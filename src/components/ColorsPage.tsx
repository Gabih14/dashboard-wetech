import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit3, Palette, RefreshCw, X } from 'lucide-react';
import { ApiError, Color } from '../types';
import { createColor, getColors, updateColor } from '../services/colorsService';

interface ColorFormState {
  name: string;
  hex: string;
}

const INITIAL_FORM: ColorFormState = {
  name: '',
  hex: '#000000',
};

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

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

function validateForm(form: ColorFormState): string | null {
  if (!form.name.trim()) return 'El nombre del color es obligatorio.';
  if (!HEX_PATTERN.test(form.hex.trim())) return 'El hex debe tener formato #RRGGBB.';
  return null;
}

function getColorKey(color: Color, index: number): string {
  return String(color.id ?? `${color.name}-${color.hex}-${index}`);
}

export default function ColorsPage() {
  const [form, setForm] = useState<ColorFormState>(INITIAL_FORM);
  const [colors, setColors] = useState<Color[]>([]);
  const [editingColorId, setEditingColorId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedHex = useMemo(() => form.hex.trim().toUpperCase(), [form.hex]);
  const isEditing = editingColorId !== null;

  const loadColors = async () => {
    setIsLoading(true);
    setListError(null);

    try {
      const items = await getColors();
      setColors(items);
    } catch (error) {
      setColors([]);
      setListError(getErrorMessage(error, 'No se pudieron cargar los colores.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadColors();
  }, []);

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
      if (isEditing) {
        const updated = await updateColor(editingColorId, {
          name: form.name.trim(),
          hex: normalizedHex,
        });
        setForm(INITIAL_FORM);
        setEditingColorId(null);
        setMessage(`Color ${updated.name} actualizado correctamente.`);
      } else {
        const created = await createColor({
          name: form.name.trim(),
          hex: normalizedHex,
        });
        setForm(INITIAL_FORM);
        setMessage(`Color ${created.name} creado correctamente.`);
      }
      await loadColors();
    } catch (error) {
      setMessage(
        getErrorMessage(error, isEditing ? 'No se pudo actualizar el color.' : 'No se pudo crear el color.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (color: Color) => {
    if (color.id == null) {
      setMessage('No se puede editar un color sin ID.');
      return;
    }

    setEditingColorId(color.id);
    setForm({
      name: color.name,
      hex: color.hex,
    });
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingColorId(null);
    setForm(INITIAL_FORM);
    setMessage(null);
  };

  const handleRefresh = async () => {
    setMessage(null);
    await loadColors();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion de colores</h2>
          <p className="text-gray-600">Alta y listado de colores disponibles en la base de datos.</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.4fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditing ? 'Editar color' : 'Crear color'}
              </h3>
              <p className="text-sm text-slate-500">
                {isEditing ? `Modificando ID ${editingColorId}.` : 'El hex debe respetar el formato #RRGGBB.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Rojo"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
              <label className="block text-sm font-medium text-slate-700">
                Color
                <input
                  type="color"
                  value={HEX_PATTERN.test(form.hex) ? form.hex : '#000000'}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, hex: event.target.value.toUpperCase() }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Hex
                <input
                  value={form.hex}
                  onChange={(event) => setForm((prev) => ({ ...prev, hex: event.target.value }))}
                  placeholder="#FF0000"
                  maxLength={7}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <span
                className="h-9 w-9 rounded-lg border border-slate-200"
                style={{ backgroundColor: HEX_PATTERN.test(form.hex) ? form.hex : '#FFFFFF' }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{form.name.trim() || 'Vista previa'}</p>
                <p className="font-mono text-xs text-slate-500">{normalizedHex || '#RRGGBB'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (isEditing ? 'Guardando...' : 'Creando...') : isEditing ? 'Guardar cambios' : 'Crear color'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Colores existentes</h3>
              <p className="text-sm text-slate-500">Listado obtenido desde /colors.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {colors.length} colores
            </span>
          </div>

          {listError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {listError}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Color</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Hex</th>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Cargando colores...
                      </td>
                    </tr>
                  ) : colors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No hay colores disponibles.
                      </td>
                    </tr>
                  ) : (
                    colors.map((color, index) => (
                      <tr key={getColorKey(color, index)} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span
                            className="block h-8 w-8 rounded-lg border border-slate-200"
                            style={{ backgroundColor: color.hex }}
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{color.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{color.hex}</td>
                        <td className="px-4 py-3 text-slate-500">{color.id ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEdit(color)}
                            disabled={isSubmitting || color.id == null}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
