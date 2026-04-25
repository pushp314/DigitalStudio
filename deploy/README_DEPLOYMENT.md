# BizCode Production Deployment Guide

This repository includes automated scripts for deploying the BizCode platform to a production VPS. It ensures that the Go backend, React (Vite) frontend, PostgreSQL database, Redis, and Nginx reverse proxy are correctly configured and secured.

## Deployment Structure
```bash
deploy/
├── install-production.sh      # Initial setup, installation, and configuration
├── update-production.sh       # Safe update script with rollback on failure
├── nginx/
│   ├── bizcode-frontend.conf  # Nginx config for React frontend
│   └── bizapi-backend.conf    # Nginx config for Go API (reverse proxy)
├── systemd/
│   └── bizcode-api.service    # Systemd service for Go backend
└── env/
    ├── backend.env.example    # Example backend variables
    └── frontend.env.example   # Example frontend variables
```

## 1. Initial Setup

### Prerequisites
* A fresh or existing Ubuntu VPS (scripts are written for Debian/Ubuntu)
* A non-root user with `sudo` privileges is recommended, but the script can run as root.
* DNS records for `bizcode.appnity.co.in` and `bizapi.appnity.co.in` pointing to your VPS IP.

### Execution
Run the installation script:
```bash
chmod +x /var/www/bizcode/source/deploy/install-production.sh
sudo /var/www/bizcode/source/deploy/install-production.sh
```

**What it does:**
1. Installs Node.js, Go, PostgreSQL, Redis, and `golang-migrate`.
2. Creates PostgreSQL database and user with strong generated passwords.
3. Finds an available backend port between 8090-8100.
4. Generates `.env` files with secure secrets.
5. Builds backend and frontend.
6. Configures Systemd and Nginx.
7. Sets up SSL with Let's Encrypt (Certbot).

## 2. Post-Installation Steps

After successful deployment, you must:
1. Update `AI_API_KEY` in `/var/www/bizcode/source/go-server/.env`.
2. Update external OAuth/Payment keys (Razorpay, Google, GitHub, Email/Resend).
3. Restart the backend service to apply updates: `sudo systemctl restart bizcode-api`

## 3. Updating Production

When you push new code to the `main` branch, run the update script on your server:

```bash
chmod +x /var/www/bizcode/source/deploy/update-production.sh
sudo /var/www/bizcode/source/deploy/update-production.sh
```

**Features:**
* Fetches the latest code from GitHub.
* Rebuilds both backend and frontend.
* Runs database migrations.
* Reloads services gracefully.
* **Automatic Rollback**: Reverts to the previous Git commit and rebuilds if the build process fails.

## Maintenance Commands
* View backend logs: `journalctl -u bizcode-api -f`
* Restart backend: `systemctl restart bizcode-api`
* Reload Nginx: `systemctl reload nginx`
