import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // <-- 1. Importamos esto
import { CartService, CartItem } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, RouterModule], // Necesario para los inputs de cantidad
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;

  // Teléfono de prueba (después le ponemos el real de la empresa)
  // Formato internacional sin el "+" (Ej: 54 9 11 1234 5678)
  companyPhone: string = '5491112345678';

  constructor(private cartService: CartService) {}

  ngOnInit() {
    // Nos conectamos a las variables en vivo del servicio
    this.cartService.cartItems$.subscribe((items) => (this.cartItems = items));
    this.cartService.cartTotal$.subscribe((total) => (this.cartTotal = total));
  }

  // Cuando cambian el numerito en el input
  onQuantityChange(productId: number, event: any) {
    const newQty = Number(event.target.value);
    this.cartService.updateQuantity(productId, newQty);
  }

  // Cuando tocan el botón de borrar
  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  // Borrá checkoutWhatsApp() y agregá esto:

  checkout() {
    if (this.cartItems.length === 0) return;

    // Acá armamos el objeto exacto que le vamos a mandar al backend
    const orderData = {
      items: this.cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.finalPrice,
      })),
      total: this.cartTotal,
    };

    console.log('Enviando orden a la base de datos...', orderData);
    alert('¡Pedido confirmado! (Falta conectar esta acción con el backend)');

    // Próximo paso: this.http.post('http://localhost:3001/api/orders', orderData)...
  }
}
