import { Component, inject, OnInit, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { CustomerService } from '../../services/customer.service';
import { Customer, CreateCustomerDto } from '../../models/customer.model';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-management.html',
  styleUrl: './customer-management.css'
})
export class CustomerManagement implements OnInit, AfterViewInit, OnDestroy {
  private customerService = inject(CustomerService);

  customers = signal<Customer[]>([]);
  searchKeyword = signal<string>('');
  isLoading = signal<boolean>(false);
  loadError = signal<string | null>(null);

  // ควบคุม Modal Popup
  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentEditingId = signal<number | string | null>(null);

  // โมเดลฟอร์ม
  formData: CreateCustomerDto = {
    name: '',
    phone: '',
    address: '',
    latitude: 16.2477,
    longitude: 103.2539
  };

  // แผนที่หลัก
  private mainMap?: L.Map;
  private mainMapResizeObserver?: ResizeObserver;
  private markersLayer = L.layerGroup();
  private markerMap = new Map<number | string, L.Marker>();

  // แผนที่ใน Modal
  private modalMap?: L.Map;
  private modalMarker?: L.Marker;

  filteredCustomers = computed(() => {
    const kw = this.searchKeyword().toLowerCase().trim();
    if (!kw) return this.customers();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(kw) ||
      c.phone.toLowerCase().includes(kw) ||
      c.address.toLowerCase().includes(kw) ||
      this.formatCustomerId(c.id).toLowerCase().includes(kw)
    );
  });

  ngOnInit(): void {
    this.loadDataAsync();
  }

  ngAfterViewInit(): void {
    this.initMainMap();
  }

  ngOnDestroy(): void {
    this.mainMapResizeObserver?.disconnect();
    this.mainMap?.remove();
    this.modalMap?.remove();
  }

  formatCustomerId(id: number | string): string {
    const num = Number(id);
    if (!isNaN(num)) {
      return `CUST-${String(num).padStart(2, '0')}`;
    }
    return String(id);
  }

  async loadDataAsync(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.loadError.set(null);
      const data = await this.customerService.getCustomers();
      this.customers.set(data);
      this.renderCustomerMarkers();
    } catch (error: unknown) {
      console.error('[loadDataAsync] ไม่สามารถดึงข้อมูลจาก Backend:', error);
      this.loadError.set(this.getRequestErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getRequestErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'เชื่อมต่อ API ไม่สำเร็จ (เครือข่ายหรือ CORS) กรุณาตรวจสอบการตั้งค่า Backend';
      }
      return `Backend ตอบกลับข้อผิดพลาด HTTP ${error.status}: ${error.message}`;
    }

    return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  private initMainMap(): void {
    const shopLat = 16.246839;
    const shopLng = 103.251963;
    const mapElement = document.getElementById('main-customer-map');

    if (!mapElement) {
      throw new Error('ไม่พบพื้นที่แสดงแผนที่ลูกค้า');
    }

    this.mainMap = L.map(mapElement).setView([shopLat, shopLng], 14);
    this.mainMapResizeObserver = new ResizeObserver(() => {
      this.mainMap?.invalidateSize({ pan: false });
    });
    this.mainMapResizeObserver.observe(mapElement);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.mainMap);

    this.markersLayer.addTo(this.mainMap);

    const shopIcon = L.divIcon({
      className: 'custom-shop-icon',
      html: `
        <div class="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md border border-white flex items-center gap-1 whitespace-nowrap">
          🍱 ครัวกลาง (มมส ขามเรียง)
        </div>
      `,
      iconSize: [160, 30],
      iconAnchor: [80, 15]
    });

    L.marker([shopLat, shopLng], { icon: shopIcon })
      .bindPopup('<b>ร้านป้าติ๋ม ข้าวกล่องเดลิเวอรี</b><br>คณะวิทยาการสารสนเทศ มมส.')
      .addTo(this.mainMap);

    this.renderCustomerMarkers();
    requestAnimationFrame(() => this.mainMap?.invalidateSize({ pan: false }));
  }

  private renderCustomerMarkers(): void {
    if (!this.mainMap) return;
    this.markersLayer.clearLayers();
    this.markerMap.clear();

    const customerIcon = L.divIcon({
      className: 'custom-customer-icon',
      html: `
        <div class="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    this.customers().forEach(c => {
      const lat = Number(c.latitude);
      const lng = Number(c.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng], { icon: customerIcon })
          .bindPopup(`
            <div class="p-1">
              <strong class="text-blue-700 font-bold">${this.formatCustomerId(c.id)}: ${c.name}</strong><br>
              <span class="text-gray-600 text-xs">📞 ${c.phone}</span><br>
              <span class="text-gray-500 text-xs">📍 ${c.address}</span>
            </div>
          `);
        marker.addTo(this.markersLayer);
        this.markerMap.set(c.id, marker);
      }
    });
  }

  private initModalMap(): void {
    setTimeout(() => {
      const lat = Number(this.formData.latitude) || 16.2477;
      const lng = Number(this.formData.longitude) || 103.2539;

      if (this.modalMap) {
        this.modalMap.remove();
      }

      this.modalMap = L.map('modal-picker-map').setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(this.modalMap);

      this.modalMarker = L.marker([lat, lng], { draggable: true }).addTo(this.modalMap);

      this.modalMarker.on('dragend', () => {
        const pos = this.modalMarker!.getLatLng();
        this.formData.latitude = parseFloat(pos.lat.toFixed(6));
        this.formData.longitude = parseFloat(pos.lng.toFixed(6));
      });

      this.modalMap.on('click', (e: L.LeafletMouseEvent) => {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(6));
        const clickedLng = parseFloat(e.latlng.lng.toFixed(6));
        this.formData.latitude = clickedLat;
        this.formData.longitude = clickedLng;
        this.modalMarker?.setLatLng([clickedLat, clickedLng]);
      });

      this.modalMap.invalidateSize();
    }, 200);
  }

  focusCustomerOnMap(customer: Customer): void {
    if (this.mainMap && customer.latitude && customer.longitude) {
      this.mainMap.flyTo([Number(customer.latitude), Number(customer.longitude)], 16);
      const marker = this.markerMap.get(customer.id);
      if (marker) {
        setTimeout(() => marker.openPopup(), 600);
      }
    }
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);
    this.formData = {
      name: '',
      phone: '',
      address: '',
      latitude: 16.2477,
      longitude: 103.2539
    };
    this.isModalOpen.set(true);
    this.initModalMap();
  }

  openEditModal(customer: Customer, event?: Event): void {
    event?.stopPropagation();
    this.isEditing.set(true);
    this.currentEditingId.set(customer.id);
    this.formData = {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      latitude: Number(customer.latitude),
      longitude: Number(customer.longitude)
    };
    this.isModalOpen.set(true);
    this.initModalMap();
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = undefined;
    }
  }

  async saveCustomer(): Promise<void> {
    if (!this.formData.name.trim() || !this.formData.phone.trim() || !this.formData.address.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    try {
      if (this.isEditing() && this.currentEditingId() !== null) {
        const res = await this.customerService.updateCustomer(this.currentEditingId()!, this.formData);
        console.log('[saveCustomer] Update Response:', res);
      } else {
        const res = await this.customerService.createCustomer(this.formData);
        console.log('[saveCustomer] Create Response:', res);
      }

      this.closeModal();
      // เรียกโหลดข้อมูลใหม่จาก Server ทันที
      await this.loadDataAsync();
      alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
    } catch (error: unknown) {
      console.error('[saveCustomer] เกิดข้อผิดพลาดในการบันทึก:', error);
      alert(`บันทึกข้อมูลไม่สำเร็จ: ${this.getRequestErrorMessage(error)}`);
    }
  }

  async deleteCustomer(id: number | string, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (confirm(`คุณต้องการลบข้อมูลลูกค้ารหัส ${this.formatCustomerId(id)} ใช่หรือไม่?`)) {
      try {
        await this.customerService.deleteCustomer(id);
        await this.loadDataAsync();
        alert('ลบข้อมูลเรียบร้อยแล้ว');
      } catch (error: unknown) {
        console.error('[deleteCustomer] ลบไม่สำเร็จ:', error);
        alert(`ลบข้อมูลไม่สำเร็จ: ${this.getRequestErrorMessage(error)}`);
      }
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchKeyword.set(input.value);
  }
}