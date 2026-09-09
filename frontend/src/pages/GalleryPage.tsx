import React, { useEffect, useState } from 'react';
import { GalleryGrid } from '../components/GalleryGrid';
import { useGalleryStore } from '../store/galleryStore';

export const GalleryPage: React.FC = () => {
  const { fetchImages, setSearch, search, page, total, perPage, setPage, items, loading } = useGalleryStore();
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 pb-12 overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Gallery</h1>
        <form onSubmit={handleSearch} className="w-full sm:w-auto relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search prompts..."
            className="w-full sm:w-64 bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
          />
          <svg className="w-4 h-4 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </form>
      </div>

      {!loading && items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
          <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <p className="text-lg">No images found</p>
          {search ? (
            <p className="text-sm mt-1">Try a different search term</p>
          ) : (
            <p className="text-sm mt-1">Go to Generate to create your first image.</p>
          )}
        </div>
      ) : (
        <>
          <GalleryGrid />
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400 px-4">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
