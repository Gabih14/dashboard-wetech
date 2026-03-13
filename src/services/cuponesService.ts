import { ApiError, Cupon, CuponCreateInput, CuponStats, CuponUsoStat } from '../types';

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

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeCupon(payload: unknown): Cupon {
  const source = asRecord(payload);

  return {
    ...source,
    id: toString(source.id ?? source.cupon_id),
    descripcion: toString(source.descripcion ?? source.description, ''),
    max_usos: toNumber(source.max_usos ?? source.maxUsos),
    maxUsosPorCuit: toNumber(source.maxUsosPorCuit ?? source.max_usos_por_cuit),
    porcentajeDescuento: toNumber(
      source.porcentajeDescuento ?? source.porcentaje_descuento ?? source.descuento
    ),
    fechaDesde: toString(source.fechaDesde ?? source.fecha_desde ?? source.fechaInicio, ''),
    fechaHasta: toString(source.fechaHasta ?? source.fecha_hasta ?? source.fechaFin, ''),
    activo: toBoolean(source.activo ?? source.active),
    createdAt: toString(source.createdAt ?? source.created_at, ''),
    updatedAt: toString(source.updatedAt ?? source.updated_at, ''),
  };
}

function normalizeCuponUso(payload: unknown): CuponUsoStat {
  const source = asRecord(payload);

  return {
    ...source,
    id: toNumber(source.id),
    cupon_id: toString(source.cupon_id ?? source.cuponId ?? source.idCupon, ''),
    cuit: toString(source.cuit),
    pedido_id: toNumber(source.pedido_id ?? source.pedidoId),
    usado_en: toString(source.usado_en ?? source.usadoEn ?? source.created_at ?? source.createdAt, ''),
  };
}

function deriveUltimoUso(usos: CuponUsoStat[]): string | undefined {
  const timestamps = usos
    .map((uso) => uso.usado_en)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => ({ raw: value, time: new Date(value).getTime() }))
    .filter((entry) => Number.isFinite(entry.time));

  if (!timestamps.length) return undefined;

  timestamps.sort((left, right) => right.time - left.time);
  return timestamps[0].raw;
}

function normalizeCuponStats(payload: unknown): CuponStats {
  const source = asRecord(payload);
  const usosSource = source.usos ?? source.items ?? source.data ?? payload;
  const usosArray = Array.isArray(usosSource) ? usosSource : [];
  const usos = usosArray.map((item) => normalizeCuponUso(item));
  const totalUsos = toNumber(source.totalUsos ?? source.total_usos ?? source.cantidadUsos) ?? usos.length;
  const ultimoUso =
    toString(source.ultimoUso ?? source.ultimo_uso, '') || deriveUltimoUso(usos) || undefined;

  return {
    ...source,
    totalUsos,
    ultimoUso,
    usos,
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

function buildCreatePayload(input: CuponCreateInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: input.id,
  };

  if (input.descripcion) payload.descripcion = input.descripcion;
  if (typeof input.max_usos === 'number') payload.max_usos = input.max_usos;
  if (typeof input.maxUsosPorCuit === 'number') payload.maxUsosPorCuit = input.maxUsosPorCuit;
  if (typeof input.porcentajeDescuento === 'number') {
    payload.porcentajeDescuento = input.porcentajeDescuento;
  }
  if (input.fechaDesde) payload.fechaDesde = input.fechaDesde;
  if (input.fechaHasta) payload.fechaHasta = input.fechaHasta;
  if (typeof input.activo === 'boolean') payload.activo = input.activo;

  return payload;
}

export async function getCupones(): Promise<Cupon[]> {
  const response = await fetch(`${API_BASE_URL}/cupones`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudieron cargar los cupones.');
  }

  const payload = await response.json();
  const source = asRecord(payload);
  const items: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(source.items)
      ? source.items
      : [];
  return items.map((item) => normalizeCupon(item));
}

export async function createCupon(input: CuponCreateInput): Promise<Cupon> {
  const response = await fetch(`${API_BASE_URL}/cupones`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(buildCreatePayload(input)),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo crear el cupón.');
  }

  const payload = await response.json();
  return normalizeCupon(payload);
}

export async function getCuponStats(id: string): Promise<CuponStats> {
  const response = await fetch(`${API_BASE_URL}/cupones/${encodeURIComponent(id)}/estadisticas`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudieron cargar las estadísticas del cupón.');
  }

  const payload = await response.json();
  return normalizeCuponStats(payload);
}

export async function desactivarCupon(id: string): Promise<Cupon> {
  const response = await fetch(`${API_BASE_URL}/cupones/${encodeURIComponent(id)}/desactivar`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo desactivar el cupón.');
  }

  const payload = await response.json();
  return normalizeCupon(payload);
}