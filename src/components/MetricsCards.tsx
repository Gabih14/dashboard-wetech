import { TrendingUp, Percent, DollarSign, FileText } from 'lucide-react';
import { ResumenMetrics } from '../services/metricsService';

interface MetricsCardsProps {
  data: ResumenMetrics | null;
  isLoading: boolean;
}

export default function MetricsCards({ data, isLoading }: MetricsCardsProps) {
  const Card = ({ icon: Icon, label, value, format }: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
          <p className="text-xl xl:text-2xl font-bold text-gray-900 leading-tight break-all max-w-full">
            {isLoading ? '-' : format(value)}
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm shrink-0 self-start flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-700" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        icon={DollarSign}
        label="Total de Ventas"
        value={data?.totalVentas ?? 0}
        format={(val: number) => `$${val.toLocaleString('es-ES')}`}
      />
      <Card
        icon={FileText}
        label="Comprobantes"
        value={data?.cantidadComprobantes ?? 0}
        format={(val: number) => val.toLocaleString('es-ES')}
      />
      <Card
        icon={TrendingUp}
        label="Monto Promedio"
        value={data?.montoPromedio ?? 0}
        format={(val: number) => `$${val.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`}
      />
      <Card
        icon={Percent}
        label="Período"
        value={`${data?.periodoDesde} a ${data?.periodoHasta}`}
        format={(val: string) => val}
      />
    </div>
  );
}
