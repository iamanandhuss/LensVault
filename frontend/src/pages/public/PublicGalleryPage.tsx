import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Heart, Loader2, Lock, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Photo {
  _id: string;
  thumbnailUrl: string;
  fullResUrl: string;
  fileName: string;
}

const PublicGalleryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [galleryName, setGalleryName] = useState('');
  const [galleryId, setGalleryId] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPhotoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  // Try to load token from localStorage for persistence during the session
  useEffect(() => {
    const savedToken = localStorage.getItem(`gallery_token_${slug}`);
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      fetchInitialGalleryData(savedToken);
    }
  }, [slug]);

  // Fetch more photos when page changes
  useEffect(() => {
    if (page > 1 && isAuthenticated && hasMore) {
      fetchMorePhotos();
    }
  }, [page, isAuthenticated, hasMore]);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/public/access`, {
        slug,
        secretKey
      });

      const token = response.data.galleryToken;
      localStorage.setItem(`gallery_token_${slug}`, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setGalleryId(response.data.gallery.id);
      
      await fetchInitialGalleryData(token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid secret key');
      setLoading(false);
    }
  };

  const fetchInitialGalleryData = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/public/gallery/${slug}?page=1&limit=60`);
      setGalleryName(response.data.gallery.name);
      setGalleryId(response.data.gallery.id);
      setPhotos(response.data.photos);
      setHasMore(response.data.pagination.hasMore);
      setIsAuthenticated(true);
      
      const favResponse = await axios.get(`${API_URL}/api/favorites/${response.data.gallery.id}`, {
        withCredentials: true 
      });
      setFavoriteIds(new Set(favResponse.data.favoritePhotoIds));

    } catch (err) {
      console.error(err);
      localStorage.removeItem(`gallery_token_${slug}`);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePhotos = async () => {
    try {
      setLoadingMore(true);
      const response = await axios.get(`${API_URL}/api/public/gallery/${slug}?page=${page}&limit=60`);
      setPhotos(prev => [...prev, ...response.data.photos]);
      setHasMore(response.data.pagination.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFavorite = async (photoId: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/favorites/toggle`, {
        galleryId,
        photoId
      }, { withCredentials: true });

      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (response.data.favorited) {
          next.add(photoId);
        } else {
          next.delete(photoId);
        }
        return next;
      });
    } catch (err) {
      alert('Failed to save favorite.');
    }
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-zinc-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-zinc-100 mb-2">Private Gallery</h2>
          <p className="text-zinc-400 text-center mb-8 text-sm">Please enter the secret key provided by your photographer to access your photos.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAccess} className="space-y-4">
            <input 
              type="text" 
              value={secretKey}
              onChange={e => setSecretKey(e.target.value.toUpperCase())}
              placeholder="e.g. A7F9-K2P4"
              className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-md px-4 text-center text-lg tracking-widest text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 uppercase"
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-black font-semibold rounded-md hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Unlock Gallery'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const displayedPhotos = showFavoritesOnly 
    ? photos.filter(photo => favoriteIds.has(photo._id)) 
    : photos;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      {/* Background ambient lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-2xl border-b border-border/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <h1 className="font-bold text-xl md:text-2xl tracking-tight text-foreground">{galleryName}</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border transition-all duration-300 shadow-sm ${
                showFavoritesOnly 
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] scale-105' 
                  : 'bg-card/50 text-muted-foreground border-border/50 hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Heart className={`h-4 w-4 transition-colors ${showFavoritesOnly ? 'fill-primary-foreground text-primary-foreground' : ''}`} />
              <span className="font-medium">{favoriteIds.size} Favorites</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 relative z-10">
        {photos.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No photos yet</h3>
            <p className="text-muted-foreground mt-3 text-lg max-w-sm">The photographer hasn't synced any photos to this gallery yet.</p>
          </div>
        ) : displayedPhotos.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <Heart className="h-10 w-10 text-red-500" />
            </div>
             <h3 className="text-2xl font-bold text-foreground">No favorites yet</h3>
             <p className="text-muted-foreground mt-3 text-lg max-w-sm">You haven't liked any photos. Turn off the filter to see all photos.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {displayedPhotos.map((photo, index) => {
              const isLastPhoto = index === displayedPhotos.length - 1;
              return (
                <div 
                  key={photo._id} 
                  ref={isLastPhoto ? lastPhotoElementRef : null}
                  className="relative group break-inside-avoid overflow-hidden rounded-2xl bg-card border border-border/20 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                >
                  <img 
                    src={photo.thumbnailUrl} 
                    alt={photo.fileName} 
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <button 
                      onClick={() => toggleFavorite(photo._id)}
                      className="absolute top-4 right-4 p-3 bg-background/40 hover:bg-background/80 backdrop-blur-md border border-white/10 rounded-full transition-all duration-300 group/btn hover:scale-110 shadow-xl"
                    >
                      <Heart 
                        className={`h-6 w-6 transition-colors duration-300 ${
                          favoriteIds.has(photo._id) 
                            ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                            : 'text-white group-hover/btn:text-red-400'
                        }`} 
                      />
                    </button>
                    {photo.fullResUrl && (
                      <a 
                        href={photo.fullResUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-white/90 hover:text-primary transition-colors tracking-wide uppercase"
                      >
                        Download High-Res
                      </a>
                    )}
                  </div>
                  
                  {/* Always show heart if favorited (Mobile/Persistent) */}
                  {favoriteIds.has(photo._id) && (
                    <div className="absolute top-4 right-4 p-3 bg-background/60 backdrop-blur-md border border-white/10 rounded-full md:hidden pointer-events-none shadow-xl">
                      <Heart className="h-6 w-6 text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {loadingMore && (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicGalleryPage;
