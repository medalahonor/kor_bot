import { useState } from 'react';
import { useDeleteOption } from '../../api/admin';
import EditOptionForm from './EditOptionForm';
import type { Option } from '@tg/shared';

interface EditOptionProps {
  option: Option;
}

export default function EditOption({ option }: EditOptionProps) {
  const [editing, setEditing] = useState(false);
  const deleteOption = useDeleteOption();

  const handleDelete = () => {
    if (confirm('Удалить этот выбор?')) {
      deleteOption.mutate(option.id);
    }
  };

  if (!editing) {
    return (
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => setEditing(true)}
          className="text-[10px] px-1.5 py-0.5 rounded bg-bg text-text-secondary border border-separator hover:border-rune/30"
        >
          &#9998;
        </button>
        <button
          onClick={handleDelete}
          className="text-[10px] px-1.5 py-0.5 rounded bg-bg text-red/70 border border-separator hover:border-red/30"
        >
          &#10005;
        </button>
      </div>
    );
  }

  return (
    <EditOptionForm
      option={option}
      onSaved={() => setEditing(false)}
      onCancel={() => setEditing(false)}
    />
  );
}
