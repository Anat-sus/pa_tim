import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { OrderService, DbOrder } from '../../services/order.service';

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

@Component({
  selector: 'app-rider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider.html',
  styleUrl: './rider.css'
})
export class Rider implements OnInit, AfterViewInit {
  private orderService = inject(OrderService);

  searchQuery = '';
  isOnline = true;
  isLoading = true;

  totalBoxes = 0;
  totalStops = 0;

  deliveryList: DeliveryPoint[] = [];
  private map!: L.Map;

  async ngOnInit(): Promise<void> {
    await this.loadOrderData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 300);
  }

  async loadOrderData(): Promise<void> {
    try {
      this.isLoading = true;
      const orders: DbOrder[] = await lastValueFrom(this.orderService.getOrders());

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
      const dropoffPoints: DeliveryPoint[] = (orders || []).map((order: any, index: number) => {
        const boxQty = order.boxes || order.qty || 1;
        totalBoxesCount += boxQty;

        return {
          id: order.id,
          type: 'dropoff',
          title: `จุดที่ ${index + 1}`,
          customerName: order.customer_name || order.customer?.name || `ลูกค้า #${order.id}`,
          address: order.address || order.customer?.address || 'มหาวิทยาลัยมหาสารคาม',
          phone: order.phone || order.customer?.phone || '',
          boxes: boxQty,
          items: order.menu || order.items || 'ข้าวกล่องเดลิเวอรี่',
          note: order.note || order.remark || '',
          status: order.status === 'completed' || order.status === 'delivered' ? 'completed' : 'pending',
          lat: Number(order.latitude || order.lat || order.customer?.latitude || 16.2485 + (index * 0.001)),
          lng: Number(order.longitude || order.lng || order.customer?.longitude || 103.2532 + (index * 0.001))
        };
      });

      pickupPoint.boxes = totalBoxesCount;
      this.deliveryList = [pickupPoint, ...dropoffPoints];
      
      this.totalStops = dropoffPoints.length;
      this.totalBoxes = totalBoxesCount;

      if (this.map) {
        this.updateMapMarkers();
      }
    } catch (error) {
      console.error('ไม่สามารถโหลดข้อมูลออเดอร์ได้:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private initMap(): void {
    if (this.map) return;

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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const latLngs: L.LatLngExpression[] = [];

    this.deliveryList.forEach(point => {
      latLngs.push([point.lat, point.lng]);
      L.marker([point.lat, point.lng])
        .addTo(this.map)
        .bindPopup(`<b>${point.type === 'pickup' ? point.title : point.customerName}</b><br>${point.address}`);
    });

    if (latLngs.length > 0) {
      L.polyline(latLngs, { color: '#ef4444', weight: 4 }).addTo(this.map);
    }

    this.map.invalidateSize();
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