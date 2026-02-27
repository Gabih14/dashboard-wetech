import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

const MOCK_PRODUCTS = [
  { id: 'prod-001', name: 'Laptop Dell XPS 13' },
  { id: 'prod-002', name: 'Monitor LG UltraWide 34"' },
  { id: 'prod-003', name: 'Teclado Mecánico Logitech' },
  { id: 'prod-004', name: 'Mouse Inalámbrico MX Master' },
  { id: 'prod-005', name: 'Webcam HD Logitech C920' },
  { id: 'prod-006', name: 'Auriculares Sony WH-1000XM4' },
  { id: 'prod-007', name: 'Silla Ergonómica Herman Miller' },
  { id: 'prod-008', name: 'Escritorio Regulable Standing Desk' },
  { id: 'prod-009', name: 'Lámpara LED Escritorio' },
  { id: 'prod-010', name: 'Hub USB-C 7 en 1' },
];

interface ProductSelectorProps {
  currentProduct: string | null;
  onSelect: (productId: string | null) => void;
  onCancel: () => void;
}

export default function ProductSelector({ currentProduct, onSelect, onCancel }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Seleccionar Producto</h4>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No se encontraron productos
          </div>
        ) : (
          filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => onSelect(product.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                currentProduct === product.id
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-xs text-gray-500">{product.id}</div>
            </button>
          ))
        )}
      </div>

      {currentProduct && (
        <button
          onClick={() => onSelect(null)}
          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          Desasociar Producto
        </button>
      )}
    </div>
  );
}
