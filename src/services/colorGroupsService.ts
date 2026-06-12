import { ApiError, ColorGroup, ColorGroupCreateInput, ColorGroupUpdateInput } from '../types';

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

function normalizeColorGroup(payload: unknown): ColorGroup {
  const source = asRecord(payload);

  return {
    ...source,
    id: source.id as string | number | undefined,
    name: toString(source.name),
    hex: source.hex ? toString(source.hex).toUpperCase() : undefined,
    sortOrder: typeof source.sortOrder === 'number' ? source.sortOrder : 0,
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

export async function getColorGroups(): Promise<ColorGroup[]> {
  const response = await fetch(`${API_BASE_URL}/color-groups`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudieron cargar los grupos de colores.');
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

  return items.map((item) => normalizeColorGroup(item));
}

export async function createColorGroup(input: ColorGroupCreateInput): Promise<ColorGroup> {
  const response = await fetch(`${API_BASE_URL}/color-groups`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      name: input.name.trim(),
      hex: input.hex?.trim().toUpperCase(),
      sortOrder: input.sortOrder ?? 0,
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo crear el grupo de colores.');
  }

  const payload = await response.json();
  return normalizeColorGroup(payload);
}

export async function updateColorGroup(
  id: string | number,
  input: ColorGroupUpdateInput
): Promise<ColorGroup> {
  const body: Record<string, unknown> = {};

  if (input.name !== undefined) {
    body.name = input.name.trim();
  }
  if (input.hex !== undefined) {
    body.hex = input.hex.trim().toUpperCase();
  }
  if (input.sortOrder !== undefined) {
    body.sortOrder = input.sortOrder;
  }

  const response = await fetch(`${API_BASE_URL}/color-groups/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo actualizar el grupo de colores.');
  }

  const payload = await response.json();
  return normalizeColorGroup(payload);
}

export async function deleteColorGroup(id: string | number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/color-groups/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'No se pudo eliminar el grupo de colores.');
  }
}
