import { describe, it, expect } from 'vitest';
import {
  formatLocationNumber,
  formatLocationRef,
  matchesLocationSearch,
} from './formatLocationNumber';

describe('formatLocationNumber', () => {
  it('не меняет обычные номера (100-199)', () => {
    expect(formatLocationNumber(105)).toBe('105');
    expect(formatLocationNumber(199)).toBe('199');
    expect(formatLocationNumber(101)).toBe('101');
  });

  it('2XX → 1XX-Б', () => {
    expect(formatLocationNumber(203)).toBe('103-Б');
    expect(formatLocationNumber(205)).toBe('105-Б');
    expect(formatLocationNumber(252)).toBe('152-Б');
    expect(formatLocationNumber(200)).toBe('100-Б');
    expect(formatLocationNumber(299)).toBe('199-Б');
  });

  it('3XX → 1XX-В', () => {
    expect(formatLocationNumber(332)).toBe('132-В');
    expect(formatLocationNumber(300)).toBe('100-В');
    expect(formatLocationNumber(399)).toBe('199-В');
  });

  it('999 и 1001 → КС', () => {
    expect(formatLocationNumber(999)).toBe('КС');
    expect(formatLocationNumber(1001)).toBe('КС');
  });

  it('1201-1204 → ЭК', () => {
    expect(formatLocationNumber(1201)).toBe('ЭК');
    expect(formatLocationNumber(1204)).toBe('ЭК');
  });

  it('не меняет номера за пределами диапазонов', () => {
    expect(formatLocationNumber(400)).toBe('400');
    expect(formatLocationNumber(0)).toBe('0');
    expect(formatLocationNumber(150)).toBe('150');
  });
});

describe('formatLocationRef', () => {
  it('обычная локация с номером строфы → Лок.N#V', () => {
    expect(formatLocationRef(105, 5)).toBe('Лок.105#5');
  });

  it('2XX локация → Лок.1XX-Б#V', () => {
    expect(formatLocationRef(252, 5)).toBe('Лок.152-Б#5');
  });

  it('3XX локация → Лок.1XX-В#V', () => {
    expect(formatLocationRef(332, 3)).toBe('Лок.132-В#3');
  });

  it('КС без префикса "Лок." → КС#V', () => {
    expect(formatLocationRef(999, 5)).toBe('КС#5');
    expect(formatLocationRef(1001, 10)).toBe('КС#10');
  });

  it('ЭК без префикса "Лок." → ЭК#V', () => {
    expect(formatLocationRef(1201, 3)).toBe('ЭК#3');
  });

  it('без номера строфы → только локация', () => {
    expect(formatLocationRef(105, null)).toBe('Лок.105');
    expect(formatLocationRef(105)).toBe('Лок.105');
    expect(formatLocationRef(999, null)).toBe('КС');
    expect(formatLocationRef(999)).toBe('КС');
  });
});

describe('matchesLocationSearch', () => {
  it('совпадает по сырому номеру', () => {
    expect(matchesLocationSearch(252, '252')).toBe(true);
    expect(matchesLocationSearch(252, '52')).toBe(true);
  });

  it('совпадает по форматированному номеру', () => {
    expect(matchesLocationSearch(252, '152')).toBe(true);
    expect(matchesLocationSearch(252, '152-Б')).toBe(true);
    expect(matchesLocationSearch(252, '152-б')).toBe(true);
  });

  it('совпадает для 3XX по форматированному номеру', () => {
    expect(matchesLocationSearch(332, '132')).toBe(true);
    expect(matchesLocationSearch(332, '132-В')).toBe(true);
  });

  it('совпадает для КС', () => {
    expect(matchesLocationSearch(999, 'кс')).toBe(true);
    expect(matchesLocationSearch(999, 'КС')).toBe(true);
  });

  it('совпадает для ЭК', () => {
    expect(matchesLocationSearch(1201, 'эк')).toBe(true);
    expect(matchesLocationSearch(1201, 'ЭК')).toBe(true);
  });

  it('не совпадает при несовпадающем запросе', () => {
    expect(matchesLocationSearch(252, '332')).toBe(false);
    expect(matchesLocationSearch(105, 'кс')).toBe(false);
  });

  it('пустой запрос всегда совпадает', () => {
    expect(matchesLocationSearch(252, '')).toBe(true);
    expect(matchesLocationSearch(252, '  ')).toBe(true);
  });
});
