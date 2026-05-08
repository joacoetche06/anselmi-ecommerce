import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModalService } from '../modal.service';
import { CartService } from '../services/cart.service';
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
    private cartService: CartService, // <--- Nuevo
    private modalService: ModalService,
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

  // Lógica del Semáforo (Copiada de catalog.ts para consistencia)
  getStockLevel(stock: number): number {
    if (stock < 10) return 1; // Nivel Bajo (Rojo)
    if (stock >= 10 && stock <= 50) return 2; // Nivel Medio (Amarillo)
    return 3; // Nivel Alto (Verde)
  }

  getStockLabel(stock: number): string {
    if (stock < 10) return 'Disponibilidad: Baja (Pocas unidades)';
    if (stock >= 10 && stock <= 50) return 'Disponibilidad: Media';
    return 'Disponibilidad: Alta (Stock garantizado)';
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, 1);
      this.modalService.show(`¡${this.product.name} agregado al pedido!`);
    }
  }
}
