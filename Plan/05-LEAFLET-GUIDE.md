# คู่มือการใช้ Leaflet ในโปรเจกต์

## เป้าหมาย

ใช้ Leaflet แสดงแผนที่ หมุดลูกค้า จุดร้าน และเส้นทางของไรเดอร์ใน Angular โดยใช้แผนที่จาก OpenStreetMap เป็นพื้นฐาน

> Leaflet เป็น library สำหรับแสดงแผนที่และวาดเส้นทาง แต่ไม่ได้คำนวณเส้นทางถนนให้เอง หากต้องการเส้นทางตามถนนจริง ให้เรียก Routing API เพิ่ม เช่น OSRM, OpenRouteService หรือบริการที่ทีมเลือก

## 1. ตรวจสอบ package

โปรเจกต์นี้มี package ที่จำเป็นแล้ว:

```bash
npm install leaflet
npm install --save-dev @types/leaflet
```

ตรวจสอบว่า `package.json` มี `leaflet` และ `@types/leaflet`

## 2. โหลด CSS ของ Leaflet

เพิ่มไฟล์ CSS ใน `src/styles.css`:

```css
@import 'leaflet/dist/leaflet.css';
```

ถ้า marker ไม่แสดง ให้ตรวจสอบว่า CSS ถูกโหลดและกำหนดความสูงให้ container แล้ว

## 3. สร้าง container ใน Angular

ใน template ของ component:

```html
<div id="delivery-map" class="map-container"></div>
```

ใน CSS:

```css
.map-container {
  width: 100%;
  height: 520px;
  min-height: 320px;
}
```

ต้องกำหนด `height` เสมอ ไม่เช่นนั้นแผนที่จะมีความสูงเป็นศูนย์

## 4. สร้างแผนที่ใน component

ตัวอย่าง Angular component:

```typescript
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-delivery-map',
  templateUrl: './delivery-map.component.html',
  styleUrl: './delivery-map.component.css',
})
export class DeliveryMapComponent implements AfterViewInit, OnDestroy {
  private map?: L.Map;

  ngAfterViewInit(): void {
    this.map = L.map('delivery-map').setView([16.245, 103.25], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
```

ให้ใช้ `ngAfterViewInit()` เพราะต้องรอให้ HTML container ถูกสร้างก่อนจึงจะสร้างแผนที่ได้ และต้องล้าง map ใน `ngOnDestroy()` เพื่อป้องกัน instance ค้างเมื่อเปลี่ยนหน้า

## 5. แสดงหมุดลูกค้า

```typescript
addCustomerMarker(customer: Customer): void {
  if (!this.map) return;

  L.marker([customer.latitude, customer.longitude])
    .addTo(this.map)
    .bindPopup(
      `<strong>${customer.firstName} ${customer.lastName}</strong><br>` +
      `${customer.address}`
    );
}
```

ไม่ควรนำข้อมูลที่ผู้ใช้กรอกมาใส่ HTML โดยตรงในระบบจริงโดยไม่ escape ข้อมูล ควรใช้ popup content ที่ปลอดภัยหรือ sanitize ก่อน

## 6. แสดงจุดร้านและเส้นทางไรเดอร์

```typescript
addRoute(
  points: Array<[number, number]>,
  color: string,
): void {
  if (!this.map) return;

  L.polyline(points, {
    color,
    weight: 5,
    opacity: 0.8,
  }).addTo(this.map);
}
```

ตัวอย่างการเรียกใช้:

```typescript
this.addRoute(
  [
    [16.245, 103.25],
    [16.247, 103.252],
    [16.249, 103.255],
  ],
  '#e53935',
);
```

กำหนดสีของไรเดอร์ให้ไม่ซ้ำกัน เช่น แดง, เขียว, น้ำเงิน และส้ม พร้อมทำ legend ให้ผู้ใช้เข้าใจว่าแต่ละสีเป็นของไรเดอร์คนใด

## 7. ปรับแผนที่ให้เห็นจุดทั้งหมด

```typescript
fitToPoints(points: Array<[number, number]>): void {
  if (!this.map || points.length === 0) return;

  this.map.fitBounds(L.latLngBounds(points), {
    padding: [24, 24],
  });
}
```

เรียกหลังจากโหลด marker หรือ route ครบแล้ว เพื่อให้แผนที่ปรับ zoom อัตโนมัติ

## 8. การเชื่อมข้อมูลจาก API

ลำดับที่แนะนำ:

1. เรียก Customer API หรือ Route API
2. ล้าง layer เดิมก่อนวาดข้อมูลชุดใหม่
3. เพิ่ม marker ลูกค้า
4. เพิ่ม marker ร้าน
5. เพิ่ม polyline ของไรเดอร์แต่ละคน
6. เรียก `fitToPoints()`
7. แสดง loading และ error state ระหว่างเรียก API

ควรเก็บ marker และ polyline ไว้ใน `LayerGroup` เพื่อให้ล้างข้อมูลได้ง่าย:

```typescript
private routeLayer = L.layerGroup();

clearRoutes(): void {
  this.routeLayer.clearLayers();
}
```

## 9. Routing API ตามถนนจริง

Leaflet `polyline` รับเพียงชุดพิกัดและวาดเส้นตรงระหว่างจุด หากต้องการเส้นทางตามถนน ให้ส่งจุดเริ่มต้นและจุดปลายทางไปยัง routing service แล้วนำ geometry ที่ได้กลับมาแสดงบน Leaflet

แนวทางการทำงาน:

1. ส่งพิกัดร้านและจุดส่งไปยัง backend หรือ routing service
2. รับ geometry ของเส้นทางกลับมา
3. แปลง geometry เป็น `Array<[latitude, longitude]>`
4. ส่งเข้า `L.polyline()`
5. บันทึกระยะทางจริงและเวลาจริงเพื่อใช้คำนวณค่าใช้จ่าย

ไม่ควรเรียก routing service จากทุก marker โดยไม่จำเป็น เพราะอาจเกิน rate limit ควรให้ backend คำนวณหรือ cache ผลลัพธ์เมื่อเหมาะสม

## 10. ปัญหาที่พบบ่อย

- แผนที่ไม่แสดง: ตรวจ `height` ของ container และตรวจว่าเรียกหลัง `ngAfterViewInit()`
- marker ไม่แสดง: ตรวจ CSS และ icon path ของ Leaflet
- แผนที่ซ้อนเมื่อเปลี่ยนหน้า: เรียก `map.remove()` ใน `ngOnDestroy()`
- แผนที่ขนาดผิดหลังเปิดใน tab: เรียก `map.invalidateSize()` หลัง tab แสดงผล
- tile ไม่โหลด: ตรวจ internet, attribution และข้อจำกัดของ tile provider
- เส้นทางไม่ใช่ถนนจริง: ต้องใช้ routing service ไม่ใช่ `L.polyline` เพียงอย่างเดียว

## เกณฑ์ทดสอบ

- แสดงแผนที่บริเวณมหาวิทยาลัยมหาสารคามได้
- แสดงหมุดลูกค้าและร้านได้
- แสดงเส้นทางแต่ละไรเดอร์ด้วยสีแตกต่างกัน
- กด marker แล้วเห็นข้อมูลลูกค้า
- ปรับ zoom ให้เห็นข้อมูลทั้งหมด
- เมื่อเปลี่ยนออเดอร์หรือคำนวณใหม่ เส้นทางเดิมถูกล้างก่อนวาดใหม่
- แผนที่ใช้งานได้ทั้ง desktop และ mobile
