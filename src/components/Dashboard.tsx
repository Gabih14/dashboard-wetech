import { useState } from 'react';
import { DashboardSection } from '../types';
import Sidebar from './Sidebar';
import CuponPage from './CuponPage';
import ImageSection from './ImageSection';
import MetricsPage from './MetricsPage';
import PedidosPage from './PedidosPage';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('pedidos');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-8">
        {activeSection === 'pedidos' && <PedidosPage />}
        {activeSection === 'images' && <ImageSection />}
        {activeSection === 'metrics' && <MetricsPage />}
        {activeSection === 'cupon' && <CuponPage />}
      </main>
    </div>
  );
}
