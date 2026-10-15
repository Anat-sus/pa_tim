import { Routes } from '@angular/router';
import { CustomerManagement } from './pages/customer-management/customer-management';
import { OrderManagement } from './pages/order-management/order-management';
export const routes: Routes = [
    { path: '', redirectTo: 'customer-management', pathMatch: 'full' },
    { path: 'order-management', component: OrderManagement },
    { path: 'customer-management', component: CustomerManagement }
];