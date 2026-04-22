import ChoiceOption from './ChoiceOption';
import type { Verse, Option, OptionStatus } from '@tg/shared';

interface VerseCardProps {
  verse: Verse;
  currentLocationDn?: number;
  statusMap: Map<number, OptionStatus>;
  pendingIds?: Set<number>;
  gatewayIds?: Set<number>;
  showOnlyNew: boolean;
  onOptionClick: (option: Option) => void;
  onStatusChange?: (optionId: number, status: OptionStatus) => void;
  onAddNoteForOption?: (
    optionId: number,
    target: { locationDn: number; verseDn: number },
  ) => void;
}

function getStatus(statusMap: Map<number, OptionStatus>, id: number): OptionStatus {
  return statusMap.get(id) ?? 'available';
}

function isCompleted(status: OptionStatus): boolean {
  return status === 'visited' || status === 'closed';
}

function getOptionTarget(
  option: Option,
  currentLocationDn: number | undefined,
): { locationDn: number; verseDn: number } | null {
  if (option.targetType === 'verse' && option.targetVerseDn !== null && currentLocationDn != null) {
    return { locationDn: currentLocationDn, verseDn: option.targetVerseDn };
  }
  if (
    option.targetType === 'cross_location' &&
    option.targetLocationDn != null &&
    option.targetVerseDn != null
  ) {
    return { locationDn: option.targetLocationDn, verseDn: option.targetVerseDn };
  }
  return null;
}

export default function VerseCard({
  verse,
  currentLocationDn,
  statusMap,
  pendingIds = new Set(),
  gatewayIds = new Set(),
  showOnlyNew,
  onOptionClick,
  onStatusChange,
  onAddNoteForOption,
}: VerseCardProps) {
  const filteredOptions = showOnlyNew
    ? verse.options.filter(
        (opt) =>
          !isCompleted(getStatus(statusMap, opt.id)) ||
          gatewayIds.has(opt.id),
      )
    : verse.options;

  if (filteredOptions.length === 0) {
    return (
      <div className="mx-4 mt-3 p-4 bg-bg-card border border-separator text-center text-text-secondary text-sm">
        <span className="text-rune/60 mr-1">⟐</span>
        Все выборы пройдены
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 bg-bg-card border border-separator">
      <div
        className="px-3.5 py-3 flex items-center gap-2.5 border-b border-separator"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% 0%, rgba(94, 200, 216, 0.08), transparent 70%),
            linear-gradient(180deg, rgba(94, 200, 216, 0.06) 0%, transparent 100%)
          `,
        }}
      >
        <span className="text-rune text-lg font-bold">
          #{verse.displayNumber}
        </span>
        <span className="text-[13px] text-text-secondary">Строфа</span>
      </div>

      <div className="p-2 flex flex-col gap-2">
        {filteredOptions.map((option) => {
          const status = getStatus(statusMap, option.id);
          const isGateway = gatewayIds.has(option.id);
          const target = getOptionTarget(option, currentLocationDn);
          const onAddNote =
            onAddNoteForOption && target
              ? () => onAddNoteForOption(option.id, target)
              : undefined;
          return (
            <ChoiceOption
              key={option.id}
              option={option}
              status={isCompleted(status) && isGateway ? 'available' : status}
              pending={pendingIds.has(option.id)}
              onClick={() => onOptionClick(option)}
              onStatusChange={onStatusChange}
              onAddNote={onAddNote}
            />
          );
        })}
      </div>
    </div>
  );
}
