import { Routes } from '@angular/router';
import { OrderManagement } from './pages/order-management/order-management';

export const routes: Routes = [
  { path: '', redirectTo: 'order-management', pathMatch: 'full' },
  { path: 'order-management', component: OrderManagement }
];

