export interface ImageData {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  product: string | null;
}

export interface Product {
  id: string;
  name: string;
}

export type DashboardSection = 'pedidos' | 'images' | 'metrics' | 'cupon';

export type PedidoEstado = 'PENDIENTE' | 'APROBADO' | 'CANCELADO' | 'RECHAZADO' | string;

export type MetodoPago = 'transfer' | 'online' | string;

export type DeliveryMethod = 'pickup' | string;

export interface Pedido {
  id?: string;
  externalId: string;
  comprobante_numero?: string;
  estado: PedidoEstado;
  metodo_pago?: MetodoPago;
  delivery_method?: DeliveryMethod;
  cliente_nombre?: string;
  cliente_cuit?: string;
  total?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface PedidoFilters {
  estado?: string;
  from?: string;
  to?: string;
  q?: string;
  metodo_pago?: string;
  delivery_method?: string;
  page?: number;
  limit?: number;
}

export interface PedidoListResponse {
  items: Pedido[];
  total: number;
  page: number;
  limit: number;
}

export interface Cupon {
  id: string;
  descripcion?: string;
  max_usos?: number;
  maxUsosPorCuit?: number;
  porcentajeDescuento?: number;
  porcentajeDescuentoTarjeta?: number;
  porcentajeDescuentoTransferencia?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CuponCreateInput {
  id: string;
  descripcion?: string;
  max_usos?: number;
  maxUsosPorCuit?: number;
  porcentajeDescuento?: number;
  porcentajeDescuentoTarjeta?: number;
  porcentajeDescuentoTransferencia?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  activo?: boolean;
}

export interface CuponUsoStat {
  id?: number;
  cupon_id?: string;
  cuit: string;
  pedido_id?: number;
  usado_en?: string;
  [key: string]: unknown;
}

export interface CuponStats {
  totalUsos: number;
  ultimoUso?: string;
  usos: CuponUsoStat[];
  [key: string]: unknown;
}

export interface ApiError {
  status: number;
  message: string;
}
