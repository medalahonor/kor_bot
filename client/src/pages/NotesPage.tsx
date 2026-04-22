import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import type { NoteType } from '@tg/shared';
import { Button } from '@/components/ui/button';
import NotesTab from './notes/NotesTab';
import NoteForm from '../components/notes/NoteForm';
import DeleteNoteDialog from '../components/notes/DeleteNoteDialog';
import { NOTE_LABELS, NOTE_TYPES } from '../lib/noteLabels';
import { useNoteFormState } from '../hooks/useNoteFormState';

export default function NotesPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<NoteType>('quest');
  const state = useNoteFormState({
    onCreated: ({ type }) => setActive(type),
  });

  return (
    <div className="flex-1 flex flex-col">
      <div
        className="sticky top-0 z-[100] border-b border-rune/20"
        style={{
          background: 'linear-gradient(180deg, #1c2428 0%, #141a1c 100%)',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
        }}
      >
        <div className="px-4 pb-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-rune text-[13px]"
          >
            &#8249; Назад
          </button>
          <h1
            className="font-heading text-text-primary text-lg font-semibold tracking-[1.5px]"
            style={{ textShadow: '0 0 10px var(--color-rune-glow)' }}
          >
            Заметки
          </h1>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Новая заметка"
            onClick={state.openCreate}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex border-b border-separator bg-bg-card">
        {NOTE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={
              'flex-1 py-2 text-[12px] tracking-wide transition-colors ' +
              (active === t
                ? 'text-rune border-b-2 border-rune'
                : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary')
            }
          >
            {NOTE_LABELS[t].plural}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <NotesTab
          type={active}
          onEdit={state.openEdit}
          onDelete={state.requestDelete}
        />
      </div>

      {state.form && (
        <NoteForm
          open
          mode={state.form.mode}
          initial={
            state.form.mode === 'edit'
              ? { type: state.form.note.type, body: state.form.note.body }
              : { type: active, body: '' }
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
