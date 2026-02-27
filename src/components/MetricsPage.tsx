import { useState, useEffect } from 'react';
import DateRangePicker from './DateRangePicker';
import MetricsCards from './MetricsCards';
import VentasMensualesChart from './VentasMensualesChart';
import VentasPorVendedorTable from './VentasPorVendedorTable';
import {
  fetchResumenMetrics,
  fetchVentasMensuales,
  fetchVentasPorVendedor,
  ResumenMetrics,
  VentaMensual,
  VentaPorVendedor,
} from '../services/metricsService';

export default function MetricsPage() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });

  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resumen, setResumen] = useState<ResumenMetrics | null>(null);
  const [ventasMensuales, setVentasMensuales] = useState<VentaMensual[] | null>(null);
  const [ventasVendedor, setVentasVendedor] = useState<VentaPorVendedor[] | null>(null);

  const loadMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [resumenData, ventasData, vendedorData] = await Promise.all([
        fetchResumenMetrics(fromDate, toDate),
        fetchVentasMensuales(fromDate, toDate),
        fetchVentasPorVendedor(fromDate, toDate),
      ]);

      if (resumenData) setResumen(resumenData);
      if (ventasData) setVentasMensuales(ventasData);
      if (vendedorData) setVentasVendedor(vendedorData);
      console.log('Métricas cargadas:', { resumenData, ventasData, vendedorData });
      if (!resumenData || !ventasData || !vendedorData) {
        setError('Error al cargar algunas métricas. Verifica la configuración del backend.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor de métricas.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Métricas de Ventas</h2>
        <p className="text-gray-600">Análisis detallado de ventas y desempeño</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Nota:</strong> {error}
          </p>
          <p className="text-xs text-red-700 mt-1">
            Asegúrate de que tu backend esté ejecutándose y accesible desde <code className="bg-red-100 px-2 py-1 rounded">VITE_API_URL</code>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
            onApply={loadMetrics}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-3">
          <MetricsCards data={resumen} isLoading={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VentasMensualesChart data={ventasMensuales} isLoading={isLoading} />
        <VentasPorVendedorTable data={ventasVendedor} isLoading={isLoading} />
      </div>
    </div>
  );
}
