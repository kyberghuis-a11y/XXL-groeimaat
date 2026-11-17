import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import { AppShell, TabLayout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Privacy, SignIn } from './pages/Account';
import { CatalogStateProvider } from './lib/catalogState';
import { Discover } from './pages/Discover';
import { Onboarding } from './pages/Onboarding';
import { ProductDetail } from './pages/ProductDetail';
import { Home } from './pages/Tabs';
import { Profile } from './pages/ProfilePage';
import { EditAnswer } from './pages/EditAnswer';
import { OrdersPage } from './pages/Orders';
import { CartPage, CheckoutPage } from './pages/Cart';
import { Welcome } from './pages/Welcome';
import { ProfileQuestions } from './pages/ProfileQuestions';
import { ProfileProvider } from './profile/ProfileContext';
import { TasteQuestions, TasteResult } from './pages/TasteScreens';
import { TasteProvider } from './taste/TasteContext';
import { CartProvider } from './cart/CartContext';
import { OrdersProvider } from './orders/OrdersContext';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
      <ProfileProvider>
      <TasteProvider>
      <OrdersProvider>
      <CartProvider>
      <CatalogStateProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/onboarding/2/:q?" element={<ProfileQuestions />} />
            <Route path="/onboarding/3/:q?" element={<TasteQuestions />} />
            <Route path="/onboarding/4" element={<TasteResult />} />
            <Route path="/onboarding/:step" element={<Onboarding />} />
            <Route path="/inloggen" element={<SignIn />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/profiel/aanpassen/:key" element={<RequireAuth><EditAnswer /></RequireAuth>} />
            <Route element={<TabLayout />}>
              {/* Ontdek en productdetail zijn ook zonder account te bekijken. */}
              <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/ontdek" element={<Discover />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/bestellingen" element={<RequireAuth><OrdersPage /></RequireAuth>} />
              <Route path="/winkelwagen" element={<CartPage />} />
              <Route path="/afrekenen" element={<CheckoutPage />} />
              <Route path="/profiel" element={<RequireAuth><Profile /></RequireAuth>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CatalogStateProvider>
      </CartProvider>
      </OrdersProvider>
      </TasteProvider>
      </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
