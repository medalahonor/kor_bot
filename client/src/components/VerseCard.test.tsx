import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerseCard from './VerseCard';
import type { Verse, Option, OptionStatus } from '../lib/types';

function makeOption(overrides: Partial<Option> & { id: number; text: string }): Option {
  return {
    position: 0,
    type: 'choice',
    targetType: null,
    targetVerseDn: null,
    targetLocationDn: null,
    requirement: null,
    result: null,
    hidden: null,
    once: false,
    conditionGroup: null,
    conditionalTargets: null,
    children: null,
    ...overrides,
  };
}

function makeVerse(options: Option[], displayNumber = 0): Verse {
  return { id: 1, displayNumber, options };
}

/** Helper: create statusMap from array of visited IDs (all as 'visited') */
function visitedMap(...ids: number[]): Map<number, OptionStatus> {
  return new Map(ids.map((id) => [id, 'visited']));
}

describe('VerseCard', () => {
  it('вызывает onOptionClick при клике на choice с targetType=end', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const endOption = makeOption({
      id: 5,
      text: 'Уйти.',
      targetType: 'end',
      result: 'Исследование окончено.',
    });

    render(
      <VerseCard
        verse={makeVerse([endOption])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={onClick}
      />,
    );

    await user.click(screen.getByText('Уйти.'));
    expect(onClick).toHaveBeenCalledWith(endOption);
  });

  it('рендерит condition с targetType=verse как кликабельную кнопку с target', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const condOption = makeOption({
      id: 9,
      text: 'Если у вас есть часть 1 достижения «Горькая правда».',
      type: 'condition',
      targetType: 'verse',
      targetVerseDn: 13,
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={onClick}
      />,
    );

    expect(screen.getByText('→ #13')).toBeInTheDocument();

    await user.click(screen.getByText('Если у вас есть часть 1 достижения «Горькая правда».'));
    expect(onClick).toHaveBeenCalledWith(condOption);
  });

  it('рендерит condition с targetType=end как кликабельную кнопку с меткой "Конец"', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const condOption = makeOption({
      id: 6,
      text: 'Если у вас есть часть 1 достижения «Диковинки».',
      type: 'condition',
      targetType: 'end',
      result: 'Здесь больше ничего не удастся найти.',
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={onClick}
      />,
    );

    expect(screen.getByText('Конец')).toBeInTheDocument();
    expect(screen.getByText('Здесь больше ничего не удастся найти.')).toBeInTheDocument();

    await user.click(screen.getByText('Если у вас есть часть 1 достижения «Диковинки».'));
    expect(onClick).toHaveBeenCalledWith(condOption);
  });

  it('pending опция рендерится с pending-индикатором', () => {
    const option = makeOption({
      id: 1,
      text: 'Пойти дальше.',
      targetType: 'verse',
      targetVerseDn: 3,
    });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={new Map()}
        pendingIds={new Set([1])}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Пойти дальше.')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button.className).toContain('choice-accent-blue');
  });

  it('pending опция не скрывается фильтром showOnlyNew', () => {
    const options = [
      makeOption({ id: 1, text: 'Уже посещён', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 2, text: 'В пути', targetType: 'verse', targetVerseDn: 5, position: 1 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(1)}
        pendingIds={new Set([2])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('Уже посещён')).not.toBeInTheDocument();
    expect(screen.getByText('В пути')).toBeInTheDocument();
  });

  it('показывает "Все выборы пройдены" когда showOnlyNew=true и все visited', () => {
    const options = [
      makeOption({ id: 1, text: 'Выбор 1', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 2, text: 'Выбор 2', targetType: 'end' }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(1, 2)}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Все выборы пройдены')).toBeInTheDocument();
  });

  it('showOnlyNew=true: visited gateway-опция остаётся видимой', () => {
    const options = [
      makeOption({ id: 1, text: 'Шлюзовой выбор', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 2, text: 'Уже пройден', targetType: 'end', position: 1 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(1, 2)}
        gatewayIds={new Set([1])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Шлюзовой выбор')).toBeInTheDocument();
    expect(screen.queryByText('Уже пройден')).not.toBeInTheDocument();
  });

  it('showOnlyNew=true: не показывает "Все выборы пройдены" когда есть gateway', () => {
    const options = [
      makeOption({ id: 1, text: 'Шлюз', targetType: 'verse', targetVerseDn: 3 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(1)}
        gatewayIds={new Set([1])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('Все выборы пройдены')).not.toBeInTheDocument();
    expect(screen.getByText('Шлюз')).toBeInTheDocument();
  });

  it('showOnlyNew=true: без gatewayIds visited опции скрыты (обратная совместимость)', () => {
    const options = [
      makeOption({ id: 1, text: 'Посещён', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 2, text: 'Новый', targetType: 'end', position: 1 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(1)}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('Посещён')).not.toBeInTheDocument();
    expect(screen.getByText('Новый')).toBeInTheDocument();
  });

  it('REPRO: visited gateway к строфе с unvisited опциями остаётся видимой', () => {
    const options = [
      makeOption({ id: 10, text: 'Путь A (посещён)', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 11, text: 'Путь B (новый)', targetType: 'verse', targetVerseDn: 5, position: 1 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(10)}
        gatewayIds={new Set([10])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Путь A (посещён)')).toBeInTheDocument();
    expect(screen.getByText('Путь B (новый)')).toBeInTheDocument();
  });

  // --- Bug fix: conditions должны показывать visited-состояние ---

  it('UC1: visited condition получает unified visited-стиль (text-green, border-l-green, opacity-55)', () => {
    const condOption = makeOption({
      id: 9,
      text: 'Если у вас есть часть 1 достижения «Горькая правда».',
      type: 'condition',
      targetType: 'verse',
      targetVerseDn: 13,
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={visitedMap(9)}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-55');
    expect(button.className).toContain('border-l-green');
    const text = screen.getByText('Если у вас есть часть 1 достижения «Горькая правда».');
    expect(text.className).toContain('text-green');
  });

  it('UC2: showOnlyNew=true: visited condition (не gateway) скрывается фильтром', () => {
    const options = [
      makeOption({
        id: 9,
        text: 'Условие (посещено)',
        type: 'condition',
        targetType: 'verse',
        targetVerseDn: 13,
      }),
      makeOption({
        id: 10,
        text: 'Новый выбор',
        targetType: 'verse',
        targetVerseDn: 5,
        position: 1,
      }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(9)}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('Условие (посещено)')).not.toBeInTheDocument();
    expect(screen.getByText('Новый выбор')).toBeInTheDocument();
  });

  it('UC3: showOnlyNew=true: visited condition-gateway остаётся видимой', () => {
    const condOption = makeOption({
      id: 9,
      text: 'Условие-шлюз',
      type: 'condition',
      targetType: 'verse',
      targetVerseDn: 13,
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={visitedMap(9)}
        gatewayIds={new Set([9])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Условие-шлюз')).toBeInTheDocument();
  });

  it('UC4: showOnlyNew=true: все опции (choice + condition) visited → "Все выборы пройдены"', () => {
    const options = [
      makeOption({ id: 1, text: 'Выбор', targetType: 'end' }),
      makeOption({
        id: 2,
        text: 'Условие',
        type: 'condition',
        targetType: 'verse',
        targetVerseDn: 5,
        position: 1,
      }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={visitedMap(1, 2)}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Все выборы пройдены')).toBeInTheDocument();
  });

  // --- Bug fix: gateway-опции НЕ должны показывать ✓ ---

  it('BUG: visited gateway choice-опция НЕ показывает ✓ и opacity-50', () => {
    const option = makeOption({
      id: 10,
      text: 'Вернуться в Четыре Девы.',
      targetType: 'verse',
      targetVerseDn: 6,
    });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={visitedMap(10)}
        gatewayIds={new Set([10])}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Вернуться в Четыре Девы.')).toBeInTheDocument();
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('opacity-50');
  });

  it('BUG: visited gateway condition-опция НЕ показывает ✓ и opacity-50', () => {
    const condOption = makeOption({
      id: 9,
      text: 'Если у вас есть карта секрета 8.',
      type: 'condition',
      targetType: 'verse',
      targetVerseDn: 8,
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={visitedMap(9)}
        gatewayIds={new Set([9])}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Если у вас есть карта секрета 8.')).toBeInTheDocument();
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('opacity-50');
  });

  it('Регрессия: обычная visited (не gateway) опция по-прежнему показывает ✓', () => {
    const option = makeOption({
      id: 10,
      text: 'Полностью пройденный путь.',
      targetType: 'verse',
      targetVerseDn: 6,
    });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={visitedMap(10)}
        gatewayIds={new Set()}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Полностью пройденный путь.')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-55');
    expect(button.className).toContain('choice-accent-green');
  });

  // --- Новые тесты для системы статусов ---

  it('showOnlyNew=true: closed опции скрываются', () => {
    const options = [
      makeOption({ id: 1, text: 'Закрытый', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 2, text: 'Доступный', targetType: 'end', position: 1 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={new Map([[1, 'closed']])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('Закрытый')).not.toBeInTheDocument();
    expect(screen.getByText('Доступный')).toBeInTheDocument();
  });

  // --- ConditionalTargets ---

  it('choice с conditionalTargets показывает target label', () => {
    const option = makeOption({
      id: 20,
      text: 'Подойти к лагерю.',
      conditionalTargets: [
        { condition: 'Если нет света', verse: 10 },
        { condition: 'Иначе', verse: 11 },
      ],
    });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Подойти к лагерю.')).toBeInTheDocument();
    expect(screen.getByText('→ #10 / #11')).toBeInTheDocument();
  });

  it('choice с conditionalTargets кликабельна', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const option = makeOption({
      id: 21,
      text: 'Подойти к лагерю.',
      conditionalTargets: [
        { condition: 'Если нет света', verse: 10 },
        { condition: 'Иначе', verse: 11 },
      ],
    });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={onClick}
      />,
    );

    await user.click(screen.getByText('Подойти к лагерю.'));
    expect(onClick).toHaveBeenCalledWith(option);
  });

  it('cross-location condition отображает форматированный номер локации', () => {
    const condOption = makeOption({
      id: 15,
      text: 'Если есть карта.',
      type: 'condition',
      targetType: 'cross_location',
      targetLocationDn: 252,
      targetVerseDn: 5,
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/Лок\.152-Б#5/)).toBeInTheDocument();
  });

  it('cross-location condition к КС отображается без префикса "Лок."', () => {
    const condOption = makeOption({
      id: 16,
      text: 'Если есть секрет.',
      type: 'condition',
      targetType: 'cross_location',
      targetLocationDn: 999,
      targetVerseDn: 10,
    });

    render(
      <VerseCard
        verse={makeVerse([condOption])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/КС#10/)).toBeInTheDocument();
  });

  // После перехода на тему «Марь и менгиры» (Apr 2026) cross_location перестал
  // иметь отдельный визуальный статус (циан). Визуально — обычный default.
  it('cross_location choice не имеет специального text-cyan / choice-accent-cyan', () => {
    const crossOption = makeOption({
      id: 77,
      text: 'Перейти в другую локацию.',
      targetType: 'cross_location',
      targetLocationDn: 100,
      targetVerseDn: 5,
    });

    render(
      <VerseCard
        verse={makeVerse([crossOption])}
        statusMap={new Map()}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).not.toContain('choice-accent-cyan');
    expect(button.className).not.toContain('text-cyan');
    expect(button.className).toContain('choice-accent-default');
  });

  // Параметризованные тесты: страховка от расхождения между choice и condition.
  // Любая новая фича ChoiceOption (StatusPicker, EditOption, обработчики и т.п.)
  // должна работать одинаково для обоих variants. Если кто-то добавит логику
  // только для одной ветки — один из этих тестов упадёт.
  describe.each<['choice' | 'condition', () => Option]>([
    [
      'choice',
      () =>
        makeOption({
          id: 1,
          text: 'Обычный выбор.',
          type: 'choice',
          targetType: 'verse',
          targetVerseDn: 3,
        }),
    ],
    [
      'condition',
      () =>
        makeOption({
          id: 1,
          text: 'Если условие выполнено.',
          type: 'condition',
          targetType: 'verse',
          targetVerseDn: 3,
        }),
    ],
  ])('поведение в game mode — %s вариант', (_variant, makeOpt) => {
    it('StatusPicker отображается когда onStatusChange передан', () => {
      const option = makeOpt();
      render(
        <VerseCard
          verse={makeVerse([option])}
          statusMap={new Map()}
          showOnlyNew={false}
          onOptionClick={vi.fn()}
          onStatusChange={vi.fn()}
        />,
      );
      expect(screen.getByTitle('Изменить статус')).toBeInTheDocument();
    });

    it('StatusPicker НЕ отображается когда onStatusChange не передан', () => {
      const option = makeOpt();
      render(
        <VerseCard
          verse={makeVerse([option])}
          statusMap={new Map()}
          showOnlyNew={false}
          onOptionClick={vi.fn()}
        />,
      );
      expect(screen.queryByTitle('Изменить статус')).not.toBeInTheDocument();
    });

    it('onStatusChange вызывается с (optionId, newStatus) при смене статуса', async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();
      const option = makeOpt();
      render(
        <VerseCard
          verse={makeVerse([option])}
          statusMap={new Map()}
          showOnlyNew={false}
          onOptionClick={vi.fn()}
          onStatusChange={onStatusChange}
        />,
      );
      await user.click(screen.getByTitle('Изменить статус'));
      await user.click(screen.getByText('Пройдено'));
      expect(onStatusChange).toHaveBeenCalledWith(option.id, 'visited');
    });

    it('closed вариант имеет line-through на тексте', () => {
      const option = makeOpt();
      render(
        <VerseCard
          verse={makeVerse([option])}
          statusMap={new Map([[option.id, 'closed']])}
          showOnlyNew={false}
          onOptionClick={vi.fn()}
        />,
      );
      const text = screen.getByText(option.text);
      expect(text.className).toContain('line-through');
    });
  });

  it('карточка с visited статусом имеет choice-accent-green и пониженную opacity', () => {
    const option = makeOption({ id: 1, text: 'Путь.', targetType: 'verse', targetVerseDn: 3 });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={new Map([[1, 'visited']])}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('choice-accent-green');
    expect(button.className).toContain('opacity-55');
  });

  it('карточка с closed статусом имеет choice-accent-red, пониженную opacity и зачеркнутый текст', () => {
    const option = makeOption({ id: 1, text: 'Закрыт.', targetType: 'verse', targetVerseDn: 3 });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={new Map([[1, 'closed']])}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('choice-accent-red');
    expect(button.className).toContain('opacity-45');
    const text = screen.getByText('Закрыт.');
    expect(text.className).toContain('line-through');
  });

  it('карточка с requirements_not_met статусом имеет choice-accent-amber', () => {
    const option = makeOption({ id: 1, text: 'Нужны ресурсы.', targetType: 'verse', targetVerseDn: 3 });

    render(
      <VerseCard
        verse={makeVerse([option])}
        statusMap={new Map([[1, 'requirements_not_met']])}
        showOnlyNew={false}
        onOptionClick={vi.fn()}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('choice-accent-amber');
  });

  it('showOnlyNew=true: requirements_not_met опции видны', () => {
    const options = [
      makeOption({ id: 1, text: 'Нет ресурсов', targetType: 'verse', targetVerseDn: 3 }),
      makeOption({ id: 2, text: 'Посещён', targetType: 'end', position: 1 }),
    ];

    render(
      <VerseCard
        verse={makeVerse(options)}
        statusMap={new Map([[1, 'requirements_not_met'], [2, 'visited']])}
        showOnlyNew={true}
        onOptionClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Нет ресурсов')).toBeInTheDocument();
    expect(screen.queryByText('Посещён')).not.toBeInTheDocument();
  });
});
