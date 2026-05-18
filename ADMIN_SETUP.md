# 🔐 Admin Setup Guide

## ✅ Admin Credentials

আপনার admin account এর credentials:

```bash
Email:    admin@thechattala.com
Password: StrongPassword123!@#
```

---

## 🚀 Setup Steps

### Step 1: Create `.env.local` file

```bash
cp .env.example .env.local
```

এটি `.env.example` থেকে সব production credentials copy করবে।

### Step 2: Verify Admin Credentials in `.env.local`

```bash
ADMIN_EMAIL="admin@thechattala.com"
ADMIN_PASSWORD="StrongPassword123!@#"
```

### Step 3: Run Database Migrations

```bash
npx prisma migrate deploy
```

### Step 4: Seed the Admin User

```bash
tsx prisma/seed-admin.ts
```

**Output আসবে:**
```
🌱 Starting Admin and Settings Seed...
✅ Global settings initialized.
✅ Admin user created successfully!
```

### Step 5: Verify Admin User Created

```bash
# Optional: Check in database
npx prisma studio
```

Prisma Studio খুলবে যেখানে আপনি users দেখতে পারবেন।

---

## 🔑 Login to Admin Panel

এখন আপনি এই credentials দিয়ে login করতে পারবেন:

- **Email:** `admin@thechattala.com`
- **Password:** `StrongPassword123!@#`

---

## 🔒 Security Notes

⚠️ **IMPORTANT:**

1. **Production deployment এর আগে:**
   - Strong password দিন (min 12 characters, numbers + symbols)
   - `StrongPassword123!@#` change করুন নিজের password এ

2. **Password generate করো:**
   ```bash
   openssl rand -base64 16
   ```

3. **কখনো commit করবে না:**
   ```bash
   .env.local        # ❌ Never commit
   .env.production   # ❌ Never commit
   ```

---

## 📋 Quick Checklist

- [ ] `.env.local` created from `.env.example`
- [ ] Admin email & password verified
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Seed script executed (`tsx prisma/seed-admin.ts`)
- [ ] Verified admin user in database (Prisma Studio)
- [ ] Admin login successful
- [ ] Changed default password (production)

---

## 🆘 Troubleshooting

### "Admin already exists" error
```
→ Admin user already created. Check database with:
  npx prisma studio
```

### "Settings model not found"
```
→ Migrations haven't run yet. Run:
  npx prisma migrate deploy
```

### "Cannot connect to database"
```
→ Check DATABASE_URL in .env.local
→ Verify Neon connection is active
```

---

**Happy admin! 🎉**
