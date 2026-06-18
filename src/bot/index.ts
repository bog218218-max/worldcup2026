import { Context, Telegraf } from "telegraf";
import { isAdminTelegramId } from "@/lib/config";
import { getPredictionDeadline, isPredictionLocked } from "@/lib/deadline";
import { formatKickoff, formatRub } from "@/lib/format";
import { parseMatchInput } from "@/lib/matchInput";
import { prisma } from "@/lib/prisma";
import { parseScoreInput } from "@/lib/scoring";
import { getLeaderboard } from "@/lib/services/leaderboard";
import { getMatches } from "@/lib/services/matches";
import { getPrizeOverview } from "@/lib/services/prizes";
import { recalculateAll, recalculateMatch } from "@/lib/services/recalc";
import { withFallbackSlug } from "@/lib/slug";
import { getAdminTelegramIds } from "@/lib/config";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new Telegraf(token);
const pendingDisplayName = new Set<string>();

function telegramId(ctx: Context) {
  return String(ctx.from?.id ?? "");
}

function commandText(ctx: Context) {
  return (ctx.message as { text?: string } | undefined)?.text ?? "";
}

function userSlug(displayName: string, id: string) {
  return withFallbackSlug(`${displayName}-${id.slice(-4)}`, `player-${id}`);
}

function requireAdmin(id: string) {
  return isAdminTelegramId(id);
}

async function ensureUser(ctx: Context) {
  const id = telegramId(ctx);
  const fallbackName =
    ctx.from?.first_name || ctx.from?.username || `Игрок ${id.slice(-4)}`;

  return prisma.user.upsert({
    where: { telegramId: id },
    update: {
      isAdmin: requireAdmin(id)
    },
    create: {
      telegramId: id,
      displayName: fallbackName,
      slug: userSlug(fallbackName, id),
      isAdmin: requireAdmin(id)
    }
  });
}

async function resolveMatchByIndex(indexText: string, includeFinished = false) {
  const matches = await prisma.match.findMany({
    where: includeFinished ? undefined : { status: { not: "finished" } },
    orderBy: { kickoffTime: "asc" }
  });
  const index = Number(indexText);
  if (!Number.isInteger(index) || index < 1 || index > matches.length) {
    return null;
  }
  return matches[index - 1];
}

function matchFormatHelp(command: "/add_match" | "/edit_match") {
  if (command === "/add_match") {
    return [
      "Формат:",
      "/add_match Команда1; Команда2; YYYY-MM-DD HH:mm; Stage",
      "",
      "Пример:",
      "/add_match Испания; Германия; 2026-06-18 21:00; Группа A",
      "",
      "Опционально можно добавить флаги:",
      "/add_match Испания; Германия; 2026-06-18 21:00; Группа A; 🇪🇸; 🇩🇪"
    ].join("\n");
  }

  return [
    "Формат:",
    "/edit_match <номер> Команда1; Команда2; YYYY-MM-DD HH:mm; Stage",
    "",
    "Пример:",
    "/edit_match 1 Испания; Германия; 2026-06-18 21:00; Группа A"
  ].join("\n");
}

function matchConfirmationText(prefix: string, match: {
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  stage: string;
}) {
  return [
    prefix,
    `${match.homeTeam} - ${match.awayTeam}`,
    `Дата/время: ${formatKickoff(match.kickoffTime)}`,
    `Стадия: ${match.stage}`,
    `Дедлайн прогноза: ${formatKickoff(getPredictionDeadline(match.kickoffTime))}`
  ].join("\n");
}

bot.start(async (ctx) => {
  const user = await ensureUser(ctx);
  pendingDisplayName.add(user.telegramId);
  await ctx.reply(
    [
      "Ты зарегистрирован в турнире.",
      `Текущее имя на сайте: ${user.displayName}`,
      "Отправь новым сообщением display name, который будет виден на сайте."
    ].join("\n")
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    [
      "Команды участника:",
      "/matches - ближайшие матчи",
      "/predict <номер> <счёт> - пример: /predict 2 2:1",
      "/my - мои прогнозы",
      "/table - таблица лидеров",
      "/rules - правила",
      "",
      "Админ:",
      "/admin - админское меню и форматы команд"
    ].join("\n")
  );
});

bot.command("rules", async (ctx) => {
  await ctx.reply(
    [
      "Правила начисления:",
      "Точный счёт - 5",
      "Разница мячей - 3",
      "Исход - 2",
      "Промах - 0",
      "Прогнозы закрываются за 1 минуту до начала матча."
    ].join("\n")
  );
});

bot.command("matches", async (ctx) => {
  await ensureUser(ctx);
  const matches = await getMatches();
  const openMatches = matches.filter((match) => match.status !== "finished");

  if (openMatches.length === 0) {
    await ctx.reply("Открытых матчей нет.");
    return;
  }

  await ctx.reply(
    openMatches
      .map(
        (match, index) =>
          `${index + 1}. ${match.homeFlag} ${match.homeTeam} - ${match.awayTeam} ${match.awayFlag}\n${match.stage}, ${formatKickoff(match.kickoffTime)}, прогнозов: ${match.predictionCount}`
      )
      .join("\n\n")
  );
});

bot.command("predict", async (ctx) => {
  const user = await ensureUser(ctx);
  const [, matchIndex, scoreText] = commandText(ctx).trim().split(/\s+/);
  const score = parseScoreInput(scoreText ?? "");

  if (!matchIndex || !score) {
    await ctx.reply("Формат: /predict <номер из /matches> <счёт>. Пример: /predict 2 2:1");
    return;
  }

  const match = await resolveMatchByIndex(matchIndex);
  if (!match) {
    await ctx.reply("Матч не найден. Открой /matches и выбери номер из списка.");
    return;
  }

  if (isPredictionLocked(match.kickoffTime)) {
    await ctx.reply("Дедлайн прошёл. Прогноз уже заблокирован.");
    return;
  }

  await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: user.id,
        matchId: match.id
      }
    },
    update: {
      predHome: score.home,
      predAway: score.away,
      points: 0,
      resultType: "pending",
      lockedAt: null
    },
    create: {
      userId: user.id,
      matchId: match.id,
      predHome: score.home,
      predAway: score.away
    }
  });

  await ctx.reply(
    `Прогноз сохранён: ${match.homeTeam} - ${match.awayTeam}, ${score.home}:${score.away}`
  );
});

bot.command("my", async (ctx) => {
  const user = await ensureUser(ctx);
  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: true },
    orderBy: { createdAt: "asc" }
  });

  if (predictions.length === 0) {
    await ctx.reply("У тебя пока нет прогнозов.");
    return;
  }

  await ctx.reply(
    predictions
      .map(
        (prediction) =>
          `${prediction.match.homeTeam} - ${prediction.match.awayTeam}: ${prediction.predHome}:${prediction.predAway}, ${prediction.points} очков`
      )
      .join("\n")
  );
});

bot.command("table", async (ctx) => {
  await ensureUser(ctx);
  const leaderboard = await getLeaderboard();

  await ctx.reply(
    leaderboard
      .slice(0, 10)
      .map((row) => `${row.rank}. ${row.displayName}: ${row.points} очков (${row.exact} точных)`)
      .join("\n") || "Таблица пока пустая."
  );
});

bot.command("admin", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  await ctx.reply(
    [
      "Админские команды:",
      "",
      "/participants - список участников и telegramId",
      "/set_paid <telegramId> yes - опционально отметить наличный взнос",
      "/set_paid <telegramId> no - опционально снять отметку взноса",
      "",
      "/add_match Команда1; Команда2; YYYY-MM-DD HH:mm; Stage",
      "Пример: /add_match Испания; Германия; 2026-06-18 21:00; Группа A",
      "",
      "/edit_match <номер> Команда1; Команда2; YYYY-MM-DD HH:mm; Stage",
      "/set_live <номер> - поставить матчу статус live",
      "/set_result <номер> <счёт> - пример: /set_result 1 2:1",
      "/recalc CONFIRM - пересчитать очки по всем завершённым матчам",
      "/prize - призовой фонд"
    ].join("\n")
  );
});

bot.command("add_match", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const payload = commandText(ctx).replace("/add_match", "").trim();
  const matchInput = parseMatchInput(payload);

  if (!matchInput) {
    await ctx.reply(matchFormatHelp("/add_match"));
    return;
  }

  const match = await prisma.match.create({
    data: matchInput
  });

  await ctx.reply(matchConfirmationText("Матч добавлен:", match));
});

bot.command("edit_match", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const payload = commandText(ctx).replace("/edit_match", "").trim();
  const [matchIndex, rest] = payload.split(/\s+(.+)/);
  const matchInput = parseMatchInput(rest ?? "");
  const match = await resolveMatchByIndex(matchIndex, true);

  if (!match || !matchInput) {
    await ctx.reply(matchFormatHelp("/edit_match"));
    return;
  }

  await prisma.match.update({
    where: { id: match.id },
    data: matchInput
  });

  await ctx.reply(matchConfirmationText("Матч обновлён:", matchInput));
});

bot.command("set_live", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const matchIndex = commandText(ctx).replace("/set_live", "").trim();
  if (!matchIndex) {
    await ctx.reply("Формат: /set_live <номер матча>. Пример: /set_live 1");
    return;
  }

  const match = await resolveMatchByIndex(matchIndex, true);
  if (!match) {
    await ctx.reply("Матч не найден.");
    return;
  }

  await prisma.match.update({
    where: { id: match.id },
    data: { status: "live" }
  });

  await ctx.reply(`Матч ${match.homeTeam} - ${match.awayTeam} переведён в статус ПРЯМОЙ ЭФИР.`);
});

bot.command("set_result", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const [, matchIndex, scoreText] = commandText(ctx).trim().split(/\s+/);
  const score = parseScoreInput(scoreText ?? "");
  if (!matchIndex || !score) {
    await ctx.reply("Формат: /set_result <номер матча> <счёт>. Пример: /set_result 1 2:1");
    return;
  }

  const match = await resolveMatchByIndex(matchIndex, true);
  if (!match) {
    await ctx.reply("Матч не найден.");
    return;
  }

  await prisma.match.update({
    where: { id: match.id },
    data: {
      homeScore: score.home,
      awayScore: score.away,
      status: "finished"
    }
  });
  await recalculateMatch(match.id);

  await ctx.reply(
    [
      `Результат сохранён: ${match.homeTeam} - ${match.awayTeam} ${score.home}:${score.away}`,
      "Очки по этому матчу пересчитаны автоматически."
    ].join("\n")
  );

  // Broadcast result and top-3 to all users
  const leaderboard = await getLeaderboard();
  const top3 = leaderboard.slice(0, 3).map((r) => `${r.rank}. ${r.displayName} - ${r.points}`).join("\n");
  const users = await prisma.user.findMany();
  const broadcastText = [
    `Матч завершён: ${match.homeTeam} - ${match.awayTeam} ${score.home}:${score.away}`,
    "",
    "Топ-3 турнирной таблицы:",
    top3 || "Таблица пустая."
  ].join("\n");

  for (const u of users) {
    try {
      await bot.telegram.sendMessage(u.telegramId, broadcastText);
    } catch (err) {
      console.error(`Failed to send broadcast to ${u.telegramId}`, err);
    }
  }
});

bot.command("recalc", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const confirmation = commandText(ctx).trim().split(/\s+/)[1];
  if (confirmation !== "CONFIRM") {
    await ctx.reply(
      [
        "Внимание: /recalc пересчитает очки по всем завершённым матчам.",
        "Это безопасно для корректных результатов, но массово меняет Prediction.points.",
        "Для запуска отправь: /recalc CONFIRM"
      ].join("\n")
    );
    return;
  }

  const count = await recalculateAll();
  await ctx.reply(`Пересчитано матчей: ${count}`);
});

bot.command("participants", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const users = await prisma.user.findMany({ orderBy: { displayName: "asc" } });
  await ctx.reply(
    users
      .map((user) => `${user.displayName}: tg ${user.telegramId}, взнос: ${user.isPaid ? "отмечен" : "не отмечен"}`)
      .join("\n") || "Участников нет."
  );
});

bot.command("set_paid", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const [, targetTelegramId, value] = commandText(ctx).trim().split(/\s+/);
  const isPaid = value === "yes" || value === "true" || value === "1";

  if (!targetTelegramId || !value) {
    await ctx.reply(
      [
        "Опционально, если хотите отмечать наличные взносы в боте.",
        "Формат: /set_paid <telegramId> <yes|no>",
        "telegramId можно посмотреть в /participants.",
        "Пример: /set_paid 123456789 yes"
      ].join("\n")
    );
    return;
  }

  const user = await prisma.user.update({
    where: { telegramId: targetTelegramId },
    data: {
      isPaid,
      payment: {
        upsert: {
          create: { amount: 1000, isPaid, paidAt: isPaid ? new Date() : null },
          update: { isPaid, paidAt: isPaid ? new Date() : null }
        }
      }
    }
  });

  await ctx.reply(`${user.displayName}: взнос ${isPaid ? "отмечен" : "не отмечен"}`);
});

bot.command("prize", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await ctx.reply("Нет доступа.");
    return;
  }

  const prize = await getPrizeOverview();
  await ctx.reply(
    [
      `Участников: ${prize.participantsCount}`,
      `Взнос отмечен в боте: ${prize.paidParticipantsCount}`,
      `Фонд: ${formatRub(prize.fundByParticipants)}`,
      ...prize.distribution.map((item) => `${item.title}: ${formatRub(item.amount)}`)
    ].join("\n")
  );
});

bot.on("text", async (ctx) => {
  const id = telegramId(ctx);
  if (!pendingDisplayName.has(id)) return;

  const displayName = ctx.message.text.trim().slice(0, 40);
  if (displayName.length < 2 || displayName.startsWith("/")) {
    await ctx.reply("Имя должно быть обычным текстом от 2 до 40 символов.");
    return;
  }

  await prisma.user.update({
    where: { telegramId: id },
    data: {
      displayName,
      slug: userSlug(displayName, id)
    }
  });
  pendingDisplayName.delete(id);
  await ctx.reply(`Имя обновлено: ${displayName}. Теперь можно открыть /matches.`);
});

bot.catch((error) => {
  console.error("Bot error", error);
});

void bot.launch().then(() => {
  console.log("Telegram bot started");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Reminders cron (runs every minute)
setInterval(async () => {
  try {
    const now = new Date();
    // Look for matches that are exactly 2 hours away (within a 1 minute window)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursAndOneMinute = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 60 * 1000);

    const matches = await prisma.match.findMany({
      where: {
        kickoffTime: {
          gte: twoHoursFromNow,
          lt: twoHoursAndOneMinute
        },
        status: "scheduled"
      }
    });

    for (const match of matches) {
      const users = await prisma.user.findMany({
        include: {
          predictions: {
            where: { matchId: match.id }
          }
        }
      });

      const missingUsers = users.filter((u) => u.predictions.length === 0);
      if (missingUsers.length > 0) {
        const names = missingUsers.map((u) => u.displayName).join(", ");
        const message = `Через 2 часа матч ${match.homeTeam} - ${match.awayTeam}, ещё не поставили: ${names}`;
        
        const admins = Array.from(getAdminTelegramIds());
        for (const adminId of admins) {
          try {
            await bot.telegram.sendMessage(adminId, message);
          } catch (err) {
            console.error(`Failed to send reminder to admin ${adminId}`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("Reminder error", err);
  }
}, 60 * 1000);
