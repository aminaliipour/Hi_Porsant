# 🚀 راهنمای نصب روی VPS

این راهنما برای نصب و اجرای پروژه Hi_Porsant روی VPS شما می‌باشد.

## 📋 پیش‌نیازها

1. **Node.js** نسخه 18 یا بالاتر
2. **MongoDB** (محلی یا Atlas)
3. **Git**

## 🛠️ مراحل نصب

### 1. کلون کردن پروژه
```bash
cd /root
git clone https://github.com/aminaliipour/Hi_Porsant.git
cd Hi_Porsant
```

### 2. نصب dependencies
```bash
npm install
```

### 3. تنظیم environment variables
```bash
cp .env.example .env.local
nano .env.local
```

فایل `.env.local` را با اطلاعات زیر پر کنید:
```bash
VPS_MODE=true
MONGODB_URI=mongodb://localhost:27017/hiarchitect
FILES_DIR=/root/hiarchitectweb/public/files
SITE_URL=https://hiarchitectweb.com
```

### 4. ایجاد پوشه فایل‌ها
```bash
mkdir -p /root/hiarchitectweb/public/files
chmod 755 /root/hiarchitectweb/public/files
```

### 5. Build کردن پروژه
```bash
npm run build
```

### 6. اجرای production
```bash
npm start
```

## 🔄 استفاده از PM2 (پیشنهادی)

برای اجرای مداوم از PM2 استفاده کنید:

```bash
# نصب PM2
npm install -g pm2

# اجرای پروژه با PM2
pm2 start npm --name "hi-porsant" -- start

# تنظیم auto-restart
pm2 startup
pm2 save
```

## 🌐 تنظیم Nginx (اختیاری)

فایل `/etc/nginx/sites-available/hiarchitectweb` را ایجاد کنید:

```nginx
server {
    listen 80;
    server_name hiarchitectweb.com www.hiarchitectweb.com;

    # Serve static files
    location /files/ {
        alias /root/hiarchitectweb/public/files/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

فعال‌سازی:
```bash
sudo ln -s /etc/nginx/sites-available/hiarchitectweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ تست عملکرد

بعد از اجرا، موارد زیر را تست کنید:

1. **دسترسی به سایت:** `http://your-vps-ip:3000`
2. **آپلود فیش حقوقی:** باید در `/root/hiarchitectweb/public/files/` ذخیره شود
3. **API endpoints:**
   - `GET /api/vps-files` - لیست فایل‌های موجود
   - `POST /api/upload-payslip` - آپلود فیش حقوقی

## 📁 ساختار فایل‌ها

```
/root/hiarchitectweb/public/files/
├── 1234567890/          # کد ملی کارمند
│   ├── payslip1.pdf
│   └── payslip2.pdf
└── 0987654321/          # کد ملی کارمند دیگر
    └── payslip3.pdf
```

## 🔧 عیب‌یابی

### خطای دسترسی به فایل:
```bash
sudo chown -R www-data:www-data /root/hiarchitectweb/public/files
chmod -R 755 /root/hiarchitectweb/public/files
```

### مشاهده logs:
```bash
# Next.js logs
tail -f ~/.pm2/logs/hi-porsant-out.log

# Error logs
tail -f ~/.pm2/logs/hi-porsant-error.log
```

### Restart کردن سرویس:
```bash
pm2 restart hi-porsant
```

## 📞 پشتیبانی

در صورت بروز مشکل، فایل‌های log را بررسی کنید یا با پشتیبانی تماس بگیرید.