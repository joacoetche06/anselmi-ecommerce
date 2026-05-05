// Agregá HostListener acá arriba
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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

  // NUEVA VARIABLE: Para el menú de Mi Cuenta
  isMenuOpen = false;

  phrases: string[] = [
    '¿No estás seguro si es el producto correcto? Escribinos y te ayudamos.',
    'Te ayudamos a elegir',
    '¿No sabés qué comprar?',
    'Te asesoramos gratis por WhatsApp',
    '¿Estás armando un proyecto o una obra? Cotizá con nosotros.',
    'Atención personalizada para corralones y profesionales.',
    'Grandes volúmenes: Solicitá tu presupuesto a medida.',
  ];

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

    this.phraseInterval = setInterval(() => {
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      this.currentPhrase = this.phrases[this.phraseIndex];
    }, 3000);

    this.modalService.state$.subscribe((state) => {
      this.modalState = state;
    });
  }

  ngOnDestroy() {
    if (this.phraseInterval) {
      clearInterval(this.phraseInterval);
    }
  }

  // --- NUEVAS FUNCIONES PARA EL MENÚ ---
  toggleMenu(event: Event) {
    event.stopPropagation(); // Evita que el clic se propague al HostListener
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  // Si hace clic en cualquier lado de la pantalla, el menú se cierra
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.menu-container');
    if (!clickedInside) {
      this.isMenuOpen = false;
    }
  }
  // ------------------------------------

  logout() {
    this.authService.logout();
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}
