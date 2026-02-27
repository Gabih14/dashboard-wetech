import { VentaMensual } from '../services/metricsService';
import { BarChart3 } from 'lucide-react';

interface VentasMensualesChartProps {
  data: VentaMensual[] | null;
  isLoading: boolean;
}

export default function VentasMensualesChart({ data, isLoading }: VentasMensualesChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
        No hay datos de ventas mensuales para este período
      </div>
    );
  }

  const safeData = data.map((item) => ({
    ...item,
    total: Number.isFinite(item.total) ? item.total : 0,
    cantidad: Number.isFinite(item.cantidad) ? item.cantidad : 0,
  }));

  const maxVenta = Math.max(...safeData.map((d) => d.total), 0);
  const scale = maxVenta > 0 ? 100 / maxVenta : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Ventas Mensuales</h3>
      </div>

      <div className="space-y-4">
        {safeData.map((item) => (
          <div key={item.mes}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-medium text-gray-700">{item.mes}</span>
              <span className="text-sm font-semibold text-gray-900">
                ${item.total.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                style={{ width: `${item.total * scale}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{item.cantidad} comprobantes</span>
          </div>
        ))}
      </div>
    </div>
  );
}
