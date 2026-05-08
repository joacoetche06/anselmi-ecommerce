import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// Importa tu servicio de carrito/auth si los necesitas para el precio o los botones

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  loading: boolean = true;
  // Variable para mover el centro del zoom
  zoomOrigin: string = '50% 50%';

  // Función que calcula la posición del mouse
  updateZoom(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Calculamos el porcentaje (de 0 a 100) en el eje X e Y
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Actualizamos el origen de la transformación
    this.zoomOrigin = `${x}% ${y}%`;
  }

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    // Capturamos el ID de la URL
    const productId = this.route.snapshot.paramMap.get('id');

    if (productId) {
      this.fetchProduct(productId);
    }
  }

  fetchProduct(id: string) {
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando producto', err);
        this.loading = false;
      },
    });
  }

  // Acá después agregaremos la lógica de agregar al carrito o pedir presupuesto
}
