# Frontend BizCode Code Intelligence

This document contains the core frontend architecture.

---

## 1. Application Shell & Routing (`App.jsx`)
```jsx
// [Simplified for briefness, focusing on DevChat integration]
import DevChat from './pages/DevChat';

const AppShell = () => {
    const isChatPath = location.pathname.startsWith('/chat');
    const hideLayout = isAdminPath || isChatPath;

    return (
        <div className="flex flex-col min-h-screen">
            {!hideLayout && <Navbar />}
            <main className={hideLayout ? 'pt-0' : 'pt-24'}>
                <Routes>
                    <Route path="/chat" element={<ProtectedRoute><DevChat /></ProtectedRoute>} />
                    {/* ... other routes */}
                </Routes>
            </main>
            {!hideLayout && <Footer />}
        </div>
    );
}
```

## 2. Global Intelligence Stream (`pages/DevChat.jsx`)
```jsx
// [Full DevChat.jsx logic provided in the earlier turn]
// Including the 100vh workspace design and WebSocket logic.
```

## 3. Communication Bridge (`services/api.js`)
```javascript
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = {
    getToken: () => localStorage.getItem('token'),
    request: async (endpoint, options = {}) => {
        // ... Request logic with Bearer token
    }
};
export default api;
```
