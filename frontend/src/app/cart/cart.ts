import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router'; // <-- 1. Importamos esto
import { CartService, CartItem } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../modal.service';
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

  isProcessing: boolean = false; // Controla la pantalla de carga general
  isRedirecting: boolean = false; // Controla si el texto dice "Redirigiendo a MP"
  // Teléfono de prueba (después le ponemos el real de la empresa)
  // Formato internacional sin el "+" (Ej: 54 9 11 1234 5678)
  companyPhone: string = '5491112345678';

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService,
    private modalService: ModalService,
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
        this.modalService.show(
          'Por favor, completá Nombre, DNI y Email para procesar el pedido.',
          true,
        );
        return;
      }

      // 2. Que el email tenga un formato válido (ej: nombre@dominio.com)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.guestEmail)) {
        this.modalService.show('Por favor, ingresá un correo electrónico válido.', true);
        return;
      }

      // 3. Que el DNI sean solo números (entre 7 y 8 dígitos)
      const dniRegex = /^\d{7,8}$/;
      if (!dniRegex.test(this.guestDni)) {
        this.modalService.show(
          'Por favor, ingresá un DNI válido (solo números, sin puntos).',
          true,
        );
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

    // ... validaciones previas ...

    console.log('Enviando orden a la base de datos...', orderData);

    // PRENDEMOS LA PANTALLA DE CARGA ACÁ:
    this.isProcessing = true;

    this.cartService.submitOrder(orderData).subscribe({
      next: (response) => {
        if (response.init_point) {
          // Flujo MP
          this.isRedirecting = true; // Cambia el texto a "Redirigiendo..."
          this.cartService.clearCart();
          window.location.href = response.init_point;
        } else {
          // --- FLUJO MAYORISTA (B2B) ---
          this.isProcessing = false; // 1. Apagamos la carga
          this.cartService.clearCart(); // 2. Vaciamos el carrito

          this.modalService.show(
            '¡Pedido confirmado con éxito! Tu número de orden es: #' + response.orderId,
          );
          this.router.navigate(['/my-orders']);
        }
      },
      error: (err) => {
        this.isProcessing = false; // APAGAMOS LA CARGA SI HAY ERROR
        console.error('Error al confirmar la compra:', err);
        this.modalService.show(
          'Hubo un problema al procesar tu pedido. Intentá de nuevo más tarde.',
          true,
        );
      },
    });
  }
}
