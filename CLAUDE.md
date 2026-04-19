# Workflow-инструкции для LLM

Документ задаёт явные рельсы работы LLM над кодом проекта. Три именованных workflow: **feature**, **debug**, **refactor**. Всё, что не попадает — обрабатывается через `/brainstorm` + суждение LLM на базе feature-шаблона.

---

## Project Rails (обязательные инварианты)

Применяются ко всем workflow. Нарушение — merge-blocker.

- **a) TDD для не-trivial.** Тест до merge.
- **b) Fail-fast контракты.** Невалидный response / SSE-event / request body → явная ошибка (throw, 500, закрытие подписки с сигналом наверх). Silent skip, warn-and-continue, try/catch с глотанием запрещены — маскируют рассинхрон версий между фронтом и бэком.
- **c) Worktree для всего не-trivial.** Всегда, без исключений (`EnterWorktree` → ветка `feature/<name>` от master).
- **d) `/brainstorm` перед не-trivial работой.** Финальная обязательная секция brainstorm output — **Architecture note** (три поля): пути файлов где живёт новый/меняющийся код, существующие утилиты/компоненты для reuse с путями, границы модулей — что НЕ трогаем. Юзер гейтит arch-note через сам brainstorm-диалог. Если по ходу работы arch-note оказалась неверной по существу — re-trigger `/brainstorm`.
- **e) `/simplify` перед merge** для feature и debug. Для refactor `/simplify` = основная работа.
- **f) Contract-first для full-stack.** Zod-схемы в `@tg/shared` зафиксированы до распараллеливания backend/UI. Схема — источник правды для endpoint + MSW handler.
- **g) `/review` перед merge** для любой не-trivial ветки. Каждый finding классифицируется:
    - **Blocking**: нарушение rails, violation module boundaries из arch-note, забытые `console.log` / TODO / мёртвый код, сломанный контракт.
    - **Nitpick**: naming, микро-стиль.
  LLM показывает полный список юзеру. Юзер по каждому решает: `fix` / `accepted` / `delay`. Done: ноль открытых blocking (всё либо пофикшено, либо явно `accepted`).

  **Failure handling (лесенка):**
    - Мелкий finding → фикс в ветке → перезапуск `/review`.
    - Finding = violation границ из arch-note → re-trigger `/brainstorm` (обновление arch-note, потом возврат к review).
    - Фикс сломал тесты → возврат в build-фазу, по зелёным тестам снова `/review`.
- **h) Migration safety.** Миграции идёмпотентны, тестируются на чистом master-DB до merge, revert-путь понятен.
- **i) Rollback-readiness.** Каждая не-trivial фича откатывается одним `git revert` без data-corruption. Необратимые миграции — явный план миграции-отката в commit-message.
- **j) PR/merge summary.** Финальный commit/merge message = bullet-список изменений + список ручных проверок для юзера.

**Merge-blockers:** активный MSW handler, падающие тесты, незакрытые TODO, не пройден `/review` (есть открытые blocking findings), нарушение хотя бы одного из rails a-j.

**Общие принципы кода:**
- Осторожно с fallback — они создают неоднозначность и усложняют логику. По возможности без них.
- Унифицировать решения, меньше edge case'ов.
- Каждый use case покрывается тестом (фиксация use cases — в тестах, не в файлах).

---

## Scope (trivial vs не-trivial)

**Trivial** (правка прямо на master, без ветки, без worktree, без `/brainstorm`, без `/simplify`, без `/review`, тест не обязателен):
- Нет нового use case
- Нет изменения публичного контракта (API endpoints, Zod-схемы в `@tg/shared`, экспортируемые сигнатуры)
- Нет новой зависимости
- Нет миграций DB

Типовые примеры: опечатка, 1-строчный config tweak, правка комментария, обновление константы без последствий.

**Всё остальное — не-trivial.** Применяются rails a-j.

---

## Feature Workflow

Новая фича или расширение существующей (новый use case или изменение контракта).

1. Plan mode + `/brainstorm` → концепт + use cases. Финальная секция brainstorm output — **Architecture note** (rail d). Юзер гейтит через brainstorm-диалог.
2. Определить scope по критериям выше. Если trivial — прямо на master, дальше не идём.
3. `EnterWorktree` → ветка `feature/<name>` от master.
4. **Contract-first** (если full-stack): Zod-схемы в `@tg/shared` зафиксированы до распараллеливания backend/UI.
5. Backend и UI параллельно на одной ветке:
    - Backend: миграции → endpoint + контрактные тесты (TDD) → сервис.
    - UI: см. раздел «UI-часть» ниже.
    - MSW допустим если UI опережает backend; помечается как merge-blocker.
6. `/simplify`.
7. **Migration safety check** (если миграции трогались): rail h.
8. Все тесты зелёные (контрактные + component). MSW удалён.
9. **`/review`** (rail g). Findings юзеру, гейтинг, failure-лесенка.
10. **Rollback-readiness** (rail i).
11. Merge `feature/<name>` → master. Commit-message = PR summary (rail j). `ExitWorktree`, удаление ветки.

### UI-часть (внутри Feature)

Применяется когда фича содержит UI.

1. **Чтение стиля.** Перед любой UI-правкой: `client/src/components/ui/*` (CVA-конфиги существующих компонентов), `client/src/index.css` (design tokens: `@theme`, palette, spacing, radius, typography). Следовать existing patterns по умолчанию; override — только при явной просьбе юзера.
2. **`/ui-ux-pro-max`** — UX-рекомендации с учётом существующего стиля (шаг 1).
3. **Production-код.** Реальные компоненты по реальным путям (`client/src/pages/<Feature>Page.tsx`, `client/src/components/<NewComponent>.tsx`). Никаких `__preview__/` или sandbox-папок. Real API вызовы по умолчанию.
4. **MSW (edge case).** Подключать только если endpoint ещё не существует на master и UI опережает backend:
    - Handler: `client/src/mocks/<feature>.ts`
    - Регистрация: `client/src/main.tsx` под `import.meta.env.DEV`
    - **Merge блокируется** пока MSW handlers не удалены и не заменены на real API-вызовы.
5. **Component-тесты обязательны** (Vitest + Testing Library) — по use cases. Playwright e2e — по суждению.
6. **Live preview.**
    ```
    cd <worktree-path>
    npm run dev -- --port 5174
    ```
    Порт 5174+ (5173 занят master-stack если работает). Claude отдаёт URL юзеру. Дефолтный viewport: **mobile 375w**. Desktop 1440w — по запросу.
7. **Итерация.** Юзер пишет правки в чат → Claude редактирует → HMR обновляет браузер. Рендерить состояния по необходимости: empty, loading, error, success — какие нужны говорит юзер.
8. **Pixel-diff** (по команде «зафиксируй кадр»). Claude через Playwright делает скриншот текущего состояния (worktree) + скриншот того же route на master + pixel-diff с красной подсветкой + semantic annotations текстом. Скриншоты **не коммитятся**.
9. **Утверждение.** Юзер: «утверждено». Claude коммитит правки атомарными сообщениями на `feature/<name>`.
10. **Замена MSW на real API** — после готовности backend endpoint. Merge блокируется пока MSW в коде.

**Инварианты UI:**
- Zero drift: preview-код = production-код. Тот же путь, те же импорты, тот же стек.
- Одна ветка на фичу. Никакой отдельной `design/<feature>`.
- Real API first: MSW — edge case, не дефолт.
- Стиль из кода: LLM читает `components/ui/*` и tokens перед каждой UI-правкой.

---

## Debug Workflow

Баг-фикс.

1. Plan mode. Каждый шаг явно проговаривается.
2. `/debug` → корневая причина + регрессионный тест, воспроизводящий баг.
3. `/brainstorm` → реализационная ошибка vs архитектурная, есть ли похожие проблемы. Финальная секция — **Architecture note** (rail d), если фикс не trivial.
4. Scope:
    - Trivial (1-строчник без нового поведения) → прямо на master, **без регрессионного теста** (исключение ради скорости).
    - Не-trivial → `feature/<name>` + worktree, регрессионный тест обязателен.
5. Если фикс касается UI — UI-часть как в feature.
6. Если фикс трогает миграции — **migration safety check** (rail h).
7. `/simplify`.
8. Регрессионный тест проходит, существующие тесты не сломаны.
9. **`/review`** (rail g). Findings юзеру, гейтинг, failure-лесенка.
10. **Rollback-readiness** (если не trivial).
11. Merge с PR summary (rail j): что было сломано, что починили, список ручных проверок.

---

## Refactor Workflow

**Назначение:** изменение формы кода без изменения поведения.

**Use cases:** выделение дубля в утилиту, переименование, переезд файла, разбиение файла, удаление dead code, унификация разных реализаций одного паттерна, переход на существующую утилиту (`@tg/shared`), применение `/simplify` как самостоятельная задача.

**Определение scope (все пять признаков должны выполняться):**
- Нет нового use case
- Нет изменения публичного контракта
- Нет миграций DB
- Нет новой зависимости
- Все существующие тесты остаются зелёными

Если хоть один нарушен — это не refactor. Либо reclassify в feature, либо откатить нарушение.

**Что НЕ refactor:**
- Перформанс-оптимизация (меняет наблюдаемое поведение → feature или отдельный perf-workflow)
- Замена библиотеки (тащит семантические различия → feature)
- Багфикс через чистку (→ debug)

**Workflow:**

1. Plan mode + `/brainstorm` → подтвердить scope по пяти признакам. Финальная секция — **Architecture note** (rail d): пути источника и назначения, reuse, границы модулей.
2. `EnterWorktree` → ветка `feature/<name>`.
3. `/simplify` — основная работа.
4. **Тесты зелёные.** Правки в тестах допустимы только в whitelist:
    - Обновление imports после переезда файла
    - Удаление теста мёртвой утилиты (если утилита удалена)
    - Rename test-helper (если переименован сам helper)

   Любая другая правка теста = behavior change → H1-процедура (ниже). Все правки тестов перечисляются в PR summary с обоснованием (одной строкой на правку).
5. **`/review`** (rail g). Фокус: behavior-changes и нарушения границ из arch-note.
6. **H1-процедура (`/review` нашёл behavior-меняющий хунк):** LLM показывает хунк юзеру и предлагает:
    - **Reclass в feature**: дальше идём по feature-workflow (contract-first если затронут контракт, TDD для новых use cases, обычные feature-шаги).
    - **Откатить хунк**: реверс именно этого хунка, возврат в `/simplify`, остаёмся refactor.

   Юзер выбирает.
7. Merge с PR summary (rail j): что и зачем переехало, список правок тестов с обоснованиями.

---

## Project Facts

- **Python 3.12** — `python` в CLI (скрипты в `scripts/`, `tools/`).
- **Frontend (Tailwind 4):** кастомные CSS-правила (reset, глобальные стили) должны быть внутри `@layer base`, иначе unlayered CSS перекрывает Tailwind-утилиты из `@layer utilities`. Проверять `client/src/index.css` при добавлении глобальных стилей.
- **Shared contracts:** Zod-схемы живут в `@tg/shared`, используются одновременно backend-валидацией и UI-типами.
- **Dev-порты:** master-stack Vite на `5173`, worktree-dev стартует с `5174+`.
