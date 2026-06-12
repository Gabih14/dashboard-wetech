# Dashboard WeTech

Un dashboard moderno y responsivo construido con React y TypeScript para gestionar pedidos, imágenes, métricas y cupones de la empresa WeTech.

## Características

- **Gestión de Pedidos**: Visualiza y administra los pedidos con diferentes estados (pendiente, aprobado, cancelado, rechazado).
- **Gestión de Imágenes**: Sube, visualiza y organiza imágenes asociadas a productos.
- **Métricas**: Consulta métricas de ventas, gráficos mensuales y rendimiento por vendedor.
- **Cupones**: Administra cupones de descuento y promociones.

## Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS, PostCSS, Autoprefixer
- **Backend**: Supabase (base de datos y autenticación)
- **Iconos**: Lucide React
- **Herramientas de Desarrollo**: ESLint, TypeScript Compiler

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/dashboard-wetech.git
   cd dashboard-wetech
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno para Supabase (crea un archivo `.env` con tus credenciales de Supabase).

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Uso

- Abre tu navegador en `http://localhost:5173` (puerto por defecto de Vite).
- Navega por las diferentes secciones usando la barra lateral.
- Gestiona pedidos, sube imágenes, revisa métricas y administra cupones.

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Construye la aplicación para producción.
- `npm run lint`: Ejecuta ESLint para verificar el código.
- `npm run preview`: Previsualiza la build de producción.
- `npm run typecheck`: Verifica tipos con TypeScript.

## Estructura del Proyecto

```
src/
├── components/          # Componentes de la interfaz
│   ├── Dashboard.tsx    # Componente principal del dashboard
│   ├── Sidebar.tsx      # Barra lateral de navegación
│   ├── PedidosPage.tsx  # Página de gestión de pedidos
│   ├── MetricsPage.tsx  # Página de métricas
│   ├── CuponPage.tsx    # Página de cupones
│   └── ...              # Otros componentes
├── services/            # Servicios para API y lógica de negocio
│   ├── pedidosService.ts
│   ├── metricsService.ts
│   └── cuponesService.ts
├── types/               # Definiciones de tipos TypeScript
└── ...
```

## Contribución

1. Haz un fork del proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.