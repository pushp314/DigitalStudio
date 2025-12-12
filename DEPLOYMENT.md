# CodeStudio Marketplace - Deployment Guide

## 🚀 Pre-Deployment Checklist

### Backend Setup

#### 1. Environment Variables
Create `.env` file in `server/` directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=your_production_mongodb_uri

# JWT & Security
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=30d

# File Upload (if using cloud storage)
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateways (for future)
STRIPE_SECRET_KEY=sk_live_...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Frontend URL (CORS)
CLIENT_URL=https://yourproductiondomain.com
```

#### 2. Database Seeding
```bash
cd server
npm run seed
```

This creates:
- Admin user: `admin@codestudio.com` / `admin`
- Default SiteConfig
- Sample products (optional)

#### 3. Start Backend
```bash
npm start
# or with PM2 for production
pm2 start server.js --name codestudio-api
```

---

### Frontend Setup

#### 1. Environment Variables
Create `.env.production` in `ecom/` directory:

```bash
VITE_API_URL=https://api.yourproductiondomain.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

#### 2. Build for Production
```bash
cd ecom
npm run build
```

Outputs to `dist/` directory.

#### 3. Deploy Options

**Option A: Static Hosting (Vercel/Netlify)**
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

**Option B: Traditional Server (Nginx)**
```nginx
server {
    listen 80;
    server_name yourproductiondomain.com;
    root /var/www/codestudio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 Security Hardening

### 1. Backend Security Headers
Already configured in `server/server.js`:
- Helmet.js for security headers
- CORS configured
- Rate limiting enabled

### 2. Environment Files
```bash
# NEVER commit these files
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
```

### 3. Update God Mode Credentials
After first deployment, change default admin password:
1. Login to `/godmode`
2. Navigate to Users tab
3. Update admin password

---

## 📊 Post-Deployment Verification

### Critical Checks
- [ ] Homepage loads (`/`)
- [ ] FAQ page works (`/faq`)
- [ ] Testimonials page works (`/testimonials`)
- [ ] Features page works (`/features`)
- [ ] Admin Dashboard accessible (`/admin/dashboard`)
- [ ] God Mode login works (`/godmode`)
- [ ] Site customization updates in real-time
- [ ] Product CRUD operations work
- [ ] Cart functionality working
- [ ] Mobile menu responsive
- [ ] Error boundary catches errors gracefully

### Performance Checks
```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://yourproductiondomain.com --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

---

## 🔧 Maintenance

### Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb+srv://..." /backups/YYYYMMDD
```

### Update Site Config
Login to God Mode (`/godmode`) to update:
- Hero title
- Announcement message
- Feature toggles

### Monitor Logs
```bash
# PM2 logs
pm2 logs codestudio-api

# Error monitoring (recommended: Sentry)
```

---

## 🆘 Troubleshooting

### Issue: 404 on refresh
**Solution:** Configure server for SPA routing (see Nginx config above)

### Issue: API calls fail
**Solution:** Check CORS settings in `server.js` and `VITE_API_URL` in frontend

### Issue: Images not loading
**Solution:** Verify S3 bucket permissions or local upload directory permissions

### Issue: Build fails
**Solution:** 
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📈 Monitoring & Analytics

### Recommended Tools
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry
- **Analytics:** Google Analytics, Plausible
- **Performance:** Web Vitals, Lighthouse CI

### Setup Sentry (Optional)
```bash
npm install @sentry/react @sentry/vite-plugin
```

Add to `main.jsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

---

## 🎯 Next Steps After Launch

1. **Set up automated backups** (daily recommended)
2. **Configure SSL certificate** (Let's Encrypt)
3. **Set up monitoring alerts**
4. **Create staging environment** for testing
5. **Implement Stripe/Razorpay** for payments
6. **Add Premium Docs** CRUD functionality
7. **Build SaaS Tools** modules

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs` (backend) and browser console (frontend)
2. Verify environment variables are set correctly
3. Ensure database connection is established
4. Review this guide's troubleshooting section

---

**Status:** ✅ Production-Ready  
**Last Updated:** 2025-12-12  
**Version:** 1.0.0
