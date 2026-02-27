import { ImageData } from '../types';
import ImageCard from './ImageCard';

interface ImageListProps {
  images: ImageData[];
  onDelete: (id: string) => void;
  onAssociateProduct: (imageId: string, productId: string | null) => void;
}

export default function ImageList({ images, onDelete, onAssociateProduct }: ImageListProps) {
  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay imágenes</h3>
          <p className="text-sm text-gray-600">Sube tu primera imagen para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Imágenes Subidas ({images.length})</h3>
      <div className="space-y-3">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onDelete={onDelete}
            onAssociateProduct={onAssociateProduct}
          />
        ))}
      </div>
    </div>
  );
}
