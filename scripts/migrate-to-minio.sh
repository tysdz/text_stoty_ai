#!/bin/bash
#
# localized text
# localized text: ./scripts/migrate-to-minio.sh [localized text]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# localized text
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     Local Storage → MinIO Migration Tool${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo

# check MinIO localized text
if ! curl -sf http://127.0.0.1:19000/minio/health/live >/devdev/null 2>&1; then
    echo -e "${YELLOW}⚠ MinIO localized text 127.0.0.1:19000${NC}"
    echo "  localized text MinIO: docker compose up -d minio"
    echo
    read -p "localized text MinIO? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        docker compose up -d minio
        echo -e "${GREEN}✓ MinIO localized text，localized text 5 localized text...${NC}"
        sleep 5
    else
        exit 1
    fi
fi

echo -e "${GREEN}✓ MinIO localized text${NC}"
echo

# localized text
if [ ! -d "./data/uploads" ]; then
    echo -e "${YELLOW}⚠ localized text ./data/uploads localized text${NC}"
    echo "  localized text"
    exit 0
fi

FILE_COUNT=$(find ./data/uploads -type f 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ localized text${NC}"
    echo "  localized text"
    exit 0
fi

echo "localized text: $FILE_COUNT"
echo

# localized text
echo -e "${YELLOW}▶ localized text (Dry Run)...${NC}"
MIGRATE_DRY_RUN=true npx tsx scripts/migrate-to-minio.ts
echo

# localized text
read -p "localized text? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}localized text${NC}"
    exit 0
fi

echo
echo -e "${GREEN}▶ localized text...${NC}"
npx tsx scripts/migrate-to-minio.ts

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}              localized text!${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
    echo
    echo "localized text:"
    echo "  1. localized text MinIO localized text: http://127.0.0.1:19001"
    echo "     localized text: minioadmin / minioadmin"
    echo "  2. update .env: STORAGE_TYPE=minio"
    echo "  3. localized text: docker compose restart app"
    echo "  4. localized text/localized text"
    echo "  5. localized text: rm -rf ./data/uploads"
    echo
else
    echo
    echo -e "${RED}══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}                localized text${NC}"
    echo -e "${RED}══════════════════════════════════════════════════════════${NC}"
    echo
    echo "localized text:"
    echo "  ./scripts/migrate-to-minio.sh"
    exit 1
fi
