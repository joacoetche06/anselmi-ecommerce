import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Agregamos CommonModule
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  // Variables Login
  email = '';
  password = '';

  // Variables Registro
  regFullName = '';
  regEmail = '';
  regPassword = '';
  regCuit = '';
  regPhone = '';
  regAddress = '';
  regCity = '';
  regZipCode = '';

  // Estados de la vista
  errorMessage = '';
  successMessage = '';
  isRegisterMode = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  // Función para alternar entre Login y Registro
  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Login (Ya lo tenías, le sumamos resetear mensajes)
  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completá todos los campos.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin-orders']).then(() => window.location.reload());
        } else {
          this.router.navigate(['/']).then(() => window.location.reload());
        }
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Error al iniciar sesión.';
        console.error(err);
      },
    });
  }

  // Lógica nueva de Registro
  doRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.regFullName || !this.regEmail || !this.regPassword) {
      this.errorMessage = 'Por favor, completá nombre, email y contraseña.';
      return;
    }

    // Armamos el objeto enviando el rol B2C por defecto
    const userData = {
      fullName: this.regFullName,
      email: this.regEmail,
      password: this.regPassword,
      cuit: this.regCuit,
      phone: this.regPhone, // <-- NUEVO
      address: this.regAddress, // <-- NUEVO
      city: this.regCity, // <-- NUEVO
      zipCode: this.regZipCode, // <-- NUEVO
      role: 'b2c',
    };

    this.authService.register(userData).subscribe({
      next: (res) => {
        this.successMessage = '¡Cuenta creada con éxito! Ya podés iniciar sesión.';
        // Autocompletamos el email en el form de login para que le sea más rápido
        this.email = this.regEmail;
        this.password = '';
        this.isRegisterMode = false; // Volvemos a la vista de login
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Error al crear la cuenta.';
      },
    });
  }
}
