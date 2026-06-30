import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Creamos una interfaz para tipar los datos
export interface AppConfig {
  id?: number;
  cashDiscount: number;
  defaultMargin: number;
  taxRate: number;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private apiUrl = 'http://localhost:3001/api/config';
  constructor(private http: HttpClient) {}

  // Obtener la configuración actual
  getConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>(this.apiUrl);
  }

  // Actualizar la configuración (requerirá token de admin)
  updateConfig(config: AppConfig): Observable<AppConfig> {
    return this.http.put<AppConfig>(this.apiUrl, config);
  }
}
