#!/bin/bash

# 🧹 اسکریپت پاکسازی و نصب مجدد برای VPS

echo "🚀 شروع پاکسازی و نصب مجدد..."

# توقف پروسه Next.js اگر در حال اجرا باشد
echo "⏹️ توقف پروسه‌های موجود..."
pkill -f "next" 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# آپدیت آخرین نسخه از گیت
echo "📥 دریافت آخرین تغییرات از گیت..."
git fetch origin
git reset --hard origin/main

# پاک کردن کامل node_modules و cache
echo "🗑️ پاک کردن کامل node_modules و cache..."
rm -rf node_modules package-lock.json .next

# پاک کردن cache npm و pnpm
echo "🧹 پاکسازی cache..."
npm cache clean --force 2>/dev/null || true
pnpm store prune 2>/dev/null || true

# بررسی وجود SSH2 و حذف آن
if [ -d "node_modules/ssh2" ]; then
    echo "❌ SSH2 موجود است - حذف دستی..."
    rm -rf node_modules/ssh2
fi

# نصب مجدد dependencies
echo "📦 نصب مجدد dependencies..."
npm install

# بررسی مجدد وجود SSH2 (نباید باشد)
if [ -d "node_modules/ssh2" ]; then
    echo "❌ SSH2 هنوز موجود است! حذف مجدد..."
    rm -rf node_modules/ssh2
    npm install --no-optional
fi

echo "✅ پاکسازی کامل شد!"

# ایجاد پوشه فایل‌ها
echo "📁 ایجاد پوشه فایل‌ها..."
mkdir -p /root/hiarchitectweb/public/files
chmod 755 /root/hiarchitectweb/public/files

# تنظیم .env.local
if [ ! -f ".env.local" ]; then
    echo "⚙️ ایجاد فایل .env.local..."
    cat > .env.local << EOF
VPS_MODE=true
MONGODB_URI=mongodb://localhost:27017/hiarchitect
FILES_DIR=/root/hiarchitectweb/public/files
SITE_URL=https://hiarchitectweb.com
NODE_ENV=production
EOF
fi

# تست build
echo "🔨 تست build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build موفق بود!"
    echo "🚀 شروع سرور با PM2..."
    
    # شروع با PM2
    pm2 start npm --name "hi-porsant" -- start
    pm2 save
    
    echo "✅ سرور راه‌اندازی شد!"
    echo "🌐 سایت در دسترس است: http://$(hostname -I | awk '{print $1}'):3000"
    echo "📋 برای مشاهده logs: pm2 logs hi-porsant"
    echo "🔄 برای restart: pm2 restart hi-porsant"
    
else
    echo "❌ Build ناموفق - لطفاً لاگ‌ها را بررسی کنید"
    exit 1
fi