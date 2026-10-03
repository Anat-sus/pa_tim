---
tags:
  - member-3
  - route-optimization
  - vrp-algorithm
  - financial-dashboard
  - leaflet
  - openstreetmap
title: คู่มือปฏิบัติงานฉบับละเอียด - สมาชิกคนที่ 3 (การจัดเส้นทางและแดชบอร์ดสรุปยอด)
---

# 🗺️ คู่มือปฏิบัติงานฉบับละเอียด: สมาชิกคนที่ 3
> [!INFO] **ส่วนงานที่รับผิดชอบ:** ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (VRP) & แดชบอร์ดการเงิน Real-time  
> **เอกสารอ้างอิงหลัก:** [[PROJECT_PLAN|แผนแม่บท PaTim]] | **คู่มือแผนที่:** [[05-LEAFLET-GUIDE|คู่มือ Leaflet Map]]

---

## 🏢 1. ภาพรวมหน้าที่และสิ่งที่โปรเจกต์ต้องเป็น (Project Overview & UI Concept)

### 1.1 หน้าที่ของสมาชิกคนที่ 3 ในทีม
คุณมีหน้าที่รับผิดชอบ **หัวใจสำคัญที่สุดของโปรเจกต์** คือการสร้างระบบคิดแทนเจ้าของร้าน โดยนำรายการออเดอร์ทั้งหมดที่สมาชิกคนที่ 2 เตรียมไว้ มาทำการ **จัดกลุ่มแบ่งงานให้ไรเดอร์แต่ละคน (Dispatching) และคำนวณเส้นทางวิ่งที่สั้นที่สุด (Route Optimization)** ภายใต้เงื่อนไขเหล็ก:
1. มอเตอร์ไซค์ 1 คัน ขนข้าวกล่องได้ **ไม่เกิน 10 กล่อง**
2. ไรเดอร์ 1 คน รับงานได้ **ไม่เกิน 3 ออเดอร์ (3 จุดส่ง)** ต่อรอบ
3. เวลาออกเดินทางคือ **11:30 น.** และต้องส่งถึงจุดสุดท้าย **ไม่เกิน 12:30 น. (ภายในเวลา 60 นาที)** โดยคำนวณจากความเร็วเฉลี่ย 30 กม./ชม.
4. **แสดงเส้นทางวิ่งแยกตามสีบนแผนที่ Leaflet ขนาดใหญ่** เพื่อให้เจ้าของร้านตรวจเช็กภาพรวมได้ง่าย
5. **คำนวณและสรุปตัวเลขทางการเงินแบบ Real-time:** รายรับ, ต้นทุนอาหาร, ค่าขนส่งไรเดอร์, และ **กำไร/ขาดทุนสุทธิ**

### 1.2 หน้าตาหน้าจอที่ต้องพัฒนา (UI Layout & Components)
1. **แถบ Action Header ด้านบน:**
   - ⚡ ปุ่ม **"คำนวณจัดเส้นทางอัตโนมัติ"** (กดครั้งเดียวเวลา 11:30 น. ระบบแบ่งงานทันที)
   - 🔄 ปุ่ม **"คำนวณใหม่ (ทางเลือกอื่น)"** (สร้างทางเลือกเส้นทางแบบอื่นให้เจ้าของร้านเปรียบเทียบ)
2. **แผง Real-time Financial Dashboard (KPI Cards 4 ใบ):**
   - 💰 **รายรับรวม:** $\text{จำนวนกล่องรวม} \times 65$ บาท
   - 🥩 **ต้นทุนอาหารรวม:** $\text{จำนวนกล่องรวม} \times 40$ บาท (กำไรขั้นต้น $= \text{กล่อง} \times 25$)
   - 🛵 **ค่าขนส่งไรเดอร์รวม:** ผลรวมของ $15 + (\text{ระยะทางรวม} \times 2 \times \text{กล่องรวม})$
   - 🟢 **กล่องใหญ่เน้นพิเศษ "กำไรสุทธิของร้าน":** $\text{กำไรขั้นต้น} - \text{ค่าขนส่งรวม}$ พร้อมบอกจำนวนไรเดอร์ที่ต้องใช้ในรอบนั้น
3. **โซนแผนที่ขนาดใหญ่ (Leaflet Multi-Rider Map):**
   - แผนที่ขนาดใหญ่แสดงเส้นทาง Polyline ของไรเดอร์แต่ละคนด้วย **สีที่แตกต่างกัน** (แดง, เขียว, น้ำเงิน, ส้ม, ม่วง)
   - หมุดร้านค้าสีแดง 🏠 ตรงกลาง (ม.มหาสารคาม)
   - หมุดจุดส่งของลูกค้ามีตัวเลขบอกลำดับการวิ่งส่ง **1, 2, 3** และมีสีตรงกับเส้นทางของไรเดอร์คนนั้น
   - กล่อง Legend ด้านบนอธิบายว่า สีไหนคือไรเดอร์คนที่เท่าไหร่ ขนกี่กล่อง และใช้เวลากี่นาที
4. **โซนตารางสรุปการแบ่งงานไรเดอร์ (Rider Job Batches):**
   - การ์ดสรุปงานของไรเดอร์แต่ละคน (เช่น ไรเดอร์คนที่ 1: Job ID `JOB-MSU-01`, ขน 6 กล่อง, ระยะทาง 2.4 กม., เวลา 18 นาที, ค่าส่ง ฿43.80, กำไร ฿106.20)
   - แสดงลำดับการวิ่งส่งแบบ Step-by-Step: `🏠 ร้านค้า -> 📍 จุด 1 (คุณ A) -> 📍 จุด 2 (คุณ B) -> กลับร้าน`

---

## 🛠️ 2. ขั้นตอนการทำงานตั้งแต่เริ่มต้นจนเสร็จสมบูรณ์ (Step-by-Step Execution)

### ขั้นตอนที่ 2.1: เตรียม Branch ใน Git
```bash
git switch develop
git pull origin develop
git switch -c feature/route-optimization
```

---

### ขั้นตอนที่ 2.2: สร้าง Data Model (`src/app/models/route.model.ts`)
```typescript
import { Order } from './order.model';

export interface RouteStop {
  sequence: number; // 1, 2, 3
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  boxQuantity: number;
  distanceFromPrevKm: number;
  estimatedMinutes: number;
}

export interface RiderRoute {
  jobCode: string; // เช่น JOB-MSU-01
  riderId: string;
  riderName: string;
  routeColor: string; // เช่น #EF4444, #10B981, #3B82F6, #F59E0B, #8B5CF6
  orders: Order[];
  stops: RouteStop[];
  totalBoxes: number; // ต้อง <= 10 กล่อง
  totalStops: number; // ต้อง <= 3 จุด
  totalDistanceKm: number;
  estimatedMinutes: number; // ต้อง <= 60 นาที
  deliveryFee: number;
  revenue: number;
  foodCost: number;
  grossProfit: number;
  netProfit: number;
  isValid: boolean;
  warningMessage?: string;
}

export interface DispatchSummary {
  dispatchTime: string; // 11:30 น.
  targetDeadline: string; // 12:30 น.
  totalRiders: number;
  totalOrders: number;
  totalBoxes: number;
  totalDistanceKm: number;
  totalDeliveryFee: number;
  totalRevenue: number;
  totalFoodCost: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  routes: RiderRoute[];
}
```

---

### ขั้นตอนที่ 2.3: สร้าง Service ด้วย Angular CLI (`RouteCalculatorService`)
รันคำสั่ง:
```bash
ng g s services/route-calculator --skip-tests
```

แก้ไขโค้ดในไฟล์ `src/app/services/route-calculator.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { Order } from '../models/order.model';
import { RiderRoute, RouteStop, DispatchSummary } from '../models/route.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RouteCalculatorService {
  private riderColors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  // สูตรคำนวณระยะทาง Haversine (กิโลเมตร)
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(3));
  }

  // อัลกอริทึมจัดเส้นทาง (VRP Clustering & Nearest Neighbor)
  optimizeRoutes(orders: Order[], randomizeSeed: boolean = false): DispatchSummary {
    const shop = environment.shopLocation;
    const pendingOrders = [...orders.filter(o => o.customer && o.status !== 'delivered')];

    if (randomizeSeed) {
      pendingOrders.sort(() => Math.random() - 0.5);
    } else {
      // เรียงลำดับจากจุดที่ใกล้ร้านเพื่อจับกลุ่มโซน
      pendingOrders.sort((a, b) => {
        const distA = this.calculateDistanceKm(shop.latitude, shop.longitude, a.customer!.latitude, a.customer!.longitude);
        const distB = this.calculateDistanceKm(shop.latitude, shop.longitude, b.customer!.latitude, b.customer!.longitude);
        return distA - distB;
      });
    }

    const routes: RiderRoute[] = [];
    let riderIndex = 1;

    while (pendingOrders.length > 0) {
      const currentOrders: Order[] = [];
      let currentBoxes = 0;

      // กฎข้อบังคับ: ไม่เกิน 10 กล่อง และ ไม่เกิน 3 ออเดอร์
      for (let i = 0; i < pendingOrders.length; i++) {
        const order = pendingOrders[i];
        if (currentOrders.length < 3 && currentBoxes + order.boxQuantity <= 10) {
          currentOrders.push(order);
          currentBoxes += order.boxQuantity;
          pendingOrders.splice(i, 1);
          i--;
        }
      }

      // เรียงลำดับจุดส่งด้วย Nearest Neighbor
      const stops: RouteStop[] = [];
      let currentLat = shop.latitude;
      let currentLng = shop.longitude;
      let totalDist = 0;
      const unvisited = [...currentOrders];
      let seq = 1;

      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;

        for (let j = 0; j < unvisited.length; j++) {
          const d = this.calculateDistanceKm(currentLat, currentLng, unvisited[j].customer!.latitude, unvisited[j].customer!.longitude);
          if (d < minDist) {
            minDist = d;
            nearestIdx = j;
          }
        }

        const nextOrder = unvisited.splice(nearestIdx, 1)[0];
        totalDist += minDist;
        const estMinutes = parseFloat(((minDist / 30) * 60).toFixed(1));

        stops.push({
          sequence: seq++,
          orderId: nextOrder.id,
          customerName: `${nextOrder.customer!.firstName} ${nextOrder.customer!.lastName}`,
          phone: nextOrder.customer!.phone,
          address: nextOrder.customer!.address,
          latitude: nextOrder.customer!.latitude,
          longitude: nextOrder.customer!.longitude,
          boxQuantity: nextOrder.boxQuantity,
          distanceFromPrevKm: minDist,
          estimatedMinutes: estMinutes
        });

        currentLat = nextOrder.customer!.latitude;
        currentLng = nextOrder.customer!.longitude;
      }

      // คำนวณเวลาและการเงิน
      const totalEstimatedMinutes = parseFloat(((totalDist / 30) * 60).toFixed(1));
      const deliveryFee = parseFloat((15 + totalDist * 2 * currentBoxes).toFixed(2));
      const revenue = currentBoxes * 65;
      const foodCost = currentBoxes * 40;
      const grossProfit = currentBoxes * 25;
      const netProfit = parseFloat((grossProfit - deliveryFee).toFixed(2));
      const isValid = totalEstimatedMinutes <= 60 && currentBoxes <= 10 && stops.length <= 3;

      routes.push({
        jobCode: `JOB-MSU-${String(riderIndex).padStart(2, '0')}`,
        riderId: `RIDER-${riderIndex}`,
        riderName: `ไรเดอร์คนที่ ${riderIndex}`,
        routeColor: this.riderColors[(riderIndex - 1) % this.riderColors.length],
        orders: currentOrders,
        stops,
        totalBoxes: currentBoxes,
        totalStops: stops.length,
        totalDistanceKm: parseFloat(totalDist.toFixed(2)),
        estimatedMinutes: totalEstimatedMinutes,
        deliveryFee,
        revenue,
        foodCost,
        grossProfit,
        netProfit,
        isValid,
        warningMessage: totalEstimatedMinutes > 60 ? '⚠️ เวลาจัดส่งเกิน 60 นาที (เสี่ยงโดนปรับ 20 บ./ออเดอร์)' : undefined
      });

      riderIndex++;
    }

    return {
      dispatchTime: '11:30 น.',
      targetDeadline: '12:30 น.',
      totalRiders: routes.length,
      totalOrders: routes.reduce((sum, r) => sum + r.totalStops, 0),
      totalBoxes: routes.reduce((sum, r) => sum + r.totalBoxes, 0),
      totalDistanceKm: parseFloat(routes.reduce((sum, r) => sum + r.totalDistanceKm, 0).toFixed(2)),
      totalDeliveryFee: parseFloat(routes.reduce((sum, r) => sum + r.deliveryFee, 0).toFixed(2)),
      totalRevenue: routes.reduce((sum, r) => sum + r.revenue, 0),
      totalFoodCost: routes.reduce((sum, r) => sum + r.foodCost, 0),
      totalGrossProfit: routes.reduce((sum, r) => sum + r.grossProfit, 0),
      totalNetProfit: parseFloat(routes.reduce((sum, r) => sum + r.netProfit, 0).toFixed(2)),
      routes
    };
  }
}
```

---

### ขั้นตอนที่ 2.4: สร้าง Page Component (`route-dashboard`)
รันคำสั่ง:
```bash
ng g c pages/route-dashboard --skip-tests
```

#### การเขียน Logic ใน `route-dashboard.ts`:
1. สร้างแผนที่ Leaflet ใน `ngAfterViewInit()`
2. เมื่อกดปุ่ม "คำนวณจัดเส้นทางอัตโนมัติ" ให้ดึงออเดอร์จาก `OrderService` มาส่งเข้า `routeCalculator.optimizeRoutes()`
3. การวาดเส้นทางแยกสีบนแผนที่:
   - สั่ง `routesLayer.clearLayers()` เพื่อล้างเส้นทางเดิม
   - วนลูป `routes` ของไรเดอร์แต่ละคน แล้วสร้าง `L.polyline(coordinates, { color: r.routeColor, weight: 5 })`
   - วาดหมุดจุดส่งพร้อมหมายเลข 1, 2, 3 ด้วย `L.divIcon` สีเดียวกับไรเดอร์
   - สั่ง `map.fitBounds()` เพื่อปรับมุมมองอัตโนมัติ

---

## ⚠️ 3. สิ่งสำคัญและข้อกำหนดทางธุรกิจที่ห้ามพลาด (Must-Know & Constraints)

> [!WARNING] **กฎเหล็ก 4 ข้อที่ระบบจัดเส้นทางต้องควบคุมอย่างเด็ดขาด**
> 1. **ความจุสูงสุด:** ห้ามจัดเกิน **10 กล่อง** ต่อรถมอเตอร์ไซค์ 1 คัน
> 2. **จำนวนจุดส่ง:** ห้ามจัดเกิน **3 ออเดอร์ (3 จุดส่ง)** ต่อไรเดอร์ 1 คน
> 3. **เวลาจัดส่ง:** ต้องส่งเสร็จภายใน **60 นาที (ถึงก่อน 12:30 น.)** โดยคำนวณจากความเร็ว 30 กม./ชม.
> 4. **ความถูกต้องของสูตรการเงิน:**
>    - $\text{ค่าขนส่ง} = 15 + (\text{ระยะทางรวม} \times 2 \times \text{กล่องรวม})$
>    - $\text{กำไรสุทธิ} = (\text{กล่องรวม} \times 25) - \text{ค่าขนส่ง}$

---

## 🌐 4. ข้อกำหนดการเรียกใช้งาน API (`DeliveryRouteService -> Backend`)

> [!NOTE] **รูปแบบการเชื่อมต่อ:** ติดต่อสื่อสารกับ Backend ผ่าน RESTful API (`HttpClient`) ไม่ต้องจัดการ Database โดยตรง

### สรุป Endpoint สำหรับระบบจัดเส้นทาง:
| Method | Endpoint | หน้าที่การทำงาน | Request Body | Response Body ตัวอย่าง |
|:---|:---|:---|:---|:---|
| `GET` | `/api/orders?status=pending` | ดึงออเดอร์ที่รอดำเนินการจัดส่งสำหรับนำมาคำนวณเส้นทาง | - | `[{ id, orderCode, boxQuantity, customer, ... }]` |
| `POST` | `/api/delivery-batches` | บันทึกผลการจัดเส้นทางและสร้างใบงานไรเดอร์ (`JOB-MSU-xx`) | `{ batchDate: "...", routes: [...] }` | `{ success: true, totalBatches: 3, batches: [...] }` (Status: 201 Created) |
| `GET` | `/api/delivery-batches` | ดึงข้อมูลรอบจัดส่งและสถิติการเงินประจำวัน | `?date=YYYY-MM-DD` | `{ totalBoxes, totalRevenue, totalDeliveryFee, totalNetProfit, routes: [...] }` |

---

## 🧪 5. รายการทดสอบและเกณฑ์การตรวจรับงาน (Testing & Checklist)

| ลำดับ | สิ่งที่ต้องทดสอบ | ผลลัพธ์ที่คาดหวัง |
|:---|:---|:---|
| 1 | กดปุ่มจัดเส้นทาง | ระบบรวบรวมออเดอร์ทั้งหมดและแบ่งงานให้ไรเดอร์อัตโนมัติทันที |
| 2 | ตรวจสอบขีดจำกัดกล่อง | ไรเดอร์ทุกคนได้รับงานรวมไม่เกิน 10 กล่อง |
| 3 | ตรวจสอบจุดส่ง | ไรเดอร์ทุกคนมีจุดส่งไม่เกิน 3 จุด |
| 4 | ตรวจสอบเวลาเดินทาง | ทุกเส้นทางใช้เวลาไม่เกิน 60 นาที (หากเกินต้องมีข้อความเตือนสีแดง) |
| 5 | แผนที่ Leaflet | แสดงเส้นทาง Polyline แยกสีของไรเดอร์แต่ละคนชัดเจน และมีหมุดหมายเลข 1, 2, 3 |
| 6 | ปุ่มคำนวณใหม่ | กดปุ่มแล้ว แผนที่ล้างเส้นทางเก่าและวาดเส้นทางทางเลือกใหม่ทันที |
| 7 | แดชบอร์ดการเงิน | สรุปรายรับ, ต้นทุนอาหาร, ค่าส่ง และกำไรสุทธิถูกต้องตรงตามสูตร |
| 8 | Git & Build | รัน `npm run build` ผ่าน 100% ไม่มีข้อผิดพลาด ก่อนเปิด PR เข้า `develop` |
