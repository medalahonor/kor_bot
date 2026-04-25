# Workflow-инструкции для LLM

Документ задаёт явные рельсы работы LLM над кодом проекта. Три именованных workflow: **feature**, **debug**, **refactor**. Всё, что не попадает — обрабатывается через `/brainstorm` + суждение LLM на базе feature-шаблона.

---

## Project Rails (обязательные инварианты)

Применяются ко всем workflow. Нарушение — merge-blocker.

- **a) TDD для не-trivial.** Тест до merge.
- **b) Fail-fast контракты.** Невалидный response / SSE-event / request body → явная ошибка (throw, 500, закрытие подписки с сигналом наверх). Silent skip, warn-and-continue, try/catch с глотанием запрещены — маскируют рассинхрон версий между фронтом и бэком.
- **b2) Hook API не маскируется под event handler.** Функции из hook'ов, которые могут попасть в `onClick`/`onChange`/прочие event handlers, не имеют optional non-event параметра — TS не отличает `MouseEvent` от любого совместимого по форме типа, и прямой `onClick={hook.fn}` молча принимает `MouseEvent` как аргумент. Контекст-аргумент → отдельная именованная функция (`actionFor(ctx)`). Reason: `feat(notes)` — `useNoteFormState.openCreate(target?: CreateTarget)` упал в prod-build после merge.
- **c) Worktree для всего не-trivial.** Всегда, без исключений (`EnterWorktree` → ветка `feature/<name>` от master).
- **d) `/brainstorm` как обязательный auto-step plan-mode.** LLM инвокает `Skill(brainstorm)` автоматом после Phase 1 research (Explore) и до architect-шага. Brainstorm получает research findings как контекст (не сырой запрос) и ведёт интерактивный диалог до концепт-документа (суть / мотивация / сценарии / границы). **Architecture note (arch-note)** производит **architect-шаг**, не brainstorm: три поля — пути файлов где живёт новый/меняющийся код, существующие утилиты/компоненты для reuse с путями, границы модулей (что НЕ трогаем). Architect обнаружил что концепт нереализуем — re-trigger `/brainstorm` с конкретным constraint. По ходу работы arch-note оказалась неверной по существу — re-trigger `/brainstorm` → architect.
- **e) `/simplify` перед merge** для feature и debug. Для refactor `/simplify` = основная работа.
- **f) Contract-first для full-stack.** Zod-схемы в `@tg/shared` формируются как Zod skeleton в implementation design architect-шага (rail d) и фиксируются до начала backend-фазы. Backend и UI используют один skeleton — схема источник правды для endpoint и UI-типов.
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

**Merge-blockers:** падающие тесты, незакрытые TODO, не пройден `/review` (есть открытые blocking findings), UI-фича без "утверждено" от юзера в чате, нарушение хотя бы одного из rails a-j.

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

### Pre-implementation flow (inside plan-mode)

Применяется к любой не-trivial фиче. Последовательные фазы внутри plan-mode:

1. **Phase 1: Explore.** LLM запускает до 3 Explore agents параллельно — research кодобы по запросу юзера.
2. **Phase 2: Brainstorm (auto).** LLM автоматом инвокает `Skill(brainstorm)` (rail d), передавая research findings как контекст (не сырой запрос). Skill ведёт интерактивный диалог до концепт-документа (суть / мотивация / сценарии / границы). Юзер прерывает ("хватит") → skill выдаёт концепт с секцией "Нерассмотрено".
3. **Phase 3: Architect.** LLM запускает явный architect-шаг:
    - Input: концепт-документ + research findings.
    - Output: **arch-note** (paths / reuse / boundaries) + **implementation design** (sequencing, TDD-порядок, migration plan, test strategy, Zod skeleton для `@tg/shared`).
    - Architect находит нереализуемость → re-trigger brainstorm с конкретным constraint.
    - "Нерассмотрено" не пуст → architect работает по partial концепту, риски пишет в arch-note.
4. **Phase 4: Final plan.** LLM записывает `plan.md` по фикс-template:
    - Context
    - Brainstorm concept
    - Arch-note
    - Implementation design
    - Verification
5. **Phase 5:** LLM вызывает `ExitPlanMode` → начинается реализация.

### Implementation steps

1. Pre-implementation flow (см. выше) завершён, `plan.md` утверждён юзером.
2. Определить scope по критериям выше. Если trivial — прямо на master, дальше не идём.
3. `EnterWorktree` → ветка `feature/<name>` от master.
4. **Backend-фаза** (skip если UI-only): миграции → endpoint + контрактные тесты (TDD) → сервис. Zod skeleton из architect — контракт.
5. **UI-фаза** (skip если backend-only): **UI-iteration loop** на real API — см. подраздел ниже.
6. `/simplify`.
7. **Migration safety check** (если миграции трогались): rail h.
8. Все тесты зелёные (контрактные + component).
9. **Typecheck-гейт.** `npm run build` (или per-workspace `tsc -b`) — должен быть зелёным. Падение → возврат в build-фазу. Reason: `tsc -b` ловит ошибки за секунду локально, prod Dockerfile-build — за минуты.
10. **`/review`** (rail g). Findings юзеру, гейтинг, failure-лесенка.
11. **Rollback-readiness** (rail i).
12. Merge `feature/<name>` → master. Commit-message = PR summary (rail j). `ExitWorktree`, удаление ветки.

**Контракт меняется по ходу UI-итерации** (UI показал плохую форму данных для рендера — нужно extra field, изменить nesting) → re-trigger architect (обновление arch-note + Zod skeleton + патч backend). UI ждёт новый контракт.

### UI-iteration loop (внутри Feature)

Применяется когда фича содержит UI. Работает на real API — backend-фаза уже завершена (см. step 4 выше). Исключение: UI-only фича, где API не меняется, итерируется на существующем API.

1. **Template-чеклист (pre-код, mandatory).** Перед первым UI-кодом LLM обязательно:
    - Читает `client/src/components/ui/*` (CVA-конфиги существующих компонентов).
    - Читает `client/src/index.css` (design tokens: `@theme`, palette, spacing, radius, typography).
    - Дефолт viewport: **mobile 375w**. Desktop 1440w — по запросу.
    - Рендерит применимые состояния: empty / loading / error / success. Какие нужны — говорит юзер.
    - Следует existing patterns по умолчанию; override — только при явной просьбе юзера.
2. **`/ui-ux-pro-max`** — **mandatory**, с учётом стиля из шага 1. UX-рекомендации до первого кода.
3. **Production-код.** Реальные компоненты по реальным путям (`client/src/pages/<Feature>Page.tsx`, `client/src/components/<NewComponent>.tsx`). Никаких `__preview__/` или sandbox-папок. **Real API only — MSW запрещён.**
4. **Live preview (mandatory).**
    ```
    cd <worktree-path>
    npm run dev -- --port 5174
    ```
    Порт 5174+ (5173 занят master-stack если работает). LLM отдаёт URL юзеру. **Без запуска preview merge блокируется.**
5. **Iteration.** Юзер пишет правки в чат → LLM редактирует → HMR обновляет браузер → LLM спрашивает "ещё правки или утверждаем?".
6. **Component-тесты обязательны** (Vitest + Testing Library) — по use cases. Playwright e2e — по суждению.
7. **Approval-gate.** Юзер пишет "утверждено" в чате → LLM коммитит правки атомарными сообщениями на `feature/<name>`. **Без "утверждено" merge блокируется** (см. merge-blockers).

**Инварианты UI:**
- Zero drift: код в preview = код в production. Тот же путь, те же импорты, тот же стек.
- Одна ветка на фичу. Никакой отдельной `design/<feature>`.
- **Real API only**: MSW не используется (backend-first устраняет необходимость).
- **Backend-first**: UI-фаза стартует только после готовности backend (исключение — UI-only фича где API не меняется).
- Стиль из кода: LLM читает `components/ui/*` и tokens перед каждой UI-правкой.

---

## Debug Workflow

Баг-фикс.

1. Plan mode. Каждый шаг явно проговаривается.
2. `/debug` → корневая причина + регрессионный тест, воспроизводящий баг.
3. `/brainstorm` (auto-step plan-mode, rail d) → реализационная ошибка vs архитектурная, есть ли похожие проблемы. Arch-note производит architect-шаг (rail d), если фикс не trivial.
4. Scope:
    - Trivial (1-строчник без нового поведения) → прямо на master, **без регрессионного теста** (исключение ради скорости).
    - Не-trivial → `feature/<name>` + worktree, регрессионный тест обязателен.
5. Если фикс касается UI — UI-часть как в feature.
6. Если фикс трогает миграции — **migration safety check** (rail h).
7. `/simplify`.
8. Регрессионный тест проходит, существующие тесты не сломаны.
9. **Typecheck-гейт** (если не trivial). `npm run build` (или per-workspace `tsc -b`) — должен быть зелёным. Падение → возврат в build-фазу.
10. **`/review`** (rail g). Findings юзеру, гейтинг, failure-лесенка.
11. **Rollback-readiness** (если не trivial).
12. Merge с PR summary (rail j): что было сломано, что починили, список ручных проверок.

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

1. Plan mode. `/brainstorm` auto-step (rail d) → подтвердить scope по пяти признакам. Architect-шаг производит arch-note: пути источника и назначения, reuse, границы модулей.
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
