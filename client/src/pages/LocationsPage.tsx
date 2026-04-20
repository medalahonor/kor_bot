import { useState } from 'react';
import { useLocation } from 'react-router';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import LocationsTab from './locations/LocationsTab';
import KsTab from './locations/KsTab';
import ChaptersTab from './locations/ChaptersTab';
import type { ContextType } from '@tg/shared';

type LocationsPageState = { tab?: ContextType; chapterCode?: string };

export default function LocationsPage() {
  const location = useLocation();
  const incomingState = (location.state as LocationsPageState | null) ?? null;
  const [activeTab, setActiveTab] = useState<ContextType>(
    incomingState?.tab ?? 'chapters',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [ksPage, setKsPage] = useState(1);

  const handleTabChange = (tab: ContextType) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (activeTab === 'ks') setKsPage(1);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <TabBar active={activeTab} onChange={handleTabChange} />

      {activeTab === 'chapters' && (
        <ChaptersTab
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          initialChapterCode={incomingState?.chapterCode}
        />
      )}

      {activeTab === 'ks' && (
        <KsTab
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          page={ksPage}
          onPageChange={setKsPage}
        />
      )}

      {(activeTab === 'locations' || activeTab === 'ek') && (
        <LocationsTab
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
      )}
    </div>
  );
}
