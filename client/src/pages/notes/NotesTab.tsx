import { useMemo } from 'react';
import type { Note, NoteType } from '@tg/shared';
import { useCampaignNotes } from '../../api/queries';
import NoteCard from '../../components/notes/NoteCard';
import { NOTE_LABELS } from '../../lib/noteLabels';

interface NotesTabProps {
  type: NoteType;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NotesTab({ type, onEdit, onDelete }: NotesTabProps) {
  const { data, isLoading } = useCampaignNotes();
  const filtered = useMemo(
    () => (data ?? []).filter((n) => n.type === type),
    [data, type],
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        Менгиры пробуждаются...
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        {NOTE_LABELS[type].empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {filtered.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          returnTo="/notes"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
