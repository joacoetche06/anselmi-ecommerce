import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router'; // <-- Importamos para leer la URL
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-tracking.html',
})
export class OrderTracking implements OnInit {
  orderId: string = '';
  email: string = '';
  orderInfo: any = null;
  error: string = '';
  loading = false;
  paymentSuccessMessage: string = ''; // Mensaje de éxito del pago

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    // 1. Escuchamos los parámetros de la URL apenas carga la página
    this.route.queryParams.subscribe((params) => {
      const status = params['collection_status'];
      const externalRef = params['external_reference'];

      // 2. Si venimos de un pago aprobado en Mercado Pago...
      if (status === 'approved' && externalRef) {
        this.paymentSuccessMessage = '¡Pago acreditado! Estamos confirmando tu orden...';
        this.loading = true;

        // 3. Le avisamos al backend para que pase la orden de PENDING a CONFIRMED
        this.http
          .post(`${environment.apiUrl}/orders/confirm-payment`, {
            external_reference: externalRef,
            status: status,
          })
          .subscribe({
            next: () => {
              this.paymentSuccessMessage = `¡Excelente! El pago de la orden #${externalRef} fue procesado correctamente.`;
              this.orderId = externalRef; // Pre-llenamos el input del ID
              this.loading = false;

              // Limpiamos la URL para que no queden los códigos largos a la vista
              this.router.navigate([], { queryParams: {} });
            },
            error: (err) => {
              console.error('Error al confirmar el pago con el backend:', err);
              this.error =
                'El pago se realizó, pero hubo un error al actualizar el sistema. Contactanos.';
              this.loading = false;
            },
          });
      }
    });
  }

  consultar() {
    this.loading = true;
    this.error = '';
    this.orderInfo = null;
    this.paymentSuccessMessage = ''; // Limpiamos el mensaje de pago si hace una nueva consulta

    this.http
      .get(`${environment.apiUrl}/orders/track?id=${this.orderId}&email=${this.email}`)
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
