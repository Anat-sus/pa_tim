# แผนการพัฒนาโปรเจกต์ PaTim

ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะสำหรับส่งอาหารกลางวัน บริเวณมหาวิทยาลัยมหาสารคาม รัศมีไม่เกิน 3 กิโลเมตร

เอกสารนี้เป็นคู่มือเริ่มต้นสำหรับสมาชิกทุกคน ตั้งแต่การนำโปรเจกต์ลงเครื่อง การติดตั้ง การแบ่งงาน การออกแบบฐานข้อมูล การสร้าง Web API และการเชื่อมต่อกับ Angular

## 1. ขอบเขตของระบบ

ระบบแบ่งเป็น 2 ส่วนหลัก

- **Owner Portal:** เจ้าของร้านจัดการลูกค้า ออเดอร์ จำลองออเดอร์ คำนวณเส้นทาง และดูข้อมูลกำไร/ขาดทุน
- **Rider Portal:** ไรเดอร์ค้นหาใบงาน ดูจำนวนกล่อง ลำดับจุดส่ง และเปิด Google Maps เพื่อนำทาง
- **Backend API:** จัดการข้อมูลลูกค้าและรายการสั่งซื้อ รวมถึงฟังก์ชันค้นหาตามระยะทาง
- **Database:** เก็บข้อมูลลูกค้า รายการสั่งซื้อ และข้อมูลที่จำเป็นต่อการจัดเส้นทาง

### กฎทางธุรกิจที่ต้องใช้ร่วมกัน

- ราคาขาย 65 บาทต่อกล่อง
- ต้นทุนอาหาร 40 บาทต่อกล่อง
- กำไรขั้นต้น 25 บาทต่อกล่อง
- ค่าเรียกรถ 15 บาทต่อไรเดอร์ต่อรอบ
- ค่าระยะทาง 2 บาทต่อกิโลเมตรต่อกล่อง
- รถหนึ่งคันบรรทุกได้ไม่เกิน 10 กล่อง
- ไรเดอร์หนึ่งคนรับได้ไม่เกิน 3 ออเดอร์ หรือ 3 จุดส่ง
- เวลาออกเดินทาง 11:30 น. และต้องส่งเสร็จภายใน 12:30 น.
- ใช้ความเร็วเฉลี่ย 30 กิโลเมตรต่อชั่วโมงในการประมาณเวลา

สูตรที่ใช้:

$$
\text{ค่าขนส่งรวม} = 15 + (\text{ระยะทางรวม} \times 2 \times \text{จำนวนกล่องรวม})
$$

$$
\text{กำไรสุทธิ} = (\text{จำนวนกล่อง} \times 25) - \text{ค่าขนส่งรวม}
$$

## 2. การนำโปรเจกต์ลงเครื่อง

### 2.1 สิ่งที่ต้องติดตั้งก่อนเริ่มงาน

- Git
- Node.js เวอร์ชันที่รองรับ Angular 22
- npm เวอร์ชันตาม `package.json`
- PostgreSQL และ pgAdmin หรือเครื่องมือจัดการฐานข้อมูลอื่น
- Visual Studio Code
- บัญชี GitHub ที่มีสิทธิ์เข้าถึง repository

ตรวจสอบโปรแกรมที่ติดตั้งแล้ว:

```bash
git --version
node --version
npm --version
psql --version
```

### 2.2 Clone repository

เปลี่ยน URL ให้เป็น URL จริงของ repository ก่อนใช้งาน:

```bash
git clone <REPOSITORY_URL>
cd pa_tim
```

ตรวจสอบ branch และสถานะไฟล์:

```bash
git branch
git status
```

ถ้า repository ใช้ branch สำหรับพัฒนา ให้เปลี่ยนไปยัง branch นั้น:

```bash
git switch develop
```

ถ้าไม่มี branch `develop` ให้ใช้ branch ที่ทีมตกลงร่วมกัน

### 2.3 ติดตั้งและเปิด Angular frontend

```bash
npm install
npm start
```

เปิดเบราว์เซอร์ที่ `http://localhost:4200/`

คำสั่งที่ใช้บ่อย:

```bash
npm run build
npm test
```

### 2.4 ติดตั้งและเปิด Backend API

เมื่อสร้างโฟลเดอร์ backend แล้ว ให้เปิด terminal อีกหน้าต่าง:

```bash
cd server
npm install
```

สร้างไฟล์ `.env` จาก `.env.example` และกำหนดค่าฐานข้อมูล เช่น:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/patim
CORS_ORIGIN=http://localhost:4200
```

จากนั้นสร้างฐานข้อมูลและเริ่ม server:

```bash
createdb patim
npm run migration:run
npm run dev
```

API จะทำงานที่ `http://localhost:3000/api`

> ห้าม commit ไฟล์ `.env` หรือรหัสผ่านลง Git ให้เพิ่ม `.env` ใน `.gitignore` เสมอ

## 3. โครงสร้างโฟลเดอร์ที่แนะนำ

```text
pa_tim/
├── Plan/
│   └── PROJECT_PLAN.md
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── app.ts
│   ├── migrations/
│   ├── .env.example
│   └── package.json
├── src/
│   └── app/
│       ├── components/
│       ├── services/
│       ├── models/
│       └── pages/
└── project_requirements.md
```

Frontend ใช้ Angular ตามโครงสร้างเดิมของโปรเจกต์ ส่วน backend แยกเป็น REST API เพื่อให้พัฒนาและทดสอบแยกจากหน้าจอได้

## 4. การแบ่งงานของสมาชิก 4 คน

การแบ่งงานตามที่ทีมกำหนดมี 4 ส่วน โดยให้แทนที่ `สมาชิกคนที่ 1` ถึง `สมาชิกคนที่ 4` ด้วยชื่อจริงของสมาชิก

| สมาชิก | ส่วนงานที่รับผิดชอบ | งานที่ต้องส่งมอบ |
|---|---|---|
| สมาชิกคนที่ 1 | ระบบลูกค้า | ตาราง `customers`, Customer API, เพิ่ม/ลบ/แก้ไข/แสดงข้อมูล, ค้นหาชื่อ/นามสกุล และค้นหาในระยะ 1 กม. |
| สมาชิกคนที่ 2 | ระบบออเดอร์ | ตาราง `orders`, Order API, สร้างออเดอร์จำลอง 20-30 รายการ, แก้ไขจำนวนกล่อง, ลบข้อมูลจำลอง และค้นหาในระยะ 2 กม. |
| สมาชิกคนที่ 3 | การคำนวณเส้นทางและสรุปยอด | ตารางใบงานที่เกี่ยวข้อง, แบ่งออเดอร์ให้ไรเดอร์, คำนวณระยะทาง/เวลา, ค่าส่ง, รายรับ, ต้นทุน และกำไรสุทธิ พร้อมแสดงเส้นทางบนแผนที่ |
| สมาชิกคนที่ 4 | ระบบไรเดอร์ | ตาราง `riders`, หน้าค้นหา Job ID, สรุปจำนวนกล่อง, แสดงลำดับจุดส่ง, เปลี่ยนสถานะการส่ง และเปิด Google Maps |

ทุกคนต้องช่วยกันทำ ER Diagram, review งานของเพื่อน, ทดสอบระบบ และเชื่อม frontend กับ API ในส่วนที่ตนเองรับผิดชอบ

### กติกาการทำงานร่วมกัน

1. สร้าง branch จาก `develop` เช่น `feature/customer-api`
2. ทำงานเฉพาะส่วนของตนเองและเขียน commit ให้สื่อความหมาย
3. ก่อน push ให้รัน `npm run build` และ test ที่เกี่ยวข้อง
4. เปิด Pull Request พร้อมอธิบายสิ่งที่แก้และวิธีทดสอบ
5. ให้สมาชิกอีกคน review ก่อน merge
6. ห้ามแก้ไขไฟล์ของเพื่อนทับโดยไม่แจ้งทีม

ตัวอย่างคำสั่ง:

```bash
git switch develop
git pull origin develop
git switch -c feature/customer-api

git add .
git commit -m "feat: add customer search API"
git push -u origin feature/customer-api
```

## 5. การออกแบบ Database และ ER Diagram

### 5.1 ตารางที่ระบบควรมี

ระบบควรมี 5 ตารางหลัก ได้แก่ `customers`, `orders`, `riders`, `delivery_batches` และ `delivery_batch_orders` โดยแต่ละตารางมีหน้าที่ดังนี้

#### `customers`

| คอลัมน์ | ชนิดข้อมูล | รายละเอียด |
|---|---|---|
| `id` | UUID หรือ BIGSERIAL | Primary key |
| `first_name` | VARCHAR(100) | ชื่อลูกค้า |
| `last_name` | VARCHAR(100) | นามสกุลลูกค้า |
| `phone` | VARCHAR(20) | เบอร์โทรศัพท์ |
| `latitude` | DECIMAL(10,7) | พิกัดละติจูด |
| `longitude` | DECIMAL(10,7) | พิกัดลองจิจูด |
| `address` | TEXT | ที่อยู่หรือคำอธิบายจุดส่ง |
| `created_at` | TIMESTAMP | วันที่สร้างข้อมูล |
| `updated_at` | TIMESTAMP | วันที่แก้ไขข้อมูลล่าสุด |

**หน้าที่:** เก็บข้อมูลลูกค้าและพิกัดจุดส่ง ใช้ร่วมกับ Customer API และใช้คำนวณระยะทาง

#### `orders`

| คอลัมน์ | ชนิดข้อมูล | รายละเอียด |
|---|---|---|
| `id` | UUID หรือ BIGSERIAL | Primary key |
| `order_code` | VARCHAR(50) | รหัสออเดอร์ไม่ซ้ำกัน |
| `customer_id` | UUID หรือ BIGSERIAL | Foreign key ไปยัง `customers.id` |
| `box_quantity` | INTEGER | จำนวนกล่อง ต้องอยู่ระหว่าง 1-3 |
| `status` | VARCHAR(30) | เช่น `pending`, `assigned`, `delivered`, `cancelled` |
| `delivery_date` | DATE | วันที่จัดส่ง |
| `is_simulated` | BOOLEAN | ระบุว่าเป็นออเดอร์จำลอง ค่าเริ่มต้น `false` |
| `created_at` | TIMESTAMP | วันที่สร้างออเดอร์ |
| `updated_at` | TIMESTAMP | วันที่แก้ไขล่าสุด |

**หน้าที่:** เก็บรายการสั่งซื้อ โดยหนึ่งออเดอร์เป็นของลูกค้าหนึ่งคน และใช้เป็นข้อมูลตั้งต้นในการจัดเส้นทาง

#### `riders`

| คอลัมน์ | ชนิดข้อมูล | รายละเอียด |
|---|---|---|
| `id` | UUID หรือ BIGSERIAL | Primary key |
| `rider_code` | VARCHAR(50) | รหัสไรเดอร์ไม่ซ้ำกัน |
| `first_name` | VARCHAR(100) | ชื่อไรเดอร์ |
| `last_name` | VARCHAR(100) | นามสกุลไรเดอร์ |
| `phone` | VARCHAR(20) | เบอร์โทรศัพท์ |
| `vehicle_type` | VARCHAR(30) | ประเภทยานพาหนะ เช่น motorcycle |
| `max_boxes` | INTEGER | จำนวนกล่องสูงสุดที่รับได้ ค่าเริ่มต้น 10 |
| `max_orders` | INTEGER | จำนวนออเดอร์สูงสุดที่รับได้ ค่าเริ่มต้น 3 |
| `status` | VARCHAR(30) | `available`, `busy` หรือ `inactive` |
| `created_at` | TIMESTAMP | วันที่สร้างข้อมูล |
| `updated_at` | TIMESTAMP | วันที่แก้ไขข้อมูลล่าสุด |

**หน้าที่:** เก็บข้อมูลไรเดอร์และข้อจำกัดการรับงาน โดยค่า `max_boxes` และ `max_orders` ใช้ตรวจสอบก่อนแบ่งงาน

#### `delivery_batches`

| คอลัมน์ | ชนิดข้อมูล | รายละเอียด |
|---|---|---|
| `id` | UUID หรือ BIGSERIAL | Primary key |
| `job_code` | VARCHAR(50) | รหัสใบงานหรือ Job ID ไม่ซ้ำกัน |
| `rider_id` | UUID หรือ BIGSERIAL | Foreign key ไปยัง `riders.id` |
| `dispatch_date` | DATE | วันที่ออกส่ง |
| `dispatch_time` | TIME | เวลาเริ่มออกส่ง ปกติคือ 11:30 น. |
| `status` | VARCHAR(30) | `planned`, `in_progress`, `completed` หรือ `cancelled` |
| `route_color` | VARCHAR(20) | สีเส้นทางที่แสดงบนแผนที่ |
| `total_boxes` | INTEGER | จำนวนกล่องรวมของใบงาน |
| `total_distance_km` | DECIMAL(10,3) | ระยะทางรวมของเส้นทาง |
| `estimated_minutes` | DECIMAL(10,2) | เวลาที่คาดว่าจะใช้ |
| `delivery_fee` | DECIMAL(10,2) | ค่าขนส่งรวมของใบงาน |
| `revenue` | DECIMAL(10,2) | รายรับจากจำนวนกล่อง |
| `food_cost` | DECIMAL(10,2) | ต้นทุนอาหาร |
| `net_profit` | DECIMAL(10,2) | กำไรสุทธิ |
| `created_at` | TIMESTAMP | วันที่สร้างใบงาน |
| `updated_at` | TIMESTAMP | วันที่แก้ไขใบงานล่าสุด |

**หน้าที่:** เก็บผลการแบ่งงานของไรเดอร์และผลคำนวณเส้นทาง/การเงินสำหรับแสดงใน dashboard และ Rider Portal

#### `delivery_batch_orders`

| คอลัมน์ | ชนิดข้อมูล | รายละเอียด |
|---|---|---|
| `id` | UUID หรือ BIGSERIAL | Primary key |
| `delivery_batch_id` | UUID หรือ BIGSERIAL | Foreign key ไปยัง `delivery_batches.id` |
| `order_id` | UUID หรือ BIGSERIAL | Foreign key ไปยัง `orders.id` |
| `stop_sequence` | INTEGER | ลำดับจุดส่ง เริ่มจาก 1 |
| `distance_from_previous_km` | DECIMAL(10,3) | ระยะทางจากจุดก่อนหน้า |
| `estimated_arrival_time` | TIME | เวลาถึงโดยประมาณ |
| `delivery_status` | VARCHAR(30) | `pending`, `picked_up`, `delivered` หรือ `failed` |
| `delivered_at` | TIMESTAMP | เวลาที่ส่งสำเร็จ |
| `created_at` | TIMESTAMP | วันที่เพิ่มออเดอร์เข้าใบงาน |
| `updated_at` | TIMESTAMP | วันที่แก้ไขสถานะล่าสุด |

**หน้าที่:** เป็นตารางเชื่อมระหว่างใบงานกับออเดอร์ เก็บลำดับจุดส่งและสถานะการจัดส่งแต่ละจุด

### 5.2 ความสัมพันธ์ระหว่างตาราง

- `customers` 1 ต่อหลาย `orders`: ลูกค้าหนึ่งคนมีหลายออเดอร์ได้
- `riders` 1 ต่อหลาย `delivery_batches`: ไรเดอร์หนึ่งคนมีหลายใบงานตามรอบส่งได้
- `delivery_batches` 1 ต่อหลาย `delivery_batch_orders`: ใบงานหนึ่งใบมีหลายจุดส่ง
- `orders` 1 ต่อหลาย `delivery_batch_orders`: ออเดอร์หนึ่งรายการควรอยู่ในใบงานที่ใช้งานจริงเพียงหนึ่งใบต่อรอบส่ง
- `delivery_batches` และ `orders` มีความสัมพันธ์หลายต่อหลายผ่าน `delivery_batch_orders`
- การลบข้อมูลควรกำหนด foreign key และพฤติกรรม `RESTRICT` หรือ `CASCADE` ให้ชัดเจน โดยไม่ให้การลบออเดอร์จำลองลบลูกค้า

### 5.3 Constraint และ Index ที่ควรมี

- `customers.phone` ควรมี index และอาจกำหนด `UNIQUE` หากเบอร์หนึ่งใช้ได้กับลูกค้าหนึ่งคนเท่านั้น
- `orders.order_code`, `riders.rider_code` และ `delivery_batches.job_code` ต้องไม่ซ้ำกัน
- `orders.box_quantity` ต้องมี constraint ให้อยู่ระหว่าง 1 ถึง 3
- `riders.max_boxes` และ `riders.max_orders` ต้องมากกว่า 0
- `delivery_batch_orders.stop_sequence` ต้องไม่ซ้ำกันภายในใบงานเดียวกัน
- เพิ่ม index ให้ `orders.customer_id`, `orders.status`, `orders.is_simulated` และคอลัมน์ foreign key ทุกตัว
- เพิ่ม index ให้ `customers.latitude` และ `customers.longitude` เพื่อช่วยการค้นหาตามพิกัด
- ฟิลด์จำนวนเงินและระยะทางควรใช้ `DECIMAL` ไม่ควรใช้ floating point เพื่อป้องกันความคลาดเคลื่อน

### 5.4 ขั้นตอนสร้าง ER Diagram ด้วย ERDPlus

1. เข้าเว็บไซต์ [ERDPlus](https://erdplus.com/)
2. สมัครสมาชิกหรือเข้าสู่ระบบตามที่เว็บไซต์กำหนด
3. เลือก **ER Diagram** แล้วสร้าง entity `Customer`, `Order`, `Rider`, `DeliveryBatch` และ `DeliveryBatchOrder`
4. เพิ่ม attributes ให้ตรงกับตารางที่กำหนดด้านบน
5. กำหนด Primary Key และ Foreign Key ให้ชัดเจน
6. เชื่อมความสัมพันธ์และกำหนด cardinality
7. ตรวจว่าลูกค้าหนึ่งคนมีหลายออเดอร์ได้ และออเดอร์หนึ่งรายการอ้างอิงลูกค้าได้เพียงคนเดียว
8. Export รูปภาพหรือ PDF เก็บไว้ในเอกสารส่งงาน
9. บันทึกชื่อไฟล์และลิงก์ ERDPlus ไว้ใน Pull Request หรือเอกสารรายงาน

### 5.5 ข้อมูลตัวอย่าง

ต้องมี seed data สำหรับลูกค้าอย่างน้อยพอทดสอบการค้นหาระยะทาง และมีคำสั่งจำลองออเดอร์ 20-30 รายการ โดยทุกออเดอร์ต้องมี:

- ลูกค้าที่สั่งซื้อ
- จำนวนกล่อง 1-3 กล่อง
- พิกัดของลูกค้าผ่านข้อมูลใน `customers`
- สถานะและวันที่จัดส่ง

ควรใช้พิกัดจำลองในพื้นที่มหาวิทยาลัยมหาสารคามและต้องไม่ใช้ข้อมูลส่วนบุคคลจริง

## 6. Web API สำหรับจัดการลูกค้า

Base URL: `http://localhost:3000/api`

### 6.1 Endpoints

| Method | Endpoint | หน้าที่ |
|---|---|---|
| `GET` | `/customers` | แสดงลูกค้าทั้งหมด |
| `GET` | `/customers/:id` | แสดงลูกค้าตาม ID |
| `POST` | `/customers` | เพิ่มลูกค้า |
| `PUT` | `/customers/:id` | แก้ไขข้อมูลลูกค้า |
| `DELETE` | `/customers/:id` | ลบลูกค้า |
| `GET` | `/customers/search?q=สม` | ค้นหาจากบางส่วนของชื่อหรือนามสกุล |
| `GET` | `/customers/nearby?latitude=16.245&longitude=103.25&radiusKm=1` | ค้นหาลูกค้าในระยะที่กำหนด |

### 6.2 ตัวอย่าง request เพิ่มลูกค้า

```http
POST /api/customers
Content-Type: application/json

{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "phone": "0800000000",
  "latitude": 16.2450000,
  "longitude": 103.2500000,
  "address": "หอพักใกล้มหาวิทยาลัย"
}
```

### 6.3 Validation ที่ต้องมี

- `firstName` และ `lastName` ต้องไม่เป็นค่าว่าง
- `phone` ต้องมีรูปแบบถูกต้องตามที่ทีมกำหนด
- `latitude` ต้องอยู่ระหว่าง -90 ถึง 90
- `longitude` ต้องอยู่ระหว่าง -180 ถึง 180
- `radiusKm` ต้องเป็นตัวเลขมากกว่า 0
- ถ้าไม่พบข้อมูลให้ตอบ `404` หรือคืนรายการว่างตามข้อตกลงของทีม

การค้นหาระยะทางให้ใช้สูตร Haversine หรือฟังก์ชันระยะทางของ PostgreSQL โดยต้องคำนวณจากพิกัดจริงที่เก็บไว้ในฐานข้อมูล ไม่ใช่ค้นจากข้อความที่อยู่

## 7. Web API สำหรับจัดการรายการสั่งซื้อ

### 7.1 Endpoints

| Method | Endpoint | หน้าที่ |
|---|---|---|
| `GET` | `/orders` | แสดงออเดอร์ทั้งหมด พร้อมข้อมูลลูกค้า |
| `GET` | `/orders/:id` | แสดงออเดอร์ตาม ID |
| `POST` | `/orders` | เพิ่มออเดอร์ |
| `PUT` | `/orders/:id` | แก้ไขจำนวนกล่องหรือข้อมูลที่อนุญาต |
| `DELETE` | `/orders/:id` | ลบออเดอร์หนึ่งรายการ |
| `DELETE` | `/orders/simulated` | ลบออเดอร์จำลองทั้งหมด |
| `POST` | `/orders/simulate` | สร้างออเดอร์จำลอง 20-30 รายการ |
| `GET` | `/orders/nearby?latitude=16.245&longitude=103.25&radiusKm=2` | แสดงออเดอร์ในระยะไม่เกิน 2 กม. |

### 7.2 ตัวอย่าง request เพิ่มออเดอร์

```http
POST /api/orders
Content-Type: application/json

{
  "customerId": 1,
  "boxQuantity": 2,
  "deliveryDate": "2026-10-01"
}
```

### 7.3 Validation และกฎสำคัญ

- ต้องตรวจว่า `customerId` มีอยู่จริง
- `boxQuantity` ต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 3 ตามข้อกำหนดออเดอร์
- การสร้างออเดอร์จำลองต้องสร้างข้อมูลครบถ้วนและเชื่อมกับลูกค้าที่มีอยู่จริง
- การล้างออเดอร์จำลองต้องไม่ลบข้อมูลลูกค้า
- Endpoint ล้างข้อมูลควรป้องกันด้วย environment หรือสิทธิ์เฉพาะใน development
- การค้นหาระยะ 2 กิโลเมตรต้องอิง latitude/longitude ของลูกค้าที่เชื่อมกับออเดอร์

## 8. รูปแบบ response ของ API

ให้ใช้รูปแบบ response เดียวกันทุก endpoint เพื่อให้ Angular เรียกใช้งานง่าย

สำเร็จ:

```json
{
  "data": {},
  "message": "ดำเนินการสำเร็จ"
}
```

รายการหลายรายการ:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

เกิดข้อผิดพลาด:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": []
  }
}
```

สถานะ HTTP ที่ควรใช้:

- `200 OK` อ่านหรือแก้ไขข้อมูลสำเร็จ
- `201 Created` เพิ่มข้อมูลสำเร็จ
- `204 No Content` ลบข้อมูลสำเร็จโดยไม่มี body
- `400 Bad Request` ข้อมูลที่ส่งมาไม่ถูกต้อง
- `404 Not Found` ไม่พบข้อมูล
- `409 Conflict` ข้อมูลซ้ำหรือขัดแย้งกับกฎระบบ
- `500 Internal Server Error` เกิดข้อผิดพลาดที่ server

## 9. การเรียกใช้ Web API จาก Angular

สร้าง service แยกตาม resource เช่น `customer.service.ts` และ `order.service.ts` แล้วเรียก `HttpClient` จาก service แทนการเรียก API ใน component โดยตรง

ตัวอย่าง service:

```typescript
getCustomers(): Observable<Customer[]> {
  return this.http.get<Customer[]>(`${this.apiUrl}/customers`);
}

searchCustomers(keyword: string): Observable<Customer[]> {
  return this.http.get<Customer[]>(`${this.apiUrl}/customers/search`, {
    params: { q: keyword },
  });
}
```

สิ่งที่ต้องทำใน Angular:

1. เปิดใช้งาน `provideHttpClient()` ใน `app.config.ts`
2. กำหนด API base URL ผ่าน environment หรือไฟล์ config
3. สร้าง TypeScript interface ให้ตรงกับ response ของ backend
4. แสดง loading, success, empty state และ error state
5. ห้ามให้ผู้ใช้กดบันทึกซ้ำระหว่าง request กำลังทำงาน
6. ใช้ Leaflet แสดงหมุดลูกค้าและเส้นทาง โดยกำหนดสีเส้นทางของไรเดอร์แต่ละคนให้แตกต่างกัน
7. ปุ่มนำทางต้องสร้างลิงก์ Google Maps จาก latitude/longitude ของจุดส่ง

ตัวอย่างลิงก์นำทาง:

```text
https://www.google.com/maps/dir/?api=1&destination=<LATITUDE>,<LONGITUDE>
```

## 10. การจัดเส้นทางและคำนวณผลลัพธ์

เมื่อเจ้าของร้านกดคำนวณเส้นทาง ระบบควรทำงานตามลำดับนี้:

1. โหลดออเดอร์ที่ยังไม่ได้จัดส่ง
2. ตรวจจำนวนกล่องรวมและจำนวนจุดส่ง
3. แบ่งงานให้ไรเดอร์ โดยไม่เกิน 10 กล่องและ 3 จุดส่งต่อคน
4. คำนวณลำดับจุดส่งที่มีระยะทางหรือเวลาเดินทางน้อยที่สุด
5. ประมาณเวลาโดยใช้ความเร็ว 30 กิโลเมตรต่อชั่วโมง
6. ตรวจว่าเวลารวมไม่เกิน 60 นาที
7. คำนวณค่าขนส่งและกำไรสุทธิ
8. แสดงผลบนแผนที่และ dashboard
9. ปุ่มคำนวณใหม่ต้องสามารถสร้างทางเลือกอื่นเพื่อเปรียบเทียบได้

หมายเหตุ: ระยะทางที่ใช้คำนวณต้นทุนควรเป็นระยะทางตามเส้นทางจริงจาก routing service เมื่อมีการเชื่อมต่อ API แผนที่ ส่วนการทดสอบเบื้องต้นสามารถใช้ระยะทางเส้นตรงเป็น fallback ได้

## 11. การทดสอบและเกณฑ์ส่งงาน

### Backend

- ทดสอบ CRUD ลูกค้าครบทุก endpoint
- ทดสอบค้นหาบางส่วนของชื่อและนามสกุล
- ทดสอบค้นหาระยะ 1 กิโลเมตร
- ทดสอบสร้างออเดอร์จำลอง 20-30 รายการ
- ทดสอบแก้ไขจำนวนกล่องและ validation 1-3 กล่อง
- ทดสอบล้างออเดอร์จำลองโดยไม่ลบลูกค้า
- ทดสอบค้นหาออเดอร์ในระยะ 2 กิโลเมตร
- ทดสอบกรณีข้อมูลไม่ครบ, ID ไม่พบ และฐานข้อมูลขัดข้อง

### Frontend

- ทดสอบแสดงและแก้ไขลูกค้า
- ทดสอบแสดงและแก้ไขออเดอร์
- ทดสอบแผนที่ หมุด และสีเส้นทาง
- ทดสอบ responsive ทั้ง desktop และ mobile
- ทดสอบ Rider Portal ด้วย Job ID ที่มีข้อมูลและไม่มีข้อมูล
- ทดสอบลิงก์ Google Maps บนอุปกรณ์มือถือ

### เกณฑ์ยอมรับงานขั้นต่ำ

- สมาชิกใหม่สามารถ clone และเปิด frontend ได้จากเอกสารนี้
- API สามารถเพิ่ม ลบ แก้ไข และแสดงลูกค้าได้
- ค้นหาลูกค้าตามชื่อบางส่วนและระยะ 1 กิโลเมตรได้
- สร้างออเดอร์จำลอง 20-30 รายการได้
- แก้ไขและล้างออเดอร์จำลองได้
- ค้นหาออเดอร์ในระยะ 2 กิโลเมตรได้
- มี ER Diagram จาก ERDPlus และสัมพันธ์ตรงกับ schema จริง
- ระบบแสดงข้อมูลต้นทุน ค่าส่ง รายรับ และกำไร/ขาดทุนตามกฎธุรกิจ
- มีคู่มือเรียก API และตัวอย่าง request/response

## 12. Checklist ก่อนส่งงาน

- [ ] ทุกคน clone repository และติดตั้งโปรเจกต์ได้
- [ ] มี `.env.example` แต่ไม่มี secret จริงใน Git
- [ ] ER Diagram export จาก ERDPlus แล้ว
- [ ] migration และ seed data ทำงานได้
- [ ] Customer API ครบตาม requirement
- [ ] Order API ครบตาม requirement
- [ ] มีข้อมูลจำลอง 20-30 ออเดอร์
- [ ] Angular เรียก API จริงได้
- [ ] แผนที่แสดงข้อมูลตำแหน่งได้
- [ ] ทดสอบ responsive แล้ว
- [ ] รัน build และ test ผ่าน
- [ ] Pull Request ได้รับการ review แล้ว
- [ ] อัปเดตชื่อผู้รับผิดชอบในตารางแบ่งงานแล้ว
