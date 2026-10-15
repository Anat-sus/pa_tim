import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerService } from './customer.service';
import { Api } from '../config/api';

const customer = {
  id: 1,
  name: 'สมชาย',
  phone: '0812345678',
  address: 'หอพัก มมส.',
  latitude: '16.2482310',
  longitude: '103.2501250',
};

describe('CustomerService API integration', () => {
  let service: CustomerService;
  let http: HttpTestingController;
  const url = 'https://test.invalid/customers';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Api, useValue: { API_ENDPOINT: 'https://test.invalid/' } },
      ],
    });
    service = TestBed.inject(CustomerService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('normalizes decimal string coordinates from the documented response', async () => {
    const result = service.getCustomers();
    http.expectOne(url).flush([customer]);
    expect(await result).toEqual([{ ...customer, latitude: 16.248231, longitude: 103.250125 }]);
  });

  it('sends Thai name searches as query parameters', async () => {
    const result = service.searchCustomers(' สมชาย ');
    const request = http.expectOne(
      (request) => request.url === `${url}/search` && request.params.get('name') === 'สมชาย',
    );
    request.flush([customer]);
    expect((await result)[0].id).toBe(1);
  });

  it('matches a displayed customer ID without sending it to the name-only endpoint', async () => {
    const result = service.searchCustomers('CUST-001');
    http.expectOne(url).flush([customer, { ...customer, id: 2 }]);
    expect((await result).map((customer) => customer.id)).toEqual([1]);
  });

  it('preserves distance returned by the nearby endpoint', async () => {
    const result = service.getNearbyCustomers();
    const request = http.expectOne(
      (request) => request.url === `${url}/near` && request.params.get('km') === '1',
    );
    request.flush({ data: [{ ...customer, distance_km: '0.18' }] });
    expect((await result)[0].distance_km).toBe(0.18);
  });

  it('rejects empty coordinates instead of turning them into zero', async () => {
    const result = service.getCustomers();
    http.expectOne(url).flush([{ ...customer, latitude: '' }]);
    await expect(result).rejects.toThrow('ละติจูด');
  });

  it('rejects out-of-range coordinates before creating map markers', async () => {
    const result = service.getCustomers();
    http.expectOne(url).flush([{ ...customer, latitude: '91' }]);
    await expect(result).rejects.toThrow('ละติจูด');
  });

  it('saves the full address and landmark in the documented payload', async () => {
    const result = service.createCustomer({
      name: ' สมชาย ',
      phone: ' 0812345678 ',
      address: ' หอพัก มมส. ฝากไว้ที่ป้อมยาม ',
      latitude: 16.248231,
      longitude: 103.250125,
    });
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.address).toBe('หอพัก มมส. ฝากไว้ที่ป้อมยาม');
    expect(request.request.body.name).toBe('สมชาย');
    request.flush({ affected_row: 1, last_idx: 2 });
    await result;
  });
});
