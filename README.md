# World Cup Predictions MVP

Публичный Next.js dashboard и отдельный Telegram bot worker для дружеского турнира прогнозов.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- PostgreSQL, Prisma ORM
- Telegraf bot worker
- Recharts для базовой визуализации
- Vitest для доменных тестов

## Environment

Создайте `.env` из `.env.example`:

```bash
cp .env.example .env
```

Переменные:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/world_cup_predictions?schema=public"
TELEGRAM_BOT_TOKEN=""
ADMIN_TELEGRAM_IDS="123456789,987654321"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MATCH_TIMEZONE_OFFSET="+03:00"
```

`.env` содержит секреты и добавлен в `.gitignore`. Не коммитьте его. `.env.example` и `.env.production.example` должны содержать только placeholders.

Если Telegram bot token передавался в чат, подрядчику или третьим лицам, перевыпустите токен у BotFather перед реальным запуском. После обновления `TELEGRAM_BOT_TOKEN` в `.env` перезапустите только bot container:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart bot
```

## Install

```bash
npm install
```

## Database

Запустить локальный PostgreSQL:

```bash
docker compose -p world-cup-predictions up -d
```

Применить миграции:

```bash
npm run db:migrate
```

Загрузить seed-данные:

```bash
npm run db:seed
```

Seed создаёт 10 игроков, 10 матчей со статусами `scheduled`, `live`, `finished`, прогнозы, результаты и призовую конфигурацию.

## Run

Сайт:

```bash
npm run dev
```

Откройте `http://localhost:3000`.

Telegram bot worker:

```bash
npm run bot
```

## Scripts

- `npm run dev` - локальный Next.js сайт
- `npm run bot` - Telegraf worker
- `npm run db:migrate` - Prisma migration
- `npm run db:seed` - seed demo data
- `npm run db:clear-demo` - очистить demo-данные перед реальным стартом
- `npm run smoke:hidden-predictions` - проверить, что будущий матч не отдаёт прогнозы API
- `npm test` - unit tests

## Bot commands

Участник:

- `/start` - регистрация и ввод display name
- `/matches` - список открытых матчей
- `/predict <номер> <счёт>` - пример: `/predict 2 2:1`
- `/my` - свои прогнозы
- `/table` - таблица лидеров
- `/rules` - правила
- `/help` - помощь

Админ:

- `/admin` - список админских команд
- `/add_match Команда1; Команда2; YYYY-MM-DD HH:mm; Stage`
- `/edit_match <номер> Команда1; Команда2; YYYY-MM-DD HH:mm; Stage`
- `/set_result <номер> <счёт>` - внести результат и пересчитать очки
- `/recalc CONFIRM` - пересчитать все завершённые матчи
- `/participants` - список участников
- `/set_paid <telegramId> <yes|no>` - опционально отметить наличный взнос
- `/prize` - призовой фонд

Админ определяется только через `ADMIN_TELEGRAM_IDS`.

## Public API

Все endpoints read-only и поддерживают только `GET`:

- `GET /api/leaderboard`
- `GET /api/matches`
- `GET /api/matches/[id]`
- `GET /api/players`
- `GET /api/players/[slug]`
- `GET /api/stats`
- `GET /api/prizes`

До kickoff прогнозы не отдаются API в detail-ответах матча и игрока. Публичные ответы не содержат `telegramId`.

Acceptance criterion для антислива прогнозов: у будущего матча `GET /api/matches/[id]` должен возвращать `predictionsVisible: false` и `predictions: []`, даже если прогнозы уже есть в базе.

Production smoke-check для этого правила:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env run --rm web npm run smoke:hidden-predictions
```

## Scoring

- Точный счёт: 5
- Угадана разница: 3
- Угадан исход: 2
- Промах: 0

Дедлайн прогноза: за 1 минуту до kickoff. После дедлайна бот запрещает создание и изменение прогноза.

## Production deployment on VPS

Production-архитектура рассчитана на один VPS:

- `caddy` принимает внешний трафик на `80` и `443`, автоматически выпускает HTTPS-сертификаты.
- `web` запускает Next.js production server внутри Docker network.
- `bot` запускает Telegram bot через long polling, webhook не нужен.
- `postgres` доступен только внутри Docker network, порт `5432` наружу не публикуется.
- На сервере извне должны быть открыты только `22`, `80`, `443`.

### 1. Подготовить env

```bash
cp .env.production.example .env
```

Заполните:

```env
APP_DOMAIN=your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong-password
POSTGRES_DB=world_cup_predictions
DATABASE_URL=postgresql://postgres:strong-password@postgres:5432/world_cup_predictions?schema=public
TELEGRAM_BOT_TOKEN=<BOT_TOKEN>
ADMIN_TELEGRAM_IDS=123456789,987654321
MATCH_TIMEZONE_OFFSET=+03:00
```

DNS домена должен указывать на IP сервера до запуска Caddy.

### 2. Build images and start Postgres

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env build
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env up -d postgres
```

Проверить состояние:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env ps
```

### 3. Run Prisma migrations

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env run --rm web npx prisma migrate deploy
```

### 4. Start production app

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env up -d
```

### 5. Run seed, first launch/demo only

Seed нужен только для первого demo-заполнения или staging. На реальном турнире не запускайте seed после появления настоящих участников или прогнозов: команда очищает таблицы и создаёт demo-данные.

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env run --rm web npm run db:seed
```

### 6. Clear demo data before real tournament

Используйте только перед стартом реального турнира, когда ещё нет настоящих прогнозов. Команда необратимо удаляет demo-данные из `Prediction`, `Payment`, `Match`, `User`. `PrizeConfig` остаётся.

Перед очисткой обязательно сделайте backup.

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env run --rm web npm run db:clear-demo -- --confirm
```

### 7. Production smoke-check

Проверить контейнеры:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env ps
```

Проверить healthcheck:

```bash
curl -fsS https://your-domain.com/api/health
```

Логи web:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env logs -f web
```

Логи bot:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env logs -f bot
```

Логи caddy:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env logs -f caddy
```

Перезапустить только web:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart web
```

Перезапустить только bot:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart bot
```

### 8. View logs

Все сервисы:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env logs -f
```

Только сайт:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env logs -f web
```

Только бот:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env logs -f bot
```

### 9. Restart services

Restart web:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart web
```

Restart bot:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart bot
```

### 10. Backup Postgres

Backup обязательно сделать:

- перед очисткой demo-данных;
- перед реальным стартом турнира;
- периодически во время турнира.

Создать папку для backup-файлов:

```bash
mkdir -p backups
```

Сделать backup:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > /backups/world_cup_predictions_$(date +%Y%m%d_%H%M%S).dump'
```

Файлы будут лежать в локальной папке `backups/` на сервере.

### 11. Restore Postgres backup

Перед restore остановите сервисы, которые пишут в базу:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env stop web bot
```

Восстановить backup:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env exec postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /backups/backup-file.dump'
```

Вернуть сервисы:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env up -d web bot
```

### 12. Real tournament launch checklist

1. Перевыпустить Telegram token у BotFather, если токен когда-либо передавался в чат или третьим лицам.
2. Проверить `.env`: `APP_DOMAIN`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `MATCH_TIMEZONE_OFFSET`.
3. Сделать backup базы.
4. Очистить demo-данные через `npm run db:clear-demo -- --confirm` в production container.
5. Перезапустить сервисы: `docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env up -d`.
6. Зарегистрировать админа через `/start` в Telegram.
7. Добавить реальные матчи через `/add_match Команда1; Команда2; YYYY-MM-DD HH:mm; Stage`.
8. Проверить `/matches` в боте.
9. Дать друзьям ссылку на бота.
10. Дождаться регистрации участников через `/start`.
11. Если хотите вести отметки наличных в боте, используйте `/set_paid <telegramId> yes`. Если скидываетесь наличкой без учёта в приложении, этот шаг можно пропустить.
12. Проверить сайт и leaderboard.
13. Сделать тестовый прогноз до дедлайна.
14. Проверить скрытие прогнозов до kickoff через сайт и `npm run smoke:hidden-predictions`.
15. Сделать backup базы перед стартом первого матча.

### 13. Update deployment

```bash
git pull
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env build
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env run --rm web npx prisma migrate deploy
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env up -d
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env ps
```
