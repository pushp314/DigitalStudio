import{d as h,r as a,A as b,b as f,c as v,j as e,L as l}from"./index-B_v40I8Q.js";const j=()=>{const{id:o}=h(),{user:n}=a.useContext(b),{addToast:r}=f(),c=v(),[t,d]=a.useState(null),[m,u]=a.useState(!0),[i,p]=a.useState(!1);a.useEffect(()=>{setTimeout(()=>{const s={_id:o,title:"Production-Grade React Architecture",category:"React",price:29,isPremium:!0,content:`
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
                `,tableOfContents:[{id:"1",title:"Introduction",level:2},{id:"2",title:"Folder Structure",level:2},{id:"3",title:"Component Organization",level:2},{id:"4",title:"State Management",level:2},{id:"5",title:"Performance Optimization",level:2}]};d(s);const g=n&&(n.subscriptionPlan==="pro"||s.price===0);p(g),u(!1)},500)},[o,n]);const x=()=>{if(!n){r("Please login to purchase","error"),c("/login");return}r("Payment system coming soon!","info")};return m?e.jsx("div",{className:"min-h-screen bg-[#F5F5F7] flex items-center justify-center",children:e.jsx("div",{className:"w-8 h-8 border-4 border-gray-200 border-t-[#0055FF] rounded-full animate-spin"})}):e.jsx("div",{className:"min-h-screen bg-[#F5F5F7] py-24 md:py-32 font-sans",children:e.jsxs("div",{className:"max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx(l,{to:"/docs",className:"text-[#0055FF] font-bold hover:underline mb-4 inline-block",children:"← Back to Docs"}),e.jsx("h1",{className:"text-4xl md:text-5xl font-black text-black mb-4",children:t.title}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("span",{className:"px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-bold",children:t.category}),t.isPremium&&!i&&e.jsxs("span",{className:"px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold",children:["Premium - $",t.price]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-8",children:[e.jsx("div",{className:"lg:col-span-1",children:e.jsxs("div",{className:"bg-white rounded-2xl p-6 border border-gray-100 sticky top-24",children:[e.jsx("h3",{className:"font-black text-black mb-4",children:"Contents"}),e.jsx("ul",{className:"space-y-2",children:t.tableOfContents.map(s=>e.jsx("li",{children:e.jsx("a",{href:`#section-${s.id}`,className:"text-sm text-gray-600 hover:text-[#0055FF] transition-colors",children:s.title})},s.id))})]})}),e.jsx("div",{className:"lg:col-span-3",children:e.jsxs("div",{className:"bg-white rounded-2xl p-8 md:p-12 border border-gray-100 shadow-sm",children:[e.jsx("div",{className:"prose prose-lg max-w-none",children:e.jsx("div",{dangerouslySetInnerHTML:{__html:t.content.replace(/\n/g,"<br />")}})}),t.isPremium&&!i&&e.jsxs("div",{className:"mt-12 p-8 bg-gradient-to-r from-[#0055FF] to-blue-600 rounded-2xl text-white text-center",children:[e.jsx("h3",{className:"text-2xl font-black mb-4",children:"🔒 Unlock Full Access"}),e.jsx("p",{className:"text-lg mb-6 opacity-90",children:"Get the complete 50+ page guide with advanced patterns, examples, and production tips"}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-4 justify-center",children:[e.jsxs("button",{onClick:x,className:"bg-white text-[#0055FF] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors",children:["Purchase for $",t.price]}),e.jsx(l,{to:"/profile",className:"bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-[#0055FF] transition-colors",children:"Upgrade to Pro"})]})]})]})})]})]})})};export{j as default};
