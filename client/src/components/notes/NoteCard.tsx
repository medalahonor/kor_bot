import { useNavigate } from 'react-router';
import type { Note } from '@tg/shared';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { formatNotePath } from '../../lib/formatLocationNumber';
import { NOTE_LABELS } from '../../lib/noteLabels';

interface NoteCardProps {
  note: Note;
  returnTo?: string;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NoteCard({ note, returnTo, onEdit, onDelete }: NoteCardProps) {
  const navigate = useNavigate();
  const path = note.path;
  const hasAttachment = path !== null && path.length > 0;
  const target = hasAttachment ? path[path.length - 1] : null;

  const openVerse = () => {
    if (!target) return;
    navigate(`/location/${target.locationDn}/verse/${target.verseDn}`, {
      state: returnTo ? { returnTo } : undefined,
    });
  };

  return (
    <div className="rounded-lg border border-separator bg-bg-card p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[1px] text-rune/70">
          {NOTE_LABELS[note.type].singular}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Редактировать заметку"
            onClick={() => onEdit(note)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Удалить заметку"
            onClick={() => onDelete(note)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <p className="text-[13px] text-text-primary whitespace-pre-wrap break-words">
        {note.body}
      </p>

      {hasAttachment && path && (
        <button
          type="button"
          onClick={openVerse}
          className="text-left text-[11px] text-rune hover:underline self-start"
        >
          {formatNotePath(path)}
          {note.locationName ? ` · ${note.locationName}` : ''}
          <span aria-hidden> ›</span>
        </button>
      )}
    </div>
  );
}
