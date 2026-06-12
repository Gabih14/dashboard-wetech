import { ApiError, Color, ColorCreateInput, ColorUpdateInput } from '../types';

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

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function normalizeColor(payload: unknown): Color {
  const source = asRecord(payload);

  return {
    ...source,
    id: source.id as string | number | undefined,
    name: toString(source.name),
    hex: toString(source.hex).toUpperCase(),
    createdAt: toString(source.createdAt ?? source.created_at, ''),
    updatedAt: toString(source.updatedAt ?? source.updated_at, ''),
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

export async function getColors(): Promise<Color[]> {
  const response = await fetch(`${API_BASE_URL}/colors`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudieron cargar los colores.');
  }

  const payload = await response.json();
  const source = asRecord(payload);
  const items: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(source.items)
      ? source.items
      : Array.isArray(source.data)
        ? source.data
        : [];

  return items.map((item) => normalizeColor(item));
}

export async function createColor(input: ColorCreateInput): Promise<Color> {
  const response = await fetch(`${API_BASE_URL}/colors`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      name: input.name.trim(),
      hex: input.hex.trim(),
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo crear el color.');
  }

  const payload = await response.json();
  return normalizeColor(payload);
}

export async function updateColor(id: string | number, input: ColorUpdateInput): Promise<Color> {
  const response = await fetch(`${API_BASE_URL}/colors/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      name: input.name.trim(),
      hex: input.hex.trim(),
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo actualizar el color.');
  }

  const payload = await response.json();
  return normalizeColor(payload);
}
