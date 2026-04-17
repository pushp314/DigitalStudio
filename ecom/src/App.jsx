import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfigProvider } from './context/ConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import { FEATURES } from './config/features';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard"));
const ProductEdit = lazy(() => import("./pages/Admin/ProductEdit"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const GodModeLogin = lazy(() => import('./pages/GodMode/Login'));
const GodModeDashboard = lazy(() => import('./pages/Admin/GodModeDashboard'));
const Docs = lazy(() => import('./pages/Docs'));
const DocViewer = lazy(() => import('./pages/DocViewer'));

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <QueryClientProvider client={queryClient}>
                <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7] text-black font-bold">Loading FlowGrid...</div>}>
                  <ErrorBoundary>
                    <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
                  <Navbar />
                  <div className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/templates" element={<Templates />} />
                      <Route path="/templates/:id" element={<TemplatesDetails />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/testimonials" element={<Testimonials />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/contact" element={<Contact />} />
                      
                      {FEATURES.docs && (
                        <>
                          <Route path="/docs" element={<Docs />} />
                          <Route path="/docs/:id" element={<DocViewer />} />
                        </>
                      )}

                      {FEATURES.payments && (
                        <>
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                        </>
                      )}

                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/auth/callback" element={<OAuthCallback />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/wishlist" element={<Wishlist />} />

                      {/* Admin Routes */}
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/product/new" element={<ProductEdit />} />
                      <Route path="/admin/product/:id/edit" element={<ProductEdit />} />

                      {/* God Mode Routes */}
                      <Route path="/godmode" element={<GodModeLogin />} />
                      <Route path="/godmode/dashboard" element={<GodModeDashboard />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </div>
                    <Footer />
                  </div>
                  </ErrorBoundary>
                </Suspense>
              </QueryClientProvider>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;
