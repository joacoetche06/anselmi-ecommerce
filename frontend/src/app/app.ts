import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  isLoggedIn = false;
  cartItemCount = 0;

  // 1. Lista de frases de Maxi
  phrases: string[] = [
    '¿No estás seguro si es el producto correcto? Escribinos y te ayudamos.',
    'Te ayudamos a elegir',
    '¿No sabés qué comprar?',
    'Te asesoramos gratis por WhatsApp',
  ];

  // 2. Variables para controlar la rotación
  currentPhrase: string = this.phrases[0];
  private phraseInterval: any;
  private phraseIndex = 0;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });

    // 3. Hacemos que la frase cambie cada 3 segundos (3000 milisegundos)
    this.phraseInterval = setInterval(() => {
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      this.currentPhrase = this.phrases[this.phraseIndex];
    }, 3000);
  }

  // 4. Limpiamos el cronómetro por las dudas si el usuario se va
  ngOnDestroy() {
    if (this.phraseInterval) {
      clearInterval(this.phraseInterval);
    }
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    window.location.reload();
  }
}
