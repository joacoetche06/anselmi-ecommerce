import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule], // <-- Importamos esto para usar [(ngModel)] en el HTML
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completá todos los campos.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        // Redirección inteligente según el rol
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
}
