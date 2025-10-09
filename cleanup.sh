#!/bin/bash

# CLV Project Cleanup Script
# Run this before pushing to GitHub

echo "🧹 Cleaning up CLV Project for GitHub..."

# Remove node_modules if exists
if [ -d "node_modules" ]; then
    echo "Removing node_modules..."
    rm -rf node_modules
fi

# Remove package-lock.json
if [ -f "package-lock.json" ]; then
    echo "Removing package-lock.json..."
    rm package-lock.json
fi

# Remove build files
if [ -f "Frontend/main.bundle.js" ]; then
    echo "Removing build files..."
    rm Frontend/main.bundle.js*
fi

# Remove log and data files
echo "Removing logs and data files..."
find . -name "*.log" -delete
find . -name "auth_logs.json" -delete
find . -name "customers.json" -delete
find . -name "auth_export_*.csv" -delete

# Remove temporary documentation
find . -name "CRUD_Operations_*.js" -delete
find . -name "PROJECT_EVALUATION_*.md" -delete
find . -name "CPP_ALGORITHMS_*.md" -delete

# Remove OS files
find . -name ".DS_Store" -delete
find . -name "._*" -delete

echo "✅ Cleanup complete! Project is ready for GitHub."
echo "📦 Project size: $(du -sh . | cut -f1)"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'Initial commit: CLV Calculator'"
echo "3. git push origin main"
