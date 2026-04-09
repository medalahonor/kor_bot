import { Routes, Route } from 'react-router';
import LocationsPage from './pages/LocationsPage';
import LocationPage from './pages/LocationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LocationsPage />} />
      <Route path="/location/:dn" element={<LocationPage />} />
      <Route path="/location/:dn/verse/:vdn" element={<LocationPage />} />
    </Routes>
  );
}
