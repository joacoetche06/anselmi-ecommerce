import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../services/product.service';
import { ModalService } from '../modal.service';

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
    hidden: false,
  };

  constructor(
    private productService: ProductService,
    private modalService: ModalService,
  ) {}

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
        error: (err) => this.modalService.show('Error al actualizar el producto.', true),
      });
    } else {
      this.productService.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => this.modalService.show('Error al crear el producto.', true),
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('¿Ocultar este producto del catálogo? Podés volver a mostrarlo cuando quieras.')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => this.modalService.show('No se pudo ocultar el producto.', true),
      });
    }
  }

  reactivateProduct(id: number) {
    this.productService.updateProduct(id, { isActive: true }).subscribe({
      next: () => this.loadProducts(),
      error: (err) => this.modalService.show('No se pudo reactivar el producto.', true),
    });
  }
}
