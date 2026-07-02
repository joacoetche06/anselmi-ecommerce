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

  // Filtro / búsqueda
  private _searchTerm = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(value: string) {
    this._searchTerm = value;
    this.currentPage = 1; // al buscar, volver a la primera página
  }
  selectedMarca = '';

  // Selección masiva
  selectedIds = new Set<number>();

  // Paginación
  currentPage = 1;
  pageSize = 25;

  showModal = false;
  isEditing = false;

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
    this.selectedIds.clear();
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

  // Lista filtrada por texto (nombre o SKU). Case-insensitive.
  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(
      (p) => p.name?.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term),
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  // La porción de productos que se muestra en la página actual
  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  // --- Selección ---
  toggleSelection(id: number) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  // Selecciona/deselecciona todos los que están filtrados en pantalla
  toggleSelectAll() {
    const filtered = this.filteredProducts;
    const allSelected = filtered.every((p) => this.selectedIds.has(p.id));
    if (allSelected) {
      filtered.forEach((p) => this.selectedIds.delete(p.id));
    } else {
      filtered.forEach((p) => this.selectedIds.add(p.id));
    }
  }

  get allFilteredSelected(): boolean {
    const filtered = this.filteredProducts;
    return filtered.length > 0 && filtered.every((p) => this.selectedIds.has(p.id));
  }

  // --- Acciones masivas ---
  bulkSetVisibility(isActive: boolean) {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    const accion = isActive ? 'mostrar' : 'ocultar';
    if (!confirm(`¿Seguro que querés ${accion} ${ids.length} productos?`)) return;

    this.productService.bulkVisibility(ids, isActive).subscribe({
      next: (res) => {
        this.modalService.show(`${ids.length} productos actualizados.`, false);
        this.loadProducts();
      },
      error: (err) => this.modalService.show('Error al actualizar productos.', true),
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
