import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import { AppShell, TabLayout } from './components/Layout';
import { Privacy, SignIn } from './pages/Account';
import { CatalogStateProvider } from './lib/catalogState';
import { Discover } from './pages/Discover';
import { Onboarding } from './pages/Onboarding';
import { ProductDetail } from './pages/ProductDetail';
import { Home, Orders, Profile } from './pages/Tabs';
import { Welcome } from './pages/Welcome';
import { ProfileQuestions } from './pages/ProfileQuestions';
import { ProfileProvider } from './profile/ProfileContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ProfileProvider>
      <CatalogStateProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/onboarding/2/:q?" element={<ProfileQuestions />} />
            <Route path="/onboarding/:step" element={<Onboarding />} />
            <Route path="/inloggen" element={<SignIn />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route element={<TabLayout />}>
              {/* Ontdek en productdetail zijn ook zonder account te bekijken. */}
              <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/ontdek" element={<Discover />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/bestellingen" element={<RequireAuth><Orders /></RequireAuth>} />
              <Route path="/profiel" element={<RequireAuth><Profile /></RequireAuth>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CatalogStateProvider>
      </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
