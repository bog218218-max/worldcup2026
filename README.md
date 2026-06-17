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
- `/add_match Home | Away | ISO | Stage | HomeFlag | AwayFlag`
- `/edit_match <номер> Home | Away | ISO | Stage | HomeFlag | AwayFlag`
- `/set_result <номер> <счёт>` - внести результат и пересчитать очки
- `/recalc` - пересчитать все завершённые матчи
- `/participants` - список участников
- `/set_paid <telegramId> <yes|no>` - отметить оплату
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
TELEGRAM_BOT_TOKEN=123456:telegram-token
ADMIN_TELEGRAM_IDS=123456789,987654321
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

### 6. View logs

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

### 7. Restart services

Restart web:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart web
```

Restart bot:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env restart bot
```

### 8. Backup Postgres

Создать папку для backup-файлов:

```bash
mkdir -p backups
```

Сделать backup:

```bash
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > /backups/world_cup_predictions_$(date +%Y%m%d_%H%M%S).dump'
```

Файлы будут лежать в локальной папке `backups/` на сервере.

### 9. Restore Postgres backup

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

### 10. Update deployment

```bash
git pull
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env build
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env run --rm web npx prisma migrate deploy
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env up -d
docker compose -p world-cup-predictions -f docker-compose.prod.yml --env-file .env ps
```
