---
tags:
  - member-1
  - customer-management
  - leaflet
  - openstreetmap
  - api-calling
  - crud
title: คู่มือปฏิบัติงานฉบับละเอียด - สมาชิกคนที่ 1 (ระบบจัดการข้อมูลลูกค้า)
---

# 👤 คู่มือปฏิบัติงานฉบับละเอียด: สมาชิกคนที่ 1
> [!INFO] **ส่วนงานที่รับผิดชอบ:** ระบบจัดการข้อมูลลูกค้า (Customer Management Portal)  
> **เอกสารอ้างอิงหลัก:** [[PROJECT_PLAN|แผนแม่บท PaTim]] | **คู่มือแผนที่:** [[05-LEAFLET-GUIDE|คู่มือ Leaflet Map]]

---

## 🏢 1. ภาพรวมหน้าที่และสิ่งที่โปรเจกต์ต้องเป็น (Project Overview & UI Concept)

### 1.1 หน้าที่ของสมาชิกคนที่ 1 ในทีม
คุณมีหน้าที่รับผิดชอบพัฒนาระบบจัดการข้อมูลลูกค้าสำหรับ **เจ้าของร้าน** เพื่อให้เจ้าของร้านสามารถบันทึกพิกัดบ้านลูกค้า ค้นหาลูกค้าเก่าด้วยเบอร์โทรหรือชื่อ และดูตำแหน่งลูกค้าบนแผนที่ได้อย่างแม่นยำ ซึ่งข้อมูลลูกค้าที่คุณจัดการจะเป็น **ข้อมูลตั้งต้นสำคัญ (Master Data)** ที่สมาชิกคนที่ 2 (ออเดอร์) และคนที่ 3 (จัดเส้นทาง) ต้องนำไปใช้งานต่อ

### 1.2 หน้าตาหน้าจอที่ต้องพัฒนา (UI Layout & Components)
หน้าจอจะถูกแบ่งออกเป็น 4 โซนหลักอย่างชัดเจน:
1. **โซนค้นหาและตัวกรองด้านบน (Search & Filter Bar):**
   - ช่องกรอกค้นหาชื่อ หรือนามสกุล (กด Enter หรือคลิกปุ่มค้นหา)
   - ช่องระบุรัศมีค้นหา (ค่าเริ่มต้น 1.0 กม.) พร้อมปุ่มกด "กรองในรัศมี 1 กม." และปุ่มรีเซ็ต
2. **โซนแผนที่ Leaflet (ฝั่งซ้าย - 2 ใน 3 ของจอ):**
   - แสดงแผนที่ OpenStreetMap ปักหมุดร้านค้าตรงกลาง (ม.มหาสารคาม)
   - ปักหมุดบ้านของลูกค้าทุกคน (คลิกหมุดแล้วมี Popup บอกชื่อ, เบอร์โทร, ที่อยู่)
   - **ฟังก์ชันคลิกบนแผนที่ (Coordinate Picker):** คลิกที่ตำแหน่งใดก็ได้บนแผนที่ พิกัด Lat และ Lng จะถูกดึงไปกรอกในฟอร์มทันที
   - เมื่อกดค้นหาระยะใกล้ จะวาดวงกลมสีฟ้า `L.circle` รัศมี 1 กม. บนแผนที่
3. **โซนฟอร์มเพิ่ม/แก้ไขลูกค้า (ฝั่งขวา - 1 ใน 3 ของจอ):**
   - ฟอร์มรับข้อมูล: ชื่อ, นามสกุล, เบอร์โทรศัพท์, ละติจูด, ลองจิจูด, รายละเอียดที่อยู่/จุดสังเกต
   - ปุ่ม "บันทึกข้อมูล" (สลับโหมดระหว่างเพิ่มใหม่ และแก้ไขข้อมูลเดิม)
4. **โซนตารางรายชื่อลูกค้า (ด้านล่าง):**
   - ตารางแสดงรายชื่อลูกค้าทั้งหมด, เบอร์โทร, พิกัด, ที่อยู่
   - ปุ่มกด "✏️ แก้ไข" (ดึงข้อมูลกลับขึ้นไปในฟอร์ม) และปุ่ม "🗑️ ลบ" (พร้อมหน้าต่างยืนยัน)

---

## 🛠️ 2. ขั้นตอนการทำงานตั้งแต่เริ่มต้นจนเสร็จสมบูรณ์ (Step-by-Step Execution)

### ขั้นตอนที่ 2.1: เตรียม Branch ใน Git
```bash
# สลับไปที่ develop และดึงโค้ดล่าสุด
git switch develop
git pull origin develop

# สร้าง branch ทำงานของตนเอง
git switch -c feature/customer-management
```

---

### ขั้นตอนที่ 2.2: สร้าง Data Model (`src/app/models/customer.model.ts`)
```typescript
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  phone: string;
  latitude: number;
  longitude: number;
  address: string;
}
```

---

### ขั้นตอนที่ 2.3: สร้าง Service ด้วย Angular CLI (`CustomerService`)
รันคำสั่ง:
```bash
ng g s services/customer --skip-tests
```

แก้ไขโค้ดในไฟล์ `src/app/services/customer.service.ts`:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Customer, CreateCustomerDto } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/customers`;

  // 1. ดึงลูกค้าทั้งหมด
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  // 2. ดึงลูกค้ารายคน
  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  // 3. เพิ่มลูกค้าใหม่
  createCustomer(dto: CreateCustomerDto): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, dto);
  }

  // 4. แก้ไขข้อมูลลูกค้า
  updateCustomer(id: string, dto: Partial<CreateCustomerDto>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, dto);
  }

  // 5. ลบข้อมูลลูกค้า
  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 6. ค้นหาตามชื่อหรือนามสกุล
  searchCustomers(keyword: string): Observable<Customer[]> {
    const params = new HttpParams().set('q', keyword);
    return this.http.get<Customer[]>(`${this.apiUrl}/search`, { params });
  }

  // 7. ค้นหาในรัศมี 1 กม. จากจุดพิกัดที่กำหนด
  getNearbyCustomers(latitude: number, longitude: number, radiusKm: number = 1.0): Observable<Customer[]> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radiusKm', radiusKm.toString());
    return this.http.get<Customer[]>(`${this.apiUrl}/nearby`, { params });
  }
}
```

---

### ขั้นตอนที่ 2.4: สร้าง Page Component (`customer-management`)
รันคำสั่ง:
```bash
ng g c pages/customer-management --skip-tests
```

#### การเขียน Logic ใน `customer-management.ts`:
1. ประกาศตัวแปร Signal:
   - `customers = signal<Customer[]>([]);`
   - `isLoading = signal<boolean>(false);`
   - `formData: CreateCustomerDto = { firstName: '', lastName: '', phone: '', latitude: 16.245, longitude: 103.25, address: '' };`
   - `isEditing = false; selectedCustomerId = null;`
2. สร้างแผนที่ใน `ngAfterViewInit()`:
   - สั่ง `L.map('customer-map').setView([16.245000, 103.250000], 14)`
   - โหลด Tile OpenStreetMap
   - สร้างหมุดร้านค้าด้วย `L.divIcon` สีแดง
   - สั่ง `map.on('click', (e) => { this.formData.latitude = e.latlng.lat; this.formData.longitude = e.latlng.lng; })`
3. วาดหมุดลูกค้า:
   - นำรายชื่อลูกค้าจาก `customers()` มาวนลูปสร้าง `L.marker([c.latitude, c.longitude]).bindPopup(...)` ใส่ลงใน `markersLayer`
4. ฟังก์ชันค้นหาและกรองระยะ:
   - `onSearch()`: ยิง `searchCustomers(searchTerm)`
   - `onFilterNearby()`: ยิง `getNearbyCustomers(16.245, 103.25, 1.0)` พร้อมวาด `L.circle` บนแผนที่
5. ฟังก์ชันฟอร์ม:
   - `onSubmitForm()`: ตรวจสอบ Validation แล้วยิง `createCustomer()` หรือ `updateCustomer()`
   - `deleteCustomer()`: แจ้งเตือนยืนยันก่อนยิง `deleteCustomer()`
6. คืนหน่วยความจำ:
   - ใส่ `this.map?.remove()` ใน `ngOnDestroy()` เสมอ

---

## ⚠️ 3. สิ่งสำคัญและข้อกำหนดทางธุรกิจที่ห้ามพลาด (Must-Know & Constraints)

> [!WARNING] **เงื่อนไขสำคัญที่ต้องตรวจสอบ**
> 1. **ความถูกต้องของพิกัด:** พิกัดละติจูดต้องอยู่ระหว่าง `-90 ถึง 90` และลองจิจูดระหว่าง `-180 ถึง 180` (พิกัด ม.มหาสารคาม จะอยู่ที่ประมาณ `Lat 16.245, Lng 103.250`)
> 2. **การค้นหาระยะทาง 1 กม.:** ต้องคำนวณจาก **พิกัดจริงด้วยสูตร Haversine** ใน Database เท่านั้น ห้ามค้นหาจากข้อความตัวหนังสือในฟิลด์ที่อยู่
> 3. **ห้ามลบลูกค้าที่ยังมีออเดอร์ค้างส่ง:** ต้องตรวจสอบหรือตั้ง Foreign Key Constraint ไม่ให้ระบบพังเมื่อลบลูกค้า

---

## 🌐 4. ข้อกำหนดการเรียกใช้งาน API (`CustomerService -> Backend`)

> [!NOTE] **รูปแบบการเชื่อมต่อ:** Frontend ติดต่อสื่อสารกับ Backend ผ่าน RESTful API (`HttpClient`) ไม่ต้องสร้างหรือแก้ไข Database โดยตรง

### สรุป Endpoint สำหรับระบบลูกค้า:
| Method | Endpoint | หน้าที่การทำงาน | Request Body | Response Body ตัวอย่าง |
|:---|:---|:---|:---|:---|
| `GET` | `/api/customers` | ดึงรายชื่อลูกค้าทั้งหมด (รองรับ `?search=...` และ `?radius=1.0`) | - | `[{ id, firstName, lastName, phone, latitude, longitude, address }, ...]` |
| `GET` | `/api/customers/:id` | ดึงข้อมูลลูกค้าตาม ID | - | `{ id, firstName, lastName, phone, latitude, longitude, address }` |
| `POST` | `/api/customers` | เพิ่มข้อมูลลูกค้าใหม่ | `{ firstName, lastName, phone, latitude, longitude, address }` | `{ id: "...", firstName: "...", ... }` (Status: 201 Created) |
| `PUT` | `/api/customers/:id` | แก้ไขข้อมูลลูกค้า | `{ firstName, lastName, phone, latitude, longitude, address }` | `{ id: "...", firstName: "...", ... }` (Status: 200 OK) |
| `DELETE` | `/api/customers/:id` | ลบข้อมูลลูกค้า | - | `{ success: true, message: "Deleted successfully" }` |


---

## 🧪 5. รายการทดสอบและเกณฑ์การตรวจรับงาน (Testing & Checklist)

| ลำดับ | สิ่งที่ต้องทดสอบ | ผลลัพธ์ที่คาดหวัง |
|:---|:---|:---|
| 1 | การเปิดหน้าเว็บ | แผนที่ Leaflet โหลดขึ้นมาตรงจุด ม.มหาสารคาม หมุดร้านค้าแสดงชัดเจน |
| 2 | การคลิกเลือกพิกัด | คลิกบนแผนที่แล้ว ช่องละติจูดและลองจิจูดในฟอร์มเปลี่ยนค่าตามจุดที่คลิกทันที |
| 3 | เพิ่มลูกค้าใหม่ | กรอกข้อมูลครบถ้วน กดบันทึกแล้ว มีหมุดใหม่ปรากฏบนแผนที่ และมีแถวใหม่ในตาราง |
| 4 | แก้ไขข้อมูล | กดปุ่มแก้ไข ข้อมูลเดิมถูกดึงเข้าฟอร์ม แก้ไขแล้วกดบันทึก ข้อมูลอัปเดตถูกต้อง |
| 5 | ลบข้อมูล | กดปุ่มลบ มีหน้าต่างยืนยัน และข้อมูลถูกลบออกจากตารางและแผนที่ |
| 6 | ค้นหาชื่อ/นามสกุล | พิมพ์ชื่อ เช่น "สมชาย" แล้วแสดงเฉพาะลูกค้าที่ชื่อมีคำว่า "สมชาย" |
| 7 | กรองรัศมี 1 กม. | กดปุ่มกรอง มีวงกลมสีฟ้าแสดงขอบเขตรัศมี 1 กม. และแสดงเฉพาะลูกค้าที่อยู่ในวงกลม |
| 8 | Git & Build | รัน `npm run build` ผ่าน 100% ไม่มี Lint Error ก่อนเปิด PR เข้า `develop` |
