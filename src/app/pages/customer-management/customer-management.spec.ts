import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as L from 'leaflet';
import { CustomerManagement } from './customer-management';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { environment } from '../../../environments/environment';

const customer: Customer = {
  id: 1,
  name: 'สมชาย',
  phone: '0812345678',
  address: 'หอพัก มมส.',
  latitude: 16.248231,
  longitude: 103.250125,
};

describe('Customer management workflows', () => {
  let fixture: ComponentFixture<CustomerManagement>;
  let page: CustomerManagement;
  let service: {
    getCustomers: ReturnType<typeof vi.fn>;
    searchCustomers: ReturnType<typeof vi.fn>;
    getNearbyCustomers: ReturnType<typeof vi.fn>;
    createCustomer: ReturnType<typeof vi.fn>;
    updateCustomer: ReturnType<typeof vi.fn>;
    deleteCustomer: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getCustomers: vi.fn().mockResolvedValue([customer]),
      searchCustomers: vi.fn().mockResolvedValue([customer]),
      getNearbyCustomers: vi.fn().mockResolvedValue([customer]),
      createCustomer: vi.fn().mockResolvedValue({ affected_row: 1 }),
      updateCustomer: vi.fn().mockResolvedValue({ affected_row: 1 }),
      deleteCustomer: vi.fn().mockResolvedValue({ affected_row: 1 }),
    };
    TestBed.configureTestingModule({
      imports: [CustomerManagement],
      providers: [{ provide: CustomerService, useValue: service }],
    });
    fixture = TestBed.createComponent(CustomerManagement);
    page = fixture.componentInstance;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    // jsdom does not implement the browser dialog top layer.
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
    dialog.close = vi.fn(() => dialog.removeAttribute('open'));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('intersects search results with nearby customers and resets both filters', async () => {
    service.getNearbyCustomers.mockResolvedValue([customer, { ...customer, id: 2 }]);
    page.searchKeyword = 'สมชาย';
    await page.onSearch();
    page.radiusKm = 1;
    await page.onFilterNearby();
    expect(service.searchCustomers).toHaveBeenCalledWith('สมชาย');
    expect(service.getNearbyCustomers).toHaveBeenCalledWith(1);
    expect(page.customers().map((customer) => customer.id)).toEqual([1]);
    await page.resetFilters();
    expect(page.appliedSearch()).toBe('');
    expect(page.appliedRadius()).toBeNull();
    expect(service.getCustomers).toHaveBeenCalled();
  });

  it('ignores stale responses when a newer search has completed', async () => {
    let resolveOld!: (customers: Customer[]) => void;
    service.getCustomers.mockReturnValue(
      new Promise<Customer[]>((resolve) => {
        resolveOld = resolve;
      }),
    );
    const oldLoad = page.loadDataAsync();
    page.searchKeyword = 'สมชาย';
    await page.onSearch();
    resolveOld([{ ...customer, id: 99 }]);
    await oldLoad;
    expect(page.customers()[0].id).toBe(1);
  });

  it('clears previous results when a filter request fails', async () => {
    await page.loadDataAsync();
    service.getNearbyCustomers.mockRejectedValue(new Error('offline'));
    await page.onFilterNearby();
    expect(page.customers()).toEqual([]);
    expect(page.loadError()).toBe('offline');
    expect(page.isLoading()).toBe(false);
  });

  it('does not submit a customer outside the 3 km service area', async () => {
    page.formData = { ...customer, latitude: 17, longitude: 104 };
    await page.saveCustomer();
    expect(service.createCustomer).not.toHaveBeenCalled();
    expect(page.formError()).toContain('3 กิโลเมตร');
  });

  it('updates the original ID then refreshes without falsely reporting a failed save', async () => {
    page.editCustomer(customer);
    page.formData.address = 'หอพัก มมส. ฝากไว้ที่ป้อมยาม';
    service.getCustomers.mockRejectedValue(new Error('offline'));
    await page.saveCustomer();
    expect(service.updateCustomer).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ address: 'หอพัก มมส. ฝากไว้ที่ป้อมยาม' }),
    );
    expect(page.editingId()).toBeNull();
    expect(page.feedback()).toContain('บันทึกข้อมูลแล้ว');
    expect(page.loadError()).toBe('offline');
  });

  it('prevents duplicate requests while a save is pending', async () => {
    let finishSave!: (value: unknown) => void;
    service.createCustomer.mockReturnValue(
      new Promise((resolve) => {
        finishSave = resolve;
      }),
    );
    page.formData = {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      latitude: Number(customer.latitude),
      longitude: Number(customer.longitude),
    };
    const saving = page.saveCustomer();
    await page.saveCustomer();
    expect(service.createCustomer).toHaveBeenCalledTimes(1);
    finishSave({ affected_row: 1 });
    await saving;
    expect(page.isSaving()).toBe(false);
    expect(page.formData.latitude).toBe(environment.shop.lat);
  });

  it('keeps a referenced customer visible when the server refuses deletion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await page.loadDataAsync();
    service.deleteCustomer.mockRejectedValue(
      new HttpErrorResponse({ status: 409, error: { error: 'Foreign key constraint' } }),
    );
    await page.deleteCustomer(customer);
    expect(page.customers()).toEqual([customer]);
    expect(page.loadError()).toContain('ออเดอร์อ้างอิง');
    expect(page.deletingId()).toBeNull();
  });

  async function openPicker(): Promise<{ pickerMap: L.Map; pickerMarker: L.Marker }> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.page-heading button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return page as unknown as { pickerMap: L.Map; pickerMarker: L.Marker };
  }

  it('hides the form until Add customer is clicked and immediately shows a draggable pin', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#customer-form')).toBeNull();
    const state = await openPicker();
    expect(page.isFormOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    expect(state.pickerMarker.dragging?.enabled()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('#customer-picker-map .customer-shop-pin')?.textContent,
    ).toContain('ร้านป้าติ๋ม');
    expect(state.pickerMarker.getLatLng()).toEqual(
      L.latLng(environment.shop.lat, environment.shop.lng),
    );
    expect(
      fixture.nativeElement.querySelector('#customer-picker-map .customer-picker-pin svg'),
    ).not.toBeNull();
  });

  it('updates visible coordinates and the pin when the picker map is clicked', async () => {
    const state = await openPicker();
    state.pickerMap.fire('click', { latlng: L.latLng(16.2475, 103.251) });
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('#customer-latitude') as HTMLInputElement).value,
    ).toBe('16.2475');
    expect(
      (fixture.nativeElement.querySelector('#customer-longitude') as HTMLInputElement).value,
    ).toBe('103.251');
    expect(state.pickerMarker.getLatLng()).toEqual(L.latLng(16.2475, 103.251));
  });

  it('updates the form when the pin is dragged', async () => {
    const state = await openPicker();
    state.pickerMarker.setLatLng([16.248, 103.252]);
    state.pickerMarker.fire('dragend');
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('#customer-latitude') as HTMLInputElement).value,
    ).toBe('16.248');
    expect(page.formData.longitude).toBe(103.252);
  });

  it('keeps the pin in view when coordinates are changed manually', async () => {
    const state = await openPicker();
    const pan = vi.spyOn(state.pickerMap, 'panTo');
    page.formData.latitude = 21.246839;
    page.updatePicker();
    expect(state.pickerMarker.getLatLng().lat).toBe(21.246839);
    expect(pan).toHaveBeenCalledWith([21.246839, environment.shop.lng]);
  });

  it('opens editing at the existing customer location', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    page.editCustomer(customer);
    await fixture.whenStable();
    const state = page as unknown as { pickerMarker: L.Marker };
    expect(page.isFormOpen()).toBe(true);
    expect(page.editingId()).toBe(1);
    expect(state.pickerMarker.getLatLng()).toEqual(
      L.latLng(Number(customer.latitude), Number(customer.longitude)),
    );
    expect((fixture.nativeElement.querySelector('#customer-name') as HTMLInputElement).value).toBe(
      customer.name,
    );
  });

  it('cleans up the picker on cancel and opens a fresh form without duplicate maps', async () => {
    const state = await openPicker();
    const remove = vi.spyOn(state.pickerMap, 'remove');
    page.formData.name = 'unsaved';
    page.closeForm();
    await fixture.whenStable();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(page.isFormOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('#customer-form')).toBeNull();
    page.openAddForm();
    await fixture.whenStable();
    expect(page.formData.name).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.customer-picker-pin')).toHaveLength(1);
  });
});
