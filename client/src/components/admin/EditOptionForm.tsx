import { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { useUpdateOption } from '../../api/admin';
import { useLocationVerses, useLocations, useVerseNumbers } from '../../api/queries';
import NumericAutocomplete from './NumericAutocomplete';
import type { Option } from '@tg/shared';

type TargetTypeValue = 'verse' | 'cross_location' | 'end' | null;

const TARGET_TYPE_OPTIONS: { value: TargetTypeValue; label: string }[] = [
  { value: 'verse', label: 'Строфа' },
  { value: 'cross_location', label: 'Другая локация' },
  { value: 'end', label: 'Конец' },
  { value: null, label: 'Нет перехода' },
];

interface EditOptionFormProps {
  option: Option;
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditOptionForm({ option, onSaved, onCancel }: EditOptionFormProps) {
  const { dn } = useParams();
  const locationDn = parseInt(dn!, 10);

  const [text, setText] = useState(option.text);
  const [requirement, setRequirement] = useState(option.requirement ?? '');
  const [result, setResult] = useState(option.result ?? '');
  const [targetType, setTargetType] = useState<TargetTypeValue>(option.targetType);
  const [targetVerseDn, setTargetVerseDn] = useState<number | null>(option.targetVerseDn);
  const [targetLocationDn, setTargetLocationDn] = useState<number | null>(option.targetLocationDn);

  const updateOption = useUpdateOption();

  const { data: currentLocationData } = useLocationVerses(locationDn);
  const currentVerseNumbers = useMemo(
    () => currentLocationData?.verses.map((v) => v.displayNumber) ?? [],
    [currentLocationData],
  );

  const { data: locationsData } = useLocations();
  const locationNumbers = useMemo(
    () => locationsData?.map((l) => l.displayNumber) ?? [],
    [locationsData],
  );

  const { data: crossLocationVerses } = useVerseNumbers(
    targetType === 'cross_location' && targetLocationDn ? targetLocationDn : 0,
  );
  const crossVerseNumbers = crossLocationVerses?.verses ?? [];

  const handleSave = () => {
    updateOption.mutate(
      {
        id: option.id,
        data: {
          text,
          requirement: requirement || null,
          result: result || null,
          targetType,
          targetVerseDn: targetType === 'verse' || targetType === 'cross_location' ? targetVerseDn : null,
          targetLocationDn: targetType === 'cross_location' ? targetLocationDn : null,
        },
      },
      { onSuccess: onSaved },
    );
  };

  const handleTargetTypeChange = (newType: TargetTypeValue) => {
    setTargetType(newType);
    if (newType === 'end' || newType === null) {
      setTargetVerseDn(null);
      setTargetLocationDn(null);
    }
    if (newType === 'verse') {
      setTargetLocationDn(null);
    }
  };

  return (
    <div className="mt-2 p-2 bg-bg rounded-lg border border-separator space-y-2">
      <div>
        <label className="text-[10px] text-text-secondary uppercase">
          Текст
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-bg-card border border-separator rounded text-text-primary focus:outline-none focus:border-rune/50"
        />
      </div>
      <div>
        <label className="text-[10px] text-text-secondary uppercase">
          Условие
        </label>
        <input
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-bg-card border border-separator rounded text-text-primary focus:outline-none focus:border-rune/50"
        />
      </div>
      <div>
        <label className="text-[10px] text-text-secondary uppercase">
          Результат
        </label>
        <input
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-bg-card border border-separator rounded text-text-primary focus:outline-none focus:border-rune/50"
        />
      </div>

      <div>
        <label className="text-[10px] text-text-secondary uppercase">
          Тип перехода
        </label>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {TARGET_TYPE_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => handleTargetTypeChange(opt.value)}
              className={`px-2 py-0.5 text-[10px] rounded border ${
                targetType === opt.value
                  ? 'bg-rune/15 text-rune border-rune/30'
                  : 'text-text-secondary border-separator hover:border-rune/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {targetType === 'verse' && (
        <div>
          <label className="text-[10px] text-text-secondary uppercase">
            Строфа №
          </label>
          <NumericAutocomplete
            value={targetVerseDn}
            suggestions={currentVerseNumbers}
            onChange={setTargetVerseDn}
            placeholder="Номер строфы"
          />
        </div>
      )}

      {targetType === 'cross_location' && (
        <>
          <div>
            <label className="text-[10px] text-text-secondary uppercase">
              Локация №
            </label>
            <NumericAutocomplete
              value={targetLocationDn}
              suggestions={locationNumbers}
              onChange={setTargetLocationDn}
              placeholder="Номер локации"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-secondary uppercase">
              Строфа №
            </label>
            <NumericAutocomplete
              value={targetVerseDn}
              suggestions={crossVerseNumbers}
              onChange={setTargetVerseDn}
              placeholder="Номер строфы"
            />
          </div>
        </>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={updateOption.isPending}
          className="px-3 py-1 text-xs font-semibold rounded bg-rune/15 text-rune border border-rune/30 disabled:opacity-50"
        >
          {updateOption.isPending ? '...' : 'Сохранить'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs rounded text-text-secondary border border-separator"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
