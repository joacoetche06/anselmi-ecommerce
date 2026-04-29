import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router'; // <-- 1. Importamos esto
import { CartService, CartItem } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
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

  isLoggedIn = false; // <-- Nueva variable
  guestName: string = ''; // <-- Nueva variable
  guestDni: string = ''; // <-- Nueva variable
  guestEmail: string = ''; // <-- Nueva variable

  isRedirecting: boolean = false;

  // Teléfono de prueba (después le ponemos el real de la empresa)
  // Formato internacional sin el "+" (Ej: 54 9 11 1234 5678)
  companyPhone: string = '5491112345678';

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn(); // Verificamos si es mayorista
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

  checkout() {
    if (this.cartItems.length === 0) return;

    // VALIDACIONES DE INVITADO
    if (!this.isLoggedIn) {
      // 1. Que no estén vacíos
      if (!this.guestName || !this.guestDni || !this.guestEmail) {
        alert('Por favor, completá Nombre, DNI y Email para procesar el pedido.');
        return;
      }

      // 2. Que el email tenga un formato válido (ej: nombre@dominio.com)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.guestEmail)) {
        alert('Por favor, ingresá un correo electrónico válido.');
        return;
      }

      // 3. Que el DNI sean solo números (entre 7 y 8 dígitos)
      const dniRegex = /^\d{7,8}$/;
      if (!dniRegex.test(this.guestDni)) {
        alert('Por favor, ingresá un DNI válido (solo números, sin puntos).');
        return;
      }
    }

    const orderData = {
      items: this.cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name, // <-- 1. NUEVO: Enviamos el nombre para MP
        quantity: item.quantity,
        price: item.product.finalPrice,
      })),
      total: this.cartTotal,
      guestName: this.isLoggedIn ? null : this.guestName,
      guestDni: this.isLoggedIn ? null : this.guestDni,
      guestEmail: this.isLoggedIn ? null : this.guestEmail,
    };

    console.log('Enviando orden a la base de datos...', orderData);

    this.cartService.submitOrder(orderData).subscribe({
      next: (response) => {
        if (response.init_point) {
          // --- FLUJO INVITADO (MERCADO PAGO) ---
          this.isRedirecting = true; // 1. Activamos la pantalla de carga
          this.cartService.clearCart(); // 2. Vaciamos el carrito local (ahora no se va a ver)
          window.location.href = response.init_point; // 3. Redirigimos
        } else {
          // --- FLUJO MAYORISTA (B2B) ---
          this.cartService.clearCart();
          alert('¡Pedido confirmado con éxito! Tu número de orden es: #' + response.orderId);
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('Error al confirmar la compra:', err);
        alert('Hubo un problema al procesar tu pedido. Intentá de nuevo más tarde.');
      },
    });
  }
}
