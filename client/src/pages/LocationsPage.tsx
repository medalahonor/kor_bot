import { useState } from 'react';
import { useLocation } from 'react-router';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import LocationsTab from './locations/LocationsTab';
import KsTab from './locations/KsTab';
import type { ContextType } from '@tg/shared';

export default function LocationsPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ContextType>(
    (location.state as { tab?: ContextType } | null)?.tab ?? 'locations',
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

      {activeTab === 'ks' ? (
        <KsTab
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          page={ksPage}
          onPageChange={setKsPage}
        />
      ) : (
        <LocationsTab
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
      )}
    </div>
  );
}
