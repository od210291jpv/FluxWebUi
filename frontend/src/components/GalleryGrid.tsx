import React, { useState } from 'react';
import { useGalleryStore } from '../store/galleryStore';
import type { GalleryItem } from '../types';

export const GalleryGrid: React.FC = () => {
  const { items, loading, deleteImage } = useGalleryStore();
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const handleDownload = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flux-${item.seed}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      await deleteImage(id);
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer border border-gray-800 hover:border-violet-500 transition-colors"
            onClick={() => setSelectedImage(item)}
          >
            <img src={item.image_url} alt={item.prompt} loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
              <p className="text-white text-xs line-clamp-3 mb-2">{item.prompt}</p>
            </div>
          </div>
        ))}
        {loading && items.length === 0 && (
          [...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
          ))
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full h-full max-w-7xl max-h-full flex flex-col md:flex-row gap-6 bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 z-10 p-2 bg-gray-900/80 rounded-full text-white hover:bg-gray-800 transition-colors" onClick={() => setSelectedImage(null)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black p-4">
              <img src={selectedImage.image_url} className="max-w-full max-h-full object-contain" alt={selectedImage.prompt} />
            </div>
            <div className="w-full md:w-80 flex flex-col bg-gray-900 p-6 overflow-y-auto border-l border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Prompt</span>
                  <p className="text-gray-200 bg-gray-800 p-3 rounded">{selectedImage.prompt}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 block">Model</span>
                    <span className="text-gray-200 truncate block">{selectedImage.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Seed</span>
                    <span className="text-gray-200">{selectedImage.seed}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Steps</span>
                    <span className="text-gray-200">{selectedImage.steps}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Guidance</span>
                    <span className="text-gray-200">{selectedImage.guidance}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Time</span>
                    <span className="text-gray-200">{selectedImage.time.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <button onClick={() => handleDownload(selectedImage)} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download
                </button>
                <button onClick={() => handleDelete(selectedImage.id)} className="w-full py-2 bg-transparent border border-red-900/50 hover:bg-red-950 text-red-500 rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
