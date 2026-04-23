import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-tracking.html',
})
export class OrderTracking {
  orderId: string = '';
  email: string = '';
  orderInfo: any = null;
  error: string = '';
  loading = false;

  constructor(private http: HttpClient) {}

  consultar() {
    this.loading = true;
    this.error = '';
    this.orderInfo = null;

    this.http
      .get(`http://localhost:3001/api/orders/track?id=${this.orderId}&email=${this.email}`)
      .subscribe({
        next: (data) => {
          this.orderInfo = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error.message || 'Error al buscar el pedido.';
          this.loading = false;
        },
      });
  }
}
