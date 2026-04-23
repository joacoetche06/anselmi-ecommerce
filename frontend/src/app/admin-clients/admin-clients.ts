import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-clients.html',
  styleUrl: './admin-clients.scss',
})
export class AdminClients {
  client = {
    fullName: '',
    email: '',
    password: '',
    cuit: '',
    role: 'b2b', // Por defecto lo creamos como mayorista
    isActive: true, // <-- AGREGAMOS ESTO
  };

  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.client.fullName || !this.client.email || !this.client.password) {
      this.errorMessage = 'Nombre, Email y Contraseña son obligatorios.';
      return;
    }

    this.authService.register(this.client).subscribe({
      next: (res) => {
        this.successMessage = `¡Cliente ${this.client.fullName} registrado con éxito! Ya puede iniciar sesión.`;
        // Limpiamos el formulario y mantenemos el isActive en true
        this.client = {
          fullName: '',
          email: '',
          password: '',
          cuit: '',
          role: 'b2b',
          isActive: true,
        };
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Error al crear el cliente.';
      },
    });
  }
}
