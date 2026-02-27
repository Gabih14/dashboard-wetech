import { useState } from 'react';
import { Trash2, Link2, Package, Check, X } from 'lucide-react';
import { ImageData } from '../types';
import ProductSelector from './ProductSelector';

interface ImageCardProps {
  image: ImageData;
  onDelete: (id: string) => void;
  onAssociateProduct: (imageId: string, productId: string | null) => void;
}

export default function ImageCard({ image, onDelete, onAssociateProduct }: ImageCardProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectProduct = (productId: string | null) => {
    onAssociateProduct(image.id, productId);
    setShowProductSelector(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <img
            src={image.url}
            alt={image.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{image.name}</h4>
              <p className="text-xs text-gray-500">
                {new Date(image.uploadedAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <button
              onClick={() => onDelete(image.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar imagen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {image.product && (
            <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-green-50 rounded-md w-fit">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                Asociada a: {image.product}
              </span>
              <button
                onClick={() => onAssociateProduct(image.id, null)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>

            <button
              onClick={() => setShowProductSelector(!showProductSelector)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              {image.product ? 'Cambiar Producto' : 'Asociar Producto'}
            </button>
          </div>
        </div>
      </div>

      {showProductSelector && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ProductSelector
            currentProduct={image.product}
            onSelect={handleSelectProduct}
            onCancel={() => setShowProductSelector(false)}
          />
        </div>
      )}
    </div>
  );
}
