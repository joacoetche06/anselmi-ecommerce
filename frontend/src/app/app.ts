import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin = false;
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

  modalState = { isOpen: false, message: '', isError: false };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    public modalService: ModalService,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdmin();

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });

    // 3. Hacemos que la frase cambie cada 3 segundos (3000 milisegundos)
    this.phraseInterval = setInterval(() => {
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      this.currentPhrase = this.phrases[this.phraseIndex];
    }, 3000);

    this.modalService.state$.subscribe((state) => {
      this.modalState = state;
    });
  }

  // 4. Limpiamos el cronómetro por las dudas si el usuario se va
  ngOnDestroy() {
    if (this.phraseInterval) {
      clearInterval(this.phraseInterval);
    }
  }

  logout() {
    this.authService.logout();
    // En lugar de recargar la página, navegamos al catálogo
    this.router.navigate(['/']).then(() => {
      window.location.reload(); // Recargamos para limpiar estados globales y descuentos
    });
  }
}
