import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../services/product.service';
import { CartService } from '../services/cart.service'; // <-- 1. Importamos el carrito

@Component({
  selector: 'app-catalog',
  standalone: true,
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  products: Product[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService, // <-- 2. Lo inyectamos acá
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data) => (this.products = data),
      error: (err) => console.error('Error al cargar productos', err),
    });
  }

  // 3. Creamos la función para el botón
  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
    // Un pequeño feedback visual rápido para el usuario
    alert(`¡${product.name} agregado al pedido!`);
  }
}
