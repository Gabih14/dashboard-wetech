const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

function getAuthHeaders(): HeadersInit {
  if (!API_TOKEN) return {};
  return {
    Authorization: `Bearer ${API_TOKEN}`,
  };
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

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const maybeData = (value as Record<string, unknown>).data;
    if (Array.isArray(maybeData)) return maybeData;
  }
  return [];
}

function normalizeResumenMetrics(payload: unknown, from?: string, to?: string): ResumenMetrics {
  const source = (payload ?? {}) as Record<string, unknown>;
  return {
    totalVentas: toNumber(source.totalVentas ?? source.total_ventas ?? source.total),
    cantidadComprobantes: toNumber(
      source.cantidadComprobantes ?? source.cantidad_comprobantes ?? source.comprobantes
    ),
    montoPromedio: toNumber(
      source.montoPromedio ??
        source.monto_promedio ??
        source.promedio ??
        source.ticketPromedio ??
        source.ticket_promedio
    ),
    periodoDesde: toString(source.periodoDesde ?? source.periodo_desde ?? source.desde, from ?? ''),
    periodoHasta: toString(source.periodoHasta ?? source.periodo_hasta ?? source.hasta, to ?? ''),
  };
}

function normalizeVentasMensuales(payload: unknown): VentaMensual[] {
  return asArray(payload).map((item) => {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      mes: toString(source.mes ?? source.month ?? source.periodo, 'Sin mes'),
      total: toNumber(source.total ?? source.totalVentas ?? source.total_ventas),
      cantidad: toNumber(source.cantidad ?? source.cantidadComprobantes ?? source.cantidad_comprobantes),
    };
  });
}

function normalizeVentasPorVendedor(payload: unknown): VentaPorVendedor[] {
  return asArray(payload).map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    const vendedorId = toString(source.vendedorId ?? source.vendedor_id ?? source.idVendedor ?? source.id);

    return {
      vendedorId: vendedorId || `vendedor-${index}`,
      vendedor: toString(source.vendedor ?? source.nombreVendedor ?? source.nombre, 'Sin vendedor'),
      totalVentas: toNumber(source.totalVentas ?? source.total_ventas ?? source.total),
      cantidadComprobantes: toNumber(
        source.cantidadComprobantes ?? source.cantidad_comprobantes ?? source.comprobantes
      ),
      porcentaje: toNumber(source.porcentaje ?? source.percent ?? source.participacion),
    };
  });
}

export interface ResumenMetrics {
  totalVentas: number;
  cantidadComprobantes: number;
  montoPromedio: number;
  periodoDesde: string;
  periodoHasta: string;
}

export interface VentaMensual {
  mes: string;
  total: number;
  cantidad: number;
}

export interface VentaPorVendedor {
  vendedorId: string;
  vendedor: string;
  totalVentas: number;
  cantidadComprobantes: number;
  porcentaje: number;
}

export async function fetchResumenMetrics(from: string, to: string): Promise<ResumenMetrics | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vta-comprobante/metrics/resumen?from=${from}&to=${to}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Error fetching resumen metrics');
    const payload = await response.json();
    return normalizeResumenMetrics(payload, from, to);
  } catch (error) {
    console.error('Error fetching resumen metrics:', error);
    return null;
  }
}

export async function fetchVentasMensuales(from: string, to: string): Promise<VentaMensual[] | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vta-comprobante/metrics/ventas-mensuales?from=${from}&to=${to}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Error fetching ventas mensuales');
    const payload = await response.json();
    return normalizeVentasMensuales(payload);
  } catch (error) {
    console.error('Error fetching ventas mensuales:', error);
    return null;
  }
}

export async function fetchVentasPorVendedor(from: string, to: string): Promise<VentaPorVendedor[] | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vta-comprobante/metrics/ventas-por-vendedor?from=${from}&to=${to}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Error fetching ventas por vendedor');
    const payload = await response.json();
    return normalizeVentasPorVendedor(payload);
  } catch (error) {
    console.error('Error fetching ventas por vendedor:', error);
    return null;
  }
}
