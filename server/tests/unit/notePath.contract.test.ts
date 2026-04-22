import { describe, it, expect } from 'vitest';
import { NotePathSchema } from '@tg/shared';

describe('NotePathSchema', () => {
  it('accepts single-step path (target only) without optionId', () => {
    const result = NotePathSchema.safeParse([
      { locationDn: 5, verseDn: 0 },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts multi-step path with optionId on non-target steps', () => {
    const result = NotePathSchema.safeParse([
      { locationDn: 5, verseDn: 0, optionId: 10 },
      { locationDn: 5, verseDn: 3, optionId: 22 },
      { locationDn: 5, verseDn: 7 },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects multi-step path missing optionId on a non-target step', () => {
    const result = NotePathSchema.safeParse([
      { locationDn: 5, verseDn: 0, optionId: 10 },
      { locationDn: 5, verseDn: 3 },
      { locationDn: 5, verseDn: 7 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects two-step path missing optionId on the first step', () => {
    const result = NotePathSchema.safeParse([
      { locationDn: 5, verseDn: 0 },
      { locationDn: 5, verseDn: 3 },
    ]);
    expect(result.success).toBe(false);
  });

  it('accepts cross-location step transitions', () => {
    const result = NotePathSchema.safeParse([
      { locationDn: 5, verseDn: 0, optionId: 10 },
      { locationDn: 8, verseDn: 0, optionId: 50 },
      { locationDn: 8, verseDn: 4 },
    ]);
    expect(result.success).toBe(true);
  });
});
