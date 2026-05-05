import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-my-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-data.html',
})
export class MyData implements OnInit {
  userData: any = null;
  loading = true;

  constructor(
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.authService.getMyData().subscribe({
      next: (data) => {
        this.userData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos', err);
        this.loading = false;
        this.modalService.show('No se pudieron cargar tus datos.', true);
      }
    });
  }
}