import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, HardDrive, Bell, Shield, Save, Camera, UploadCloud, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [user, setUser] = useState<any>({});
  const [profile, setProfile] = useState<any>({
    displayName: '',
    businessName: '',
    bio: '',
    phone: '',
    website: '',
    location: { city: '', state: '', country: '' },
    socialLinks: { instagram: '', facebook: '', youtube: '' },
    branding: { primaryColor: '#D4AF37', accentColor: '#ffffff' }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/profile`, { withCredentials: true });
      setUser(res.data.user || {});
      
      // Merge with default structure to prevent uncontrolled inputs
      const p = res.data.profile || {};
      setProfile({
        ...p,
        location: p.location || { city: '', state: '', country: '' },
        socialLinks: p.socialLinks || { instagram: '', facebook: '', youtube: '' },
        branding: p.branding || { primaryColor: '#D4AF37', accentColor: '#ffffff' }
      });
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/api/profile`, profile, { withCredentials: true });
      // Show success toast or message here
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Maximum size is 2MB.');
      return;
    }

    if (type === 'profile') setIsUploadingPhoto(true);
    else setIsUploadingLogo(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await axios.post(`${API_URL}/api/profile/upload`, { imageBase64: base64, type }, { withCredentials: true });
        setProfile(res.data.profile);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to upload image');
      } finally {
        if (type === 'profile') setIsUploadingPhoto(false);
        else setIsUploadingLogo(false);
      }
    };
  };

  const updateNestedProfile = (category: 'location' | 'socialLinks' | 'branding', field: string, value: string) => {
    setProfile((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your public profile and account preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'profile' ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-primary' : 'opacity-70'}`} />
            Public Profile
          </button>
          
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'integrations' ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <HardDrive className={`h-5 w-5 ${activeTab === 'integrations' ? 'text-primary' : 'opacity-70'}`} />
            Integrations
          </button>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'notifications' ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <Bell className={`h-5 w-5 ${activeTab === 'notifications' ? 'text-primary' : 'opacity-70'}`} />
            Notifications
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'security' ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <Shield className={`h-5 w-5 ${activeTab === 'security' ? 'text-primary' : 'opacity-70'}`} />
            Account & Security
          </button>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-8 min-h-[500px]">
          
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Public Profile Branding</h2>
              
              {/* Image Uploads */}
              <div className="flex flex-col md:flex-row gap-12 mb-8">
                {/* Profile Photo */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Profile Photo</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 rounded-full bg-secondary border border-border/50 flex items-center justify-center overflow-hidden shadow-lg">
                      {isUploadingPhoto ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : profile.profileImage ? (
                        <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground/50" />
                      )}
                    </div>
                    <div>
                      <input type="file" id="profile-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profile')} />
                      <label htmlFor="profile-upload" className="cursor-pointer bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium border border-border/50 hover:bg-secondary/80 transition-colors">
                        Change Photo
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP. Max 2MB.</p>
                    </div>
                  </div>
                </div>

                {/* Business Logo */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Business Logo</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative h-24 w-48 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-center overflow-hidden shadow-lg p-2">
                      {isUploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : profile.logo ? (
                        <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">YOUR LOGO</span>
                      )}
                    </div>
                    <div>
                      <input type="file" id="logo-upload" accept="image/png, image/webp, image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                      <label htmlFor="logo-upload" className="cursor-pointer bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium border border-border/50 hover:bg-secondary/80 transition-colors">
                        Upload Logo
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">Transparent PNG recommended.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                  <input type="text" value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <input type="text" value={profile.businessName} onChange={e => setProfile({...profile, businessName: e.target.value})} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Bio / About Me</label>
                  <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Tell clients about yourself..." className="w-full h-24 bg-background/50 border border-border/50 rounded-xl p-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4 mt-8">Contact & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <input type="text" placeholder="https://" value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <input type="text" value={profile.location?.city} onChange={e => updateNestedProfile('location', 'city', e.target.value)} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">State/Region</label>
                  <input type="text" value={profile.location?.state} onChange={e => updateNestedProfile('location', 'state', e.target.value)} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Country</label>
                  <input type="text" value={profile.location?.country} onChange={e => updateNestedProfile('location', 'country', e.target.value)} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4 mt-8">Social Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Instagram</label>
                  <input type="text" placeholder="@username" value={profile.socialLinks?.instagram} onChange={e => updateNestedProfile('socialLinks', 'instagram', e.target.value)} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Facebook</label>
                  <input type="text" placeholder="Page URL" value={profile.socialLinks?.facebook} onChange={e => updateNestedProfile('socialLinks', 'facebook', e.target.value)} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">YouTube</label>
                  <input type="text" placeholder="Channel URL" value={profile.socialLinks?.youtube} onChange={e => updateNestedProfile('socialLinks', 'youtube', e.target.value)} className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4 mt-8">Brand Colors</h2>
              <div className="flex items-center gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={profile.branding?.primaryColor || '#D4AF37'} onChange={e => updateNestedProfile('branding', 'primaryColor', e.target.value)} className="h-11 w-11 rounded-lg border-0 bg-transparent cursor-pointer" />
                    <input type="text" value={profile.branding?.primaryColor || '#D4AF37'} onChange={e => updateNestedProfile('branding', 'primaryColor', e.target.value)} className="w-24 h-11 bg-background/50 border border-border/50 rounded-xl px-3 text-sm text-foreground focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={profile.branding?.accentColor || '#ffffff'} onChange={e => updateNestedProfile('branding', 'accentColor', e.target.value)} className="h-11 w-11 rounded-lg border-0 bg-transparent cursor-pointer" />
                    <input type="text" value={profile.branding?.accentColor || '#ffffff'} onChange={e => updateNestedProfile('branding', 'accentColor', e.target.value)} className="w-24 h-11 bg-background/50 border border-border/50 rounded-xl px-3 text-sm text-foreground focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               {/* Same integration content as before */}
               <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Connected Integrations</h2>
              <div className="bg-background/40 border border-border/50 rounded-xl p-6 flex items-center justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#0F9D58]/10 rounded-xl flex items-center justify-center">
                    <HardDrive className="h-6 w-6 text-[#0F9D58]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Google Drive</h3>
                    <p className="text-sm text-muted-foreground">Sync galleries directly from your Drive folders.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const response = await axios.get(`${API_URL}/api/integrations/google/auth-url`, { withCredentials: true });
                        window.location.href = response.data.url;
                      } catch (err) {
                        alert('Failed to get Google Auth URL. Make sure the backend is running and OAuth is configured.');
                      }
                    }}
                    className="text-sm font-medium text-foreground bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg border border-primary/30 transition-colors"
                  >
                    Connect Google Drive
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Notification Preferences</h2>
              <p className="text-muted-foreground text-sm">Coming Soon.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Account Information</h2>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Account Email</label>
                  <input type="text" readOnly value={user?.email || ''} className="w-full h-11 bg-background border border-border/50 rounded-xl px-4 text-muted-foreground cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed currently.</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <label className="text-sm font-medium text-muted-foreground">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <button className="bg-secondary text-foreground px-4 py-2.5 rounded-xl text-sm font-medium border border-border/50 hover:bg-secondary/80 transition-colors mt-2">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
