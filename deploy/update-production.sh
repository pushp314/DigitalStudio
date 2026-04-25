#!/bin/bash
set -e

echo "==============================================="
echo "🔄 BizCode Production Update Script"
echo "==============================================="

DEST_DIR="/var/www/bizcode/source"
cd "$DEST_DIR"

# Store current commit for rollback
PREVIOUS_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $PREVIOUS_COMMIT"

echo "=> Fetching and pulling latest changes..."
git fetch origin
git pull origin main
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$PREVIOUS_COMMIT" = "$NEW_COMMIT" ]; then
    echo "Already up to date. Exiting."
    exit 0
fi

echo "=> Sourcing environment variables..."
source "$DEST_DIR/go-server/.env"

# Function to rollback changes
rollback() {
    echo "⚠️ Update failed! Rolling back to $PREVIOUS_COMMIT..."
    cd "$DEST_DIR"
    git reset --hard "$PREVIOUS_COMMIT"
    
    echo "=> Rebuilding backend (rollback)..."
    cd "$DEST_DIR/go-server"
    go build -o bizcode-api ./main.go
    
    echo "=> Rebuilding frontend (rollback)..."
    cd "$DEST_DIR/ecom"
    npm install
    npm run build
    
    echo "=> Restarting services (rollback)..."
    systemctl restart bizcode-api
    systemctl reload nginx
    echo "Rollback complete."
    exit 1
}

# Trap errors and execute rollback
trap rollback ERR

echo "=> Building backend..."
cd "$DEST_DIR/go-server"
go mod download
go build -o bizcode-api ./main.go

echo "=> Running database migrations..."
# Extract user, password, dbname from DATABASE_URL
migrate -path migrations/ -database "$DATABASE_URL" up

echo "=> Restarting backend service..."
systemctl restart bizcode-api

echo "=> Building frontend..."
cd "$DEST_DIR/ecom"
npm install
npm run build

echo "=> Reloading Nginx..."
systemctl reload nginx

# Remove trap on success
trap - ERR

echo "==============================================="
echo "✅ Update Successful!"
echo "==============================================="
echo "Previous Commit: $PREVIOUS_COMMIT"
echo "New Commit: $NEW_COMMIT"
echo "Frontend: https://bizcode.appnity.co.in"
echo "Backend: https://bizapi.appnity.co.in"
