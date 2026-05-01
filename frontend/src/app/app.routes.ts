import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Catalog } from './catalog/catalog';
import { Cart } from './cart/cart';
import { MyOrders } from './my-orders/my-orders';
import { AdminOrders } from './admin-orders/admin-orders';
import { AdminGuard } from './guards/admin-guard';
import { AdminClients } from './admin-clients/admin-clients';
import { authGuard } from './guards/auth-guard';
import { OrderTracking } from './order-tracking/order-tracking';
// Importamos el nuevo componente que vamos a crear en un segundo:
import { AdminProducts } from './admin-products/admin-products';
import { Home } from './home/home';
import { AdminConfigComponent } from './admin-config/admin-config';

export const routes: Routes = [
  { path: '', component: Home },

  { path: 'catalogo', component: Catalog },
  { path: 'cart', component: Cart },
  { path: 'login', component: Login },
  { path: 'track-order', component: OrderTracking },

  // Cliente Mayorista
  { path: 'my-orders', component: MyOrders, canActivate: [authGuard] },

  // MAXI (Admin) - AHORA CON EL CANDADO REAL
  { path: 'admin-orders', component: AdminOrders, canActivate: [AdminGuard] },
  { path: 'admin-clients', component: AdminClients, canActivate: [AdminGuard] },
  { path: 'admin-products', component: AdminProducts, canActivate: [AdminGuard] }, // <-- Nueva ruta
  { path: 'admin/config', component: AdminConfigComponent }, // Acordate de protegerla con tu AdminGuard si lo tenés
];
