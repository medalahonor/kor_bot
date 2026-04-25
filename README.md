# Tainted Grail

Веб-сервис-компаньон для настолки Tainted Grail. Telegram-бот + UI для прохождения кампании, заметок и ветвлений сюжета.

**Стек.** Node 22 (Fastify) + PostgreSQL 16 + nginx (reverse proxy + статика клиента + SSL termination). Клиент: Vite + React (production-сборка отдаётся nginx-ом как статика).

**Окружения.** Два:
- **dev** — `docker-compose.yml`. Vite hot-reload на `:5173`, server на `:3000`, БД на `:15432`. Все порты — `127.0.0.1`.
- **prod** — `docker-compose.prod.yml`. nginx на `:8443` (HTTPS), server и БД во внутренней сети контейнеров (наружу не торчат).

**Соседство с film_bot.** На том же prod-хосте развёрнут отдельный сервис `film_bot`, у которого свой nginx занимает `:80`. Tainted Grail использует `:80` ТОЛЬКО на время выпуска/ротации SSL-сертификата (standalone-challenge Let's Encrypt). На эти ~30 секунд `film_bot-nginx` останавливается, после ротации поднимается обратно. Путь к compose-файлу `film_bot` задаётся переменной `FILM_BOT_COMPOSE` в `.env`.

---

## Prerequisites

Что должно быть на хосте до `make setup`.

- **OS**: Linux с systemd (Ubuntu 22.04+, Debian 12+).
- **Bash 5+** — `bash --version`.
- **Docker Engine 24+** с **compose plugin v2** — `docker compose version` (НЕ `docker-compose` legacy).
- **certbot** — `apt-get install -y certbot` (нужен для выпуска и авто-ротации SSL-серта).
- **acl** — поставится автоматически при `make setup`. Проверить: `command -v setfacl`.
- **Пользователь `bot`** — обычный непривилегированный пользователь, в группе `docker`. Если его нет:
  ```bash
  sudo useradd -m -s /bin/bash -G docker bot
  ```
  Проверка: `id bot` — в выводе должна быть группа `docker`. Без этой группы bot не сможет работать с docker-сокетом.
- **Доменное имя** с A-записью на IP хоста. Без правильного DNS Let's Encrypt не выпустит серт (challenge будет недоступен).
- **Открытые порты на firewall**:
  - `:22` — SSH (для bot и админа).
  - `:80` — нужен только для cert-challenge. Должен быть публично доступен извне (Let's Encrypt стучится снаружи).
  - `:8443` — постоянный prod-порт сервиса (HTTPS).
- **film_bot** развёрнут на том же хосте, путь к его `docker-compose.yml` известен (указывается в `.env` как `FILM_BOT_COMPOSE`). Если film_bot нет — `cert.sh` упадёт при попытке его остановить; разворот сервиса без film_bot требует правки `cert.sh` (вне scope этого README).

---

## First-time setup

Один раз на новом хосте. Проходится по шагам, ничего не пропускать.

### Шаг 1 — клонирование репо под bot

Важно: рабочая копия должна принадлежать `bot`, иначе bot не сможет делать `git pull`.

```bash
sudo -u bot bash -c 'git clone https://github.com/medalahonor/kor_bot.git /home/bot/kor_bot'
cd /home/bot/kor_bot
```

### Шаг 2 — заполнение `.env`

```bash
sudo -u bot cp .env.example .env
sudo -u bot nano /home/bot/kor_bot/.env
```

Заполнить **5 prod-переменных**:

| Переменная | Что значит | Как получить |
|---|---|---|
| `DOMAIN` | Доменное имя сервиса | Например `tg.example.com` (А-запись уже настроена на IP хоста) |
| `URL_PREFIX` | Случайный префикс для obfuscation URL: `https://tg.example.com:8443/<URL_PREFIX>/`. Защита от случайных посетителей и сканеров | `openssl rand -hex 12` |
| `DB_PASSWORD` | Пароль PostgreSQL для prod | `openssl rand -base64 32` |
| `CERTBOT_EMAIL` | Email для Let's Encrypt (notifications о просрочке) | Твой реальный email |
| `FILM_BOT_COMPOSE` | Полный путь к `docker-compose.yml` соседнего film_bot | Например `/home/bot/film_bot/docker-compose.yml` |

Остальные переменные (`DATABASE_URL`, `BOT_TOKEN`, `PORT`, `ADMIN_TELEGRAM_ID`) нужны только для local dev (npm run dev) — в prod они берутся из docker-compose окружения. Если разворачиваешь только prod — можно оставить как есть.

### Шаг 3 — `make setup` под root

```bash
cd /home/bot/kor_bot
sudo make setup
```

**Что делает `setup.sh` (по шагам, идемпотентно):**

1. Проверяет, что запущен от root.
2. Проверяет наличие пользователя `bot`.
3. Читает `.env`, валидирует ключевые переменные (`DOMAIN`, `CERTBOT_EMAIL`, `FILM_BOT_COMPOSE`).
4. Ставит пакет `acl`, если ещё нет.
5. **Выставляет ACL** на `/etc/letsencrypt/{live,archive}`:
   - `setfacl -R -m u:bot:rX ...` — текущие файлы становятся читаемыми для bot;
   - `setfacl -R -d -m u:bot:rX ...` — **default ACL**: все будущие файлы (после автоматической ротации серта) автоматически наследуют права для bot. **Без default ACL** — после первой авто-ротации bot перестанет читать новый серт и `make up` сломается.
6. **Серт**: если `/etc/letsencrypt/live/$DOMAIN/fullchain.pem` уже есть — пропускает выпуск. Если нет — вызывает `cert.sh` (standalone-challenge: останавливает `film_bot-nginx` на ~30 сек, certbot выпускает серт, film_bot поднимается обратно).
7. Устанавливает systemd-юниты:
   - `tainted-grail-cert-renew.service` — oneshot, вызывает `cert.sh` от root;
   - `tainted-grail-cert-renew.timer` — `OnCalendar=daily` + `RandomizedDelaySec=1h` + `Persistent=true` (если хост был выключен — догонит).
   Делает `systemctl daemon-reload` и `systemctl enable --now <timer>`.
8. **Финальная диагностика**: показывает ACL и `systemctl list-timers`, под bot пробует `test -r $CERT`.

**На уже-работающем prod**: setup НЕ перезапускает контейнеры. Серт уже есть → шаг 6 skip. Контейнеры docker compose продолжают крутиться без рестарта. Downtime = 0.

### Шаг 4 — первый запуск под bot

```bash
sudo -u bot bash -c 'cd /home/bot/kor_bot && make up'
```

Ожидаемый ход событий: validate `.env` → серт найден → `git pull` (no changes на свежем clone) → генерация `nginx.conf` → `docker compose build` (несколько минут на первом запуске) → `up -d` → ожидание `healthy` (до 60 секунд, миграции БД накатываются на этом этапе).

### Шаг 5 — verification

```bash
# (a) bot читает серт
sudo -u bot bash -c 'cat /etc/letsencrypt/live/$(grep ^DOMAIN /home/bot/kor_bot/.env | cut -d= -f2)/fullchain.pem | head -1'
# Ожидание: -----BEGIN CERTIFICATE-----

# (b) Cert renewal timer установлен и тикает
sudo systemctl list-timers tainted-grail-cert-renew.timer
# Ожидание: NEXT — дата на завтра, ACTIVATES = tainted-grail-cert-renew.service

# (c) Сервис отвечает
curl -k https://localhost:8443/api/health
# Ожидание: {"status":"ok"} (или эквивалент). -k чтобы curl не ругался на self-trust
```

Если что-то из (a)/(b)/(c) не сработало — раздел **Troubleshooting** ниже.

---

## Regular update — повседневное обновление

Только под `bot`. Без `sudo`, без переключения на root.

```bash
ssh bot@<host>
cd /home/bot/kor_bot
git pull && make up
```

**Что делает `make up`** (через `deploy/up.sh`):

1. Валидирует `.env` (все 5 prod-переменных должны быть заданы).
2. **Fail-fast по серту**: если `/etc/letsencrypt/live/$DOMAIN/fullchain.pem` отсутствует или нечитаем — exit с понятным сообщением. up.sh **не пытается выпустить сам** (Project Rail b: маскирующая логика запрещена). Серт обеспечивается `make setup` + автоматическим timer.
3. `git pull --ff-only` — fast-forward only. Если на хосте есть локальные правки или дивергенция с master — упадёт, не молча мерджит.
4. Генерация `deploy/nginx.conf` из template с подстановкой `__DOMAIN__` и `__URL_PREFIX__`. Sha1-сравнение со старым — флаг для hot-reload.
5. `DOCKER_BUILDKIT=0 docker compose build` (BuildKit отключён — на этом хосте виснет; этот фикс уже захардкожен в скрипте).
6. `docker compose up -d` — поднимает изменённые контейнеры.
7. **Ожидание `healthy` у `tainted-grail-server`** (до 60 секунд, шаг 30×2с). Миграции БД применяются `entrypoint.sh` через таблицу `schema_migrations` именно на этом этапе. Если health не достигнут — exit 1, логи последних 50 строк сервера выводятся.
8. Если nginx.conf изменился — `docker exec tainted-grail-nginx nginx -s reload` (без рестарта контейнера).
9. `docker image prune -f` — чистит висящие старые образы.

**Откат кода** (если новый релиз сломан): `git checkout <prev-sha> && make up`. ⚠️ Миграции БД не откатываются автоматически — если предыдущий релиз без миграции, всё ок; если с миграцией — БД останется на новой схеме, runtime-ошибки возможны. Тяжёлый rollback с восстановлением БД — out of scope.

---

## Команды Makefile

| Target | Назначение | От кого | Примечание |
|---|---|---|---|
| `setup` | First-time setup: ACL для bot + первый серт + autorenew timer | **root** | Идемпотентно. Запускается один раз на новом хосте; повторный запуск — для починки ACL после внешних изменений |
| `up` | Pull + build + поднять/обновить сервис | bot | Главная повседневная команда |
| `down` | Остановить контейнеры | bot | `docker compose down` |
| `logs` | Логи всех сервисов | bot | `--tail=100 -f`, прервать `Ctrl+C` |
| `ps` | Статус контейнеров | bot | |
| `cert-rotate` | Разовая принудительная ротация серта | **root** | Escape-hatch: серт повреждён, домен сменился. Останавливает `film_bot-nginx` на ~30 сек |
| `cert-autorenew-install` | Установить systemd timer для автоматической ротации | **root** | Часть `make setup`; можно дёрнуть отдельно (например для починки timer) |
| `cert-autorenew-uninstall` | Снять systemd timer | **root** | Не трогает ACL и серты |
| `rotate-prefix` | Сгенерировать новый `URL_PREFIX` в .env и поднять | bot | URL prod-сервиса меняется. Для безопасности (закрыть утёкший префикс) |
| `nginx-test` | `nginx -t` внутри контейнера | bot | Проверка валидности конфига перед reload |
| `dev` | Поднять dev-окружение | локально | `docker-compose.yml` (не prod) |
| `install` | `npm install` в server и client | локально | Для запуска без docker (`cd server && npm run dev`) |
| `help` | Список таргетов | любой | `make help` |

### FAQ

**Q: `make up` падает на `git pull --ff-only`. Что делать?**
A: На хосте есть локальные правки или коммиты, которых нет на origin. `git status` — посмотреть что; либо коммитить и пушить, либо `git stash`/`git reset --hard origin/master` (последнее уничтожит локальные правки — без подтверждения не делать).

**Q: Хочу сделать deploy без `git pull` (например прокатать локальный фикс).**
A: Закоммитить локально (без push), потом `make up` — пройдёт `git pull --ff-only` (если расходимости с origin нет) и продолжит. Либо вручную `bash deploy/up.sh` после `git ...`.

**Q: Зачем `URL_PREFIX`? Это ведь не безопасность.**
A: Не security-by-obscurity в строгом смысле, а способ снизить шум: автосканеры по `https://tg.example.com:8443/` будут получать 404, не зная префикса. Серьёзная защита — на уровне Telegram-аутентификации внутри приложения.

**Q: `make setup` упал на середине. Что-то поломалось?**
A: setup.sh идемпотентен — можно перезапустить. Сначала прочитать вывод, понять причину; затем `sudo make setup` повторно.

---

## Troubleshooting

### bot: `Permission denied` при чтении `/etc/letsencrypt/live/.../fullchain.pem`

**Симптом**: `make up` под bot падает на чтении серта; либо явный `cat /etc/letsencrypt/live/$DOMAIN/fullchain.pem` под bot выдаёт `Permission denied`.

**Диагностика**:
```bash
sudo getfacl -d /etc/letsencrypt/live | grep "user:bot"
```
Если в выводе нет строки `default:user:bot:r-x` — default ACL не выставлен или потерялся (например, `/etc/letsencrypt/live/` был ручно пересоздан, или certbot создал новый домен в архиве без наследования).

**Фикс**:
```bash
sudo make setup
```
(идемпотентно, серт не перевыпустит, ACL применит повторно).

**Почему именно default ACL**: certbot при перевыпуске серта создаёт новые файлы в `/etc/letsencrypt/archive/$DOMAIN/`. Без default ACL они получают права `600 root:root`, и bot снова теряет доступ. Default ACL гарантирует, что все будущие файлы наследуют `user:bot:r-x` автоматически.

### `make up`: `ERROR: серт не найден`

**Симптом**: bot запускает `make up`, скрипт говорит:
```
ERROR: серт не найден (/etc/letsencrypt/live/$DOMAIN/fullchain.pem).
  Первый раз на хосте:    sudo make setup
  Аварийный перевыпуск:   sudo make cert-rotate
```

**Решение**:
- **Первый раз на хосте** — `sudo make setup`.
- **Серт пропал на работающем хосте** (например, удалили letsencrypt-папку): `sudo make cert-rotate` — выпустит новый. Cert-rotate останавливает `film_bot-nginx` на ~30 секунд.

**Почему up.sh не выпускает серт сам**: фейл-фаст вместо магической авторекавери (Project Rail b). Up.sh должен только обновлять сервис; вопросы серта — отдельная роль (setup или ручной cert-rotate под root).

### Cert renewal timer не тикает

**Симптом**: серт почти просрочен, но автоматического перевыпуска не было.

**Диагностика**:
```bash
sudo systemctl status tainted-grail-cert-renew.timer
sudo systemctl list-timers tainted-grail-cert-renew.timer --all
sudo journalctl -u tainted-grail-cert-renew.service -n 100 --no-pager
```

**Если timer `inactive`** — он отключён или не установлен:
```bash
sudo make cert-autorenew-install
```

**Если service падает с ошибкой в журнале** — обычно одно из:
- `FILM_BOT_COMPOSE` указывает на несуществующий файл → исправить путь в `.env`.
- `.env` не читается из `WorkingDirectory` юнита → проверить, что путь в unit-файле корректен (`grep WorkingDirectory /etc/systemd/system/tainted-grail-cert-renew.service`); путь должен указывать на актуальную рабочую копию.
- Certbot rate-limit от Let's Encrypt → подождать; форсированную ротацию делать только в крайнем случае.

### Полный откат фичи (вернуться к старому workflow)

Если по каким-то причинам нужно вернуться к "bot → root → make up":

1. **Снять timer**:
   ```bash
   sudo make cert-autorenew-uninstall
   ```
2. **Откатить код**:
   ```bash
   git revert <sha-feature-bot-deploy-merge>
   make up  # под root, как раньше
   ```
3. **(опционально) Снять ACL** — не обязательно, ACL безвредны, но если хочется чистоты:
   ```bash
   sudo setfacl -Rb /etc/letsencrypt/live /etc/letsencrypt/archive
   ```
   ⚠️ После этого bot снова не сможет читать серт; для возврата к новому workflow придётся опять `sudo make setup`.

### Docker BuildKit виснет на `docker compose build`

**Симптом**: build висит на `exporting layers` минутами.

**Причина**: BuildKit не работает корректно на этом хосте (overlay-fs/kernel issues).

**Фикс**: уже захардкожен в `up.sh` — `DOCKER_BUILDKIT=0` экспортируется перед сборкой. Если запускаешь `docker compose build` руками — `DOCKER_BUILDKIT=0 docker compose -f docker-compose.prod.yml build`.

### `make setup` упал на середине

**Симптом**: setup прервался ошибкой, неизвестно, дошёл ли он до timer-а.

**Решение**: setup идемпотентен. Прочитать вывод, понять причину (отсутствие пакета, неверный путь, нет .env, итд), исправить, повторить:
```bash
sudo make setup
```
Уже выставленный ACL не дублируется (setfacl поверх — no-op), уже установленный timer не ломается (`enable --now` поверх — no-op), уже выпущенный серт не перевыпускается (skip).

---

## Boundaries — что НЕ делает этот workflow

- **Нет push-deploy.** Push в master НЕ запускает деплой автоматически. Деплой — ручной `make up` под bot.
- **Нет автоматического rollback кода и БД.** Откат кода — `git checkout <sha> && make up`. Миграции БД не откатываются автоматически (нет down-миграций). Если предыдущий релиз без миграции — всё ок; если с миграцией — runtime-errors возможны. Тяжёлый rollback с восстановлением БД — отдельная процедура (вне scope).
- **Нет audit-log.** Кто и когда делал deploy — не записывается. Историю смотреть в `git log`; SSH-доступ — в системных логах хоста.
- **Только standalone challenge для cert.** Webroot/DNS-challenge не реализованы. Каждая ротация требует кратковременного останова `film_bot-nginx` (~30 секунд раз в 60 дней). Если film_bot мешает — переход на webroot challenge — вне scope.
- **Нет monitoring uptime.** Падения сервиса не алертятся. Узнаешь от пользователей или ручным `make ps` / `curl /api/health`.
