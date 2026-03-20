import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Ban, Percent, RefreshCw } from 'lucide-react';
import { ApiError, Cupon, CuponCreateInput, CuponStats } from '../types';
import { createCupon, desactivarCupon, getCupones, getCuponStats } from '../services/cuponesService';

interface CuponFormState {
  id: string;
  descripcion: string;
  max_usos: string;
  maxUsosPorCuit: string;
  porcentajeDescuento: string;
  porcentajeDescuentoTarjeta: string;
  porcentajeDescuentoTransferencia: string;
  fechaDesde: string;
  fechaHasta: string;
  activo: boolean;
}

const INITIAL_FORM: CuponFormState = {
  id: '',
  descripcion: '',
  max_usos: '',
  maxUsosPorCuit: '',
  porcentajeDescuento: '',
  porcentajeDescuentoTarjeta: '',
  porcentajeDescuentoTransferencia: '',
  fechaDesde: '',
  fechaHasta: '',
  activo: true,
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-AR');
}

function formatNumber(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('es-AR').format(value);
}

function formatPercent(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${value}%`;
}

function buildCreateInput(form: CuponFormState): CuponCreateInput {
  const payload: CuponCreateInput = {
    id: form.id.trim(),
    activo: form.activo,
  };

  if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();
  if (form.max_usos.trim()) payload.max_usos = Number(form.max_usos);
  if (form.maxUsosPorCuit.trim()) payload.maxUsosPorCuit = Number(form.maxUsosPorCuit);
  if (form.porcentajeDescuento.trim()) {
    payload.porcentajeDescuento = Number(form.porcentajeDescuento);
  }
  if (form.porcentajeDescuentoTarjeta.trim()) {
    payload.porcentajeDescuentoTarjeta = Number(form.porcentajeDescuentoTarjeta);
  }
  if (form.porcentajeDescuentoTransferencia.trim()) {
    payload.porcentajeDescuentoTransferencia = Number(form.porcentajeDescuentoTransferencia);
  }
  if (form.fechaDesde) payload.fechaDesde = new Date(form.fechaDesde).toISOString();
  if (form.fechaHasta) payload.fechaHasta = new Date(form.fechaHasta).toISOString();

  return payload;
}

function validateForm(form: CuponFormState): string | null {
  if (!form.id.trim()) return 'El código del cupón es obligatorio.';

  const integerFields = [
    { label: 'Máximo de usos', value: form.max_usos },
    { label: 'Máximo por CUIT', value: form.maxUsosPorCuit },
  ];

  for (const field of integerFields) {
    if (!field.value.trim()) continue;
    const parsed = Number(field.value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return `${field.label} debe ser un entero mayor o igual a 0.`;
    }
  }

  const percentageFields = [
    { label: 'El porcentaje de descuento', value: form.porcentajeDescuento },
    { label: 'El porcentaje de descuento con tarjeta', value: form.porcentajeDescuentoTarjeta },
    {
      label: 'El porcentaje de descuento con transferencia',
      value: form.porcentajeDescuentoTransferencia,
    },
  ];

  for (const field of percentageFields) {
    if (!field.value.trim()) continue;
    const percentage = Number(field.value);
    if (!Number.isFinite(percentage) || percentage < 0.01 || percentage > 100) {
      return `${field.label} debe estar entre 0.01 y 100.`;
    }
  }

  if (form.fechaDesde && form.fechaHasta) {
    const fromDate = new Date(form.fechaDesde);
    const toDate = new Date(form.fechaHasta);
    if (fromDate.getTime() > toDate.getTime()) {
      return 'La fecha desde no puede ser mayor que la fecha hasta.';
    }
  }

  return null;
}

function getCuponStatusClass(cupon: Cupon): string {
  return cupon.activo === false
    ? 'bg-rose-100 text-rose-700'
    : 'bg-emerald-100 text-emerald-700';
}

function renderDiscountLines(cupon: Cupon) {
  return (
    <div className="space-y-1 text-xs text-slate-500">
      <div>
        <span className="font-medium text-slate-700">General:</span> {formatPercent(cupon.porcentajeDescuento)}
      </div>
      <div>
        <span className="font-medium text-slate-700">Tarjeta:</span>{' '}
        {formatPercent(cupon.porcentajeDescuentoTarjeta)}
      </div>
      <div>
        <span className="font-medium text-slate-700">Transferencia:</span>{' '}
        {formatPercent(cupon.porcentajeDescuentoTransferencia)}
      </div>
    </div>
  );
}

export default function CuponPage() {
  const [form, setForm] = useState<CuponFormState>(INITIAL_FORM);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [selectedCuponId, setSelectedCuponId] = useState<string | null>(null);
  const [stats, setStats] = useState<CuponStats | null>(null);

  const [isListLoading, setIsListLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [listError, setListError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCupon = useMemo(
    () => cupones.find((cupon) => cupon.id === selectedCuponId) ?? null,
    [cupones, selectedCuponId]
  );

  const loadCupones = async (preferredSelectedId?: string | null) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const items = await getCupones();
      setCupones(items);

      const nextSelectedId =
        preferredSelectedId && items.some((cupon) => cupon.id === preferredSelectedId)
          ? preferredSelectedId
          : items[0]?.id ?? null;

      setSelectedCuponId(nextSelectedId);
      return nextSelectedId;
    } catch (error) {
      setCupones([]);
      setSelectedCuponId(null);
      setStats(null);
      setListError(getErrorMessage(error, 'No se pudieron cargar los cupones.'));
      return null;
    } finally {
      setIsListLoading(false);
    }
  };

  const loadStats = async (cuponId: string) => {
    setIsStatsLoading(true);
    setStatsError(null);

    try {
      const nextStats = await getCuponStats(cuponId);
      setStats(nextStats);
    } catch (error) {
      setStats(null);
      setStatsError(getErrorMessage(error, 'No se pudieron cargar las estadísticas del cupón.'));
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const nextSelectedId = await loadCupones();
      if (isMounted && nextSelectedId) {
        await loadStats(nextSelectedId);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (field: keyof CuponFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const created = await createCupon(buildCreateInput(form));
      setForm(INITIAL_FORM);
      setMessage(`Cupón ${created.id} creado correctamente.`);
      const nextSelectedId = await loadCupones(created.id);
      if (nextSelectedId) {
        await loadStats(nextSelectedId);
      }
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudo crear el cupón.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCupon = async (cuponId: string) => {
    setSelectedCuponId(cuponId);
    setMessage(null);
    await loadStats(cuponId);
  };

  const handleRefresh = async () => {
    setMessage(null);
    const nextSelectedId = await loadCupones(selectedCuponId);
    if (nextSelectedId) {
      await loadStats(nextSelectedId);
    }
  };

  const handleDesactivar = async (cuponId: string) => {
    setActionId(cuponId);
    setMessage(null);

    try {
      await desactivarCupon(cuponId);
      setMessage(`Cupón ${cuponId} desactivado correctamente.`);
      const nextSelectedId = await loadCupones(selectedCuponId === cuponId ? null : selectedCuponId);
      if (nextSelectedId) {
        await loadStats(nextSelectedId);
      } else {
        setStats(null);
      }
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudo desactivar el cupón.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de cupones</h2>
          <p className="text-gray-600">Alta, consulta de uso y desactivación de cupones activos.</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isListLoading || isStatsLoading || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isListLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Crear cupón</h3>
              <p className="text-sm text-slate-500">Definí límites, fechas y descuentos por tipo de pago.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Código
                <input
                  value={form.id}
                  onChange={(event) => handleInputChange('id', event.target.value)}
                  placeholder="BIENVENIDA10"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Descripción
                <input
                  value={form.descripcion}
                  onChange={(event) => handleInputChange('descripcion', event.target.value)}
                  placeholder="Cupón promocional de lanzamiento"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Máximo de usos
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.max_usos}
                  onChange={(event) => handleInputChange('max_usos', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Máximo por CUIT
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.maxUsosPorCuit}
                  onChange={(event) => handleInputChange('maxUsosPorCuit', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Porcentaje descuento
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.porcentajeDescuento}
                  onChange={(event) => handleInputChange('porcentajeDescuento', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Descuento tarjeta
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.porcentajeDescuentoTarjeta}
                  onChange={(event) => handleInputChange('porcentajeDescuentoTarjeta', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Descuento transferencia
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.porcentajeDescuentoTransferencia}
                  onChange={(event) =>
                    handleInputChange('porcentajeDescuentoTransferencia', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(event) => handleInputChange('activo', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Activo desde la creación
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Fecha desde
                <input
                  type="date"
                  value={form.fechaDesde}
                  onChange={(event) => handleInputChange('fechaDesde', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Fecha hasta
                <input
                  type="date"
                  value={form.fechaHasta}
                  onChange={(event) => handleInputChange('fechaHasta', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creando...' : 'Crear cupón'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Cupones activos</h3>
              <p className="text-sm text-slate-500">Seleccioná un cupón para ver su actividad.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {cupones.length} activos
            </span>
          </div>

          {listError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {listError}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-[460px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Código</th>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Vigencia</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isListLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Cargando cupones...
                      </td>
                    </tr>
                  ) : cupones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No hay cupones activos disponibles.
                      </td>
                    </tr>
                  ) : (
                    cupones.map((cupon) => {
                      const isSelected = cupon.id === selectedCuponId;
                      const isActionLoading = actionId === cupon.id;

                      return (
                        <tr
                          key={cupon.id}
                          onClick={() => handleSelectCupon(cupon.id)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{cupon.id}</div>
                            <div className="text-xs text-slate-500">{cupon.descripcion || 'Sin descripción'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {renderDiscountLines(cupon)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div>{formatDateOnly(cupon.fechaDesde)}</div>
                            <div className="text-xs text-slate-500">hasta {formatDateOnly(cupon.fechaHasta)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCuponStatusClass(cupon)}`}>
                              {cupon.activo === false ? 'Inactivo' : 'Activo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDesactivar(cupon.id);
                              }}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {isActionLoading ? 'Procesando...' : 'Desactivar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Estadísticas del cupón</h3>
            <p className="text-sm text-slate-500">
              {selectedCupon ? `Detalle de uso para ${selectedCupon.id}.` : 'Seleccioná un cupón para ver sus estadísticas.'}
            </p>
          </div>
        </div>

        {statsError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {statsError}
          </div>
        )}

        {!selectedCupon ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No hay un cupón seleccionado.
          </div>
        ) : isStatsLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            Cargando estadísticas...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Usos registrados</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(stats?.totalUsos)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Último uso</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(stats?.ultimoUso)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Máximo usos</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(selectedCupon.max_usos)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Máximo por CUIT</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(selectedCupon.maxUsosPorCuit)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Desc. general</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatPercent(selectedCupon.porcentajeDescuento)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Desc. tarjeta</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatPercent(selectedCupon.porcentajeDescuentoTarjeta)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Desc. transferencia</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatPercent(selectedCupon.porcentajeDescuentoTransferencia)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">CUIT</th>
                    <th className="px-4 py-3 font-semibold">Pedido</th>
                    <th className="px-4 py-3 font-semibold">Usado en</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {stats?.usos.length ? (
                    stats.usos.map((uso, index) => (
                      <tr key={`${uso.cuit}-${uso.usado_en ?? index}`}>
                        <td className="px-4 py-3 text-slate-700">{uso.cuit}</td>
                        <td className="px-4 py-3 text-slate-700">{uso.pedido_id ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(uso.usado_en)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                        No hay usos registrados para este cupón.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}