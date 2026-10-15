import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Api } from '../config/api';
import { Customer, CreateCustomerDto } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private api = inject(Api);
  private readonly apiUrl = `${this.api.API_ENDPOINT.replace(/\/+$/, '')}/customers`;

  // 1. ดึงรายชื่อลูกค้าทั้งหมด (GET /customers)
  public async getCustomers(): Promise<Customer[]> {
    const response: unknown = await lastValueFrom(this.http.get<unknown>(this.apiUrl));
    const rawList = Array.isArray(response)
      ? response
      : this.isRecord(response) && Array.isArray(response['data'])
        ? response['data']
        : null;

    if (!rawList) {
      throw new Error('รูปแบบข้อมูลจาก API ไม่ถูกต้อง: ต้องได้รับรายการลูกค้า');
    }

    return rawList.map(item => this.normalizeCustomer(item));
  }

  // 2. เพิ่มลูกค้าใหม่ (POST /customers)
  public async createCustomer(dto: CreateCustomerDto): Promise<unknown> {
    return lastValueFrom(this.http.post(this.apiUrl, this.toPayload(dto)));
  }

  // 3. แก้ไขข้อมูลลูกค้า (PUT /customers/:id)
  public async updateCustomer(id: number | string, dto: CreateCustomerDto): Promise<unknown> {
    return lastValueFrom(this.http.put(`${this.apiUrl}/${encodeURIComponent(id)}`, this.toPayload(dto)));
  }

  // 4. ลบข้อมูลลูกค้า (DELETE /customers/:id)
  public async deleteCustomer(id: number | string): Promise<unknown> {
    return lastValueFrom(this.http.delete(`${this.apiUrl}/${encodeURIComponent(id)}`));
  }

  private toPayload(dto: CreateCustomerDto): CreateCustomerDto {
    const latitude = Number(dto.latitude);
    const longitude = Number(dto.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('ละติจูดต้องอยู่ระหว่าง -90 ถึง 90');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180');
    }

    return {
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      address: dto.address.trim(),
      latitude: Number(latitude.toFixed(7)),
      longitude: Number(longitude.toFixed(7))
    };
  }

  private normalizeCustomer(value: unknown): Customer {
    if (!this.isRecord(value)) {
      throw new Error('รูปแบบข้อมูลลูกค้าจาก API ไม่ถูกต้อง');
    }

    const id = value['id'];
    const latitude = this.parseCoordinate(value['latitude'], 'ละติจูด');
    const longitude = this.parseCoordinate(value['longitude'], 'ลองจิจูด');

    if ((typeof id !== 'number' && typeof id !== 'string') || String(id).trim() === '') {
      throw new Error('ข้อมูลลูกค้าจาก API ไม่มีรหัสลูกค้าที่ถูกต้อง');
    }

    const name = this.readRequiredString(value, 'name');
    const phone = this.readRequiredString(value, 'phone');
    const address = this.readRequiredString(value, 'address');

    return {
      id,
      name,
      phone,
      address,
      latitude,
      longitude,
      ...(typeof value['created_at'] === 'string' ? { created_at: value['created_at'] } : {})
    };
  }

  private parseCoordinate(value: unknown, label: string): number {
    const coordinate = typeof value === 'number' || typeof value === 'string'
      ? Number(value)
      : Number.NaN;

    if (!Number.isFinite(coordinate)) {
      throw new Error(`ข้อมูลลูกค้าจาก API มี${label}ไม่ถูกต้อง`);
    }

    return coordinate;
  }

  private readRequiredString(value: Record<string, unknown>, field: string): string {
    const fieldValue = value[field];
    if (typeof fieldValue !== 'string') {
      throw new Error(`ข้อมูลลูกค้าจาก API ไม่มีฟิลด์ ${field} ที่ถูกต้อง`);
    }
    return fieldValue;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
