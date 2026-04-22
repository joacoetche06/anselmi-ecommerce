import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Catalog } from './catalog/catalog';
import { Cart } from './cart/cart'; // <-- 1. Importamos el carrito

export const routes: Routes = [
  { path: '', component: Catalog },
  { path: 'login', component: Login },
  { path: 'cart', component: Cart }, // <-- 2. Lo agregamos al diccionario
];
