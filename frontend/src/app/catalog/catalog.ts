import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para los ngIf
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]
import { ProductService, Product } from '../services/product.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule], // Sumamos los módulos
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  products: Product[] = [];

  // Variables para la búsqueda y orden
  searchTerm: string = '';
  selectedOrder: string = '';

  selectedLines: string[] = [];
  selectedColors: string[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.loadProducts(); // Llamamos a la función de carga
  }

  // Carga los productos, opcionalmente enviando los filtros a la URL
  loadProducts() {
    // 1. Armamos la cadena de consulta (query params)
    let queryParams = '?';

    if (this.searchTerm) {
      queryParams += `search=${encodeURIComponent(this.searchTerm)}&`;
    }

    if (this.selectedOrder) {
      queryParams += `orderBy=${this.selectedOrder}&`;
    }

    // --- NUEVO: Agregamos los filtros a la URL ---
    // (OJO: Leelo completo antes de probarlo)
    if (this.selectedLines.length > 0) {
      queryParams += `linea=${this.selectedLines.join(',')}&`;
    }

    if (this.selectedColors.length > 0) {
      queryParams += `color=${this.selectedColors.join(',')}&`;
    }
    // ---------------------------------------------

    // Limpiamos el último '&' o '?' si quedó suelto
    if (queryParams.endsWith('&') || queryParams === '?') {
      queryParams = queryParams.slice(0, -1);
    }

    // 2. Llamamos al servicio con la query (Requiere un pequeño ajuste en tu productService)
    this.productService.getProducts(queryParams).subscribe({
      next: (data) => (this.products = data),
      error: (err) => console.error('Error al cargar productos', err),
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
    alert(`¡${product.name} agregado al pedido!`);
  }

  // Función que se dispara cada vez que el usuario tilda/destilda un checkbox
  toggleFilter(filterList: string[], value: string) {
    const index = filterList.indexOf(value);
    if (index > -1) {
      filterList.splice(index, 1); // Si ya estaba tildado, lo sacamos de la lista
    } else {
      filterList.push(value); // Si no estaba, lo agregamos
    }
    this.loadProducts(); // Recargamos el catálogo con los nuevos filtros
  }
}
