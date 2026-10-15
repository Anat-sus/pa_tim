import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  protected readonly navigationItems = [
    {
      label: 'ลูกค้า',
      description: 'จัดการข้อมูลลูกค้า',
      route: '/customer-management',
    },
    {
      label: 'คำสั่งซื้อ',
      description: 'จัดการออเดอร์',
      route: '/order-management',
    },
    {
      label: 'จัดส่ง',
      description: 'วางแผนเส้นทาง',
      route: '/route-dashboard',
    },
  ];
}
