import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Catalog } from './catalog/catalog';
import { Cart } from './cart/cart'; // <-- 1. Importamos el carrito
import { MyOrders } from './my-orders/my-orders'; // <-- 2. Importamos mis pedidos
import { AdminOrders } from './admin-orders/admin-orders'; // <-- 3. Importamos el panel de Maxi
import { AdminGuard } from './guards/admin-guard'; // <-- Importalo
import { AdminClients } from './admin-clients/admin-clients';
import { authGuard } from './guards/auth-guard';
import { OrderTracking } from './order-tracking/order-tracking';

export const routes: Routes = [
  { path: '', component: Catalog },
  { path: 'cart', component: Cart },
  { path: 'login', component: Login },
  // Protegemos mis pedidos y el panel de admin
  { path: 'my-orders', component: MyOrders, canActivate: [authGuard] },
  { path: 'admin-orders', component: AdminOrders, canActivate: [authGuard] },
  { path: 'admin-clients', component: AdminClients, canActivate: [authGuard] },
  { path: 'track-order', component: OrderTracking },
];
