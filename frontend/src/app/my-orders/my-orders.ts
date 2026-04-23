import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para el DatePipe y pipes de moneda
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  orders: any[] = [];
  loading = true;
  errorMessage: string | null = null; // <-- Nueva variable

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos', err);
        this.errorMessage = 'No pudimos cargar tus pedidos. Por favor, intentá más tarde.';
        this.loading = false;
      },
    });
  }
}
