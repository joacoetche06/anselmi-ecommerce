import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Catalog } from './catalog/catalog';
import { Cart } from './cart/cart'; // <-- 1. Importamos el carrito
import { MyOrders } from './my-orders/my-orders'; // <-- 2. Importamos mis pedidos

export const routes: Routes = [
  { path: '', component: Catalog },
  { path: 'login', component: Login },
  { path: 'cart', component: Cart }, // <-- 2. Lo agregamos al diccionario
  { path: 'my-orders', component: MyOrders }, // <-- 3. Agregamos la ruta a mis pedidos
];
