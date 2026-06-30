import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  sku: string;
  name: string;
  stockQuantity: number;

  // Datos Crudos de la BD (Panel de Maxi)
  listPrice: number;
  discountPercentage: number;

  // Datos Calculados por index.ts (Catálogo y Carrito)
  finalPrice?: number;
  cashPrice?: number;
  appliedDiscount?: number;

  imageUrl?: string;

  hidden?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3001/api/products';
  // Adentro de la clase ProductService

  // Memoria del Catálogo
  public catalogState = {
    searchTerm: '',
    selectedOrder: '',
    selectedLines: [] as string[],
    selectedColors: [] as string[],
  };
  constructor(private http: HttpClient) {}

  // Usado por el Catálogo (Pega en tu index.ts)
  getProducts(queryParams: string = ''): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}${queryParams}`);
  }

  // Usado por el Panel de Admin (Pega en la nueva ruta cruda)
  getAdminProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/admin/all`);
  }

  createProduct(productData: Partial<Product>): Observable<any> {
    return this.http.post(this.apiUrl, productData);
  }

  updateProduct(id: number, productData: Partial<Product>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, productData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Descargar el Excel dinámico (opcionalmente para un cliente específico)
  downloadCotizador(clientId?: number) {
    let url = `${this.apiUrl}/cotizador`;
    // Si viene un ID, lo agregamos como parámetro de búsqueda
    if (clientId) {
      url += `?clientId=${clientId}`;
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  getProductById(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // --- RESEÑAS ---
  getLatestReviews(): Observable<any[]> {
    // Le pegamos a la ruta global de reviews
    return this.http.get<any[]>('http://localhost:3001/api/reviews/latest');
  }

  // Obtener reseñas de un producto específico
  getReviewsByProduct(productId: number | string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3001/api/products/${productId}/reviews`);
  }

  // Enviar una nueva reseña
  createReview(
    productId: number | string,
    reviewData: { rating: number; comment: string },
  ): Observable<any> {
    return this.http.post(`http://localhost:3001/api/products/${productId}/reviews`, reviewData);
  }

  getCompanyReviews(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3001/api/reviews/company');
  }

  createCompanyReview(data: any): Observable<any> {
    return this.http.post('http://localhost:3001/api/reviews/company', data);
  }

  getRelatedProducts(productId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3001/api/products/${productId}/related`);
  }
}
