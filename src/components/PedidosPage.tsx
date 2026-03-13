import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiError, Pedido, PedidoFilters } from '../types';
import {
  cancelarPedido,
  getPedidoByExternalId,
  getPedidos,
  rechazarPedido,
} from '../services/pedidosService';

const DEFAULT_LIMIT = 20;
const AUTO_REFRESH_INTERVAL_MS = 60_000;

const INITIAL_FILTERS: PedidoFilters = {
  estado: '',
  from: '',
  to: '',
  q: '',
  metodo_pago: '',
  delivery_method: '',
};

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object') {
    const maybeApiError = error as Partial<ApiError>;
    if (typeof maybeApiError.message === 'string' && maybeApiError.message.trim()) {
      return maybeApiError.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value);
}

function getComprobanteCorto(pedido: Pedido): string {
  const comprobante =
    typeof pedido.comprobante_numero === 'string' ? pedido.comprobante_numero.trim() : '';

  if (!comprobante) return '-';
  return comprobante.slice(-8);
}

function getEstadoBadgeClass(estado?: string): string {
  if (estado === 'APROBADO') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'CANCELADO' || estado === 'RECHAZADO') return 'bg-rose-100 text-rose-700';
  if (estado === 'PENDIENTE') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export default function PedidosPage() {
  const [filtersForm, setFiltersForm] = useState<PedidoFilters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PedidoFilters>(INITIAL_FILTERS);

  const [items, setItems] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);

  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Refs para el callback del intervalo, para evitar closures obsoletas
  const pageRef = useRef(page);
  const appliedFiltersRef = useRef(appliedFilters);
  const isLoadingRef = useRef(isLoading);
  const actionLoadingIdRef = useRef(actionLoadingId);
  const loadPedidosRef = useRef<((targetPage: number, filters: PedidoFilters) => Promise<void>) | null>(null);
  pageRef.current = page;
  appliedFiltersRef.current = appliedFilters;
  isLoadingRef.current = isLoading;
  actionLoadingIdRef.current = actionLoadingId;

  const totalPages = useMemo(() => {
    if (!total || !limit) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  const loadPedidos = async (targetPage: number, filters: PedidoFilters) => {
    setIsLoading(true);
    setListError(null);

    try {
      const response = await getPedidos({
        ...filters,
        page: targetPage,
        limit,
      });

      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setLastRefreshed(new Date());

      if (selectedExternalId) {
        const existsInPage = response.items.some((item) => item.externalId === selectedExternalId);
        if (!existsInPage) {
          setSelectedExternalId(null);
          setSelectedPedido(null);
          setDetailError(null);
        }
      }
    } catch (error) {
      setListError(getErrorMessage(error, 'No se pudieron cargar los pedidos.'));
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  loadPedidosRef.current = loadPedidos;

  useEffect(() => {
    loadPedidos(1, INITIAL_FILTERS);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (isLoadingRef.current || actionLoadingIdRef.current) return;
      loadPedidosRef.current?.(pageRef.current, appliedFiltersRef.current);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleApplyFilters = async () => {
    setAppliedFilters(filtersForm);
    setActionMessage(null);
    await loadPedidos(1, filtersForm);
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    await loadPedidos(nextPage, appliedFilters);
  };

  const handleSelectPedido = async (externalId: string) => {
    setSelectedExternalId(externalId);
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await getPedidoByExternalId(externalId);
      setSelectedPedido(detail);
    } catch (error) {
      setSelectedPedido(null);
      setDetailError(getErrorMessage(error, 'No se pudo cargar el detalle del pedido.'));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const updatePedidoInState = (externalId: string, changes: Partial<Pedido>) => {
    setItems((prev) =>
      prev.map((item) => (item.externalId === externalId ? { ...item, ...changes } : item))
    );

    setSelectedPedido((prev) => {
      if (!prev || prev.externalId !== externalId) return prev;
      return { ...prev, ...changes };
    });
  };

  const handleCancelar = async (externalId: string) => {
    setActionLoadingId(externalId);
    setActionMessage(null);

    try {
      const updatedPedido = await cancelarPedido(externalId);
      if (updatedPedido) {
        updatePedidoInState(externalId, updatedPedido);
      } else {
        updatePedidoInState(externalId, { estado: 'CANCELADO' });
      }
      setActionMessage('Pedido cancelado correctamente.');
      await loadPedidos(page, appliedFilters);
    } catch (error) {
      setActionMessage(getErrorMessage(error, 'No se pudo cancelar el pedido.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRechazarTransferencia = async (externalId: string) => {
    setActionLoadingId(externalId);
    setActionMessage(null);

    try {
      const updatedPedido = await rechazarPedido(externalId);
      if (updatedPedido) {
        updatePedidoInState(externalId, updatedPedido);
      } else {
        updatePedidoInState(externalId, { estado: 'CANCELADO' });
      }
      setActionMessage('Transferencia rechazada correctamente.');
      await loadPedidos(page, appliedFilters);
    } catch (error) {
      setActionMessage(getErrorMessage(error, 'No se pudo rechazar la transferencia.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderPedidoActions = (pedido: Pedido) => {
    const isPending = pedido.estado === 'PENDIENTE';
    const isTransfer = pedido.metodo_pago === 'transfer';
    const isActionLoading = actionLoadingId === pedido.externalId;

    if (!isPending) {
      return null;
    }

    return (
      <div className="flex flex-col gap-2">
        {isTransfer && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleRechazarTransferencia(pedido.externalId);
            }}
            disabled={Boolean(actionLoadingId) || isActionLoading}
            className="w-full px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 text-xs leading-tight"
          >
            {isActionLoading ? 'Procesando...' : 'Rechazar transf.'}
          </button>
        )}

        {!isTransfer && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleCancelar(pedido.externalId);
            }}
            disabled={Boolean(actionLoadingId) || isActionLoading}
            className="w-full px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 text-xs leading-tight"
          >
            {isActionLoading ? 'Procesando...' : 'Cancelar'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/80 px-5 py-5">
        <h2 className="text-3xl font-bold text-slate-900 mb-1">Pedidos</h2>
        <p className="text-slate-600">Gestión operativa con foco en lectura rápida y acciones.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <select
            value={filtersForm.estado || ''}
            onChange={(event) =>
              setFiltersForm((prev) => ({ ...prev, estado: event.target.value }))
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Estado (todos)</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="APROBADO">APROBADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>

          <input
            type="date"
            value={filtersForm.from || ''}
            onChange={(event) =>
              setFiltersForm((prev) => ({ ...prev, from: event.target.value }))
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />

          <input
            type="date"
            value={filtersForm.to || ''}
            onChange={(event) =>
              setFiltersForm((prev) => ({ ...prev, to: event.target.value }))
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />

          <input
            type="text"
            value={filtersForm.q || ''}
            placeholder="Buscar nombre o CUIT"
            onChange={(event) =>
              setFiltersForm((prev) => ({ ...prev, q: event.target.value }))
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />

          <select
            value={filtersForm.metodo_pago || ''}
            onChange={(event) =>
              setFiltersForm((prev) => ({ ...prev, metodo_pago: event.target.value }))
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Pago (todos)</option>
            <option value="transfer">transfer</option>
            <option value="online">online</option>
          </select>

          <select
            value={filtersForm.delivery_method || ''}
            onChange={(event) =>
              setFiltersForm((prev) => ({ ...prev, delivery_method: event.target.value }))
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Entrega (todos)</option>
            <option value="pickup">pickup</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Aplicando...' : 'Aplicar filtros'}
          </button>

          <button
            onClick={async () => {
              setFiltersForm(INITIAL_FILTERS);
              setAppliedFilters(INITIAL_FILTERS);
              setActionMessage(null);
              await loadPedidos(1, INITIAL_FILTERS);
            }}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Limpiar
          </button>

          <div className="flex flex-col items-start gap-1">
            <button
              onClick={() => loadPedidos(page, appliedFilters)}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <span className="text-xs text-slate-400">
              {lastRefreshed
                ? `Últ.: ${lastRefreshed.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Auto-refresco cada 30s'}
            </span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800">
          {actionMessage}
        </div>
      )}

      {listError && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {listError}
        </div>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
        <div className="2xl:col-span-9 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Comp.</th>
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Pago</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Total</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left font-medium whitespace-nowrap">Creado</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap w-[150px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={7}>
                      Cargando pedidos...
                    </td>
                  </tr>
                )}

                {!isLoading && items.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={7}>
                      No hay pedidos para los filtros seleccionados.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  items.map((pedido) => (
                    <tr
                      key={pedido.externalId}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${
                        selectedExternalId === pedido.externalId
                          ? 'bg-sky-50'
                          : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => handleSelectPedido(pedido.externalId)}
                    >
                      <td className="px-4 py-3 text-slate-700 font-semibold tracking-wide">
                        {getComprobanteCorto(pedido)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="truncate font-medium text-slate-900">{pedido.cliente_nombre || '-'}</p>
                        <div className="text-xs text-slate-500 truncate">{pedido.cliente_cuit || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(
                            pedido.estado
                          )}`}
                        >
                          {pedido.estado || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{pedido.metodo_pago || '-'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(pedido.total)}</td>
                      <td className="hidden xl:table-cell px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(pedido.created_at)}</td>
                      <td className="px-4 py-3 text-slate-700 align-top">{renderPedidoActions(pedido)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden p-4 space-y-3">
            {isLoading && <p className="text-sm text-gray-500">Cargando pedidos...</p>}

            {!isLoading && items.length === 0 && (
              <p className="text-sm text-gray-500">No hay pedidos para los filtros seleccionados.</p>
            )}

            {!isLoading &&
              items.map((pedido) => (
                <article
                  key={pedido.externalId}
                  onClick={() => handleSelectPedido(pedido.externalId)}
                  className={`rounded-lg border p-3 cursor-pointer ${
                    selectedExternalId === pedido.externalId
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900">Comp. {getComprobanteCorto(pedido)}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getEstadoBadgeClass(
                        pedido.estado
                      )}`}
                    >
                      {pedido.estado || '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
                    <div>
                      <p className="text-gray-500">Cliente</p>
                      <p className="text-gray-800">{pedido.cliente_nombre || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CUIT</p>
                      <p className="text-gray-800">{pedido.cliente_cuit || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pago</p>
                      <p className="text-gray-800">{pedido.metodo_pago || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Entrega</p>
                      <p className="text-gray-800">{pedido.delivery_method || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="text-gray-800">{formatCurrency(pedido.total)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Creado</p>
                      <p className="text-gray-800">{formatDate(pedido.created_at)}</p>
                    </div>
                  </div>

                  {renderPedidoActions(pedido)}
                </article>
              ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">
              Total: <strong>{total}</strong> · Página {page} de {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={isLoading || page <= 1}
                className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={isLoading || page >= totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        <div className="2xl:col-span-3 bg-white rounded-xl border border-slate-200 p-4 h-fit shadow-sm 2xl:sticky 2xl:top-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Detalle de pedido</h3>

          {!selectedExternalId && (
            <p className="text-sm text-gray-600">Selecciona un pedido para ver su detalle.</p>
          )}

          {selectedExternalId && isDetailLoading && (
            <p className="text-sm text-gray-600">Cargando detalle...</p>
          )}

          {selectedExternalId && detailError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
              {detailError}
            </div>
          )}

          {selectedExternalId && !isDetailLoading && selectedPedido && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">External ID</p>
                <p className="font-medium text-slate-900 break-all">{selectedPedido.externalId || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Comprobante</p>
                <p className="font-medium text-slate-900">{selectedPedido.comprobante_numero || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Estado</p>
                <p className="font-medium text-slate-900">{selectedPedido.estado || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Cliente</p>
                <p className="font-medium text-slate-900">{selectedPedido.cliente_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">CUIT</p>
                <p className="font-medium text-slate-900">{selectedPedido.cliente_cuit || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Método de pago</p>
                <p className="font-medium text-slate-900">{selectedPedido.metodo_pago || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Método de entrega</p>
                <p className="font-medium text-slate-900">{selectedPedido.delivery_method || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Total</p>
                <p className="font-medium text-slate-900">{formatCurrency(selectedPedido.total)}</p>
              </div>
              <div>
                <p className="text-slate-500">Creado</p>
                <p className="font-medium text-slate-900">{formatDate(selectedPedido.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-500">Actualizado</p>
                <p className="font-medium text-slate-900">{formatDate(selectedPedido.updated_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
