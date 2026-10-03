---
tags:
  - member-4
  - rider-portal
  - mobile-first
  - google-maps
  - api-calling
  - signals
title: คู่มือปฏิบัติงานฉบับละเอียด - สมาชิกคนที่ 4 (หน้าสำหรับไรเดอร์บนมือถือ)
---

# 🛵 คู่มือปฏิบัติงานฉบับละเอียด: สมาชิกคนที่ 4
> [!INFO] **ส่วนงานที่รับผิดชอบ:** หน้าสำหรับไรเดอร์บนมือถือ (Rider Mobile Portal & Navigation)  
> **เอกสารอ้างอิงหลัก:** [[PROJECT_PLAN|แผนแม่บท PaTim]] | **หน้าระบบจัดส่ง:** [[03-ROUTE-AND-SUMMARY|ระบบจัดเส้นทางและสรุปการเงิน]]

---

## 🏢 1. ภาพรวมหน้าที่และสิ่งที่โปรเจกต์ต้องเป็น (Project Overview & UI Concept)

### 1.1 หน้าที่ของสมาชิกคนที่ 4 ในทีม
คุณมีหน้าที่รับผิดชอบพัฒนา **Mobile Web Application สำหรับพนักงานส่งอาหาร (Rider)** 
ออกแบบมาเพื่อให้ไรเดอร์สามารถเปิดใช้งานบนโทรศัพท์มือถือได้อย่างสะดวกขณะขับขี่รถจักรยานยนต์ มีปุ่มกดขนาดใหญ่ อ่านง่าย มองเห็นชัดเจนกลางแดด และมีระบบนำทาง 1 คลิกเข้าสู่ **Google Maps Application** ทันที เพื่อส่งอาหารให้ถึงมือลูกค้าภายในกรอบเวลา **11:30 น. - 12:30 น. (ไม่เกิน 60 นาที)**

### 1.2 หน้าตาหน้าจอที่ต้องพัฒนา (Mobile-First UI Layout & Components)
หน้าจอจะถูกออกแบบให้เป็น **Mobile-First Layout** (ความกว้างหน้าจอด้านในจำกัดที่ `max-w-md mx-auto` พร้อมขอบมนและเงาแบบการ์ดสวยงาม):

```
┌──────────────────────────────────────────────┐
│  🛵 PaTim Rider Portal           🟢 Online   │
│  ⏱️ รอบส่งเที่ยง: 11:30 - 12:30 น. (ตรงเวลา)    │
├──────────────────────────────────────────────┤
│  🔍 ค้นหาใบงาน: [ JOB-MSU-01     ] [ ค้นหา ] │
├──────────────────────────────────────────────┤
│  📦 สรุปของที่ต้องรับขึ้นรถ (Pickup Summary) │
│  • ไรเดอร์: คุณสมชาย ใจดี                    │
│  • จำนวนข้าวกล่องทั้งหมด: 8 กล่อง (ห้ามเกิน 10) │
│  • จำนวนจุดส่ง: 3 จุด (ห้ามเกิน 3 จุด)       │
│  • ความคืบหน้า: [████████░░░░] 2/3 จุด (67%) │
├──────────────────────────────────────────────┤
│  📍 ลำดับการส่ง (Delivery Sequence):         │
│                                              │
│  [1] คุณสมศักดิ์ ขยันยิ่ง (3 กล่อง) - 🟢 ส่งแล้ว │
│      หอพัก MSU Park ห้อง 302                 │
│      📞 081-111-2222                         │
│                                              │
│  [2] คุณกานดา รักษ์ดี (2 กล่อง) - 🟡 กำลังไปส่ง  │
│      คณะวิทยาการสารสนเทศ โต๊ะม้าหินอ่อน       │
│      📞 082-333-4444                         │
│      [ 🗺️ เปิด Google Maps นำทาง ]            │
│      [ ✅ บันทึกว่าส่งสำเร็จแล้ว ]             │
│                                              │
│  [3] คุณพิมพา สดใส (3 กล่อง) - ⏳ รอดำเนินการ   │
│      คอนโดแคนปัสทาวเวอร์ ชั้น 5               │
│      📞 089-555-6666                         │
│      [ 🗺️ เปิด Google Maps นำทาง ]            │
│      [ ✅ บันทึกว่าส่งสำเร็จแล้ว ]             │
└──────────────────────────────────────────────┘
```

---

## 🛠️ 2. ขั้นตอนการทำงานตั้งแต่เริ่มต้นจนเสร็จสมบูรณ์ (Step-by-Step Execution)

### ขั้นตอนที่ 2.1: เตรียม Branch ใน Git
```bash
# สลับไปที่ develop และดึงโค้ดล่าสุด
git switch develop
git pull origin develop

# สร้าง branch ทำงานของตนเอง
git switch -c feature/rider-portal
```

---

### ขั้นตอนที่ 2.2: สร้าง Data Model (`src/app/models/rider-job.model.ts`)
สร้างไฟล์ `src/app/models/rider-job.model.ts` เพื่อกำหนดโครงสร้างข้อมูลใบงานของไรเดอร์:

```typescript
export type StopDeliveryStatus = 'pending' | 'in_progress' | 'delivered' | 'failed';

export interface RiderStopItem {
  sequence: number;          // ลำดับที่ 1, 2, 3
  stopId: string;            // รหัสจุดส่ง
  orderId: string;           // รหัสออเดอร์
  orderCode: string;         // เลขที่อ้างอิงออเดอร์ เช่น ORD-001
  customerName: string;      // ชื่อลูกค้าผู้รับ
  phone: string;             // เบอร์โทรศัพท์ลูกค้า
  address: string;           // รายละเอียดที่อยู่/จุดส่งมอบ
  latitude: number;          // ละติจูดพิกัดจัดส่ง
  longitude: number;         // ลองจิจูดพิกัดจัดส่ง
  boxQuantity: number;       // จำนวนกล่องของจุดนี้ (1 - 3 กล่อง)
  status: StopDeliveryStatus;// สถานะการจัดส่ง
  deliveredAt?: string;      // เวลาที่บันทึกว่าส่งสำเร็จ
  notes?: string;            // บันทึกเพิ่มเติม เช่น วางไว้หน้าป้อมยาม
}

export interface RiderJobBatch {
  jobCode: string;           // เช่น JOB-MSU-01
  riderName: string;         // ชื่อไรเดอร์
  riderPhone: string;        // เบอร์โทรไรเดอร์
  batchDate: string;         // วันที่ส่ง YYYY-MM-DD
  dispatchTime: string;      // เวลาออกเดินทาง เช่น 11:30
  deadlineTime: string;      // เวลาส่งถึงจุดสุดท้าย เช่น 12:30
  totalBoxes: number;        // จำนวนกล่องรวมที่ต้องหยิบขึ้นรถ (<= 10 กล่อง)
  totalStops: number;        // จำนวนจุดแวะส่ง (<= 3 จุด)
  estimatedDistanceKm: number; // ระยะทางประเมินรวม (กม.)
  estimatedMinutes: number;  // เวลาประเมินรวม (นาที)
  batchStatus: 'assigned' | 'in_progress' | 'completed';
  stops: RiderStopItem[];    // รายการจุดส่งเรียงตามลำดับ 1 -> 2 -> 3
}
```

---

### ขั้นตอนที่ 2.3: สร้าง Service ด้วย Angular CLI (`RiderService`)
รันคำสั่ง Angular CLI:
```bash
ng g s services/rider --skip-tests
```

แก้ไขโค้ดในไฟล์ `src/app/services/rider.service.ts`:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RiderJobBatch, StopDeliveryStatus } from '../models/rider-job.model';

@Injectable({
  providedIn: 'root'
})
export class RiderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/delivery-batches`;

  /**
   * ดึงข้อมูลใบงานตาม Job Code (เช่น JOB-MSU-01)
   */
  getJobByCode(jobCode: string): Observable<RiderJobBatch> {
    return this.http.get<RiderJobBatch>(`${this.apiUrl}/${jobCode}`).pipe(
      catchError(err => {
        console.warn(`[RiderService] API Offline -> Using Mock Data for job ${jobCode}`, err);
        return of(this.getFallbackMockJob(jobCode));
      })
    );
  }

  /**
   * อัปเดตสถานะจุดจัดส่ง (เช่น เปลี่ยนเป็น 'delivered')
   */
  updateStopStatus(jobCode: string, stopId: string, status: StopDeliveryStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${jobCode}/stops/${stopId}`, {
      status,
      deliveredAt: new Date().toISOString()
    }).pipe(
      catchError(err => {
        console.warn('[RiderService] API Offline -> Simulated status update success', err);
        return of({ success: true, stopId, status, deliveredAt: new Date().toISOString() });
      })
    );
  }

  /**
   * สร้างลิงก์นำทาง Google Maps Navigation URL ด้วยพิกัดปลายทาง
   */
  buildGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }

  /**
   * ข้อมูลจำลอง (Mock Data) สำหรับทดสอบขณะยังไม่เปิดเซิร์ฟเวอร์ Backend
   */
  private getFallbackMockJob(jobCode: string): RiderJobBatch {
    return {
      jobCode: jobCode || 'JOB-MSU-01',
      riderName: 'สมชาย ใจดี (Rider 1)',
      riderPhone: '089-999-8888',
      batchDate: new Date().toISOString().split('T')[0],
      dispatchTime: '11:30 น.',
      deadlineTime: '12:30 น.',
      totalBoxes: 8,
      totalStops: 3,
      estimatedDistanceKm: 3.8,
      estimatedMinutes: 28,
      batchStatus: 'in_progress',
      stops: [
        {
          sequence: 1,
          stopId: 'STOP-001',
          orderId: 'ORD-101',
          orderCode: 'ORD-101',
          customerName: 'คุณสมศักดิ์ ขยันยิ่ง',
          phone: '081-111-2222',
          address: 'หอพัก MSU Park อาคาร B ห้อง 302',
          latitude: 16.248500,
          longitude: 103.253200,
          boxQuantity: 3,
          status: 'delivered',
          deliveredAt: '11:42 น.'
        },
        {
          sequence: 2,
          stopId: 'STOP-002',
          orderId: 'ORD-102',
          orderCode: 'ORD-102',
          customerName: 'คุณกานดา รักษ์ดี',
          phone: '082-333-4444',
          address: 'คณะวิทยาการสารสนเทศ โต๊ะม้าหินอ่อนใต้ตึก',
          latitude: 16.242100,
          longitude: 103.248900,
          boxQuantity: 2,
          status: 'in_progress'
        },
        {
          sequence: 3,
          stopId: 'STOP-003',
          orderId: 'ORD-103',
          orderCode: 'ORD-103',
          customerName: 'คุณพิมพา สดใส',
          phone: '089-555-6666',
          address: 'คอนโดแคนปัสทาวเวอร์ ชั้น 5 หน้าลิฟต์',
          latitude: 16.239500,
          longitude: 103.256000,
          boxQuantity: 3,
          status: 'pending'
        }
      ]
    };
  }
}
```

---

### ขั้นตอนที่ 2.4: สร้างหน้า Component ด้วย Angular CLI (`RiderPortalComponent`)
รันคำสั่ง:
```bash
ng g c pages/rider-portal --skip-tests
```

แก้ไขโค้ดในไฟล์ `src/app/pages/rider-portal/rider-portal.component.ts`:
```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RiderService } from '../../services/rider.service';
import { RiderJobBatch, RiderStopItem, StopDeliveryStatus } from '../../models/rider-job.model';

@Component({
  selector: 'app-rider-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider-portal.component.html',
  styleUrls: ['./rider-portal.component.css']
})
export class RiderPortalComponent implements OnInit {
  private riderService = inject(RiderService);

  // Angular Signals จัดการ State ภายในหน้าจอ
  searchJobCode = signal<string>('JOB-MSU-01');
  currentJob = signal<RiderJobBatch | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  toastMessage = signal<string>('');

  // Computed Signal คำนวณความคืบหน้าการส่ง
  completedStopsCount = computed(() => {
    const job = this.currentJob();
    if (!job || !job.stops) return 0;
    return job.stops.filter(s => s.status === 'delivered').length;
  });

  progressPercent = computed(() => {
    const job = this.currentJob();
    if (!job || job.totalStops === 0) return 0;
    return Math.round((this.completedStopsCount() / job.totalStops) * 100);
  });

  isAllDelivered = computed(() => {
    const job = this.currentJob();
    if (!job || job.totalStops === 0) return false;
    return this.completedStopsCount() === job.totalStops;
  });

  ngOnInit(): void {
    this.searchJob();
  }

  /**
   * ค้นหาใบงานตาม Job Code
   */
  searchJob(): void {
    const code = this.searchJobCode().trim();
    if (!code) {
      this.errorMessage.set('กรุณากรอกรหัสใบงาน (เช่น JOB-MSU-01)');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.riderService.getJobByCode(code).subscribe({
      next: (job) => {
        this.currentJob.set(job);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('ไม่พบข้อมูลใบงานที่ระบุ กรุณาตรวจสอบรหัสอีกครั้ง');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * เปิดแอปพลิเคชัน Google Maps นำทาง
   */
  openNavigation(stop: RiderStopItem): void {
    const navUrl = this.riderService.buildGoogleMapsUrl(stop.latitude, stop.longitude);
    window.open(navUrl, '_blank');
  }

  /**
   * อัปเดตสถานะการจัดส่ง
   */
  markAsDelivered(stop: RiderStopItem): void {
    const job = this.currentJob();
    if (!job) return;

    this.riderService.updateStopStatus(job.jobCode, stop.stopId, 'delivered').subscribe({
      next: () => {
        // อัปเดต State ภายใน Signals
        const updatedStops = job.stops.map(s => {
          if (s.stopId === stop.stopId) {
            return { ...s, status: 'delivered' as StopDeliveryStatus, deliveredAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' };
          }
          return s;
        });

        this.currentJob.set({
          ...job,
          stops: updatedStops
        });

        this.showToast(`✅ บันทึกส่งจุดที่ ${stop.sequence} สำเร็จเรียบร้อย!`);
      },
      error: () => {
        this.showToast('❌ ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  }

  /**
   * แสดงกล่องแจ้งเตือน Toast สั้นๆ
   */
  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3000);
  }
}
```

---

### ขั้นตอนที่ 2.5: ออกแบบหน้าจอ Template HTML (`rider-portal.component.html`)

```html
<div class="min-h-screen bg-slate-900 text-slate-100 py-4 px-3 sm:px-4">
  <div class="max-w-md mx-auto space-y-4">

    <!-- 1. Header และแบนเนอร์แจ้งเตือนเวลาส่ง -->
    <header class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🛵</span>
          <div>
            <h1 class="text-lg font-bold text-emerald-400">PaTim Rider Portal</h1>
            <p class="text-xs text-slate-400">ระบบนำทางและส่งอาหารสำหรับไรเดอร์</p>
          </div>
        </div>
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
          ● กำลังปฏิบัติงาน
        </span>
      </div>

      <!-- กล่องเน้นย้ำเป้าหมายเวลาส่ง -->
      <div class="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2.5 text-xs text-amber-300">
        <span class="text-lg">⏱️</span>
        <div>
          <span class="font-bold">กรอบเวลาส่งอาหาร: 11:30 - 12:30 น.</span>
          <p class="text-[11px] text-amber-300/80">เป้าหมาย: ส่งถึงมือลูกค้าทุกคนภายในไม่เกิน 60 นาที</p>
        </div>
      </div>
    </header>

    <!-- 2. กล่องค้นหาใบงาน (Job Lookup Search Bar) -->
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 shadow-md">
      <label class="block text-xs font-medium text-slate-300 mb-1.5">🔍 ค้นหารหัสใบงาน (Job Code):</label>
      <div class="flex gap-2">
        <input 
          type="text" 
          [ngModel]="searchJobCode()" 
          (ngModelChange)="searchJobCode.set($event)"
          (keyup.enter)="searchJob()"
          placeholder="เช่น JOB-MSU-01" 
          class="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
        />
        <button 
          (click)="searchJob()" 
          [disabled]="isLoading()"
          class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
        >
          <span>ค้นหา</span>
        </button>
      </div>

      @if (errorMessage()) {
        <p class="mt-2 text-xs text-rose-400 flex items-center gap-1">
          <span>⚠️</span> {{ errorMessage() }}
        </p>
      }
    </div>

    <!-- 3. ส่วนแสดงข้อมูลสรุปการรับของ (Pickup Summary) -->
    @if (currentJob(); as job) {
      <div class="bg-gradient-to-br from-slate-800 to-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-xs text-slate-400">รหัสใบงาน:</span>
            <div class="text-base font-extrabold text-white tracking-wide">{{ job.jobCode }}</div>
            <div class="text-xs text-slate-300 mt-0.5">👤 {{ job.riderName }}</div>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400">เวลาออกส่ง:</span>
            <div class="text-sm font-bold text-amber-400">{{ job.dispatchTime }}</div>
          </div>
        </div>

        <!-- กล่องนับจำนวนกล่องรวม (Pickup Box Badge) -->
        <div class="grid grid-cols-2 gap-2.5 pt-1">
          <div class="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
            <span class="text-[11px] text-slate-400 block">ข้าวกล่องที่ต้องรับขึ้นรถ</span>
            <span class="text-xl font-black text-amber-400">{{ job.totalBoxes }}</span>
            <span class="text-[10px] text-slate-400 ml-1">/ 10 กล่อง</span>
          </div>
          <div class="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
            <span class="text-[11px] text-slate-400 block">จำนวนจุดส่ง</span>
            <span class="text-xl font-black text-sky-400">{{ job.totalStops }}</span>
            <span class="text-[10px] text-slate-400 ml-1">/ 3 จุด</span>
          </div>
        </div>

        <!-- แถบ Progress Bar ความคืบหน้า -->
        <div class="pt-1">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-300 font-medium">ความคืบหน้าการจัดส่ง</span>
            <span class="font-bold text-emerald-400">{{ completedStopsCount() }} / {{ job.totalStops }} จุด ({{ progressPercent() }}%)</span>
          </div>
          <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div 
              class="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
              [style.width.%]="progressPercent()"
            ></div>
          </div>
        </div>

        @if (isAllDelivered()) {
          <div class="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-center text-emerald-300 font-bold text-sm animate-bounce">
            🎉 ส่งอาหารครบทุกจุดแล้ว ขอบคุณสำหรับการทำงานครับ!
          </div>
        }
      </div>

      <!-- 4. ลำดับรายการจุดส่ง (Step-by-Step Delivery List) -->
      <div class="space-y-3">
        <h2 class="text-sm font-bold text-slate-300 flex items-center gap-1.5 px-1">
          <span>📍</span> ลำดับจุดส่งตามเส้นทาง (Delivery Sequence)
        </h2>

        @for (stop of job.stops; track stop.stopId) {
          <div 
            class="rounded-2xl border transition-all duration-200 overflow-hidden shadow-md"
            [ngClass]="{
              'bg-emerald-950/30 border-emerald-500/40': stop.status === 'delivered',
              'bg-slate-800 border-amber-500/50 ring-1 ring-amber-500/30': stop.status === 'in_progress',
              'bg-slate-800 border-slate-700': stop.status === 'pending'
            }"
          >
            <!-- Card Header -->
            <div class="p-3.5 border-b border-slate-700/50 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span 
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                  [ngClass]="{
                    'bg-emerald-500': stop.status === 'delivered',
                    'bg-amber-500': stop.status === 'in_progress',
                    'bg-slate-600': stop.status === 'pending'
                  }"
                >
                  {{ stop.sequence }}
                </span>
                <div>
                  <h3 class="text-sm font-bold text-white">{{ stop.customerName }}</h3>
                  <span class="text-[11px] text-slate-400">รหัสออเดอร์: {{ stop.orderCode }}</span>
                </div>
              </div>

              <!-- ป้ายบอกจำนวนกล่องประจำจุด -->
              <span class="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                🍱 {{ stop.boxQuantity }} กล่อง
              </span>
            </div>

            <!-- Card Body -->
            <div class="p-3.5 space-y-2.5 text-xs text-slate-300">
              <div class="flex items-start gap-2">
                <span class="text-slate-400 mt-0.5">🏠</span>
                <p class="leading-relaxed">{{ stop.address }}</p>
              </div>

              <div class="flex items-center justify-between pt-1">
                <a 
                  [href]="'tel:' + stop.phone" 
                  class="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                >
                  <span>📞 โทรหาลูกค้า:</span>
                  <span class="underline">{{ stop.phone }}</span>
                </a>

                @if (stop.status === 'delivered') {
                  <span class="text-emerald-400 font-bold flex items-center gap-1">
                    <span>✓</span> ส่งสำเร็จ {{ stop.deliveredAt || '' }}
                  </span>
                }
              </div>

              <!-- ปุ่มแอ็กชัน: Google Maps & ส่งสำเร็จ -->
              @if (stop.status !== 'delivered') {
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                  <button 
                    (click)="openNavigation(stop)"
                    class="bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-900/30 text-xs"
                  >
                    <span>🗺️ เปิด Google Maps</span>
                  </button>

                  <button 
                    (click)="markAsDelivered(stop)"
                    class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 text-xs"
                  >
                    <span>✅ ส่งสำเร็จแล้ว</span>
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- 5. Toast Notification แจ้งเตือนสั้นๆ ด้านล่าง -->
    @if (toastMessage()) {
      <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
        {{ toastMessage() }}
      </div>
    }

  </div>
</div>
```

---

## 🌐 3. ข้อกำหนด API Endpoints (Backend Contracts)

> [!TIP] **Base URL:** `http://localhost:3000/api/delivery-batches`

| Method | Endpoint | คำอธิบายการทำงาน | Request / Response ตัวอย่าง |
|:---|:---|:---|:---|
| `GET` | `/api/delivery-batches/:jobCode` | ดึงข้อมูลใบงานพร้อมรายการจุดส่ง 1, 2, 3 | **Response 200:** ข้อมูล `RiderJobBatch` |
| `PATCH` | `/api/delivery-batches/:jobCode/stops/:stopId` | อัปเดตสถานะจุดส่งเป็น `delivered` | **Body:** `{ status: "delivered", deliveredAt: "..." }` |

---

## ✅ 4. เกณฑ์การตรวจรับงานและข้อควรระวัง (Verification Checklist)

> [!IMPORTANT] **Checklist สำหรับสมาชิกคนที่ 4:**
- [ ] **Mobile Responsive:** ทดสอบบน Chrome DevTools โหมด Mobile (iPhone 14 / Pixel 7) หน้าจอต้องไม่ล้นออกข้าง
- [ ] **Job Code Search:** กรอก `JOB-MSU-01` แล้วค้นหาข้อมูลใบงานขึ้นมาแสดงผลได้ถูกต้อง
- [ ] **Pickup Box Summary:** แสดงกล่องรวมไม่เกิน 10 กล่อง และจุดส่งไม่เกิน 3 จุดชัดเจน
- [ ] **Phone Call:** กดลิงก์เบอร์โทร `tel:xxxxxxxxx` แล้วสามารถเด้งหน้าจอกดโทรศัพท์ได้
- [ ] **Google Maps Navigation:** กดปุ่ม 🗺️ แล้วเปิดแท็บใหม่ไปยัง URL `https://www.google.com/maps/dir/?api=1&destination=...` ได้ถูกต้องตามพิกัดของลูกค้า
- [ ] **Delivered Status Toggle:** กดปุ่ม ✅ แล้วการ์ดเปลี่ยนเป็นสีเขียว แถบ Progress Bar ขยับขึ้น และข้อมูลถูกบันทึก
- [ ] **Git PR:** Commit โค้ดและเปิด Pull Request จาก `feature/rider-portal` เข้าสู่ `develop`
