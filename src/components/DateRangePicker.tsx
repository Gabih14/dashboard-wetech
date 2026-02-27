import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onApply: () => void;
  isLoading?: boolean;
}

export default function DateRangePicker({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onApply,
  isLoading
}: DateRangePickerProps) {
  const getLast30Days = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    };
  };

  const getLast90Days = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 90);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    };
  };

  const getThisYear = () => {
    const today = new Date();
    return {
      from: `${today.getFullYear()}-01-01`,
      to: today.toISOString().split('T')[0]
    };
  };

  const applyPreset = (preset: { from: string; to: string }) => {
    onFromChange(preset.from);
    onToChange(preset.to);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Rango de Fechas</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => applyPreset(getLast30Days())}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Últimos 30 días
        </button>
        <button
          onClick={() => applyPreset(getLast90Days())}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Últimos 90 días
        </button>
        <button
          onClick={() => applyPreset(getThisYear())}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Este año
        </button>
      </div>

      <button
        onClick={onApply}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
      >
        {isLoading ? 'Cargando...' : 'Aplicar'}
      </button>
    </div>
  );
}
