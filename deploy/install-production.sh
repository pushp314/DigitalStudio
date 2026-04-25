#!/bin/bash
set -e

echo "==============================================="
echo "🚀 BizCode Production Deployment Script"
echo "==============================================="

# Configuration
REPO_URL="https://github.com/pushp314/bizcode.git"
DEST_DIR="/var/www/bizcode/source"
DB_NAME="bizcode_prod"
DB_USER="bizcode_user"
FRONTEND_DOMAIN="bizcode.appnity.co.in"
BACKEND_DOMAIN="bizapi.appnity.co.in"

# 1. Update and Install Dependencies
echo "=> Checking and installing dependencies..."
apt-get update -y
apt-get install -y git curl certbot python3-certbot-nginx postgresql redis-server wget

# Install Node.js (20.x) if not present
if ! command -v node > /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install Go if not present
if ! command -v go > /dev/null; then
    echo "Installing Go..."
    wget -q https://go.dev/dl/go1.22.1.linux-amd64.tar.gz
    rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz
    rm go1.22.1.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh
    source /etc/profile.d/go.sh
fi

export PATH=$PATH:/usr/local/go/bin

# Install golang-migrate if not present
if ! command -v migrate > /dev/null; then
    echo "Installing golang-migrate..."
    curl -sSfL https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar zxvf -
    mv migrate /usr/local/bin/migrate
fi

# 2. Clone Repository
echo "=> Setting up repository at $DEST_DIR..."
if [ -d "$DEST_DIR" ]; then
    echo "Directory $DEST_DIR already exists."
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$DEST_DIR"
    else
        echo "Aborting deployment."
        exit 1
    fi
fi
git clone "$REPO_URL" "$DEST_DIR"

# 3. Detect Free Port
echo "=> Detecting free backend port..."
BACKEND_PORT=8090
while netstat -tuln | grep -q ":$BACKEND_PORT\b"; do
    ((BACKEND_PORT++))
    if [ $BACKEND_PORT -gt 8100 ]; then
        echo "Error: No free ports available between 8090 and 8100."
        exit 1
    fi
done
echo "Selected backend port: $BACKEND_PORT"

# 4. PostgreSQL Setup
echo "=> Setting up PostgreSQL..."
DB_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
# Always update the password in case this is a re-run
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
# Explicitly grant privileges on public schema so migrations don't fail
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Generate secrets
JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
SESSION_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
LICENSE_KEY=$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)

# 5. Generate Backend .env
echo "=> Creating backend .env..."
cat > "$DEST_DIR/go-server/.env" <<EOF
APP_ENV=production
PORT=$BACKEND_PORT

DB_HOST=localhost
DB_PORT=5432
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?sslmode=disable

REDIS_URL=redis://localhost:6379

JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
LICENSE_SIGNING_KEY=$LICENSE_KEY

FRONTEND_URL=https://$FRONTEND_DOMAIN
ALLOWED_ORIGINS=https://$FRONTEND_DOMAIN
COOKIE_SAMESITE=strict

ENABLE_SEEDER=false
ENABLE_AUTOMIGRATE=false

STORAGE_PROVIDER=local
EMAIL_PROVIDER=stdout
EMAIL_FROM=noreply@$FRONTEND_DOMAIN

AI_API_KEY=ADD_YOUR_KEY
GEMINI_MODEL=gemini-2.5-flash
AI_RATE_LIMIT_RPM=10
EOF
chmod 600 "$DEST_DIR/go-server/.env"

# 6. Generate Frontend .env
echo "=> Creating frontend .env..."
cat > "$DEST_DIR/ecom/.env" <<EOF
VITE_API_URL=https://$BACKEND_DOMAIN/api
VITE_FEATURE_DOCS=true
VITE_FEATURE_REVIEWS=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_AI=true
VITE_FEATURE_PAYMENTS=true
VITE_FEATURE_SUBSCRIPTIONS=false
VITE_FEATURE_LICENSES=false
EOF

# 7. Install & Build
echo "=> Building backend..."
cd "$DEST_DIR/go-server"
go mod download
go build -o bizcode-api ./main.go

echo "=> Building frontend..."
cd "$DEST_DIR/ecom"
npm install
npm run build

# 8. Run DB Migrations
echo "=> Running database migrations..."
cd "$DEST_DIR/go-server"
migrate -path migrations/ -database "postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?sslmode=disable" up

# 9. Systemd Service
echo "=> Setting up systemd service..."
cp "$DEST_DIR/deploy/systemd/bizcode-api.service" /etc/systemd/system/
sed -i "s|EnvironmentFile=.*|EnvironmentFile=$DEST_DIR/go-server/.env|g" /etc/systemd/system/bizcode-api.service
sed -i "s|WorkingDirectory=.*|WorkingDirectory=$DEST_DIR/go-server|g" /etc/systemd/system/bizcode-api.service
sed -i "s|ExecStart=.*|ExecStart=$DEST_DIR/go-server/bizcode-api|g" /etc/systemd/system/bizcode-api.service

systemctl daemon-reload
systemctl enable bizcode-api
systemctl restart bizcode-api

# 10. Nginx Config
echo "=> Setting up Nginx..."
cp "$DEST_DIR/deploy/nginx/bizcode-frontend.conf" /etc/nginx/sites-available/
cp "$DEST_DIR/deploy/nginx/bizapi-backend.conf" /etc/nginx/sites-available/

# Set correct paths and ports in Nginx configs
sed -i "s|root .*|root $DEST_DIR/ecom/dist;|g" /etc/nginx/sites-available/bizcode-frontend.conf
sed -i "s|proxy_pass http://127.0.0.1:.*|proxy_pass http://127.0.0.1:$BACKEND_PORT;|g" /etc/nginx/sites-available/bizapi-backend.conf

ln -sf /etc/nginx/sites-available/bizcode-frontend.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/bizapi-backend.conf /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

# 11. SSL Setup
echo "=> Setting up SSL via Certbot..."
certbot --nginx -d $FRONTEND_DOMAIN -d $BACKEND_DOMAIN --non-interactive --agree-tos -m admin@$FRONTEND_DOMAIN || echo "Warning: Certbot setup failed, you may need to run it manually."

# 12. Health Checks
echo "=> Running health checks..."
sleep 3
if systemctl is-active --quiet bizcode-api; then
    echo "[OK] Backend service is running"
else
    echo "[ERROR] Backend service failed to start"
fi

if systemctl is-active --quiet nginx; then
    echo "[OK] Nginx is running"
else
    echo "[ERROR] Nginx failed to start"
fi

# 13. Final Output
echo "==============================================="
echo "✅ Deployment Successful!"
echo "==============================================="
echo "Frontend: https://$FRONTEND_DOMAIN"
echo "Backend: https://$BACKEND_DOMAIN"
echo "Service: bizcode-api"
echo "Port: $BACKEND_PORT"
echo "DB Name: $DB_NAME"
echo "DB User: $DB_USER"
echo "==============================================="
echo "Please update AI_API_KEY in $DEST_DIR/go-server/.env and restart the service if needed."
