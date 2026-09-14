import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Heart, Loader2, Lock, Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2, MapPin, Globe } from 'lucide-react';

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
  const [photographerProfile, setPhotographerProfile] = useState<any>(null);
  
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  useEffect(() => {
    const savedToken = localStorage.getItem(`gallery_token_${slug}`);
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      fetchInitialGalleryData(savedToken);
    }
  }, [slug]);

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
      setPhotographerProfile(response.data.photographerProfile);
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

  const brandColor = photographerProfile?.branding?.primaryColor || '#D4AF37';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <style>{`
        .brand-bg { background-color: ${brandColor}; }
        .brand-text { color: ${brandColor}; }
        .brand-border { border-color: ${brandColor}; }
        .brand-shadow { box-shadow: 0 4px 14px 0 ${brandColor}40; }
        .brand-fill { fill: ${brandColor}; }
      `}</style>
      
      {/* Background ambient lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[150px] pointer-events-none brand-bg" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[150px] pointer-events-none brand-bg" />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          
          {/* Photographer Identity */}
          <div 
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowProfileModal(true)}
          >
            {photographerProfile?.logo ? (
              <img src={photographerProfile.logo} alt="Logo" className="h-10 object-contain" />
            ) : photographerProfile?.profileImage ? (
              <img src={photographerProfile.profileImage} alt="Profile" className="h-10 w-10 rounded-full object-cover shadow-sm" />
            ) : null}
            
            <div className={`${photographerProfile?.logo ? 'hidden md:block' : 'block'}`}>
              <h2 className="font-bold text-sm md:text-base leading-tight text-foreground">
                {photographerProfile?.businessName || photographerProfile?.displayName || 'Photographer'}
              </h2>
              {photographerProfile?.businessName && photographerProfile?.displayName && (
                <p className="text-xs text-muted-foreground">{photographerProfile.displayName}</p>
              )}
            </div>
          </div>

          {/* Center Title (Desktop only) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <h1 className="font-semibold text-lg tracking-tight text-foreground/90">{galleryName}</h1>
          </div>

          {/* Client Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 text-sm px-4 md:px-5 py-2.5 rounded-full border transition-all duration-300 ${
                showFavoritesOnly 
                  ? 'brand-bg text-white brand-border brand-shadow scale-105' 
                  : 'bg-card/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Heart className={`h-4 w-4 transition-colors ${showFavoritesOnly ? 'fill-white text-white' : ''}`} />
              <span className="font-medium hidden md:inline">{favoriteIds.size} Favorites</span>
              <span className="font-medium md:hidden">{favoriteIds.size}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Title */}
      <div className="lg:hidden px-4 pt-6 pb-2 text-center">
        <h1 className="font-bold text-2xl tracking-tight text-foreground">{galleryName}</h1>
        <p className="text-sm text-muted-foreground mt-1">{photos.length} Photos</p>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
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
                  className="relative group break-inside-avoid overflow-hidden rounded-2xl bg-card border border-border/20 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
                  onClick={() => setSelectedPhotoIndex(index)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo._id);
                      }}
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
                    
                    <div className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" /> View Image
                    </div>
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

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && displayedPhotos[selectedPhotoIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-50"
          >
            <X className="h-6 w-6" />
          </button>
          
          <button 
            onClick={() => setSelectedPhotoIndex(prev => (prev! > 0 ? prev! - 1 : displayedPhotos.length - 1))}
            className="absolute left-4 md:left-12 p-3 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-50"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img 
              src={displayedPhotos[selectedPhotoIndex].thumbnailUrl.replace(/=s\d+$/, '=s1600')} 
              alt={displayedPhotos[selectedPhotoIndex].fileName} 
              className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
            />
          </div>

          <button 
            onClick={() => setSelectedPhotoIndex(prev => (prev! < displayedPhotos.length - 1 ? prev! + 1 : 0))}
            className="absolute right-4 md:right-12 p-3 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-50"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* Photographer Profile Modal */}
      {showProfileModal && photographerProfile && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowProfileModal(false)}>
          <div 
            className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-32 brand-bg relative">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8 relative">
              {/* Avatar overhanging the banner */}
              <div className="absolute -top-16 left-8 h-28 w-28 rounded-full border-4 border-card bg-secondary overflow-hidden shadow-xl flex items-center justify-center">
                {photographerProfile.profileImage ? (
                  <img src={photographerProfile.profileImage} alt={photographerProfile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
              
              <div className="pt-16">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {photographerProfile.businessName || photographerProfile.displayName}
                </h2>
                {photographerProfile.businessName && photographerProfile.displayName && (
                  <p className="text-muted-foreground font-medium text-sm mt-1">{photographerProfile.displayName}</p>
                )}
                
                {photographerProfile.bio && (
                  <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
                    {photographerProfile.bio}
                  </p>
                )}
                
                <div className="mt-6 space-y-3">
                  {(photographerProfile.location?.city || photographerProfile.location?.country) && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 brand-text" />
                      <span>{[photographerProfile.location.city, photographerProfile.location.state, photographerProfile.location.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  
                  {photographerProfile.website && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 brand-text" />
                      <a href={photographerProfile.website.startsWith('http') ? photographerProfile.website : `https://${photographerProfile.website}`} target="_blank" rel="noreferrer" className="hover:brand-text transition-colors">
                        {photographerProfile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(photographerProfile.socialLinks?.instagram || photographerProfile.socialLinks?.facebook || photographerProfile.socialLinks?.youtube) && (
                  <div className="mt-8 flex items-center gap-4 pt-6 border-t border-border/50">
                    {photographerProfile.socialLinks.instagram && (
                      <a href={photographerProfile.socialLinks.instagram.startsWith('http') ? photographerProfile.socialLinks.instagram : `https://instagram.com/${photographerProfile.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-full transition-colors group">
                        <Globe className="h-5 w-5 text-foreground/70 group-hover:brand-text" />
                      </a>
                    )}
                    {photographerProfile.socialLinks.facebook && (
                      <a href={photographerProfile.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-full transition-colors group">
                        <Globe className="h-5 w-5 text-foreground/70 group-hover:brand-text" />
                      </a>
                    )}
                    {photographerProfile.socialLinks.youtube && (
                      <a href={photographerProfile.socialLinks.youtube} target="_blank" rel="noreferrer" className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-full transition-colors group">
                        <Globe className="h-5 w-5 text-foreground/70 group-hover:brand-text" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGalleryPage;
