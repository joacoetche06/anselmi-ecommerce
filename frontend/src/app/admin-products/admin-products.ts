import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.html',
})
export class AdminProducts implements OnInit {
  products: Product[] = [];
  loading = true;
  error = '';

  showModal = false;
  isEditing = false;

  // Variables corregidas a listPrice
  currentProduct: Partial<Product> = {
    name: '',
    sku: '',
    listPrice: 0,
    stockQuantity: 0,
    discountPercentage: 0,
    imageUrl: '',
  };

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    // LLAMAMOS A LA RUTA NUEVA DE MAXI
    this.productService.getAdminProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.error = 'Error al cargar el catálogo.';
        this.loading = false;
      },
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentProduct = {
      name: '',
      sku: '',
      listPrice: 0,
      stockQuantity: 0,
      discountPercentage: 0,
      imageUrl: '',
    };
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.isEditing = true;
    this.currentProduct = { ...product };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveProduct() {
    if (this.isEditing && this.currentProduct.id) {
      this.productService.updateProduct(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => alert('Error al actualizar el producto.'),
      });
    } else {
      this.productService.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => alert('Error al crear el producto.'),
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('¿Estás seguro de que querés borrar este producto de forma permanente?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) =>
          alert('No se pudo borrar. Asegurate de que no esté incluido en ninguna orden previa.'),
      });
    }
  }
}
