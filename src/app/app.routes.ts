import { Routes } from '@angular/router';
import { CustomerManagement } from './pages/customer-management/customer-management';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'customer-management' },
    { path: 'customer-management', component: CustomerManagement }
];
