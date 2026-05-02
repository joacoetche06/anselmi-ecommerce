# 🏗️ Anselmi Desarrollos Comerciales - E-commerce B2B & B2C

Plataforma integral de comercio electrónico diseñada con una arquitectura dual para atender tanto a consumidores finales (B2C) como a clientes mayoristas y corralones (B2B). 

## 🚀 Características Principales (MVP)

### 🛒 Experiencia de Compra Dual
*   **Minoristas (B2C):** Acceso público al catálogo con precios finales (Costo + Remarque + IVA). Integración directa con **Mercado Pago** mediante Webhooks para cobro automatizado y seguimiento de envíos.
*   **Mayoristas (B2B):** Acceso privado mediante autenticación JWT. Visualización de catálogo con precios de gremio (precios netos aplicando descuentos en cascada personalizados). Flujo de compra directo a Cuenta Corriente con notificaciones automáticas vía Email.
*   **Checkout Híbrido:** Botones dinámicos de "Agregar al Pedido" para compra directa, o "Solicitar Presupuesto" para artículos pesados/voluminosos o cotizaciones de obra.

### 💼 Herramientas B2B (Mayoristas)
*   **Cotizador Excel Dinámico:** Generación en tiempo real de listas de precio en formato `.xlsx`. Inyecta el logo corporativo y calcula el precio final del corralón aplicando la fórmula de cascada: `Precio Lista * (1 - Bonificación Cliente) * (1 - Descuento Contado)`.
*   **Indicador de Stock Inteligente:** Sistema visual tipo "semáforo" (Rojo, Amarillo, Verde) para proteger cantidades exactas frente a la competencia, brindando noción de disponibilidad.

### 🛠️ Panel de Administración (Backoffice)
*   **Gestión de Catálogo:** ABM completo de productos con capacidad de asociar imágenes mediante URLs.
*   **Gestión de Clientes:** Aprobación/Suspensión de cuentas mayoristas, asignación de roles y modificación de porcentajes de descuento. Descarga de cotizadores específicos por cliente.
*   **Configuración Global:** Variables macro editables en tiempo real (Descuento Pago Contado, Margen de Remarque, % IVA) con simulador visual de impacto de precios.
*   **Automatización de Datos:** Scripts integrados en Node.js para importación masiva de catálogos y precios desde el sistema ERP local (Aleph) y Web Scraping automatizado de proveedores oficiales (ej. FV).

## 💻 Stack Tecnológico

**Frontend:**
*   Angular 17+ (Standalone Components)
*   RxJS para manejo de estados y asincronía.
*   Diseño responsive UI/UX corporativo.

**Backend:**
*   Node.js con Express.
*   TypeScript para tipado estricto.
*   PostgreSQL + TypeORM (Base de datos relacional).
*   Autenticación basada en JSON Web Tokens (JWT).
*   Librerías clave: `exceljs` (Reportes B2B), `mercadopago` (Pasarela B2C), `nodemailer` (Notificaciones), `puppeteer`/`cheerio` (Scraping).

## ⚙️ Instalación y Despliegue Local

### Requisitos Previos
*   Node.js (v18 o superior)
*   PostgreSQL corriendo localmente o en un contenedor Docker.

### 1. Configuración del Backend
```bash
cd backend
npm install
# Configurar credenciales de BD en src/data-source.ts
npm run start

### 2. Configuración del Frontend

cd frontend
npm install
npm start





#######################  CREDENCIALES  ##################################
USUARIOS DE PRUEBA

joaco@prueba.com
password123

admin@anselmi.com
admin

prueba@prueba.com
prueba

prueba2@prueba.com
prueba2

CUENTAS PRUEBA MERCADOPAGO

Comprador:
    TESTUSER713025825533981039
    Jwb9nkclPs
    056563

Vendedor:
    TESTUSER7007998307536401193
    PEseMGOwVn
    635716


CUENTA CORREO PRUEBAS

    cruz.watsica@ethereal.email
    VSEBVeA5kYBrHTXGTN