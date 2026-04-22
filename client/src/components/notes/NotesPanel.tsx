import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { NotePath } from '@tg/shared';
import { useVerseNotes } from '../../api/queries';
import { useNoteFormState } from '../../hooks/useNoteFormState';
import NoteCard from './NoteCard';
import NoteForm from './NoteForm';
import DeleteNoteDialog from './DeleteNoteDialog';

interface NotesPanelProps {
  verseId: number;
  defaultPath: NotePath;
  locationName: string | null;
}

export default function NotesPanel({
  verseId,
  defaultPath,
  locationName,
}: NotesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: notes = [] } = useVerseNotes(verseId);
  const state = useNoteFormState({
    defaultTarget: {
      path: defaultPath,
      locationName,
    },
  });

  const count = notes.length;
  const headerLabel = count === 0 ? 'Добавить заметку' : `Заметки (${count})`;

  return (
    <div className="mx-4 mt-3 rounded-lg border border-separator bg-bg-card">
      <button
        type="button"
        onClick={() => {
          if (count === 0) state.openCreate();
          else setExpanded((v) => !v);
        }}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        aria-expanded={expanded}
      >
        <span className="text-[12px] text-rune/80">{headerLabel}</span>
        {count > 0 && (
          <ChevronDown
            className={
              'size-4 text-rune/70 transition-transform ' +
              (expanded ? 'rotate-180' : '')
            }
          />
        )}
      </button>

      {count > 0 && expanded && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={state.openEdit}
              onDelete={state.requestDelete}
            />
          ))}
          <button
            type="button"
            onClick={state.openCreate}
            className="self-start flex items-center gap-1 text-[12px] text-rune hover:underline"
          >
            <Plus className="size-3.5" />
            заметка
          </button>
        </div>
      )}

      {state.form && (
        <NoteForm
          open
          mode={state.form.mode}
          initial={
            state.form.mode === 'edit'
              ? { type: state.form.note.type, body: state.form.note.body }
              : undefined
          }
          attachmentPath={state.form.mode === 'create' ? state.form.target.path : null}
          onSubmit={state.submit}
          onClose={state.closeForm}
          busy={state.busyForm}
          error={state.formError}
        />
      )}

      {state.deletingNote && (
        <DeleteNoteDialog
          open
          busy={state.busyDelete}
          error={state.deleteError}
          onConfirm={state.confirmDelete}
          onClose={state.closeDelete}
        />
      )}
    </div>
  );
}
