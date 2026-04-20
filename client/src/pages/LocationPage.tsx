import { useParams } from 'react-router';
import { getContextType } from '@tg/shared';
import EkVerseListView from './location/EkVerseListView';
import LocationVerseView from './location/LocationVerseView';

export default function LocationPage() {
  const { dn, vdn } = useParams();
  const locationDn = parseInt(dn!, 10);
  const contextType = getContextType(locationDn);
  const isKs = contextType === 'ks';
  const isEk = contextType === 'ek';
  const ekVerseList = isEk && vdn === undefined;

  if (ekVerseList) {
    return <EkVerseListView locationDn={locationDn} />;
  }

  const currentVerseDn = vdn !== undefined ? parseInt(vdn, 10) : 0;

  return (
    <LocationVerseView
      locationDn={locationDn}
      currentVerseDn={currentVerseDn}
      isKs={isKs}
      isEk={isEk}
    />
  );
}
