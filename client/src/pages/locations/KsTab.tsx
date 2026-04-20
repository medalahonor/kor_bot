import KsVerseList from '../../components/KsVerseList';
import LocationSearchBar from '../../components/LocationSearchBar';
import StateMessage from '../../components/StateMessage';
import ShowOnlyNewToggle from '../../components/ShowOnlyNewToggle';
import { useKsVerses } from '../../api/queries';
import { useAppStore } from '../../stores/app';

interface KsTabProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
}

export default function KsTab({ searchQuery, onSearchChange, page, onPageChange }: KsTabProps) {
  const showOnlyNew = useAppStore((s) => s.showOnlyNew);
  const { data: ksData, isLoading } = useKsVerses(page, searchQuery, showOnlyNew);

  const totalPages = ksData ? Math.ceil(ksData.total / (ksData.limit || 50)) : 0;

  return (
    <>
      <div className="px-4 pt-4 pb-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <ShowOnlyNewToggle />
        </div>
        <LocationSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Поиск по номеру строфы"
        />
      </div>

      {isLoading && <StateMessage text="Авалон пробуждается..." />}

      {!isLoading && ksData && (
        <div className="flex-1 overflow-y-auto pb-8">
          <KsVerseList
            verses={ksData.verses}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
          <div className="px-4 pt-1.5 pb-4 text-xs text-text-secondary">
            {ksData.total} строф &middot; Кампания Kings of Ruin
          </div>
        </div>
      )}
    </>
  );
}
