#!/bin/bash

# 🧹 اسکریپت پاکسازی و نصب مجدد برای VPS

echo "🚀 شروع پاکسازی و نصب مجدد..."

# توقف پروسه Next.js اگر در حال اجرا باشد
echo "⏹️ توقف پروسه‌های موجود..."
pkill -f "next"
pm2 delete all 2>/dev/null || true

# پاک کردن کامل node_modules
echo "🗑️ پاک کردن node_modules..."
rm -rf node_modules
rm -f package-lock.json

# پاک کردن cache npm
echo "🧹 پاکسازی cache npm..."
npm cache clean --force

# پاک کردن .next build
echo "🗑️ پاک کردن build قبلی..."
rm -rf .next

# نصب مجدد dependencies
echo "📦 نصب مجدد dependencies..."
npm install

# بررسی وجود SSH2 در node_modules (نباید باشد)
if [ -d "node_modules/ssh2" ]; then
    echo "❌ SSH2 هنوز موجود است - حذف دستی..."
    rm -rf node_modules/ssh2
    npm install
fi

echo "✅ پاکسازی کامل شد!"

# ایجاد پوشه فایل‌ها
echo "📁 ایجاد پوشه فایل‌ها..."
mkdir -p /root/hiarchitectweb/public/files
chmod 755 /root/hiarchitectweb/public/files

# تست build
echo "🔨 تست build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build موفق بود!"
    echo "🚀 شروع سرور..."
    npm start
else
    echo "❌ Build ناموفق - لطفاً لاگ‌ها را بررسی کنید"
    exit 1
fi