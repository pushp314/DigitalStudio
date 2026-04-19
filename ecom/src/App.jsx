import React, { Suspense, lazy, useContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Navbar from "./components/layout/Navbar";
import BottomNav from "./components/layout/BottomNav";
import Footer from "./components/layout/Footer";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import ConfigContext, { ConfigProvider } from './context/ConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import MaintenancePage from "./pages/MaintenancePage";
import ScrollToTop from "./components/common/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home"));
const Templates = lazy(() => import("./pages/Templates"));
const Features = lazy(() => import("./pages/Features"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TemplatesDetails = lazy(() => import("./pages/TemplatesDetails"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const OAuthCallback = lazy(() => import("./pages/Auth/OAuthCallback"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductEdit = lazy(() => import("./pages/admin/ProductEdit"));
const DocEdit = lazy(() => import("./pages/admin/DocEdit"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Docs = lazy(() => import('./pages/Docs'));
const DocViewer = lazy(() => import('./pages/DocViewer'));
const DevChat = lazy(() => import('./pages/DevChat'));
const Pricing = lazy(() => import('./pages/PricingPlan'));
const SubscriptionCheckout = lazy(() => import('./pages/SubscriptionCheckout'));
import SearchPalette from "./components/ui/SearchPalette";
import FlashBanner from "./components/growth/FlashBanner";

const AppShell = () => {
  const { config, loading } = useContext(ConfigContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [platformDown, setPlatformDown] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const features = config?.features ?? {};

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      // '/' key (only if not in an input)
      if (e.key === '/') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Referral captured
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('ds_partner_ref', ref);
      console.log('Referral captured:', ref);
    }

    const handleMaintenance = (e) => {
      setPlatformDown(true);
      setMaintenanceMsg(e.detail);
    };

    window.addEventListener('platform_maintenance', handleMaintenance);
    return () => window.removeEventListener('platform_maintenance', handleMaintenance);
  }, [location.search]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7] text-black font-bold">Starting DigitalStudio...</div>;
  }

  // Allow access to admin and auth paths during maintenance
  const isAuthPath = location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname.startsWith('/auth');
  const isBypassPath = isAdminPath || isAuthPath;

  const isMaintenance = (platformDown || config?.maintenanceMode) && !isBypassPath;

  if (isMaintenance) {
    return <MaintenancePage message={maintenanceMsg || config?.maintenanceMessage} />;
  }

  const isChatPath = location.pathname.startsWith('/chat');
  const hideLayout = isAdminPath || isChatPath;

  const mainPadding = hideLayout
    ? 'pt-0' 
    : (config?.showAnnouncement && config?.announcements?.length > 0 ? 'pt-32 md:pt-40' : 'pt-24 md:pt-32');

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7] text-black font-bold">Loading Marketplace...</div>}>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
          {!hideLayout && <Navbar onSearchClick={() => setIsSearchOpen(true)} />}
          <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          {!hideLayout && <FlashBanner />}
          {!hideLayout && <BottomNav />}
          <main className={`flex-grow transition-all duration-300 ${!hideLayout ? 'pb-32 md:pb-0' : ''} ${mainPadding}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/:id" element={<TemplatesDetails />} />
              <Route path="/features" element={<Features />} />
              {features.testimonials && <Route path="/testimonials" element={<Testimonials />} />}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/chat" element={<ProtectedRoute><DevChat /></ProtectedRoute>} />

              {features.docs && (
                <>
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/docs/:id" element={<DocViewer />} />
                </>
              )}

              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription-checkout" element={<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>} />

              {features.payments && (
                <>
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                </>
              )}

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/wishlist" element={<Wishlist />} />

               {/* Robust Admin Routes - Fixes 404 issues */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard defaultTab="analytics" /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard defaultTab="analytics" /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><AdminDashboard defaultTab="inventory" /></AdminRoute>} />
              <Route path="/admin/docs" element={<AdminRoute><AdminDashboard defaultTab="docs" /></AdminRoute>} />
              <Route path="/admin/config" element={<AdminRoute><AdminDashboard defaultTab="config" /></AdminRoute>} />
              <Route path="/admin/maintenance" element={<AdminRoute><AdminDashboard defaultTab="maintenance" /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminDashboard defaultTab="orders" /></AdminRoute>} />
              <Route path="/admin/licenses" element={<AdminRoute><AdminDashboard defaultTab="licenses" /></AdminRoute>} />
              <Route path="/admin/subscriptions" element={<AdminRoute><AdminDashboard defaultTab="subscriptions" /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminDashboard defaultTab="users" /></AdminRoute>} />
              <Route path="/admin/marketing" element={<AdminRoute><AdminDashboard defaultTab="marketing" /></AdminRoute>} />
              <Route path="/admin/testimonials" element={<AdminRoute><AdminDashboard defaultTab="testimonials" /></AdminRoute>} />
              <Route path="/admin/showcase" element={<AdminRoute><AdminDashboard defaultTab="showcase" /></AdminRoute>} />
              <Route path="/admin/messages" element={<AdminRoute><AdminDashboard defaultTab="messages" /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminDashboard defaultTab="settings" /></AdminRoute>} />
              
              {/* Specialized Admin Pages */}
              <Route path="/admin/product/new" element={<AdminRoute><ProductEdit /></AdminRoute>} />
              <Route path="/admin/product/:id/edit" element={<AdminRoute><ProductEdit /></AdminRoute>} />
              <Route path="/admin/doc/new" element={<AdminRoute><DocEdit /></AdminRoute>} />
              <Route path="/admin/doc/:id/edit" element={<AdminRoute><DocEdit /></AdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {!hideLayout && <Footer />}
        </div>
      </ErrorBoundary>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <QueryClientProvider client={queryClient}>
                <AppShell />
              </QueryClientProvider>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;
