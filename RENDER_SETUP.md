# دليل النشر السريع على Render - DeskTown

## 📋 قائمة المتغيرات البيئية

انسخ المتغيرات التالية مباشرة إلى **Render Dashboard → Environment**:

### ✅ النسخة الجاهزة للنسخ:

```
DATABASE_URL=postgresql://postgres:Rayan201667%24@db.imzjapteeyxumnevnxmu.supabase.co:5432/postgres?sslmode=no-verify
SESSION_SECRET=JRtbJe0z9eXAwTAbTSoG0oyt0b7EvdoKlqX/bKbHK3dpsxlqkWYR1ONputW8n6AKFBP2EHpVKq5dJ1c/cQv93A==
VAPID_PRIVATE_KEY=dUnwDkyAQndUc2l92-ZqkIPDL7DpJJquS5pn0BcQp6Y
VAPID_PUBLIC_KEY=BEW6basvmbqUpZrQqjxnpAifjdl1-qdSFHk3yNIGK-_McXzEhWYOByvxpFfegYr7kT0zJ4TBaxjfFi_95q2aLSU
PUBLIC_OBJECT_SEARCH_PATHS=/dummy-bucket/public
PRIVATE_OBJECT_DIR=/dummy-bucket/private
REPL_ID=render-deployment
NODE_VERSION=20
NODE_ENV=production
```

---

## 🚀 خطوات النشر

### 1. إعداد الخدمة (Service Setup)

- **Service Type**: Web Service
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Environment**: Node

### 2. إضافة المتغيرات البيئية

1. اذهب إلى **Dashboard** → اختر خدمتك
2. اضغط على **Environment** من القائمة الجانبية
3. اضغط **Add Environment Variable**
4. انسخ كل متغير من القائمة أعلاه:
   - **Key**: اسم المتغير (مثل `DATABASE_URL`)
   - **Value**: القيمة المقابلة

### 3. ملاحظات مهمة

#### ⚠️ أخطاء شائعة وحلولها

**خطأ: `illegal value for flag --max_old_space_size=4096`**
- **الحل**: احذف المتغير `NODE_OPTIONS` إذا كان موجودًا

**خطأ: `The "paths[0]" argument must be of type string`**
- **الحل**: تأكد من إضافة المتغيرات:
  - `PUBLIC_OBJECT_SEARCH_PATHS`
  - `PRIVATE_OBJECT_DIR`
  - `REPL_ID`

**خطأ اتصال قاعدة البيانات**
- **الحل**: تحقق من `DATABASE_URL` وتأكد أن كلمة المرور صحيحة
- إذا لم يعمل `$` في كلمة المرور، استبدلها بـ `%24`

---

## 🔍 التحقق من التشغيل

بعد النشر، تحقق من:

1. **Build Logs**: تأكد من نجاح البناء بدون أخطاء
2. **Runtime Logs**: ابحث عن:
   ```
   [DB] Database connection initialized using postgres.js
   Database connection successful.
   serving on port 5000
   ```

3. **اختبار الاتصال**: افتح URL المشروع وتحقق من:
   - صفحة تسجيل الدخول تظهر بشكل صحيح
   - قاعدة البيانات متصلة

---

## 📊 معلومات إضافية

### قاعدة البيانات
- **النوع**: PostgreSQL (Supabase)
- **المنفذ**: 5432 (اتصال مباشر)
- **SSL**: معطّل (`sslmode=no-verify`)

### Object Storage
- القيم المستخدمة "وهمية" (dummy values)
- لن يؤثر على الوظائف الأساسية
- لاستخدام تخزين حقيقي، يجب إعداد Google Cloud Storage

### Push Notifications
- تم تضمين مفاتيح VAPID
- تعمل على HTTPS فقط
- يمكن تجديد المفاتيح لاحقًا

---

## 🆘 الدعم

إذا واجهت مشاكل:

1. **تحقق من Logs**: Render → Dashboard → اختر Service → Logs
2. **ابحث عن الخطأ**: انسخ رسالة الخطأ وابحث في الملف `DEPLOYMENT.md`
3. **تحقق من المتغيرات**: Environment → تأكد من نسخ جميع المتغيرات بشكل صحيح

---

**آخر تحديث**: 2026-02-06  
**النسخة**: 2.0 (Supabase Migration)
