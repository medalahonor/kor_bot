import type { NoteType } from '@tg/shared';

export const NOTE_LABELS: Record<NoteType, { singular: string; plural: string; empty: string }> = {
  quest: { singular: 'Задание', plural: 'Задания', empty: 'Нет заданий' },
  hint: { singular: 'Подсказка', plural: 'Подсказки', empty: 'Нет подсказок' },
  general: { singular: 'Общее', plural: 'Общие', empty: 'Нет заметок' },
};

export const NOTE_TYPES: NoteType[] = ['quest', 'hint', 'general'];
