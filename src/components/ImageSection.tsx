import { useState } from 'react';
import ImageUploader from './ImageUploader';
import ImageList from './ImageList';
import { ImageData } from '../types';

export default function ImageSection() {
  const [images, setImages] = useState<ImageData[]>([]);

  const handleImageUpload = (file: File) => {
    const newImage: ImageData = {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
      product: null,
    };
    setImages([...images, newImage]);
  };

  const handleDeleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleAssociateProduct = (imageId: string, productId: string | null) => {
    setImages(images.map(img =>
      img.id === imageId ? { ...img, product: productId } : img
    ));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Imágenes</h2>
        <p className="text-gray-600">Sube, gestiona y asocia imágenes a tus productos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ImageUploader onUpload={handleImageUpload} />
        </div>

        <div className="lg:col-span-2">
          <ImageList
            images={images}
            onDelete={handleDeleteImage}
            onAssociateProduct={handleAssociateProduct}
          />
        </div>
      </div>
    </div>
  );
}
