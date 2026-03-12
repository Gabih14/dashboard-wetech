import { ApiError, Pedido, PedidoFilters, PedidoListResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

function getAuthHeaders(contentType = false): HeadersInit {
  const headers: HeadersInit = {};

  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizePedido(payload: unknown): Pedido {
  const source = asRecord(payload);

  return {
    ...source,
    externalId: toString(source.externalId ?? source.external_id ?? source.id),
    estado: toString(source.estado ?? source.status ?? source.state, 'PENDIENTE'),
    metodo_pago: toString(source.metodo_pago ?? source.metodoPago ?? source.payment_method, ''),
    delivery_method: toString(source.delivery_method ?? source.deliveryMethod, ''),
    cliente_nombre: toString(source.cliente_nombre ?? source.clienteNombre ?? source.nombre, ''),
    cliente_cuit: toString(source.cliente_cuit ?? source.clienteCuit ?? source.cuit, ''),
    total: toNumber(source.total ?? source.monto_total ?? source.amount_total, 0),
    created_at: toString(source.created_at ?? source.createdAt ?? source.fecha_creacion, ''),
    updated_at: toString(source.updated_at ?? source.updatedAt ?? source.fecha_actualizacion, ''),
  };
}

function normalizePedidoListResponse(payload: unknown, fallbackPage: number, fallbackLimit: number): PedidoListResponse {
  const source = asRecord(payload);
  const itemsSource = source.items ?? source.data ?? [];
  const itemsArray = Array.isArray(itemsSource) ? itemsSource : [];

  return {
    items: itemsArray.map((item) => normalizePedido(item)),
    total: toNumber(source.total ?? source.count ?? source.totalItems, itemsArray.length),
    page: toNumber(source.page ?? source.currentPage, fallbackPage),
    limit: toNumber(source.limit ?? source.pageSize, fallbackLimit),
  };
}

async function toApiError(response: Response, fallbackMessage: string): Promise<ApiError> {
  try {
    const payload = await response.json();
    const source = asRecord(payload);
    const message = toString(source.message ?? source.error ?? source.detail, fallbackMessage);
    return {
      status: response.status,
      message,
    };
  } catch {
    return {
      status: response.status,
      message: fallbackMessage,
    };
  }
}

function buildPedidoQuery(filters: PedidoFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.estado) params.set('estado', filters.estado);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.q) params.set('q', filters.q);
  if (filters.metodo_pago) params.set('metodo_pago', filters.metodo_pago);
  if (filters.delivery_method) params.set('delivery_method', filters.delivery_method);

  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));

  return params;
}

export async function getPedidos(filters: PedidoFilters): Promise<PedidoListResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const query = buildPedidoQuery({ ...filters, page, limit });

  const response = await fetch(`${API_BASE_URL}/pedido?${query.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudieron cargar los pedidos.');
  }

  const payload = await response.json();
  return normalizePedidoListResponse(payload, page, limit);
}

export async function getPedidoByExternalId(externalId: string): Promise<Pedido> {
  const response = await fetch(`${API_BASE_URL}/pedido/${encodeURIComponent(externalId)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo cargar el detalle del pedido.');
  }

  const payload = await response.json();
  return normalizePedido(payload);
}

async function postPedidoAction(
  externalId: string,
  action: 'cancelar' | 'rechazar'
): Promise<Pedido | null> {
  const response = await fetch(`${API_BASE_URL}/pedido/${encodeURIComponent(externalId)}/${action}`, {
    method: 'POST',
    headers: getAuthHeaders(true),
  });

  if (!response.ok) {
    throw await toApiError(response, `No se pudo ${action} el pedido.`);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  return normalizePedido(payload);
}

export async function cancelarPedido(externalId: string): Promise<Pedido | null> {
  return postPedidoAction(externalId, 'cancelar');
}

export async function rechazarPedido(externalId: string): Promise<Pedido | null> {
  return postPedidoAction(externalId, 'rechazar');
}
