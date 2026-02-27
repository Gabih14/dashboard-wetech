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

export type PedidoEstado = 'PENDIENTE' | 'APROBADO' | 'CANCELADO' | 'RECHAZADO' | string;

export type MetodoPago = 'transfer' | 'online' | string;

export type DeliveryMethod = 'pickup' | string;

export interface Pedido {
  id?: string;
  externalId: string;
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

export interface ApiError {
  status: number;
  message: string;
}
