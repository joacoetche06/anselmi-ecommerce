import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService, AppConfig } from '../config.service';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-config.html',
})
export class AdminConfigComponent implements OnInit {
  // Objeto donde guardamos los valores que se muestran en pantalla
  config: AppConfig = {
    cashDiscount: 10, // Valores por defecto provisorios
    defaultMargin: 1.5,
    taxRate: 21,
  };

  // Variables para la vista previa en vivo
  previewBasePrice: number = 1000;
  previewClientDiscount: number = 30; // Simulamos un cliente con 30% de dto.

  constructor(
    private configService: ConfigService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig() {
    this.configService.getConfig().subscribe({
      next: (data) => {
        if (data) {
          this.config = data;
        }
      },
      error: (err) => {
        console.error('Error al cargar configuración:', err);
        // Si no existe (ej. base de datos vacía al principio), no hacemos nada
        // ya que el backend usará sus propios valores por defecto.
      },
    });
  }

  guardarConfiguracion() {
    this.configService.updateConfig(this.config).subscribe({
      next: () => {
        this.modalService.show('¡Configuración guardada exitosamente!');
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.modalService.show('Hubo un error al guardar los datos.', true);
      },
    });
  }

  // --- Funciones para la Vista Previa ---

  get costoNetoPrevio(): number {
    // Fórmula en Cascada: Precio Base * (1 - Bonificación Cliente) * (1 - Descuento Contado)
    const factorCliente = 1 - this.previewClientDiscount / 100;
    const factorContado = 1 - this.config.cashDiscount / 100;
    return this.previewBasePrice * factorCliente * factorContado;
  }

  get precioVentaPrevio(): number {
    // Costo Neto * Margen * (1 + IVA)
    const factorIva = 1 + this.config.taxRate / 100;
    return this.costoNetoPrevio * this.config.defaultMargin * factorIva;
  }
}
