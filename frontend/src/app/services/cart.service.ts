import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Acá guardamos los items en memoria
  private items: CartItem[] = [];

  // Estos "Subjects" avisan a la interfaz cada vez que cambia el carrito o el total
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private totalSubject = new BehaviorSubject<number>(0);

  // Variables públicas para que los componentes se suscriban y escuchen los cambios
  cartItems$ = this.cartSubject.asObservable();
  cartTotal$ = this.totalSubject.asObservable();

  constructor() {}

  // 1. Agregar un producto al carrito
  addToCart(product: Product, quantity: number = 1) {
    const existingItem = this.items.find((item) => item.product.id === product.id);

    if (existingItem) {
      // Si ya estaba, le sumamos la cantidad
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * product.finalPrice;
    } else {
      // Si es nuevo, lo empujamos a la lista
      this.items.push({
        product,
        quantity,
        subtotal: product.finalPrice * quantity,
      });
    }

    this.updateCart();
  }

  // 2. Eliminar un producto entero
  removeFromCart(productId: number) {
    this.items = this.items.filter((item) => item.product.id !== productId);
    this.updateCart();
  }

  // 3. Cambiar la cantidad a mano (+ o - en el input)
  updateQuantity(productId: number, quantity: number) {
    const item = this.items.find((item) => item.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        item.subtotal = item.quantity * item.product.finalPrice;
        this.updateCart();
      }
    }
  }

  // 4. Vaciar el carrito (por ej, después de comprar)
  clearCart() {
    this.items = [];
    this.updateCart();
  }

  // Función interna para recalcular todo y avisarle a los componentes
  private updateCart() {
    this.cartSubject.next([...this.items]); // Emitimos la nueva lista

    // Calculamos la suma de todos los subtotales
    const total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    // Redondeamos para no tener errores de decimales extraños
    this.totalSubject.next(parseFloat(total.toFixed(2)));
  }
}
