import React, { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LoginModal from "./components/auth/LoginModal";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfigProvider } from './context/ConfigContext';
import AuthContext from "./context/AuthContext";

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

// Loading Spinner Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0055FF] rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7] text-black font-bold">Loading FlowGrid...</div>}>
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
                      <Route path="/docs" element={<Docs />} />
                      <Route path="/docs/:id" element={<DocViewer />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/wishlist" element={<Wishlist />} />

                      {/* Admin Routes */}
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/product/:id/edit" element={<ProductEdit />} />

                      {/* God Mode Routes */}
                      <Route path="/godmode" element={<GodModeLogin />} />
                      <Route path="/godmode/dashboard" element={<GodModeDashboard />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Footer />
                </div>
              </Suspense>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};

// Internal Component for Global Popup Logic
const GlobalLoginPopup = () => {
  const { user, loading } = React.useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on homepage, not on product browsing pages
    const shouldShowPopup = location.pathname === '/' || location.pathname === '/home';
    const hasShown = sessionStorage.getItem('loginPopupShown');

    if (!loading && !user && !hasShown && shouldShowPopup) {
      const timer = setTimeout(() => {
        setShowModal(true);
        sessionStorage.setItem('loginPopupShown', 'true');
      }, 3000); // 3 second delay
      return () => clearTimeout(timer);
    }
  }, [user, loading, location]);

  return <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />;
};

export default App;
