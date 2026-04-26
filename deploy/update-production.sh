#!/bin/bash
# ==============================================================================
# 🚀 BizCode Production Update Script (Best Practices Edition)
# ==============================================================================
# This script handles automated updates, migrations, and builds for production.
# Usage: sudo ./update-production.sh
# ==============================================================================

set -e # Exit on error
set -o pipefail # Fail if any part of a pipe fails

# Ensure common binary paths are included for sudo
export PATH=$PATH:/usr/local/bin:/usr/local/go/bin:/usr/bin:/bin

# --- Configuration ---
DEST_DIR="/var/www/bizcode/source"
BACKUP_DIR="/var/www/bizcode/backups"
LOG_DIR="/var/log/bizcode"
LOG_FILE="$LOG_DIR/update-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Initialization ---
mkdir -p "$BACKUP_DIR" "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}🔄 BizCode Production Update Started${NC}"
echo -e "${BLUE}📅 Time: $TIMESTAMP${NC}"
echo -e "${BLUE}===============================================${NC}"

# --- Check Permissions ---
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (sudo)${NC}" 
   exit 1
fi

# --- Check Required Tools ---
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ Required tool '$1' not found. Please install it.${NC}"
        exit 1
    fi
}

check_tool "git"
check_tool "go"
check_tool "npm"
check_tool "migrate"

cd "$DEST_DIR"

# --- Store previous state ---
PREVIOUS_COMMIT=$(git rev-parse HEAD)
echo -e "${YELLOW}📍 Current Commit: $PREVIOUS_COMMIT${NC}"

# --- Rollback Function ---
rollback() {
    echo -e "${RED}⚠️  Update failed at line $1! Initiating rollback...${NC}"
    
    cd "$DEST_DIR"
    git reset --hard "$PREVIOUS_COMMIT"
    
    echo "=> Restoring backend..."
    cd "$DEST_DIR/go-server"
    go build -o bizcode-api ./main.go
    
    echo "=> Restoring frontend..."
    cd "$DEST_DIR/ecom"
    npm install --quiet
    npm run build --quiet
    
    echo "=> Restarting services..."
    systemctl restart bizcode-api
    systemctl reload nginx
    
    echo -e "${GREEN}✅ Rollback complete. System is back to previous state.${NC}"
    exit 1
}

trap 'rollback $LINENO' ERR

# --- Step 1: Update Source ---
echo -e "${YELLOW}Step 1: Synchronizing with repository...${NC}"

# Fetch latest from remote
git fetch origin main

# Force local to match remote exactly
# This clears any local changes to tracked files (like the script itself or dist files)
git reset --hard origin/main

NEW_COMMIT=$(git rev-parse HEAD)
if [ "$PREVIOUS_COMMIT" = "$NEW_COMMIT" ]; then
    echo -e "${YELLOW}ℹ️  No new commits found, but proceeding with fresh build as requested...${NC}"
else
    echo -e "${GREEN}✨ Successfully synchronized to commit: $NEW_COMMIT${NC}"
fi

# --- Step 2: Environment & Database ---
echo -e "${YELLOW}Step 2: Database Migration & Backup...${NC}"
source "$DEST_DIR/go-server/.env"

# Perform a quick DB backup (Assuming SQLite for this repo based on digitalstudio.db)
if [ -f "$DEST_DIR/go-server/digitalstudio.db" ]; then
    echo "=> Backing up database..."
    cp "$DEST_DIR/go-server/digitalstudio.db" "$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).db.bak"
fi

echo "=> Running migrations..."
# Assuming 'migrate' tool is used with the DATABASE_URL from .env
migrate -path "$DEST_DIR/go-server/migrations/" -database "$DATABASE_URL" up

# --- Step 3: Build Backend ---
echo -e "${YELLOW}Step 3: Building Backend (Go)...${NC}"
cd "$DEST_DIR/go-server"
echo "=> Cleaning old binary..."
rm -f bizcode-api
echo "=> Downloading dependencies..."
go mod download
echo "=> Compiling..."
go build -ldflags="-s -w" -o bizcode-api ./main.go # -s -w reduces binary size

echo "=> Restarting API Service..."
systemctl restart bizcode-api

# --- Step 4: Build Frontend ---
echo -e "${YELLOW}Step 4: Building Frontend (React/Vite)...${NC}"
cd "$DEST_DIR/ecom"
echo "=> Cleaning old dist..."
rm -rf dist/
echo "=> Installing dependencies (npm ci)..."
npm ci # Faster and more reliable for production
echo "=> Building assets..."
npm run build

echo "=> Reloading Nginx..."
systemctl reload nginx

# --- Finalize ---
trap - ERR
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}✅ Production Update Successful!${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Previous: $PREVIOUS_COMMIT"
echo -e "Current:  $NEW_COMMIT"
echo -e "Log File: $LOG_FILE"
echo -e "${BLUE}===============================================${NC}"
