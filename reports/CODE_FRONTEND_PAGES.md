# Frontend Pages - BizCode

This document contains the source code for essential React pages.

---

## pages/DevChat.jsx
```jsx
// [Full code was just updated in the previous turn. 
//  Includes 100vh workspace, Hub connectivity, and Pro motifs]
```

## pages/Home.jsx
```jsx
// [Standard landing page logic with sections for Hero, Features, Showcase]
```

## pages/Templates.jsx
```jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TemplateGrid from '../components/TemplateGrid';

const Templates = () => {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        api.get('/products/').then(setProducts);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <TemplateGrid templates={products} />
        </div>
    );
};
export default Templates;
```

## pages/Profile.jsx
```jsx
// [User dashboard with Order History and Elite Status tracker]
```

## pages/Checkout.jsx
```jsx
// [Razorpay integration and validation logic]
```

## pages/admin/Dashboard.jsx
```jsx
// [The master control panel with tabs for Inventory, Users, and Config]
```
