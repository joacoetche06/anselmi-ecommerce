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
import { MyData } from './my-data/my-data';
import { ProductDetailComponent } from './product-detail/product-detail';
import { Community } from './community/community';
import { ResetPassword } from './reset-password/reset-password';

export const routes: Routes = [
  { path: '', component: Home },

  { path: 'catalogo', component: Catalog },
  { path: 'comunidad', component: Community },

  { path: 'reset-password', component: ResetPassword },

  { path: 'cart', component: Cart },
  { path: 'login', component: Login },
  { path: 'track-order', component: OrderTracking },

  { path: 'producto/:id', component: ProductDetailComponent },

  { path: 'my-data', component: MyData, canActivate: [authGuard] },

  // Cliente Mayorista
  { path: 'my-orders', component: MyOrders, canActivate: [authGuard] },

  // MAXI (Admin) - AHORA CON EL CANDADO REAL
  { path: 'admin-orders', component: AdminOrders, canActivate: [AdminGuard] },
  { path: 'admin-clients', component: AdminClients, canActivate: [AdminGuard] },
  { path: 'admin-products', component: AdminProducts, canActivate: [AdminGuard] }, // <-- Nueva ruta
  { path: 'admin/config', component: AdminConfigComponent }, // Acordate de protegerla con tu AdminGuard si lo tenés
];
