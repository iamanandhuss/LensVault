import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Loader2, Plus, X, Folder, Copy, Check, RefreshCw, Trash2, AlertTriangle, UploadCloud, Heart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Client {
  _id: string;
  name: string;
}

interface Gallery {
  _id: string;
  name: string;
  slug: string;
  clientId: Client;
  googleDriveFolderId: string;
  coverPhotoUrl?: string;
  createdAt: string;
}

const GalleriesPage = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // For showing the secret key after creation
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<{name: string, key: string, slug: string} | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState('');

  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingGalleries, setSyncingGalleries] = useState<Set<string>>(new Set());
  const [viewingFavoritesFor, setViewingFavoritesFor] = useState<Gallery | null>(null);
  const [favoritesData, setFavoritesData] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({});

  // Delete state
  const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [galleriesRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/api/galleries`, { withCredentials: true }),
        axios.get(`${API_URL}/api/clients`, { withCredentials: true })
      ]);
      setGalleries(galleriesRes.data);
      setClients(clientsRes.data);
      if (clientsRes.data.length > 0 && !clientId) {
        setClientId(clientsRes.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (clients.length === 0) {
      setError('You must create a Client first before creating a gallery.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/galleries`, {
        name,
        clientId,
        googleDriveFolderId
      }, { withCredentials: true });

      // The backend returns the raw secret key ONLY ONCE upon creation
      setNewlyCreatedSecret({
        name: response.data.gallery.name,
        key: response.data.rawSecretKey,
        slug: response.data.gallery.slug
      });
      
      setIsModalOpen(false);
      setName('');
      setGoogleDriveFolderId('');
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create gallery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncGallery = async (galleryId: string, folderId: string) => {
    setSyncingId(galleryId);
    setSyncProgress(prev => ({ ...prev, [galleryId]: 0 }));
    
    try {
      // Start sync
      await axios.post(`${API_URL}/api/integrations/google/sync-gallery`, {
        galleryId,
        googleDriveFolderId: folderId
      }, { withCredentials: true });
      
      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_URL}/api/integrations/google/sync-status/${galleryId}`, { withCredentials: true });
          const { syncStatus } = statusRes.data;
          
          if (syncStatus === 'syncing') {
            // Indeterminate progress or fake it slightly for UI feel
            setSyncProgress(prev => {
              const current = prev[galleryId] || 0;
              return { ...prev, [galleryId]: Math.min(current + 5, 90) };
            });
          } else if (syncStatus === 'idle') {
            clearInterval(pollInterval);
            setSyncProgress(prev => ({ ...prev, [galleryId]: 100 }));
            setTimeout(() => {
              alert('Sync completed successfully!');
              setSyncingId(null);
              setSyncProgress(prev => {
                const next = { ...prev };
                delete next[galleryId];
                return next;
              });
              fetchData(); // Refresh photos count
            }, 500);
          } else if (syncStatus === 'error') {
            clearInterval(pollInterval);
            setSyncingId(null);
            alert('Background sync encountered an error. Check logs.');
          } else if (syncStatus === 'GOOGLE_REAUTH_REQUIRED') {
            clearInterval(pollInterval);
            setSyncingId(null);
            alert('Google Drive permissions need to be updated. LensVault needs additional permission to complete this operation.\n\nPlease go to Settings -> Integrations and click Reconnect Google Drive.');
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          setSyncingId(null);
          console.error(pollErr);
        }
      }, 2000); // poll every 2 seconds

    } catch (err: any) {
      setSyncingId(null);
      setSyncProgress(prev => {
        const next = { ...prev };
        delete next[galleryId];
        return next;
      });
      alert(err.response?.data?.error || 'Failed to start sync. Did you connect Google Drive?');
    }
  };

  const handleViewFavorites = async (gallery: Gallery) => {
    setViewingFavoritesFor(gallery);
    setLoadingFavorites(true);
    setFavoritesData([]);
    try {
      const response = await axios.get(`${API_URL}/api/favorites/gallery/${gallery._id}/details`, { withCredentials: true });
      setFavoritesData(response.data.favorites);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to fetch favorites');
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleDeleteGallery = async () => {
    if (!deletingGallery) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/galleries/${deletingGallery._id}`, { withCredentials: true });
      setDeletingGallery(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete gallery');
    } finally {
      setIsDeleting(false);
    }
  };



  const handleCopySecret = () => {
    if (newlyCreatedSecret) {
      navigator.clipboard.writeText(newlyCreatedSecret.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Galleries</h1>
          <p className="text-muted-foreground mt-2">Create and manage client photo galleries.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Gallery
        </button>
      </div>

      {newlyCreatedSecret && (
        <div className="mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">🎉 Gallery Created Successfully!</h3>
          <p className="text-sm mb-4 text-green-900 dark:text-green-100">Please save this Secret Key. It will only be shown once and is required for your client to access the gallery.</p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 bg-background/50 p-4 rounded-xl border border-green-500/20 font-mono text-xl tracking-wider flex justify-between items-center shadow-inner">
              <span className="text-foreground">{newlyCreatedSecret.key}</span>
              <button 
                onClick={handleCopySecret}
                className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                title="Copy Secret Key"
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-green-600 dark:text-green-400" />}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-green-800 dark:text-green-200">
            Client Public Link: <a href={`/gallery/${newlyCreatedSecret.slug}`} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">{window.location.origin}/gallery/{newlyCreatedSecret.slug}</a>
          </p>
          
          <button 
            onClick={() => setNewlyCreatedSecret(null)}
            className="mt-6 text-sm font-semibold text-green-700 dark:text-green-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {galleries.length === 0 ? (
        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-16 text-center flex flex-col items-center">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Image className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-foreground">No galleries yet</h3>
          <p className="text-muted-foreground max-w-sm mb-8 text-lg">Connect your Google Drive and create a private gallery to send to your client.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-base hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] hover:-translate-y-1"
          >
            Create Gallery
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleries.map(gallery => (
            <div key={gallery._id} className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden flex flex-col relative group hover:-translate-y-1">
              
              {/* Green Progress Bar Overlay */}
              {syncProgress[gallery._id] !== undefined && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary z-10">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${syncProgress[gallery._id]}%` }}
                  />
                </div>
              )}
              <div className="h-40 bg-gradient-to-br from-secondary/50 to-background/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {gallery.coverPhotoUrl ? (
                  <img 
                    src={gallery.coverPhotoUrl} 
                    alt={gallery.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Image className="h-12 w-12 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500 z-10" />
                )}

                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-md z-20">
                  <a 
                    href={`/gallery/${gallery.slug}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold shadow-xl hover:scale-105 transition-transform"
                  >
                    View Public Gallery
                  </a>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col relative z-10 bg-card/40">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-xl text-foreground tracking-tight line-clamp-1">{gallery.name}</h3>
                  <button 
                    onClick={() => setDeletingGallery(gallery)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete Gallery"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Client: {gallery.clientId?.name || 'Unknown'}</p>
                


                <div className="mt-auto pt-4 border-t flex justify-between items-center">
                  <div className="flex items-center text-xs text-muted-foreground truncate max-w-[150px]" title={gallery.googleDriveFolderId}>
                    <Folder className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{gallery.googleDriveFolderId}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewFavorites(gallery)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 px-2.5 py-1.5 rounded transition-colors"
                      >
                        <Heart className="h-3.5 w-3.5" /> View Favorites
                      </button>
                    <button 
                      onClick={() => handleSyncGallery(gallery._id, gallery.googleDriveFolderId)}
                      disabled={syncingId === gallery._id}
                      className="text-xs flex items-center gap-1 font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      {syncingId === gallery._id ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Syncing...</>
                      ) : (
                        <><RefreshCw className="h-3 w-3" /> Sync Photos</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Gallery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">New Gallery</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGallery} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Gallery Name <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Smith Wedding"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Client <span className="text-destructive">*</span></label>
                {clients.length === 0 ? (
                  <div className="text-sm text-destructive border border-destructive/20 bg-destructive/10 p-3 rounded-md">
                    You must create a client first!
                  </div>
                ) : (
                  <select 
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Google Drive Folder ID <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={googleDriveFolderId}
                  onChange={e => setGoogleDriveFolderId(e.target.value)}
                  placeholder="1A2B3C4D5E6F..."
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  required
                />
                <p className="text-xs text-muted-foreground">The 33-character ID from your Google Drive folder URL.</p>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 border rounded-md font-medium text-sm hover:bg-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || clients.length === 0}
                  className="flex-1 h-10 bg-primary text-primary-foreground rounded-md font-medium flex justify-center items-center text-sm hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGallery && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border/50 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Gallery?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingGallery.name}"</span>? This will permanently remove the gallery and all its synced photos from the system. (Your files on Google Drive will NOT be deleted).
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setDeletingGallery(null)}
                disabled={isDeleting}
                className="flex-1 h-11 border border-border/50 bg-secondary/50 rounded-xl font-medium text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteGallery}
                disabled={isDeleting}
                className="flex-1 h-11 bg-destructive text-destructive-foreground rounded-xl font-semibold flex justify-center items-center text-sm hover:bg-destructive/90 transition-colors shadow-[0_4px_14px_0_hsl(var(--destructive)/30%)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Favorites Modal */}
      {viewingFavoritesFor && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-border/50">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="text-2xl font-bold">Favorites: {viewingFavoritesFor.name}</h2>
                <p className="text-muted-foreground text-sm mt-1">{favoritesData.length} photos selected by clients.</p>
              </div>
              <button onClick={() => setViewingFavoritesFor(null)} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingFavorites ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading favorites...</p>
                </div>
              ) : favoritesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No Favorites Yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">Your clients haven't selected any favorites for this gallery.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {favoritesData.map((fav, index) => (
                    <div key={fav._id || index} className="group relative rounded-xl overflow-hidden border border-border/50 bg-secondary/20">
                      <div className="aspect-square bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                        {fav.photo?.thumbnailUrl ? (
                          <img 
                            src={fav.photo.thumbnailUrl} 
                            alt={fav.photo.fileName || 'Favorite'} 
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="p-3 bg-card border-t border-border/50">
                        <p className="text-sm font-semibold text-foreground truncate" title={fav.photo?.fileName || 'Unknown File'}>
                          {fav.photo?.fileName || 'Unknown File'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleriesPage;
