import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './community.html',
  styleUrls: ['./community.scss'],
})
export class Community implements OnInit {
  reviews: any[] = [];
  filteredReviews: any[] = []; // <--- NUEVO
  selectedFilter: string | number = 'all'; // <--- NUEVO
  newRating: number = 5;
  newComment: string = '';
  isSubmitting: boolean = false;

  constructor(
    public authService: AuthService,
    private productService: ProductService,
    private modalService: ModalService,
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.productService.getCompanyReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.applyFilter(); // Aplicamos el filtro al cargar
      },
      error: (err) => console.error('Error cargando la comunidad', err),
    });
  }

  // NUEVA FUNCIÓN: Lógica del filtro
  applyFilter() {
    if (this.selectedFilter === 'all') {
      this.filteredReviews = [...this.reviews];
    } else {
      const targetRating = Number(this.selectedFilter);
      this.filteredReviews = this.reviews.filter((r) => r.rating === targetRating);
    }
  }

  submitReview() {
    if (!this.newComment.trim()) return;
    this.isSubmitting = true;

    this.productService
      .createCompanyReview({
        rating: this.newRating,
        comment: this.newComment,
      })
      .subscribe({
        next: () => {
          this.modalService.show('¡Gracias por tu opinión sobre Anselmi!');
          this.newComment = '';
          this.newRating = 5;
          this.loadReviews(); // Recargamos para ver el comentario nuevo
          this.isSubmitting = false;
        },
        error: () => {
          this.modalService.show('Error al guardar tu opinión', true);
          this.isSubmitting = false;
        },
      });
  }

  getStars(rating: number): number[] {
    return new Array(rating);
  }
}
