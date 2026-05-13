import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- Agregado
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service'; // <-- Agregado

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule], // <-- Agregado
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  latestReviews: any[] = []; // <-- Variable para guardar las reseñas

  constructor(
    private authService: AuthService,
    private router: Router,
    private productService: ProductService, // <-- Inyectado
  ) {}

  ngOnInit() {
    // Si es administrador, lo mandamos directo a la gestión de pedidos
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin-orders']);
      return;
    }

    // Traemos las opiniones generales y filtramos las mejores para la Home
    this.productService.getCompanyReviews().subscribe({
      next: (data) => {
        this.latestReviews = data
          .filter((r) => r.rating >= 4) // Solo 4 o 5 estrellas
          .slice(0, 3); // Máximo 3 reseñas
      },
      error: (err) => console.error('Error cargando reseñas', err),
    });
  }

  // Pequeña función de ayuda para dibujar las estrellitas en el HTML
  getStars(rating: number): number[] {
    return new Array(rating);
  }
}
