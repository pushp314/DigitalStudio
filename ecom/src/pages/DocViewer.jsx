import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DocViewer = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        // Mock fetch - in production, fetch from API
        setTimeout(() => {
            const mockDoc = {
                _id: id,
                title: 'Production-Grade React Architecture',
                category: 'React',
                price: 29,
                isPremium: true,
                content: `
# Production-Grade React Architecture

## Table of Contents
1. Introduction
2. Folder Structure
3. Component Organization
4. State Management
5. Performance Optimization

## 1. Introduction

Building scalable React applications requires careful planning and architecture decisions. This guide walks you through industry best practices used by top tech companies.

## 2. Folder Structure

\`\`\`
src/
├── components/
│   ├── common/
│   ├── layout/
│   └── features/
├── pages/
├── hooks/
├── context/
├── services/
└── utils/
\`\`\`

### Why This Structure?

This organization separates concerns and makes your codebase maintainable as it grows. **Common components** are reusable across the app, **layout components** handle page structure, and **feature components** are specific to business logic.

## 3. Component Organization

### Atomic Design Principles

Follow atomic design by breaking components into:
- **Atoms**: Buttons, inputs, labels
- **Molecules**: Form fields, card headers
- **Organisms**: Full forms, navigation bars
- **Templates**: Page layouts
- **Pages**: Complete views

### Example Component Structure

\`\`\`jsx
// Button.jsx
const Button = ({ variant, children, onClick, ...props }) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold";
  const variants = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-gray-200 text-black"
  };
  
  return (
    <button 
      className={\`\${baseStyles} \${variants[variant]}\`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
\`\`\`

## 4. State Management

### When to Use Context vs Redux

**Use Context for:**
- Theme/UI state
- User authentication
- Simple global state

**Use Redux/Zustand for:**
- Complex state logic
- Frequent updates
- Time-travel debugging

### Performance Tips

- Memoize expensive computations with \`useMemo\`
- Prevent unnecessary re-renders with \`React.memo\`
- Use \`useCallback\` for event handlers

## 5. Performance Optimization

### Code Splitting

\`\`\`jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
\`\`\`

### Image Optimization

Use modern formats (WebP, AVIF) and lazy loading:

\`\`\`jsx
<img 
  src="image.webp" 
  loading="lazy" 
  alt="Description"
/>
\`\`\`

---

**This is a preview. Purchase to unlock the full 50+ page guide with:**
- Advanced patterns & hooks
- Real-world examples
- Performance profiling
- Testing strategies
- Deployment checklist
                `,
                tableOfContents: [
                    { id: '1', title: 'Introduction', level: 2 },
                    { id: '2', title: 'Folder Structure', level: 2 },
                    { id: '3', title: 'Component Organization', level: 2 },
                    { id: '4', title: 'State Management', level: 2 },
                    { id: '5', title: 'Performance Optimization', level: 2 }
                ]
            };
            setDoc(mockDoc);

            // Check if user has access
            const userHasAccess = user && (user.subscriptionPlan === 'pro' || mockDoc.price === 0);
            setHasAccess(userHasAccess);
            setLoading(false);
        }, 500);
    }, [id, user]);

    const handlePurchase = () => {
        if (!user) {
            addToast('Please login to purchase', 'error');
            navigate('/login');
            return;
        }
        addToast('Payment system coming soon!', 'info');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0055FF] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] py-24 md:py-32 font-sans">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/docs" className="text-[#0055FF] font-bold hover:underline mb-4 inline-block">
                        ← Back to Docs
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
                        {doc.title}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                            {doc.category}
                        </span>
                        {doc.isPremium && !hasAccess && (
                            <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold">
                                Premium - ${doc.price}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Table of Contents */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
                            <h3 className="font-black text-black mb-4">Contents</h3>
                            <ul className="space-y-2">
                                {doc.tableOfContents.map(item => (
                                    <li key={item.id}>
                                        <a
                                            href={`#section-${item.id}`}
                                            className="text-sm text-gray-600 hover:text-[#0055FF] transition-colors"
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-100 shadow-sm">
                            <div className="prose prose-lg max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: doc.content.replace(/\n/g, '<br />') }} />
                            </div>

                            {/* Purchase Gate */}
                            {doc.isPremium && !hasAccess && (
                                <div className="mt-12 p-8 bg-gradient-to-r from-[#0055FF] to-blue-600 rounded-2xl text-white text-center">
                                    <h3 className="text-2xl font-black mb-4">
                                        🔒 Unlock Full Access
                                    </h3>
                                    <p className="text-lg mb-6 opacity-90">
                                        Get the complete 50+ page guide with advanced patterns, examples, and production tips
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={handlePurchase}
                                            className="bg-white text-[#0055FF] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                                        >
                                            Purchase for ${doc.price}
                                        </button>
                                        <Link
                                            to="/profile"
                                            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-[#0055FF] transition-colors"
                                        >
                                            Upgrade to Pro
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocViewer;
