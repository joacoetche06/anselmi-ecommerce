import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
})
export class AdminOrders implements OnInit {
  orders: any[] = [];
  loading = true;

  constructor(
    private cartService: CartService,
    private modalService: ModalService,
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.cartService.getAllOrdersAdmin().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar panel de admin', err);
        this.loading = false;
      },
    });
  }

  changeStatus(orderId: number, newStatus: string) {
    // Llamamos al backend para hacer el cambio
    this.cartService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (res) => {
        // Actualizamos el estado localmente para no tener que recargar toda la página
        const orderIndex = this.orders.findIndex((o) => o.id === orderId);
        if (orderIndex !== -1) {
          this.orders[orderIndex].status = newStatus;
        }

        // Un pequeño feedback visual (opcional)
        this.modalService.show(
          `✅ ¡El pedido #${orderId} pasó a estado: ${newStatus.toUpperCase()}!`,
        );
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.modalService.show(
          'Hubo un problema al actualizar la orden. Revisá tu conexión.',
          true,
        );
        // Si falla, volvemos a cargar las órdenes para revertir el selector al estado real
        this.loadOrders();
      },
    });
  }
}
