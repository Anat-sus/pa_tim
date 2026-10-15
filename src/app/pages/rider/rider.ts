import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';

import { OrderService, DbOrder } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';

interface DbCustomer {
  id?: number | string;
  name?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DeliveryPoint {
  id: number | string;
  type: 'pickup' | 'dropoff';
  title: string;
  customerName?: string;
  address: string;
  phone?: string;
  boxes: number;
  items?: string;
  note?: string;
  status: 'pending' | 'completed';
  lat: number;
  lng: number;
}

interface RiderItem {
  code: string;
  name: string;
  colorClass: string;
}

@Component({
  selector: 'app-rider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider.html',
  styleUrl: './rider.css'
})
export class Rider implements OnInit, AfterViewInit {
  private orderService = inject(OrderService);
  private customerService = inject(CustomerService);

  searchQuery = 'RD-01';
  selectedRiderCode = 'RD-01';
  notFoundError = false;

  colorPalette = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];

  allOrders: DbOrder[] = [];
  customerMap = new Map<number | string, DbCustomer>();
  riderList: RiderItem[] = [];

  currentRiderInfo: any = {
    fullName: '',
    jobId: 'JOB-1001',
    vehicle: 'Wave 110i สีแดง',
    shift: 'รอบส่งด่วนมื้อเที่ยง',
    deadline: '12:30 น.',
    estimatedFinish: 'เสร็จ ~11:41 น.',
    earnings: 0,
    totalDistance: 2.38
  };

  isOnline = true;
  isLoading = true;

  totalBoxes = 0;
  totalStops = 0;

  deliveryList: DeliveryPoint[] = [];
  private map!: L.Map;

  async ngOnInit(): Promise<void> {
    await this.loadAllDataFromDB();
  }

  ngAfterViewInit(): void {
    this.ensureMapInitialized();
  }

  async loadAllDataFromDB(): Promise<void> {
    try {
      this.isLoading = true;

      // โหลด Orders
      const ordersData = await lastValueFrom(this.orderService.getOrders()).catch(() => []);
      this.allOrders = ordersData || [];

      let customersData: any[] = [];
      try {
        const cs = this.customerService as any;
        const fetchMethod = cs.getCustomers || cs.getAllCustomers || cs.getCustomersData || cs.searchCustomers;
        
        if (typeof fetchMethod === 'function') {
          const res = await lastValueFrom(fetchMethod.call(cs));
          customersData = Array.isArray(res) ? res : (res as any)?.data || [];
        }
      } catch (e) {
        console.warn('ไม่สามารถดึงข้อมูลลูกค้าได้:', e);
      }

      this.customerMap.clear();
      customersData.forEach((c: DbCustomer) => {
        if (c.id) {
          this.customerMap.set(c.id, c);
        }
      });

      const riderMap = new Map<string, string>();
      this.allOrders.forEach((o: any) => {
        if (o.rider_code || o.riderCode) {
          const code = (o.rider_code || o.riderCode).toString().trim().toUpperCase();
          const name = o.rider_name || o.riderName || o.rider || `ไรเดอร์ ${code}`;
          riderMap.set(code, name);
        }
      });

      this.riderList = Array.from(riderMap.entries()).map(([code, name], index) => ({
        code,
        name,
        colorClass: this.colorPalette[index % this.colorPalette.length]
      }));

      if (this.riderList.length > 0) {
        this.selectedRiderCode = this.riderList[0].code.toUpperCase();
        this.searchQuery = this.selectedRiderCode;
      }

      this.processRiderOrders();

    } catch (error) {
      console.error('ไม่สามารถโหลดข้อมูลจาก DB ได้:', error);
      this.riderList = [];
      this.deliveryList = [];
    } finally {
      this.isLoading = false;
    }
  }

  // 2. คำนวณจุดส่งและยอดกล่องตามไรเดอร์ที่เลือก (บังคับ Uppercase)
  processRiderOrders(): void {
    const code = this.selectedRiderCode.trim().toUpperCase();
    
    const riderOrders = this.allOrders.filter((o: any) => {
      const riderCode = o.rider_code || o.riderCode;
      return riderCode && riderCode.toString().trim().toUpperCase() === code;
    });

    const matchedRider = this.riderList.find(r => r.code === code);

    if (!matchedRider && riderOrders.length === 0) {
      this.notFoundError = true;
      this.deliveryList = [];
      this.totalBoxes = 0;
      this.totalStops = 0;
      return;
    }

    this.notFoundError = false;
    this.currentRiderInfo.fullName = matchedRider ? matchedRider.name : `ไรเดอร์ ${code}`;

    const pickupPoint: DeliveryPoint = {
      id: 'PICKUP',
      type: 'pickup',
      title: 'ร้านข้าวกล่องเดลิเวอรี่ (มมส ขามเรียง)',
      address: 'ตรงข้ามตลาดน้อย มหาวิทยาลัยมหาสารคาม',
      boxes: 0,
      status: 'completed',
      lat: 16.2468,
      lng: 103.2521
    };

    let totalBoxesCount = 0;
    const dropoffPoints: DeliveryPoint[] = riderOrders.map((order: any, index: number) => {
      const customer = order.customer_id ? this.customerMap.get(order.customer_id) : null;
      const boxQty = Number(order.boxes || order.qty || order.quantity || 1);
      totalBoxesCount += boxQty;

      return {
        id: order.id,
        type: 'dropoff',
        title: `จุดที่ ${index + 1}`,
        customerName: order.customer_name || customer?.name || order.customer?.name || `ลูกค้า #${order.id}`,
        address: order.address || customer?.address || order.customer?.address || 'มหาวิทยาลัยมหาสารคาม',
        phone: order.phone || customer?.phone || order.customer?.phone || '',
        boxes: boxQty,
        items: order.menu || order.items || 'ข้าวกล่องเดลิเวอรี่',
        note: order.note || order.remark || '',
        status: order.status === 'completed' || order.status === 'delivered' ? 'completed' : 'pending',
        lat: Number(order.latitude || order.lat || customer?.latitude || 16.2485 + (index * 0.001)),
        lng: Number(order.longitude || order.lng || customer?.longitude || 103.2532 + (index * 0.001))
      };
    });

    pickupPoint.boxes = totalBoxesCount;
    this.deliveryList = [pickupPoint, ...dropoffPoints];
    
    this.totalStops = dropoffPoints.length;
    this.totalBoxes = totalBoxesCount;
    this.currentRiderInfo.earnings = (dropoffPoints.length * 15) + (totalBoxesCount * 2);

    this.ensureMapInitialized();
  }

  onSearchRider(): void {
    const code = this.searchQuery.trim().toUpperCase();
    this.searchQuery = code;
    this.selectedRiderCode = code;
    this.processRiderOrders();
  }

  selectRider(code: string): void {
    const upperCode = code.trim().toUpperCase();
    this.searchQuery = upperCode;
    this.selectedRiderCode = upperCode;
    this.processRiderOrders();
  }

  private ensureMapInitialized(): void {
    setTimeout(() => {
      const mapElement = document.getElementById('riderMap');
      if (mapElement) {
        if (!this.map) {
          this.initMap();
        } else {
          this.map.invalidateSize();
          this.updateMapMarkers();
        }
      } else {
        setTimeout(() => this.ensureMapInitialized(), 150);
      }
    }, 100);
  }

  private initMap(): void {
    const mapContainer = document.getElementById('riderMap');
    if (!mapContainer) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('riderMap').setView([16.2485, 103.2532], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMapMarkers();
  }

  private updateMapMarkers(): void {
    if (!this.map || this.deliveryList.length === 0) return;

    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        this.map.removeLayer(layer);
      }
    });

    const latLngs: L.LatLngExpression[] = [];

    this.deliveryList.forEach(point => {
      latLngs.push([point.lat, point.lng]);
      L.marker([point.lat, point.lng])
        .addTo(this.map)
        .bindPopup(`<b>${point.type === 'pickup' ? point.title : point.customerName}</b><br>${point.address}`);
    });

    if (latLngs.length > 0) {
      L.polyline(latLngs, { color: '#ef4444', weight: 4 }).addTo(this.map);
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, { padding: [25, 25] });
    }

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  openGoogleMaps(): void {
    window.open('https://www.google.com/maps', '_blank');
  }

  async toggleStatus(point: DeliveryPoint): Promise<void> {
    const newStatus = point.status === 'completed' ? 'pending' : 'completed';
    point.status = newStatus;

    if (point.type === 'dropoff') {
      try {
        await lastValueFrom(this.orderService.patchOrder(point.id, { status: newStatus }));
      } catch (err) {
        console.error('อัปเดตสถานะออเดอร์ไม่สำเร็จ:', err);
      }
    }
  }
}