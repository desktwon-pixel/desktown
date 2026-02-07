# تعليمات رفع وتشغيل مشروع DeskTown على الاستضافة

هذا الملف يحتوي على الخطوات اللازمة لتشغيل مشروع المكتب السحابي على خادم (Server) أو استضافة تدعم Node.js.

## المتطلبات الأساسية
- **Node.js**: الإصدار 18 أو أحدث.
- **قاعدة بيانات PostgreSQL**: المشروع مجهز للعمل مع Neon.tech أو أي مزود PostgreSQL آخر (مثل Supabase).

## حل مشكلة "Endpoint Disabled" (Render/Neon)
إذا ظهر لك الخطأ `The endpoint has been disabled. Enable it using Neon API and retry`، فهذا يعني أن قاعدة بيانات Neon قد توقفت بسبب عدم النشاط.

**الحل 1: استخدام Supabase (مستقر ومجاني)**
استخدم رابط الاتصال الخاص بـ Supabase بدلاً من Neon في إعدادات Render.
1. اذهب إلى Render Dashboard > Environment.
2. عدل المتغير `DATABASE_URL` إلى:
```
postgresql://postgres:Rayan201667%24@db.imzjapteeyxumnevnxmu.supabase.co:5432/postgres?sslmode=no-verify
```

**الحل 2: إعادة تفعيل Neon**
1. سجل الدخول إلى لوحة تحكم Neon.tech.
2. اذهب إلى المشروع واضغط على زر التفعيل (Wake up/Start).

**الحل 3: استخدام رابط اتصال Neon الجديد (تم التحقق منه)**
إذا قمت بإنشاء قاعدة بيانات جديدة أو نقطة اتصال جديدة، استخدم الرابط التالي في إعدادات Render:
```
postgresql://neondb_owner:npg_paYlKD4R7hSI@ep-super-rain-ahlt4hgi-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## الخطوات العامة للنشر:

### 1. إعداد المتغيرات البيئية (Environment Variables)
يجب إنشاء ملف `.env` في المجلد الرئيسي للمشروع على الاستضافة وإضافة القيم التالية:

```env
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
SESSION_SECRET=اكتب_كلمة_سر_عشوائية_هنا
NODE_ENV=production
PORT=5000

# إذا كنت تستخدم Replit OIDC للمصادقة:
REPLIT_CLIENT_ID=معرف_العميل_الخاص_بك
ISSUER_URL=https://replit.com/oidc
```

### 2. تثبيت الحزم (Dependencies)
قم بتشغيل الأمر التالي لتثبيت المكتبات المطلوبة:
```bash
npm install --production
```

### 3. تحديث قاعدة البيانات (Database Push)
للتأكد من أن جداول قاعدة البيانات مطابقة للكود، قم بتشغيل:
```bash
npx drizzle-kit push
```

### 4. تشغيل المشروع
لتشغيل النسخة النهائية (Production build):
```bash
npm start
```

## ملاحظات هامة:
- المشروع تم ضغطه بدون مجلد `node_modules` لتقليل الحجم، لذا يجب تشغيل `npm install` عند الرفع.
- تأكد من أن المنفذ (Port) المختار (مثلاً 5000) مفتوح في إعدادات جدار الحماية الخاص بالاستضافة.
- تم حصر الدخول فقط للحسابات الإدارية المسجلة في قاعدة البيانات لضمان خصوصية العمل.
- تم دعم النشر على Vercel و Render (للنسخة المستقلة).

## النشر على Render (التطبيق الكامل أو المستقل)

لضمان الاتصال بقاعدة البيانات بشكل مستقر وتجنب أخطاء DNS/IPv6، يرجى اتباع الإعدادات التالية:

### 1. إعدادات البناء والتشغيل (Build & Start)

| الإعداد | للتطبيق الكامل (Frontend + Backend) | للنسخة المستقلة (Backend API Only) |
| :--- | :--- | :--- |
| **Build Command** | `npm run build` | `npm run build:standalone` |
| **Start Command** | `npm run start` | `npm run start:standalone` |

### 2. المتغيرات البيئية (Environment Variables)

اذهب إلى **Render Dashboard** → اختر خدمتك → **Environment** → أضف المتغيرات التالية:

#### ✅ متغيرات أساسية (مطلوبة)

```bash
# قاعدة البيانات - Supabase
DATABASE_URL=postgresql://postgres:Rayan201667%24@db.imzjapteeyxumnevnxmu.supabase.co:5432/postgres?sslmode=no-verify

# الجلسة والأمان
SESSION_SECRET=JRtbJe0z9eXAwTAbTSoG0oyt0b7EvdoKlqX/bKbHK3dpsxlqkWYR1ONputW8n6AKFBP2EHpVKq5dJ1c/cQv93A==

# إشعارات الدفع (Push Notifications)
VAPID_PRIVATE_KEY=dUnwDkyAQndUc2l92-ZqkIPDL7DpJJquS5pn0BcQp6Y
VAPID_PUBLIC_KEY=BEW6basvmbqUpZrQqjxnpAifjdl1-qdSFHk3yNIGK-_McXzEhWYOByvxpFfegYr7kT0zJ4TBaxjfFi_95q2aLSU

# تخزين الكائنات (Object Storage) - قيم وهمية
PUBLIC_OBJECT_SEARCH_PATHS=/dummy-bucket/public
PRIVATE_OBJECT_DIR=/dummy-bucket/private

# البيئة
REPL_ID=render-deployment
NODE_VERSION=20
NODE_ENV=production
```

#### 📝 ملاحظات مهمة

1. **كلمة المرور في DATABASE_URL**:
   - استخدم `Rayan201667$` مباشرة (Render يتعامل مع `$` بشكل صحيح)
   - إذا واجهت مشكلة، جرب: `Rayan201667%24` (حيث `%24` هو ترميز `$`)

2. **لا تضف `NODE_OPTIONS`**: 
   - حذف المتغير `NODE_OPTIONS=--max_old_space_size=4096` إذا كان موجودًا
   - يسبب خطأ في Node.js v20

3. **Object Storage**:
   - القيم المذكورة "وهمية" لمنع أخطاء التشغيل
   - لن يتم استخدامها إلا عند رفع/تحميل الملفات

### 3. حل مشاكل الاتصال (اختياري)

إذا واجهت مشاكل رغم الإعدادات أعلاه:

- للتطبيق الكامل:
  ```bash
  node --dns-result-order=ipv4first dist/index.cjs
  ```

- للنسخة المستقلة:
  ```bash
  node --dns-result-order=ipv4first dist/standalone.cjs
  ```

## النشر على Vercel

اذهب إلى **Vercel Dashboard** → اختر مشروعك → **Settings** → **Environment Variables**

### المتغيرات المطلوبة:

```bash
# قاعدة البيانات
DATABASE_URL=postgresql://postgres:Rayan201667%24@db.imzjapteeyxumnevnxmu.supabase.co:5432/postgres?sslmode=no-verify

# الأمان
SESSION_SECRET=JRtbJe0z9eXAwTAbTSoG0oyt0b7EvdoKlqX/bKbHK3dpsxlqkWYR1ONputW8n6AKFBP2EHpVKq5dJ1c/cQv93A==

# البيئة
NODE_ENV=production

# Push Notifications (اختياري)
VAPID_PRIVATE_KEY=dUnwDkyAQndUc2l92-ZqkIPDL7DpJJquS5pn0BcQp6Y
VAPID_PUBLIC_KEY=BEW6basvmbqUpZrQqjxnpAifjdl1-qdSFHk3yNIGK-_McXzEhWYOByvxpFfegYr7kT0zJ4TBaxjfFi_95q2aLSU
```


---
**تم التجهيز بواسطة Antigravity AI**
