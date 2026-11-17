import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, TabLayout } from './components/Layout';
import { CatalogStateProvider } from './lib/catalogState';
import { Discover } from './pages/Discover';
import { Onboarding } from './pages/Onboarding';
import { ProductDetail } from './pages/ProductDetail';
import { Home, Orders, Profile } from './pages/Tabs';
import { Welcome } from './pages/Welcome';

export default function App() {
  return (
    <BrowserRouter>
      <CatalogStateProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/onboarding/:step" element={<Onboarding />} />
            <Route element={<TabLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/ontdek" element={<Discover />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/bestellingen" element={<Orders />} />
              <Route path="/profiel" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CatalogStateProvider>
    </BrowserRouter>
  );
}
