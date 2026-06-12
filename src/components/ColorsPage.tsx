import { FormEvent, useEffect, useRef, useMemo, useState } from 'react';
import { Edit3, Palette, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { ApiError, Color, ColorGroup } from '../types';
import { createColor, getColors, updateColor } from '../services/colorsService';
import {
  createColorGroup,
  deleteColorGroup,
  getColorGroups,
  updateColorGroup,
} from '../services/colorGroupsService';

interface ColorFormState {
  name: string;
  hex: string;
  colorGroupId: string | number | null;
}

interface ColorGroupFormState {
  name: string;
  hex: string;
}

// Guardar posición del scroll de una tabla
const saveScrollPosition = (ref: React.RefObject<HTMLDivElement>) => {
  return ref.current?.scrollTop ?? 0;
};

// Restaurar posición del scroll de una tabla
const restoreScrollPosition = (ref: React.RefObject<HTMLDivElement>, position: number) => {
  if (ref.current) {
    ref.current.scrollTop = position;
  }
};

const INITIAL_COLOR_FORM: ColorFormState = {
  name: '',
  hex: '#000000',
  colorGroupId: null,
};

const INITIAL_GROUP_FORM: ColorGroupFormState = {
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

function validateColorForm(form: ColorFormState): string | null {
  if (!form.name.trim()) return 'El nombre del color es obligatorio.';
  if (!HEX_PATTERN.test(form.hex.trim())) return 'El hex debe tener formato #RRGGBB.';
  return null;
}

function validateGroupForm(form: ColorGroupFormState): string | null {
  if (!form.name.trim()) return 'El nombre del grupo es obligatorio.';
  if (!HEX_PATTERN.test(form.hex.trim())) return 'El hex debe tener formato #RRGGBB.';
  return null;
}

function getColorKey(color: Color, index: number): string {
  return String(color.id ?? `${color.name}-${color.hex}-${index}`);
}

export default function ColorsPage() {
  // Refs para guardar/restaurar posición del scroll
  const colorsTableRef = useRef<HTMLDivElement>(null);
  const groupsTableRef = useRef<HTMLDivElement>(null);

  const [colorForm, setColorForm] = useState<ColorFormState>(INITIAL_COLOR_FORM);
  const [groupForm, setGroupForm] = useState<ColorGroupFormState>(INITIAL_GROUP_FORM);
  const [colors, setColors] = useState<Color[]>([]);
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
  const [editingColorId, setEditingColorId] = useState<string | number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | number | null>(null);
  const [isLoadingColors, setIsLoadingColors] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isSubmittingColor, setIsSubmittingColor] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedColorHex = useMemo(() => colorForm.hex.trim().toUpperCase(), [colorForm.hex]);
  const normalizedGroupHex = useMemo(() => groupForm.hex.trim().toUpperCase(), [groupForm.hex]);
  const isEditingColor = editingColorId !== null;
  const isEditingGroup = editingGroupId !== null;

  // Actualizar un color en la lista localmente (sin hacer fetch)
  const updateColorInList = (id: string | number, updatedColor: Partial<Color>) => {
    setColors((prev) =>
      prev.map((color) => (color.id === id ? { ...color, ...updatedColor } : color))
    );
  };

  // Actualizar un grupo en la lista localmente
  const updateGroupInList = (id: string | number, updatedGroup: Partial<ColorGroup>) => {
    setColorGroups((prev) =>
      prev.map((group) => (group.id === id ? { ...group, ...updatedGroup } : group))
    );
  };

  // Agregar un color a la lista (al inicio)
  const addColorToList = (color: Color) => {
    setColors((prev) => [color, ...prev]);
  };

  // Agregar un grupo a la lista (al inicio)
  const addGroupToList = (group: ColorGroup) => {
    setColorGroups((prev) => [group, ...prev]);
  };

  // Remover un grupo de la lista
  const removeGroupFromList = (id: string | number) => {
    setColorGroups((prev) => prev.filter((group) => group.id !== id));
  };

  // Sincronizar listas en segundo plano (sin interrumpir UX)
  const syncColorsInBackground = async () => {
    try {
      const items = await getColors();
      setColors(items);
    } catch {
      // Silenciosamente fallar si hay error en sync de fondo
    }
  };

  const syncGroupsInBackground = async () => {
    try {
      const items = await getColorGroups();
      setColorGroups(items);
    } catch {
      // Silenciosamente fallar si hay error en sync de fondo
    }
  };

  const loadColors = async () => {
    setIsLoadingColors(true);
    setListError(null);

    try {
      const items = await getColors();
      setColors(items);
    } catch (error) {
      setColors([]);
      setListError(getErrorMessage(error, 'No se pudieron cargar los colores.'));
    } finally {
      setIsLoadingColors(false);
    }
  };

  const loadColorGroups = async () => {
    setIsLoadingGroups(true);

    try {
      const items = await getColorGroups();
      setColorGroups(items);
    } catch (error) {
      setColorGroups([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadColors();
    loadColorGroups();
  }, []);

  const handleColorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateColorForm(colorForm);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSubmittingColor(true);
    setMessage(null);
    const scrollPosition = saveScrollPosition(colorsTableRef);

    try {
      if (isEditingColor) {
        const updated = await updateColor(editingColorId, {
          name: colorForm.name.trim(),
          hex: normalizedColorHex,
          colorGroupId: colorForm.colorGroupId,
        });
        // Actualizar localmente en lugar de recargar toda la lista
        updateColorInList(editingColorId, updated);
        setColorForm(INITIAL_COLOR_FORM);
        setEditingColorId(null);
        setMessage(`Color ${updated.name} actualizado correctamente.`);
        // Sincronizar en segundo plano para mantener consistencia
        syncColorsInBackground();
      } else {
        const created = await createColor({
          name: colorForm.name.trim(),
          hex: normalizedColorHex,
          colorGroupId: colorForm.colorGroupId,
        });
        // Agregar a la lista localmente
        addColorToList(created);
        setColorForm(INITIAL_COLOR_FORM);
        setMessage(`Color ${created.name} creado correctamente.`);
        // Sincronizar en segundo plano
        syncColorsInBackground();
      }
      // Restaurar scroll position
      restoreScrollPosition(colorsTableRef, scrollPosition);
    } catch (error) {
      setMessage(
        getErrorMessage(error, isEditingColor ? 'No se pudo actualizar el color.' : 'No se pudo crear el color.')
      );
    } finally {
      setIsSubmittingColor(false);
    }
  };

  const handleGroupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateGroupForm(groupForm);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSubmittingGroup(true);
    setMessage(null);
    const scrollPosition = saveScrollPosition(groupsTableRef);

    try {
      if (isEditingGroup) {
        const updated = await updateColorGroup(editingGroupId, {
          name: groupForm.name.trim(),
          hex: normalizedGroupHex,
        });
        // Actualizar localmente
        updateGroupInList(editingGroupId, updated);
        setGroupForm(INITIAL_GROUP_FORM);
        setEditingGroupId(null);
        setMessage(`Grupo ${updated.name} actualizado correctamente.`);
        // Sincronizar en segundo plano
        syncGroupsInBackground();
      } else {
        const created = await createColorGroup({
          name: groupForm.name.trim(),
          hex: normalizedGroupHex,
        });
        // Agregar a la lista localmente
        addGroupToList(created);
        setGroupForm(INITIAL_GROUP_FORM);
        setMessage(`Grupo ${created.name} creado correctamente.`);
        // Sincronizar en segundo plano
        syncGroupsInBackground();
      }
      // Restaurar scroll position
      restoreScrollPosition(groupsTableRef, scrollPosition);
    } catch (error) {
      setMessage(
        getErrorMessage(
          error,
          isEditingGroup ? 'No se pudo actualizar el grupo.' : 'No se pudo crear el grupo.'
        )
      );
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleEditColor = (color: Color) => {
    if (color.id == null) {
      setMessage('No se puede editar un color sin ID.');
      return;
    }

    setEditingColorId(color.id);
    setColorForm({
      name: color.name,
      hex: color.hex,
      colorGroupId: color.colorGroupId ?? null,
    });
    setMessage(null);
  };

  const handleCancelEditColor = () => {
    setEditingColorId(null);
    setColorForm(INITIAL_COLOR_FORM);
    setMessage(null);
  };

  const handleEditGroup = (group: ColorGroup) => {
    if (group.id == null) {
      setMessage('No se puede editar un grupo sin ID.');
      return;
    }

    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name,
      hex: group.hex || '#000000',
    });
    setMessage(null);
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setGroupForm(INITIAL_GROUP_FORM);
    setMessage(null);
  };

  const handleDeleteGroup = async (group: ColorGroup) => {
    if (group.id == null) {
      setMessage('No se puede eliminar un grupo sin ID.');
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`)) {
      return;
    }

    setMessage(null);
    const scrollPosition = saveScrollPosition(groupsTableRef);

    try {
      await deleteColorGroup(group.id);
      // Remover de la lista localmente
      removeGroupFromList(group.id);
      // Actualizar colores que pertenecían a este grupo
      setColors((prev) =>
        prev.map((color) =>
          color.colorGroupId === group.id ? { ...color, colorGroupId: null, colorGroup: undefined } : color
        )
      );
      setMessage(`Grupo ${group.name} eliminado correctamente.`);
      // Sincronizar en segundo plano
      syncGroupsInBackground();
      syncColorsInBackground();
      // Restaurar scroll
      restoreScrollPosition(groupsTableRef, scrollPosition);
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudo eliminar el grupo.'));
    }
  };

  const handleRemoveColorGroup = async (color: Color) => {
    if (color.id == null) {
      setMessage('No se puede actualizar un color sin ID.');
      return;
    }

    setMessage(null);
    const scrollPosition = saveScrollPosition(colorsTableRef);

    try {
      await updateColor(color.id, {
        colorGroupId: null,
      });
      // Actualizar localmente
      updateColorInList(color.id, { colorGroupId: null, colorGroup: undefined });
      setMessage(`Grupo removido del color ${color.name}.`);
      // Sincronizar en segundo plano
      syncColorsInBackground();
      // Restaurar scroll
      restoreScrollPosition(colorsTableRef, scrollPosition);
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudo remover el grupo del color.'));
    }
  };

  const handleRefresh = async () => {
    setMessage(null);
    await loadColors();
    await loadColorGroups();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de colores</h2>
          <p className="text-gray-600">Alta y listado de colores y grupos disponibles en la base de datos.</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoadingColors || isLoadingGroups || isSubmittingColor || isSubmittingGroup}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoadingColors || isLoadingGroups ? 'animate-spin' : ''}`}
          />
          Actualizar
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.4fr]">
        {/* Color Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditingColor ? 'Editar color' : 'Crear color'}
              </h3>
              <p className="text-sm text-slate-500">
                {isEditingColor ? `Modificando ID ${editingColorId}.` : 'El hex debe respetar el formato #RRGGBB.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleColorSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                value={colorForm.name}
                onChange={(event) =>
                  setColorForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Rojo"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
              <label className="block text-sm font-medium text-slate-700">
                Color
                <input
                  type="color"
                  value={HEX_PATTERN.test(colorForm.hex) ? colorForm.hex : '#000000'}
                  onChange={(event) =>
                    setColorForm((prev) => ({
                      ...prev,
                      hex: event.target.value.toUpperCase(),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Hex
                <input
                  value={colorForm.hex}
                  onChange={(event) =>
                    setColorForm((prev) => ({ ...prev, hex: event.target.value }))
                  }
                  placeholder="#FF0000"
                  maxLength={7}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Grupo (Opcional)
              <select
                value={colorForm.colorGroupId ?? ''}
                onChange={(event) =>
                  setColorForm((prev) => ({
                    ...prev,
                    colorGroupId: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Sin grupo</option>
                {colorGroups.map((group) => (
                  <option key={group.id} value={String(group.id)}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <span
                className="h-9 w-9 rounded-lg border border-slate-200"
                style={{
                  backgroundColor: HEX_PATTERN.test(colorForm.hex) ? colorForm.hex : '#FFFFFF',
                }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {colorForm.name.trim() || 'Vista previa'}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {normalizedColorHex || '#RRGGBB'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmittingColor}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingColor
                  ? isEditingColor
                    ? 'Guardando...'
                    : 'Creando...'
                  : isEditingColor
                    ? 'Guardar cambios'
                    : 'Crear color'}
              </button>

              {isEditingColor && (
                <button
                  type="button"
                  onClick={handleCancelEditColor}
                  disabled={isSubmittingColor}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Colors List */}
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
            <div ref={colorsTableRef} className="max-h-[520px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Color</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Grupo</th>
                    <th className="px-4 py-3 font-semibold">Hex</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoadingColors ? (
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
                        <td className="px-4 py-3 text-slate-700">
                          {color.colorGroup ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded border border-slate-200"
                                style={{
                                  backgroundColor: color.colorGroup.hex || '#CCCCCC',
                                }}
                              />
                              <span>{color.colorGroup.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Sin grupo</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{color.hex}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleEditColor(color)}
                              disabled={isSubmittingColor || color.id == null}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            {color.colorGroupId && (
                              <button
                                onClick={() => handleRemoveColorGroup(color)}
                                disabled={isSubmittingColor}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                Remover
                              </button>
                            )}
                          </div>
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

      {/* Color Groups Section */}
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.4fr]">
        {/* Group Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditingGroup ? 'Editar grupo' : 'Crear grupo de colores'}
              </h3>
              <p className="text-sm text-slate-500">
                {isEditingGroup ? `Modificando ID ${editingGroupId}.` : 'Agrupa colores relacionados.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Rojos"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
              <label className="block text-sm font-medium text-slate-700">
                Color
                <input
                  type="color"
                  value={HEX_PATTERN.test(groupForm.hex) ? groupForm.hex : '#000000'}
                  onChange={(event) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      hex: event.target.value.toUpperCase(),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Hex
                <input
                  value={groupForm.hex}
                  onChange={(event) =>
                    setGroupForm((prev) => ({ ...prev, hex: event.target.value }))
                  }
                  placeholder="#FF0000"
                  maxLength={7}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <span
                className="h-9 w-9 rounded-lg border border-slate-200"
                style={{
                  backgroundColor: HEX_PATTERN.test(groupForm.hex)
                    ? groupForm.hex
                    : '#FFFFFF',
                }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {groupForm.name.trim() || 'Vista previa'}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {normalizedGroupHex || '#RRGGBB'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmittingGroup}
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingGroup
                  ? isEditingGroup
                    ? 'Guardando...'
                    : 'Creando...'
                  : isEditingGroup
                    ? 'Guardar cambios'
                    : 'Crear grupo'}
              </button>

              {isEditingGroup && (
                <button
                  type="button"
                  onClick={handleCancelEditGroup}
                  disabled={isSubmittingGroup}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Groups List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Grupos de colores</h3>
              <p className="text-sm text-slate-500">Listado obtenido desde /color-groups.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {colorGroups.length} grupos
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div ref={groupsTableRef} className="max-h-[520px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Color</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Hex</th>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoadingGroups ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Cargando grupos...
                      </td>
                    </tr>
                  ) : colorGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No hay grupos disponibles.
                      </td>
                    </tr>
                  ) : (
                    colorGroups.map((group, index) => (
                      <tr key={`${group.id}-${index}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span
                            className="block h-8 w-8 rounded-lg border border-slate-200"
                            style={{
                              backgroundColor: group.hex || '#CCCCCC',
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{group.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {group.hex || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{group.id ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleEditGroup(group)}
                              disabled={isSubmittingGroup || group.id == null}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group)}
                              disabled={isSubmittingGroup || group.id == null}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Eliminar
                            </button>
                          </div>
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
