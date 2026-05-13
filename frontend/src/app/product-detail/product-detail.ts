import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModalService } from '../modal.service';
import { CartService } from '../services/cart.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service'; // <-- Importar esto

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink, FormsModule],
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

  reviews: any[] = [];
  newRating: number = 5;
  newComment: string = '';
  isSubmittingReview: boolean = false;
  filteredReviews: any[] = [];
  selectedFilter: string | number = 'all';

  relatedProducts: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService, // <--- Nuevo
    private modalService: ModalService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const productId = params.get('id');
      if (productId) {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // <--- MAGIA ACÁ
        this.loading = true;
        this.fetchProduct(productId);
        this.loadReviews(productId);
        this.loadRelatedProducts(productId);
      }
    });
  }

  loadRelatedProducts(id: string | number) {
    this.productService.getRelatedProducts(id).subscribe({
      next: (data) => (this.relatedProducts = data),
      error: (err) => console.error('Error cargando relacionados', err),
    });
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

  loadReviews(id: string | number) {
    this.productService.getReviewsByProduct(id).subscribe({
      next: (data) => {
        this.reviews = data; // 1. Guardamos los datos
        this.applyFilter(); // 2. RECIÉN ACÁ filtramos, cuando ya tenemos la data
      },
      error: (err) => console.error('Error cargando reseñas', err),
    });
  }

  submitReview() {
    if (!this.newComment.trim()) return;

    this.isSubmittingReview = true;
    this.productService
      .createReview(this.product.id, {
        rating: this.newRating,
        comment: this.newComment,
      })
      .subscribe({
        next: () => {
          this.modalService.show('¡Gracias por tu reseña!');
          this.newComment = '';
          this.newRating = 5;
          this.loadReviews(this.product.id); // Recargamos la lista
          this.isSubmittingReview = false;
        },
        error: (err) => {
          this.modalService.show('Error al guardar la reseña', true);
          this.isSubmittingReview = false;
        },
      });
  }

  // Reutilizamos la función de las estrellitas
  getStars(rating: number): number[] {
    return new Array(rating);
  }

  applyFilter() {
    if (this.selectedFilter === 'all') {
      this.filteredReviews = [...this.reviews];
    } else {
      const targetRating = Number(this.selectedFilter);
      this.filteredReviews = this.reviews.filter((r) => r.rating === targetRating);
    }
  }
}
