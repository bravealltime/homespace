# คู่มือการเปิดใช้งานระบบแจ้งเตือนเข้าโทรศัพท์ (Firebase Push Notification) สำหรับ HomeSpace

ระบบ Push Notification ในโปรเจกต์ถูกติดตั้งและเขียนโค้ดรองรับไว้สมบูรณ์แล้ว ทั้งฝั่งแอปมือถือ (Capacitor + Android) และฝั่งเซิร์ฟเวอร์ (Node.js Express + Firebase Admin SDK)

เพื่อให้การแจ้งเตือนสามารถยิงเข้าโทรศัพท์จริงได้ ต้องใช้ไฟล์เชื่อมต่อของ Firebase 2 ไฟล์ดังนี้ครับ:

---

### ไฟล์ที่ต้องใช้ 2 ไฟล์:
1. `google-services.json` ➔ นำไปวางที่โฟลเดอร์: `homespace/android/app/google-services.json`
2. `firebase-service-account.json` ➔ นำไปวางที่โฟลเดอร์: `homespace/server/firebase-service-account.json` (หรือใส่เป็น Environment Variable ชื่อ `FIREBASE_SERVICE_ACCOUNT` บน Vercel)

---

### ขั้นตอนการสร้างและดาวน์โหลดไฟล์ (ทำครั้งเดียว ใช้เวลา 3-5 นาที):

#### ขั้นตอนที่ 1: สร้างโปรเจกต์บน Firebase Console
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วล็อกอินด้วย Google Account
2. กดปุ่ม **"Add project"** (เพิ่มโปรเจกต์)
3. ตั้งชื่อโปรเจกต์ เช่น `HomeSpace-Family` แล้วกด ดำเนินการต่อ (Continue) จนสร้างเสร็จ

#### ขั้นตอนที่ 2: ดาวน์โหลดไฟล์ `google-services.json` (สำหรับแอปมือถือ)
1. ในหน้าแรกของโปรเจกต์ ให้คลิกที่ไอคอน **Android** (หุ่นเขียว)
2. ใส่ข้อมูลแอป:
   * **Android package name:** `com.homespace.family` *(ต้องตรงตามนี้)*
   * **App nickname:** `HomeSpace`
3. กด **Register app**
4. จะมีปุ่มให้กดดาวน์โหลดไฟล์ **`google-services.json`**
5. นำไฟล์ที่ได้มาวางไว้ที่:
   ```
   homespace/android/app/google-services.json
   ```

#### ขั้นตอนที่ 3: ดาวน์โหลดไฟล์ `firebase-service-account.json` (สำหรับเซิร์ฟเวอร์ยิงแจ้งเตือน)
1. ในหน้า Firebase Console คลิกที่รูป **ฟันเฟือง (Project Settings)** ที่มุมซ้ายบน
2. เลือกแท็บ **"Service accounts"**
3. ตรวจสอบว่าเลือกแท็บ Node.js แล้วกดปุ่ม **"Generate new private key"** (สร้างคีย์ส่วนตัวใหม่)
4. จะได้ไฟล์ JSON ให้เปลี่ยนชื่อไฟล์เป็น:
   ```
   firebase-service-account.json
   ```
5. นำไฟล์นี้มาวางไว้ที่:
   ```
   homespace/server/firebase-service-account.json
   ```
   *(หมายเหตุ: หาก deploy บน Vercel สามารถก๊อปปี้เนื้อหาในไฟล์นี้ทั้งหมดไปใส่ในช่อง Environment Variable ชื่อ `FIREBASE_SERVICE_ACCOUNT` ได้เลย)*

---

### เมื่อวางไฟล์ครบแล้ว:
1. คอมไพล์หรือติดตั้ง APK บนโทรศัพท์
2. เมื่อเปิดแอปและเข้าสู่ระบบ ตัวแอปจะขอสิทธิ์แจ้งเตือนและลงทะเบียน Device Token กับเซิร์ฟเวอร์โดยอัตโนมัติ
3. สามารถทดสอบได้ทันทีโดยกดปุ่ม **"🔔 ทดสอบแจ้งเตือน"** ในหน้าต่างการแจ้งเตือนของแอปได้เลยครับ!
