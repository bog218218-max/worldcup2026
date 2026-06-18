import { Context, Markup, Telegraf } from "telegraf";
import { getAdminTelegramIds, isAdminTelegramId } from "@/lib/config";
import { getPredictionDeadline, isPredictionLocked } from "@/lib/deadline";
import { formatKickoff, formatMskDateTime, formatRub } from "@/lib/format";
import { parseMatchInput } from "@/lib/matchInput";
import { parseParticipantInput, parseParticipantLines } from "@/lib/participantInput";
import { prisma } from "@/lib/prisma";
import { parseScoreInput } from "@/lib/scoring";
import { getLeaderboard } from "@/lib/services/leaderboard";
import { getMatches } from "@/lib/services/matches";
import { getPrizeOverview } from "@/lib/services/prizes";
import { recalculateAll, recalculateMatch } from "@/lib/services/recalc";
import { withFallbackSlug } from "@/lib/slug";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new Telegraf(token);
const pendingDisplayName = new Set<string>();
const pendingPredictionMatchId = new Map<string, string>();
const NOT_PARTICIPANT_MESSAGE = "Ты не добавлен в список участников турнира. Напиши админу.";

const MENU = {
  matches: "Матчи",
  my: "Мои прогнозы",
  table: "Таблица",
  rules: "Правила",
  name: "Изменить имя",
  help: "Помощь",
  admin: "Панель админа"
} as const;

const USER_COMMANDS = [
  { command: "start", description: "Меню турнира" },
  { command: "matches", description: "Ближайшие матчи" },
  { command: "my", description: "Мои прогнозы" },
  { command: "table", description: "Таблица лидеров" },
  { command: "rules", description: "Правила" },
  { command: "help", description: "Помощь" }
];

const ADMIN_COMMANDS = [
  ...USER_COMMANDS,
  { command: "admin", description: "Панель админа" },
  { command: "add_participant", description: "Добавить участника" },
  { command: "import_participants", description: "Импорт участников" },
  { command: "missing", description: "Кто не сделал прогноз" },
  { command: "remove_participant", description: "Деактивировать участника" },
  { command: "participants", description: "Участники" },
  { command: "prize", description: "Призовой фонд" }
];

function telegramId(ctx: Context) {
  return String(ctx.from?.id ?? "");
}

function commandText(ctx: Context) {
  return (ctx.message as { text?: string } | undefined)?.text ?? "";
}

function commandPayload(ctx: Context, command: string) {
  return commandText(ctx)
    .replace(new RegExp(`^/${command}(?:@\\w+)?\\s*`), "")
    .trim();
}

function userSlug(displayName: string, id: string) {
  return withFallbackSlug(`${displayName}-${id.slice(-4)}`, `player-${id}`);
}

function requireAdmin(id: string) {
  return isAdminTelegramId(id);
}

function isMenuButton(text: string) {
  return Object.values(MENU).includes(text as (typeof MENU)[keyof typeof MENU]);
}

function mainMenuKeyboard(id: string) {
  const rows: string[][] = [
    [MENU.matches, MENU.my],
    [MENU.table, MENU.rules],
    [MENU.name, MENU.help]
  ];

  if (requireAdmin(id)) {
    rows.push([MENU.admin]);
  }

  return Markup.keyboard(rows).resize();
}

async function replyWithMenu(ctx: Context, text: string) {
  await ctx.reply(text, mainMenuKeyboard(telegramId(ctx)));
}

async function configureBotCommands() {
  await bot.telegram.setMyCommands(USER_COMMANDS);

  for (const adminId of getAdminTelegramIds()) {
    await bot.telegram.setMyCommands(ADMIN_COMMANDS, {
      scope: { type: "chat", chat_id: Number(adminId) }
    });
  }
}

async function getParticipant(ctx: Context) {
  const id = telegramId(ctx);
  const user = await prisma.user.findUnique({
    where: { telegramId: id }
  });

  if (!user?.isPaid) {
    pendingDisplayName.delete(id);
    pendingPredictionMatchId.delete(id);
    await ctx.reply(NOT_PARTICIPANT_MESSAGE);
    return null;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      isAdmin: requireAdmin(id),
      ...(ctx.from?.username ? { telegramUsername: ctx.from.username } : {})
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

async function resolveMatchReference(reference: string, includeFinished = false) {
  const byIndex = await resolveMatchByIndex(reference, includeFinished);
  if (byIndex) return byIndex;

  return prisma.match.findFirst({
    where: {
      id: reference,
      ...(includeFinished ? {} : { status: { not: "finished" as const } })
    }
  });
}

function participantFormatExample() {
  return [
    "Формат:",
    "/import_participants",
    "123456789; Костя",
    "987654321; Артём",
    "555555555; Дима"
  ].join("\n");
}

function resultTypeLabel(resultType: string) {
  if (resultType === "exact") return "точный счёт";
  if (resultType === "difference") return "разница";
  if (resultType === "outcome") return "исход";
  if (resultType === "miss") return "промах";
  return resultType;
}

async function isActiveParticipantTelegramId(id: string) {
  const user = await prisma.user.findUnique({
    where: { telegramId: id },
    select: { isPaid: true }
  });

  return user?.isPaid === true;
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

async function denyAdminAccess(ctx: Context) {
  await replyWithMenu(ctx, "Эта команда недоступна. Используй кнопки меню.");
}

async function beginDisplayNameChange(ctx: Context) {
  const user = await getParticipant(ctx);
  if (!user) return;

  pendingPredictionMatchId.delete(user.telegramId);
  pendingDisplayName.add(user.telegramId);
  await ctx.reply(
    [
      `Текущее имя на сайте: ${user.displayName}`,
      "Отправь новым сообщением имя от 2 до 40 символов.",
      "Это имя будет видно в таблице и прогнозах."
    ].join("\n"),
    mainMenuKeyboard(user.telegramId)
  );
}

async function showHelp(ctx: Context) {
  const user = await getParticipant(ctx);
  if (!user) return;

  pendingPredictionMatchId.delete(user.telegramId);
  await ctx.reply(
    [
      "Пользуйся кнопками на панели снизу.",
      "",
      `${MENU.matches} - выбрать матч и поставить прогноз`,
      `${MENU.my} - посмотреть свои прогнозы`,
      `${MENU.table} - таблица лидеров`,
      `${MENU.rules} - правила начисления`,
      `${MENU.name} - поменять имя на сайте`,
      "",
      "Чтобы поставить прогноз: открой матчи, нажми кнопку под нужным матчем и отправь счёт в формате 2:1."
    ].join("\n"),
    mainMenuKeyboard(user.telegramId)
  );
}

async function showRules(ctx: Context) {
  const user = await getParticipant(ctx);
  if (!user) return;

  await replyWithMenu(
    ctx,
    [
      "Правила начисления:",
      "Точный счёт - 5",
      "Разница мячей - 3",
      "Исход - 2",
      "Промах - 0",
      "",
      "Прогнозы принимаются и изменяются только до дедлайна: за 1 минуту до начала матча.",
      "Счёт вводится в порядке команд из карточки матча: первая команда - первая цифра, вторая команда - вторая цифра.",
      "После дедлайна прогноз не меняется вручную, даже если матч ещё не начался.",
      "Чужие прогнозы скрыты до начала матча, чтобы никто не мог подстроиться.",
      "После внесения результата очки пересчитываются автоматически."
    ].join("\n")
  );
}

async function showMatches(ctx: Context) {
  const user = await getParticipant(ctx);
  if (!user) return;

  pendingPredictionMatchId.delete(user.telegramId);
  const matches = await getMatches();
  const openMatches = matches.filter((match) => match.status !== "finished");

  if (openMatches.length === 0) {
    await replyWithMenu(ctx, "Открытых матчей нет. Когда расписание появится, кнопка покажет список.");
    return;
  }

  const predictions = await prisma.prediction.findMany({
    where: {
      userId: user.id,
      matchId: { in: openMatches.map((match) => match.id) }
    }
  });
  const predictionsByMatch = new Map(
    predictions.map((prediction) => [prediction.matchId, `${prediction.predHome}:${prediction.predAway}`])
  );
  const buttons = openMatches
    .map((match, index) => ({ match, index }))
    .filter(({ match }) => !isPredictionLocked(match.kickoffTime))
    .map(({ match, index }) => [
      Markup.button.callback(
        `${index + 1}. Поставить / изменить прогноз`,
        `predict:${match.id}`
      )
    ]);

  const text =
    openMatches
      .map(
        (match, index) => {
          const saved = predictionsByMatch.get(match.id);
          const locked = isPredictionLocked(match.kickoffTime);
          return [
            `${index + 1}. ${match.homeFlag} ${match.homeTeam} - ${match.awayTeam} ${match.awayFlag}`,
            `${match.stage}, ${formatKickoff(match.kickoffTime)}`,
            `Дедлайн: ${formatKickoff(getPredictionDeadline(match.kickoffTime))}`,
            `Твой прогноз: ${saved ?? "ещё не поставлен"}`,
            locked ? "Статус: прогноз закрыт" : `Прогнозов всего: ${match.predictionCount}`
          ].join("\n");
        }
      )
      .join("\n\n");

  if (buttons.length === 0) {
    await replyWithMenu(ctx, text);
    return;
  }

  await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

async function savePrediction(ctx: Context, matchId: string, scoreText: string) {
  const user = await getParticipant(ctx);
  if (!user) return;

  const score = parseScoreInput(scoreText ?? "");

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      status: { not: "finished" }
    }
  });
  if (!match) {
    pendingPredictionMatchId.delete(user.telegramId);
    await replyWithMenu(ctx, "Матч не найден или уже завершён. Открой список матчей и выбери актуальный.");
    return;
  }

  if (!score) {
    await ctx.reply(
      [
        `Матч: ${match.homeTeam} - ${match.awayTeam}`,
        "Отправь счёт в формате 2:1.",
        "Первая цифра относится к первой команде, вторая - ко второй."
      ].join("\n"),
      mainMenuKeyboard(user.telegramId)
    );
    return;
  }

  if (isPredictionLocked(match.kickoffTime)) {
    pendingPredictionMatchId.delete(user.telegramId);
    await replyWithMenu(
      ctx,
      `Дедлайн прошёл: ${formatKickoff(getPredictionDeadline(match.kickoffTime))}. Прогноз уже заблокирован.`
    );
    return;
  }

  const existing = await prisma.prediction.findUnique({
    where: {
      userId_matchId: {
        userId: user.id,
        matchId: match.id
      }
    }
  });

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

  pendingPredictionMatchId.delete(user.telegramId);
  await replyWithMenu(
    ctx,
    [
      existing ? "Прогноз обновлён." : "Прогноз сохранён.",
      `${match.homeTeam} - ${match.awayTeam}: ${score.home}:${score.away}`,
      `Изменить можно до дедлайна: ${formatKickoff(getPredictionDeadline(match.kickoffTime))}.`
    ].join("\n")
  );
}

async function promptPrediction(ctx: Context, matchId: string) {
  const user = await getParticipant(ctx);
  if (!user) return;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      status: { not: "finished" }
    },
    include: {
      predictions: {
        where: { userId: user.id },
        take: 1
      }
    }
  });

  if (!match) {
    await replyWithMenu(ctx, "Матч не найден или уже завершён. Открой список матчей ещё раз.");
    return;
  }

  if (isPredictionLocked(match.kickoffTime)) {
    await replyWithMenu(
      ctx,
      `Прогноз на ${match.homeTeam} - ${match.awayTeam} уже закрыт. Дедлайн: ${formatKickoff(getPredictionDeadline(match.kickoffTime))}.`
    );
    return;
  }

  pendingDisplayName.delete(user.telegramId);
  pendingPredictionMatchId.set(user.telegramId, match.id);
  const current = match.predictions[0]
    ? `Текущий прогноз: ${match.predictions[0].predHome}:${match.predictions[0].predAway}`
    : "Текущего прогноза нет.";

  await ctx.reply(
    [
      `${match.homeFlag} ${match.homeTeam} - ${match.awayTeam} ${match.awayFlag}`,
      `${match.stage}, ${formatKickoff(match.kickoffTime)}`,
      current,
      "",
      "Отправь счёт одним сообщением, например 2:1.",
      "Первая цифра - первая команда, вторая цифра - вторая команда."
    ].join("\n"),
    mainMenuKeyboard(user.telegramId)
  );
}

async function showMyPredictions(ctx: Context) {
  const user = await getParticipant(ctx);
  if (!user) return;

  pendingPredictionMatchId.delete(user.telegramId);
  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: true },
    orderBy: { match: { kickoffTime: "asc" } }
  });

  if (predictions.length === 0) {
    await replyWithMenu(ctx, "У тебя пока нет прогнозов. Нажми кнопку «Матчи» и выбери игру.");
    return;
  }

  await replyWithMenu(
    ctx,
    predictions
      .map((prediction) => {
        const points =
          prediction.match.status === "finished"
            ? `${prediction.points} очков`
            : "очки будут после результата";
        const locked = isPredictionLocked(prediction.match.kickoffTime)
          ? "закрыт"
          : `можно изменить до ${formatKickoff(getPredictionDeadline(prediction.match.kickoffTime))}`;
        return `${prediction.match.homeTeam} - ${prediction.match.awayTeam}: ${prediction.predHome}:${prediction.predAway}, ${points}, ${locked}`;
      })
      .join("\n")
  );
}

async function showTable(ctx: Context) {
  const user = await getParticipant(ctx);
  if (!user) return;

  pendingPredictionMatchId.delete(telegramId(ctx));
  const leaderboard = await getLeaderboard();

  await replyWithMenu(
    ctx,
    leaderboard
      .slice(0, 10)
      .map((row) => `${row.rank}. ${row.displayName}: ${row.points} очков (${row.exact} точных)`)
      .join("\n") || "Таблица пока пустая."
  );
}

async function handleMenuText(ctx: Context, text: string) {
  if (text === MENU.matches) {
    await showMatches(ctx);
    return true;
  }
  if (text === MENU.my) {
    await showMyPredictions(ctx);
    return true;
  }
  if (text === MENU.table) {
    await showTable(ctx);
    return true;
  }
  if (text === MENU.rules) {
    await showRules(ctx);
    return true;
  }
  if (text === MENU.name) {
    await beginDisplayNameChange(ctx);
    return true;
  }
  if (text === MENU.help) {
    await showHelp(ctx);
    return true;
  }
  if (text === MENU.admin) {
    await showAdminPanel(ctx);
    return true;
  }

  return false;
}

bot.start(async (ctx) => {
  const user = await getParticipant(ctx);
  if (!user) return;

  await ctx.reply(
    [
      "Ты добавлен в список участников турнира.",
      `Текущее имя на сайте: ${user.displayName}`,
      "",
      "Основные действия теперь доступны кнопками на панели снизу."
    ].join("\n"),
    mainMenuKeyboard(user.telegramId)
  );
});

bot.command("help", showHelp);
bot.command("rules", showRules);
bot.command("matches", showMatches);

bot.command("predict", async (ctx) => {
  const user = await getParticipant(ctx);
  if (!user) return;

  const [, matchReference, scoreText] = commandText(ctx).trim().split(/\s+/);
  if (!matchReference || !scoreText) {
    await showMatches(ctx);
    return;
  }

  const match = await resolveMatchReference(matchReference);
  if (!match) {
    await replyWithMenu(ctx, "Матч не найден. Нажми кнопку «Матчи» и выбери игру из актуального списка.");
    return;
  }

  await savePrediction(ctx, match.id, scoreText);
});

bot.command("my", showMyPredictions);
bot.command("table", showTable);

async function showAdminPanel(ctx: Context) {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
    return;
  }

  await ctx.reply(
    [
      "Админские команды:",
      "",
      "/participants - список участников и telegramId",
      "/add_participant <telegramId>; <displayName> - добавить или восстановить участника",
      "/import_participants - добавить участников пачкой",
      "/missing <matchId> - кто не сделал прогноз",
      "/remove_participant <telegramId> - деактивировать участника без удаления прогнозов",
      "",
      "/add_match Команда1; Команда2; YYYY-MM-DD HH:mm; Stage",
      "Пример: /add_match Испания; Германия; 2026-06-18 21:00; Группа A",
      "",
      "/edit_match <номер> Команда1; Команда2; YYYY-MM-DD HH:mm; Stage",
      "/set_live <номер> - поставить матчу статус live",
      "/set_result <matchId> <счёт> - пример: /set_result cmatchid 2:1",
      "/recalc CONFIRM - пересчитать очки по всем завершённым матчам",
      "/prize - призовой фонд"
    ].join("\n"),
    mainMenuKeyboard(id)
  );
}

bot.command("admin", showAdminPanel);

bot.command("add_participant", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
    return;
  }

  const payload = commandText(ctx).replace("/add_participant", "").trim();
  const participant = parseParticipantInput(payload);

  if (!participant) {
    await ctx.reply(
      [
        "Формат:",
        "/add_participant <telegramId>; <displayName>",
        "",
        "Пример:",
        "/add_participant 123456789; Костя"
      ].join("\n")
    );
    return;
  }

  const user = await prisma.user.upsert({
    where: { telegramId: participant.telegramId },
    update: {
      displayName: participant.displayName,
      slug: userSlug(participant.displayName, participant.telegramId),
      isAdmin: requireAdmin(participant.telegramId),
      isPaid: true,
      payment: {
        upsert: {
          create: { amount: 1000, isPaid: true, paidAt: new Date() },
          update: { isPaid: true, paidAt: new Date() }
        }
      }
    },
    create: {
      telegramId: participant.telegramId,
      displayName: participant.displayName,
      slug: userSlug(participant.displayName, participant.telegramId),
      isAdmin: requireAdmin(participant.telegramId),
      isPaid: true,
      payment: {
        create: { amount: 1000, isPaid: true, paidAt: new Date() }
      }
    }
  });

  await ctx.reply(
    [
      "Участник добавлен в whitelist:",
      `${user.displayName}: tg ${user.telegramId}`,
      "Статус: допущен, взнос отмечен."
    ].join("\n")
  );
});

bot.command("import_participants", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
    return;
  }

  const payload = commandPayload(ctx, "import_participants");
  const parsed = parseParticipantLines(payload);

  if (parsed.errorLine !== null) {
    await ctx.reply(
      [
        `Ошибка в строке ${parsed.errorLine}. Ничего не импортировано.`,
        "",
        participantFormatExample()
      ].join("\n")
    );
    return;
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      telegramId: { in: parsed.participants.map((participant) => participant.telegramId) }
    },
    select: { telegramId: true }
  });
  const existingIds = new Set(existingUsers.map((user) => user.telegramId));

  await prisma.$transaction(
    parsed.participants.map((participant) =>
      prisma.user.upsert({
        where: { telegramId: participant.telegramId },
        update: {
          displayName: participant.displayName,
          slug: userSlug(participant.displayName, participant.telegramId),
          isAdmin: requireAdmin(participant.telegramId),
          isPaid: true,
          payment: {
            upsert: {
              create: { amount: 1000, isPaid: true, paidAt: new Date() },
              update: { isPaid: true, paidAt: new Date() }
            }
          }
        },
        create: {
          telegramId: participant.telegramId,
          displayName: participant.displayName,
          slug: userSlug(participant.displayName, participant.telegramId),
          isAdmin: requireAdmin(participant.telegramId),
          isPaid: true,
          payment: {
            create: { amount: 1000, isPaid: true, paidAt: new Date() }
          }
        }
      })
    )
  );

  const added = parsed.participants.filter(
    (participant) => !existingIds.has(participant.telegramId)
  ).length;
  const updated = parsed.participants.length - added;

  await ctx.reply(
    [
      "Импорт участников завершён.",
      `Добавлено: ${added}`,
      `Обновлено: ${updated}`,
      "",
      ...parsed.participants.map((participant) => `${participant.telegramId}: ${participant.displayName}`),
      "",
      "Проверь список командой /participants."
    ].join("\n")
  );
});

bot.command("remove_participant", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
    return;
  }

  const targetTelegramId = commandText(ctx).replace("/remove_participant", "").trim();

  if (!targetTelegramId) {
    await ctx.reply("Формат: /remove_participant <telegramId>. Пример: /remove_participant 123456789");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { telegramId: targetTelegramId },
    include: {
      payment: true,
      _count: { select: { predictions: true } }
    }
  });

  if (!user) {
    await ctx.reply("Участник не найден.");
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: user.payment
      ? {
          isPaid: false,
          payment: {
            update: { isPaid: false, paidAt: null }
          }
        }
      : { isPaid: false }
  });

  await ctx.reply(
    [
      "Участник деактивирован без удаления User.",
      `${updated.displayName}: tg ${updated.telegramId}`,
      `Прогнозов в базе: ${user._count.predictions}`,
      "Он исключён из публичной статистики, таблицы и призового фонда."
    ].join("\n")
  );
});

bot.command("missing", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
    return;
  }

  const matchReference = commandPayload(ctx, "missing");
  if (!matchReference) {
    await ctx.reply("Формат: /missing <matchId>. Пример: /missing cmatchid");
    return;
  }

  const match = await resolveMatchReference(matchReference, true);
  if (!match) {
    await ctx.reply("Матч не найден. Проверь matchId.");
    return;
  }

  const users = await prisma.user.findMany({
    where: { isPaid: true },
    orderBy: { displayName: "asc" },
    include: {
      predictions: {
        where: { matchId: match.id },
        select: { id: true }
      }
    }
  });
  const predictedCount = users.filter((user) => user.predictions.length > 0).length;
  const missingUsers = users.filter((user) => user.predictions.length === 0);

  await ctx.reply(
    [
      `${match.homeTeam} - ${match.awayTeam}`,
      `Kickoff: ${formatMskDateTime(match.kickoffTime)}`,
      `Deadline: ${formatMskDateTime(getPredictionDeadline(match.kickoffTime))}`,
      `Прогноз сделали: ${predictedCount} из ${users.length}`,
      "",
      missingUsers.length > 0
        ? ["Не сделали прогноз:", ...missingUsers.map((user) => `- ${user.displayName} (${user.telegramId})`)].join("\n")
        : "Все активные участники сделали прогноз на этот матч."
    ].join("\n")
  );
});

bot.command("add_match", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
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
    await denyAdminAccess(ctx);
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
    await denyAdminAccess(ctx);
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
    await denyAdminAccess(ctx);
    return;
  }

  const [, matchReference, scoreText] = commandText(ctx).trim().split(/\s+/);
  const score = parseScoreInput(scoreText ?? "");
  if (!matchReference || !score) {
    await ctx.reply("Формат: /set_result <matchId> <счёт>. Пример: /set_result cmatchid 2:1");
    return;
  }

  const match = await resolveMatchReference(matchReference, true);
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

  const [leaderboard, predictions] = await Promise.all([
    getLeaderboard(),
    prisma.prediction.findMany({
      where: {
        matchId: match.id,
        user: { isPaid: true }
      },
      include: {
        user: { select: { displayName: true } }
      },
      orderBy: [{ points: "desc" }, { updatedAt: "asc" }]
    })
  ]);
  const scoredPredictions = predictions.filter((prediction) => prediction.resultType !== "pending");
  const totalPoints = scoredPredictions.reduce((sum, prediction) => sum + prediction.points, 0);
  const averagePoints =
    scoredPredictions.length > 0 ? totalPoints / scoredPredictions.length : 0;
  const playersWithPoints = scoredPredictions.filter((prediction) => prediction.points > 0).length;
  const bestScore = Math.max(...scoredPredictions.map((prediction) => prediction.points), 0);
  const bestPredictions = scoredPredictions.filter(
    (prediction) => prediction.points === bestScore && prediction.points > 0
  );
  const top3 = leaderboard
    .slice(0, 3)
    .map((row) => `${row.rank}. ${row.displayName} - ${row.points}`)
    .join("\n");

  await ctx.reply(
    [
      `Результат сохранён: ${match.homeTeam} - ${match.awayTeam} ${score.home}:${score.away}`,
      "Очки по этому матчу пересчитаны автоматически.",
      "",
      scoredPredictions.length > 0
        ? [
            "Лучшие прогнозы:",
            bestPredictions.length > 0
              ? bestPredictions
                  .map(
                    (prediction) =>
                      `${prediction.user.displayName}: ${prediction.predHome}:${prediction.predAway}, ${prediction.points} очков, ${resultTypeLabel(prediction.resultType)}`
                  )
                  .join("\n")
              : "Лучших прогнозов с очками нет."
          ].join("\n")
        : "На этот матч пока не было прогнозов активных участников.",
      "",
      `Участников с очками: ${playersWithPoints}`,
      `Средний балл: ${averagePoints.toFixed(2)}`,
      "",
      "Текущий топ-3:",
      top3 || "Таблица пустая."
    ].join("\n")
  );
});

bot.command("recalc", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
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
    await denyAdminAccess(ctx);
    return;
  }

  const users = await prisma.user.findMany({
    orderBy: { displayName: "asc" },
    include: {
      _count: { select: { predictions: true } }
    }
  });
  await ctx.reply(
    [
      users
        .map((user) =>
          [
            `${user.displayName}: tg ${user.telegramId}`,
            `статус: ${user.isPaid ? "active" : "inactive"} (isPaid=${user.isPaid})`,
            `прогнозов: ${user._count.predictions}`,
            `/remove_participant ${user.telegramId}`
          ].join("\n")
        )
        .join("\n\n") || "Участников нет.",
      "",
      "Добавить одного: /add_participant 123456789; Костя",
      "Добавить пачкой: /import_participants"
    ].join("\n")
  );
});

bot.command("set_paid", async (ctx) => {
  const id = telegramId(ctx);
  if (!requireAdmin(id)) {
    await denyAdminAccess(ctx);
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
    await denyAdminAccess(ctx);
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

bot.action(/^predict:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  await promptPrediction(ctx, ctx.match[1]);
});

bot.on("text", async (ctx) => {
  const id = telegramId(ctx);
  const text = ctx.message.text.trim();

  if (!requireAdmin(id) && !(await isActiveParticipantTelegramId(id))) {
    pendingDisplayName.delete(id);
    pendingPredictionMatchId.delete(id);
    await ctx.reply(NOT_PARTICIPANT_MESSAGE);
    return;
  }

  if (pendingDisplayName.has(id)) {
    const user = await getParticipant(ctx);
    if (!user) return;

    if (isMenuButton(text) || text.startsWith("/")) {
      pendingDisplayName.delete(id);
      await handleMenuText(ctx, text);
      return;
    }

    const displayName = text.slice(0, 40);
    if (displayName.length < 2) {
      await ctx.reply("Имя должно быть обычным текстом от 2 до 40 символов.", mainMenuKeyboard(id));
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName,
        slug: userSlug(displayName, id)
      }
    });
    pendingDisplayName.delete(id);
    await replyWithMenu(ctx, `Имя обновлено: ${displayName}.`);
    return;
  }

  const pendingMatchId = pendingPredictionMatchId.get(id);
  if (pendingMatchId) {
    if (isMenuButton(text) || text.startsWith("/")) {
      pendingPredictionMatchId.delete(id);
      await handleMenuText(ctx, text);
      return;
    }

    await savePrediction(ctx, pendingMatchId, text);
    return;
  }

  if (await handleMenuText(ctx, text)) {
    return;
  }

  if (text.startsWith("/")) {
    await replyWithMenu(ctx, "Команды через slash больше не нужны. Используй кнопки на панели снизу.");
    return;
  }

  if (parseScoreInput(text)) {
    await replyWithMenu(ctx, "Сначала выбери матч через кнопку «Матчи», потом отправь счёт.");
    return;
  }

  await showHelp(ctx);
});

bot.catch((error) => {
  console.error("Bot error", error);
});

void configureBotCommands()
  .catch((error) => {
    console.error("Failed to configure bot commands", error);
  })
  .then(() => bot.launch())
  .then(() => {
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
        where: { isPaid: true },
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
