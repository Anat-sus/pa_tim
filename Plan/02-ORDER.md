---
tags:
  - member-2
  - order-management
  - simulation
  - api-calling
  - crud
title: คู่มือปฏิบัติงานฉบับละเอียด - สมาชิกคนที่ 2 (ระบบจัดการออเดอร์และการจำลองข้อมูล)
---

# 📦 คู่มือปฏิบัติงานฉบับละเอียด: สมาชิกคนที่ 2
> [!INFO] **ส่วนงานที่รับผิดชอบ:** ระบบจัดการรายการออเดอร์ & ระบบจำลองข้อมูลสั่งซื้อ (Order Management & Simulation)  
> **เอกสารอ้างอิงหลัก:** [[PROJECT_PLAN|แผนแม่บท PaTim]] | **หน้าที่เกี่ยวข้อง:** [[01-CUSTOMER|ระบบลูกค้า]]

---

## 🏢 1. ภาพรวมหน้าที่และสิ่งที่โปรเจกต์ต้องเป็น (Project Overview & UI Concept)

### 1.1 หน้าที่ของสมาชิกคนที่ 2 ในทีม
คุณมีหน้าที่รับผิดชอบพัฒนาระบบจัดการรายการสั่งซื้อข้าวกล่องสำหรับ **เจ้าของร้าน** ซึ่งในชีวิตจริงช่วง 10:00 น. จะมีออเดอร์เข้ามาพร้อมกัน 20–30 รายการ โดยหน้าที่สำคัญที่สุดของคุณคือ:
1. การควบคุมกฎข้อบังคับทางธุรกิจ: **ลูกค้าแต่ละคนสั่งอาหารได้ไม่เกิน 3 กล่อง (1–3 กล่องต่อออเดอร์)**
2. **ระบบจำลองออเดอร์ (Mock Simulation 20–30 รายการ):** สร้างปุ่มคลิกเดียวที่สุ่มสร้างออเดอร์ขึ้นมาในระบบ เพื่อให้สมาชิกคนที่ 3 สามารถกดคำนวณเส้นทางได้ทันทีโดยไม่ต้องมานั่งพิมพ์ทีละรายการ
3. **ระบบล้างออเดอร์จำลอง:** ปุ่มลบเฉพาะออเดอร์จำลองออกเพื่อเริ่มรอบการทดสอบใหม่ โดย **ต้องไม่ลบข้อมูลลูกค้า**
4. **ตัวกรองออเดอร์รัศมี 2 กิโลเมตร:** กรองออเดอร์ที่อยู่ในรัศมีใกล้เคียงร้าน

### 1.2 หน้าตาหน้าจอที่ต้องพัฒนา (UI Layout & Components)
1. **แถบ Action Bar ด้านบนสุด:**
   - 🟣 ปุ่มเด่น **"⚡ จำลอง 25 ออเดอร์ (10:00 น.)"** สำหรับสร้างข้อมูลทดสอบ
   - 🔴 ปุ่ม **"🗑️ ล้างออเดอร์จำลอง"** สำหรับลบเฉพาะออเดอร์ Mock
2. **แถบ KPI Summary Cards 4 ใบ:**
   - 📦 **ออเดอร์ทั้งหมด:** จำนวนออเดอร์ในระบบ
   - 🍱 **จำนวนกล่องรวม:** ผลรวมจำนวนข้าวกล่องทั้งหมดที่ต้องปรุง
   - ⏳ **รอจัดส่ง (Pending):** ออเดอร์ที่ยังไม่ได้จัดเส้นทาง
   - 🏷️ **ออเดอร์จำลอง (Mock):** จำนวนออเดอร์ที่เกิดจากการสุ่มจำลอง
3. **โซนฟอร์มสั่งซื้อ และแผงกรองระยะ 2 กม. (Grid ซ้าย-ขวา):**
   - **ฝั่งซ้าย (ฟอร์มสั่งซื้อ):** เลือกชื่อลูกค้าจาก Dropdown + ปุ่มเลือกจำนวนกล่อง `[ 1 กล่อง ]` `[ 2 กล่อง ]` `[ 3 กล่อง ]`
   - **ฝั่งขวา (ตัวกรองรัศมี 2 กม.):** ช่องกรอกระยะทางรัศมี (ค่าเริ่มต้น 2.0 กม.) และปุ่ม "📍 กรองออเดอร์"
4. **โซนตารางรายการออเดอร์ (ด้านล่าง):**
   - แสดงรหัสออเดอร์ (เช่น `ORD-001`), ชื่อลูกค้า, เบอร์โทร, จำนวนกล่อง (Badge สีฟ้า), สถานะ (`pending`, `assigned`, `delivered`), ป้ายกำกับ `[Mock]` หรือ `[Real]`
   - ปุ่มแก้ไขจำนวนกล่องแบบ Inline และปุ่มลบออเดอร์

---

## 🛠️ 2. ขั้นตอนการทำงานตั้งแต่เริ่มต้นจนเสร็จสมบูรณ์ (Step-by-Step Execution)

### ขั้นตอนที่ 2.1: เตรียม Branch ใน Git
```bash
git switch develop
git pull origin develop
git switch -c feature/order-management
```

---

### ขั้นตอนที่ 2.2: สร้าง Data Model (`src/app/models/order.model.ts`)
```typescript
import { Customer } from './customer.model';

export type OrderStatus = 'pending' | 'assigned' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  customer?: Customer;
  boxQuantity: number; // 1 - 3 กล่อง
  status: OrderStatus;
  deliveryDate: string;
  isSimulated: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderDto {
  customerId: string;
  boxQuantity: number;
  deliveryDate?: string;
}
```

---

### ขั้นตอนที่ 2.3: สร้าง Service ด้วย Angular CLI (`OrderService`)
รันคำสั่ง:
```bash
ng g s services/order --skip-tests
```

แก้ไขโค้ดในไฟล์ `src/app/services/order.service.ts`:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, CreateOrderDto } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  // 1. ดึงออเดอร์ทั้งหมดพร้อมข้อมูลลูกค้า
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  // 2. ดึงออเดอร์รายตัว
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  // 3. เพิ่มออเดอร์ใหม่ (1-3 กล่อง)
  createOrder(dto: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, dto);
  }

  // 4. แก้ไขจำนวนกล่องหรือสถานะ
  updateOrder(id: string, dto: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, dto);
  }

  // 5. ลบออเดอร์ 1 รายการ
  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 6. จำลองออเดอร์ 20-30 รายการ
  simulateOrders(count: number = 25): Observable<{ count: number; orders: Order[] }> {
    return this.http.post<{ count: number; orders: Order[] }>(`${this.apiUrl}/simulate`, { count });
  }

  // 7. ล้างออเดอร์จำลองทั้งหมด
  clearSimulatedOrders(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`${this.apiUrl}/simulated`);
  }

  // 8. ค้นหาออเดอร์ในรัศมี 2 กม.
  getNearbyOrders(latitude: number, longitude: number, radiusKm: number = 2.0): Observable<Order[]> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radiusKm', radiusKm.toString());
    return this.http.get<Order[]>(`${this.apiUrl}/nearby`, { params });
  }
}
```

---

### ขั้นตอนที่ 2.4: สร้าง Page Component (`order-management`)
รันคำสั่ง:
```bash
ng g c pages/order-management --skip-tests
```

#### การเขียน Logic ใน `order-management.ts`:
1. **การจัดการ State ด้วย Signals:**
   - `orders = signal<Order[]>([]);`
   - `customers = signal<Customer[]>([]);` (เรียกจาก `CustomerService` มาใส่ใน Select Dropdown)
   - `isLoading = signal<boolean>(false);`
2. **การคำนวณตัวเลขสรุปอัตโนมัติด้วย `computed()`:**
   - `totalOrders = computed(() => this.orders().length);`
   - `totalBoxes = computed(() => this.orders().reduce((sum, o) => sum + Number(o.boxQuantity), 0));`
   - `pendingOrders = computed(() => this.orders().filter(o => o.status === 'pending').length);`
   - `simulatedOrdersCount = computed(() => this.orders().filter(o => o.isSimulated).length);`
3. **การตรวจสอบเงื่อนไข Validation (1–3 กล่อง):**
   - ตรวจสอบว่าต้องเลือกผู้สั่ง และจำนวนกล่องต้องมีค่า 1, 2 หรือ 3 เท่านั้น
4. **ฟังก์ชันจำลองข้อมูล 20–30 ออเดอร์ (`onSimulateOrders`):**
   - สั่งเรียก `orderService.simulateOrders(25)` และรีโหลดรายการออเดอร์ใหม่ทันที
5. **ฟังก์ชันล้างออเดอร์จำลอง (`onClearSimulated`):**
   - สั่งเรียก `orderService.clearSimulatedOrders()` พร้อมแจ้งจำนวนแถวที่ลบสำเร็จ
6. **ฟังก์ชันกรองออเดอร์รัศมี 2 กม. (`onFilterNearby`):**
   - ดึงพิกัดร้านค้าจาก `environment.shopLocation` แล้วส่งไปค้นหาออเดอร์ที่อยู่ในรัศมี

---

## ⚠️ 3. สิ่งสำคัญและข้อกำหนดทางธุรกิจที่ห้ามพลาด (Must-Know & Constraints)

> [!WARNING] **เงื่อนไขสำคัญที่ต้องตรวจสอบ**
> 1. **จำกัด 1–3 กล่องต่อออเดอร์:** ห้ามผู้ใช้กรอกจำนวนกล่องเป็น 0 หรือมากกว่า 3 กล่องอย่างเด็ดขาด
> 2. **ความปลอดภัยในการล้างข้อมูลจำลอง:** การกดปุ่มล้างข้อมูลจำลอง ต้องลบเฉพาะแถวที่ `is_simulated = true` ในตาราง `orders` **ห้ามลบข้อมูลในตาราง `customers` โดยเด็ดขาด**
> 3. **Foreign Key Integrity:** ทุกออเดอร์ต้องผูกกับ `customerId` ที่มีอยู่จริงในฐานข้อมูล

---

## 🌐 4. ข้อกำหนดการเรียกใช้งาน API (`OrderService -> Backend`)

> [!NOTE] **รูปแบบการเชื่อมต่อ:** ติดต่อสื่อสารกับ Backend ผ่าน RESTful API (`HttpClient`) ไม่ต้องจัดการ Database โดยตรง

### สรุป Endpoint สำหรับระบบออเดอร์:
| Method | Endpoint | หน้าที่การทำงาน | Request Body | Response Body ตัวอย่าง |
|:---|:---|:---|:---|:---|
| `GET` | `/api/orders` | ดึงรายการออเดอร์ทั้งหมด (รองรับ `?radius=2.0` และ `?date=YYYY-MM-DD`) | - | `[{ id, orderCode, customerId, boxQuantity, status, deliveryDate, isSimulated, customer }, ...]` |
| `POST` | `/api/orders` | สร้างออเดอร์ใหม่ (1–3 กล่อง) | `{ customerId, boxQuantity, deliveryDate }` | `{ id: "...", orderCode: "ORD-...", ... }` (Status: 201 Created) |
| `POST` | `/api/orders/simulate` | จำลองสุ่มออเดอร์ 20 - 30 รายการ | `{ count: 25, deliveryDate: "..." }` | `{ count: 25, orders: [...] }` (Status: 201 Created) |
| `DELETE` | `/api/orders/simulated` | ล้างเฉพาะออเดอร์จำลอง (ไม่ลบข้อมูลลูกค้า) | - | `{ success: true, deletedCount: 25 }` (Status: 200 OK) |
| `DELETE` | `/api/orders/:id` | ลบออเดอร์รายตัว | - | `{ success: true }` |


---

## 🧪 5. รายการทดสอบและเกณฑ์การตรวจรับงาน (Testing & Checklist)

| ลำดับ | สิ่งที่ต้องทดสอบ | ผลลัพธ์ที่คาดหวัง |
|:---|:---|:---|
| 1 | เพิ่มออเดอร์ปกติ | เลือกลูกค้า เลือก 1–3 กล่อง กดบันทึกแล้ว ออเดอร์ปรากฏในตารางถูกต้อง |
| 2 | Validation กล่อง | ไม่สามารถเลือกหรือพิมพ์จำนวนกล่องที่น้อยกว่า 1 หรือมากกว่า 3 ได้ |
| 3 | จำลอง 25 ออเดอร์ | กดปุ่มจำลองแล้ว มีออเดอร์ใหม่เพิ่มในระบบ 25 รายการ โดยเป็นสถานะ `pending` และมีป้าย `[Mock]` |
| 4 | ยอดสรุป KPI | การ์ด "จำนวนกล่องรวม" และ "ออเดอร์ทั้งหมด" คำนวณผลรวมได้ถูกต้องตรงตามตาราง |
| 5 | ล้างออเดอร์จำลอง | กดปุ่มล้างข้อมูลจำลอง ออเดอร์ที่เป็น Mock หายไปทั้งหมด แต่ออเดอร์จริงและข้อมูลลูกค้ายังคงอยู่ครบ |
| 6 | กรองรัศมี 2 กม. | แสดงเฉพาะออเดอร์ที่พิกัดบ้านลูกค้าอยู่ในรัศมี 2 กิโลเมตรจากร้าน |
| 7 | Git & Build | รัน `npm run build` ผ่าน 100% ไม่มีข้อผิดพลาด ก่อนเปิด PR เข้า `develop` |
