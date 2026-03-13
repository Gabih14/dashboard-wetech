import { BarChart3, Percent, ShoppingCart, TrendingUp } from 'lucide-react';
import { DashboardSection } from '../types';

interface SidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold">WeTECH</h1>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => onSectionChange('pedidos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'pedidos'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">Pedidos</span>
          </button>

          {/* <button
            onClick={() => onSectionChange('images')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'images'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <Image className="w-5 h-5" />
            <span className="font-medium">Agregar Imagen</span>
          </button> */}

          <button
            onClick={() => onSectionChange('metrics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'metrics'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Métricas</span>
          </button>

          <button
            onClick={() => onSectionChange('cupon')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'cupon'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <Percent className="w-5 h-5" />
            <span className="font-medium">Cupones</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
