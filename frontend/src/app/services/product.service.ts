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
  appliedDiscount?: number;

  imageUrl?: string;

  requierePresupuesto?: boolean;

  hidden?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3001/api/products';

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
}
