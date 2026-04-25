import React, { Suspense, lazy, useContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import ToastProvider, { ToastContext } from './context/ToastContext';
import ConfigContext, { ConfigProvider } from './context/ConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import MaintenancePage from "./pages/MaintenancePage";
import ScrollToTop from "./components/common/ScrollToTop";
import { HelpCircle, MessageCircle, ArrowUpRight, X } from 'lucide-react';
import { Link } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import LoadingScreen from "./components/common/LoadingScreen";


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
const TemplateEdit = lazy(() => import("./pages/admin/TemplateEdit"));
const DocEdit = lazy(() => import("./pages/admin/DocEdit"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Docs = lazy(() => import('./pages/Docs'));
const DocViewer = lazy(() => import('./pages/DocViewer'));
const DevChat = lazy(() => import('./pages/DevChat'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Pricing = lazy(() => import('./pages/PricingPlan'));
const SubscriptionCheckout = lazy(() => import('./pages/SubscriptionCheckout'));
const Legal = lazy(() => import('./pages/Legal'));
const EliteHub = lazy(() => import('./pages/elite/EliteHub'));
const EliteChat = lazy(() => import('./pages/elite/EliteChat'));
import SearchPalette from "./components/ui/SearchPalette";
import FlashBanner from "./components/growth/FlashBanner";

const AppShell = () => {
  const { config, loading: configLoading } = useContext(ConfigContext);
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [platformDown, setPlatformDown] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const { toast } = useContext(ToastContext);
  const { events } = useRealtime();

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000;
    
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(currentProgress);
      
      if (currentProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setMinLoadingDone(true);
      }
    };
    
    requestAnimationFrame(updateProgress);
  }, []);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const features = config?.features ?? {};
  
  useEffect(() => {
    NProgress.start();
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 100); // Small delay to handle fast loads
    return () => {
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [location.pathname]);

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
    const handleClickOutside = () => setIsSupportOpen(false);
    if (isSupportOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isSupportOpen]);

  useEffect(() => {
    // Referral captured — track click on backend
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      const alreadyTracked = sessionStorage.getItem('bc_partner_ref');
      sessionStorage.setItem('bc_partner_ref', ref);
      // Only fire tracking call once per session per referral code
      if (alreadyTracked !== ref) {
        import('./services/api').then(({ default: apiClient }) => {
          apiClient.post('/referral/track', {
            referralCode: ref,
            landingUrl: window.location.href,
            visitorId: sessionStorage.getItem('bc_visitor_id') || crypto.randomUUID?.() || String(Date.now()),
          }).catch(() => {}); // silently fail — must not block UX
        });
      }
    }

    const handleMaintenance = (e) => {
      setPlatformDown(true);
      setMaintenanceMsg(e.detail);
    };

    window.addEventListener('platform_maintenance', handleMaintenance);
    return () => window.removeEventListener('platform_maintenance', handleMaintenance);
  }, [location.search]);

  // Real-time System Notifications Listener
  useEffect(() => {
    if (events?.type === 'notification') {
      const { title, message, style } = events.data;
      toast(message, { 
          title: title || "System Alert", 
          type: style || 'info' 
      });
    }
  }, [events, toast]);

  const isAuthPath = location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname.startsWith('/auth');
  const isBypassPath = isAdminPath || isAuthPath;

  const isMaintenance = (platformDown || config?.maintenanceMode) && !isBypassPath;

  if (isMaintenance) {
    return <MaintenancePage message={maintenanceMsg || config?.maintenanceMessage} />;
  }

  const isChatPath = location.pathname.startsWith('/chat');
  const isSupportPath = location.pathname.startsWith('/support');
  const isAccountPath = location.pathname.startsWith('/account');
  const excludedRoutes = ['apps', 'templates', 'features', 'faq', 'contact', 'hire-developer', 'sell-your-project', 'chat', 'docs', 'pricing', 'cart', 'checkout', 'login', 'register', 'account', 'wishlist', 'admin', 'support'];
  const isProfilePath = location.pathname.startsWith('/@') || location.pathname.startsWith('/profile') || (location.pathname.split('/').length === 2 && location.pathname !== '/' && !excludedRoutes.includes(location.pathname.substring(1)));
  const hideLayout = isAdminPath || isSupportPath || isChatPath || isProfilePath || isAccountPath || isAuthPath;
  const hideFooter = hideLayout || location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout');


  const mainPadding = hideLayout
    ? 'pt-0' 
    : (config?.showAnnouncement && config?.announcements?.length > 0 ? 'pt-28 md:pt-32' : 'pt-16 md:pt-20');

  const isLoading = configLoading || !minLoadingDone;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loading" message="Loading workspace..." progress={progress} />
      ) : (
        <Suspense key="content" fallback={<LoadingScreen message="Opening catalog..." progress={100} />}>
          <ErrorBoundary>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-[#F5F5F7] relative">
              {!hideLayout && <Navbar onSearchClick={() => setIsSearchOpen(true)} />}
              <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              {!hideLayout && <FlashBanner />}
              <main className={`flex-grow transition-all duration-300 ${!hideLayout ? 'pb-32 md:pb-0' : ''} ${mainPadding}`}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/apps" element={<Templates />} />
                  <Route path="/apps/category/:slug" element={<Templates />} />
                  <Route path="/apps/:id" element={<TemplatesDetails />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/templates/:id" element={<TemplatesDetails />} />
                  <Route path="/features" element={<Features />} />
                  {features.testimonials && <Route path="/testimonials" element={<Testimonials />} />}
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/help" element={<Navigate to="/support" replace />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/hire-developer" element={<Contact />} />
                  <Route path="/hire-developer/:serviceType" element={<Contact />} />
                  <Route path="/terms" element={<Legal type="terms" />} />
                  <Route path="/privacy" element={<Legal type="privacy" />} />
                  <Route path="/chat" element={<ProtectedRoute><DevChat /></ProtectedRoute>} />
                  <Route path="/support" element={<ProtectedRoute><EliteHub /></ProtectedRoute>} />
                  <Route path="/expert-help/:intent" element={<ProtectedRoute><EliteHub /></ProtectedRoute>} />
                  <Route path="/elite/chat/:sessionId" element={<ProtectedRoute><EliteChat /></ProtectedRoute>} />

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
                  <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/sell-your-project" element={<ProtectedRoute><TemplateEdit /></ProtectedRoute>} />
                  <Route path="/account/submit" element={<ProtectedRoute><TemplateEdit /></ProtectedRoute>} />
                  <Route path="/account/templates/:id/edit" element={<ProtectedRoute><TemplateEdit /></ProtectedRoute>} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/@:username" element={<PublicProfile />} />
                  <Route path="/profile/:username" element={<PublicProfile />} />
                  <Route path="/:username" element={<PublicProfile />} />

                   {/* Unified Admin Namespace */}
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/:tab" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  
                  {/* Specialized Admin Pages */}
                  <Route path="/admin/templates/new" element={<AdminRoute><TemplateEdit /></AdminRoute>} />
                  <Route path="/admin/templates/:id/edit" element={<AdminRoute><TemplateEdit /></AdminRoute>} />
                  <Route path="/admin/doc/new" element={<AdminRoute><DocEdit /></AdminRoute>} />
                  <Route path="/admin/doc/:id/edit" element={<AdminRoute><DocEdit /></AdminRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              {/* Universal Help FAB - High-Access Positioning */}
              <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
                {/* Modal Menu */}
                <div className={`transition-all duration-500 transform origin-bottom-right ${isSupportOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'} bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl mb-2 w-72 ring-1 ring-black/5`}>
                   <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Support Central</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   </div>
                   <p className="text-[9px] text-slate-500 font-medium mb-5 leading-relaxed">Expert guidance for product choice, technical issues, or custom builds.</p>
                   
                   <div className="space-y-2">
                     <Link onClick={() => setIsSupportOpen(false)} to="/support" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white group/item transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-widest">Expert Chat</span>
                        <ArrowUpRight size={10} className="text-slate-400 group-hover/item:text-white group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                     </Link>
                     <Link onClick={() => setIsSupportOpen(false)} to="/support" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white group/item transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-widest">Support Tickets</span>
                        <ArrowUpRight size={10} className="text-slate-400 group-hover/item:text-white group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                     </Link>
                     <Link onClick={() => setIsSupportOpen(false)} to="/hire-developer" className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white group/item transition-all duration-300">
                        <span className="text-[9px] font-black text-indigo-600 group-hover/item:text-white uppercase tracking-widest">Hire Developer</span>
                        <ArrowUpRight size={10} className="text-indigo-400 group-hover/item:text-white group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                     </Link>
                   </div>
                </div>

                {/* Main Toggle Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSupportOpen(!isSupportOpen);
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-90 relative group overflow-hidden ${
                    isSupportOpen ? 'bg-slate-900 text-white rotate-180' : 'bg-white text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {isSupportOpen ? <X size={20} strokeWidth={2.5} /> : <HelpCircle size={24} strokeWidth={2.5} />}
                </button>
              </div>

              {!hideFooter && <Footer />}
            </div>
          </ErrorBoundary>
        </Suspense>
      )}
    </AnimatePresence>
  );
};


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <ConfigProvider>
            <RealtimeProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastProvider>
                    <AppShell />
                  </ToastProvider>
                </WishlistProvider>
              </CartProvider>
            </RealtimeProvider>
          </ConfigProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
