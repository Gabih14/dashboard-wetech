import { VentaPorVendedor } from '../services/metricsService';
import { Users } from 'lucide-react';

interface VentasPorVendedorTableProps {
  data: VentaPorVendedor[] | null;
  isLoading: boolean;
}

export default function VentasPorVendedorTable({ data, isLoading }: VentasPorVendedorTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
        No hay datos de ventas por vendedor para este período
      </div>
    );
  }

  const safeData = data.map((item) => {
    const totalVentas = Number.isFinite(item.totalVentas) ? item.totalVentas : 0;
    const cantidadComprobantes = Number.isFinite(item.cantidadComprobantes) ? item.cantidadComprobantes : 0;
    const porcentaje = Number.isFinite(item.porcentaje) ? item.porcentaje : 0;

    return {
      ...item,
      totalVentas,
      cantidadComprobantes,
      porcentaje,
      porcentajeClamped: Math.max(0, Math.min(100, porcentaje)),
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Ventas por Vendedor</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendedor</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Ventas</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Comprobantes</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {safeData.map((item) => (
              <tr key={item.vendedorId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{item.vendedor}</td>
                <td className="py-3 px-4 text-right text-gray-700">
                  ${item.totalVentas.toLocaleString('es-ES')}
                </td>
                <td className="py-3 px-4 text-right text-gray-700">
                  {item.cantidadComprobantes}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all"
                        style={{ width: `${item.porcentajeClamped}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900 w-10 text-right">
                      {item.porcentaje.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
