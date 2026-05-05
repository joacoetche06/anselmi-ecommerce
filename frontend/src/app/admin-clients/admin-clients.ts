import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../modal.service';
import { ProductService } from '../services/product.service';
import { zip } from 'rxjs';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-clients.html',
  styleUrl: './admin-clients.scss',
})
export class AdminClients implements OnInit {
  viewMode: 'list' | 'create' = 'list'; // Controla qué pantalla vemos
  users: any[] = [];

  client = {
    fullName: '',
    email: '',
    password: '',
    cuit: '',
    role: 'b2b',
    isActive: true,
    zipCode: '',
    city: '',
    address: '',
    phone: '',
  };

  // Variables para Edición (Agregar abajo de client = {...})
  showEditModal = false;
  editingUser: any = null;

  constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private productService: ProductService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => this.modalService.show('Error al cargar la lista de clientes.', true),
    });
  }

  toggleUserStatus(user: any) {
    const newStatus = !user.isActive;
    this.authService.updateUser(user.id, { isActive: newStatus }).subscribe({
      next: () => {
        user.isActive = newStatus;
        this.modalService.show(`Cliente ${newStatus ? 'Aprobado/Activado' : 'Suspendido'}.`);
      },
      error: () => this.modalService.show('Error al actualizar el estado.', true),
    });
  }

  updateDiscount(user: any) {
    this.authService
      .updateUser(user.id, { discountPercentage: user.discountPercentage })
      .subscribe({
        next: () => this.modalService.show('Descuento actualizado correctamente.'),
        error: () => this.modalService.show('Error al actualizar el descuento.', true),
      });
  }

  // Nuevas funciones para manejar la edición
  openEditModal(user: any) {
    // Clonamos el objeto para no modificar la tabla en vivo hasta que se guarde
    this.editingUser = { ...user };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingUser = null;
  }

  saveUserEdits() {
    if (!this.editingUser) return;

    // Actualizamos al backend mandando TODOS los campos
    this.authService.updateUser(this.editingUser.id, this.editingUser).subscribe({
      next: () => {
        this.modalService.show(`Datos de ${this.editingUser.fullName} actualizados.`);
        this.loadUsers(); // Recarga la tabla
        this.closeEditModal();
      },
      error: () => this.modalService.show('Error al actualizar los datos.', true),
    });
  }

  onSubmit() {
    if (!this.client.fullName || !this.client.email || !this.client.password) {
      this.modalService.show('Nombre, Email y Contraseña son obligatorios.', true);
      return;
    }

    this.authService.register(this.client).subscribe({
      next: (res) => {
        this.modalService.show(`¡Cliente ${this.client.fullName} registrado con éxito!`);
        this.client = {
          fullName: '',
          email: '',
          password: '',
          cuit: '',
          role: 'b2b',
          isActive: true,
          zipCode: '',
          city: '',
          address: '',
          phone: '',
        };
        this.loadUsers(); // Recargamos la lista
        this.viewMode = 'list'; // Volvemos a la tabla
      },
      error: (err) => {
        this.modalService.show(err.error.message || 'Error al crear el cliente.', true);
      },
    });
  }

  descargarCotizadorCliente(clienteId: number, nombreCliente: string) {
    this.modalService.show(`Generando cotizador B2B para ${nombreCliente}...`);

    // Le pasamos el ID al servicio
    this.productService.downloadCotizador(clienteId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Personalizamos el nombre del archivo para que el Admin no se confunda
        a.download = `Cotizador_Anselmi_${nombreCliente.replace(/\s+/g, '_')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar el cotizador', err);
        this.modalService.show(`Error al generar el cotizador para ${nombreCliente}.`, true);
      },
    });
  }
}
