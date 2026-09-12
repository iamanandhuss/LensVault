import React, { useState } from 'react';
import { User, HardDrive, Bell, Shield, Save } from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and integrations.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          <Save className="h-4 w-4" /> 
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'profile' 
                ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' 
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-primary' : 'opacity-70'}`} />
            Profile
          </button>
          
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'integrations' 
                ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' 
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <HardDrive className={`h-5 w-5 ${activeTab === 'integrations' ? 'text-primary' : 'opacity-70'}`} />
            Integrations
          </button>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'notifications' 
                ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' 
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Bell className={`h-5 w-5 ${activeTab === 'notifications' ? 'text-primary' : 'opacity-70'}`} />
            Notifications
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'security' 
                ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' 
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Shield className={`h-5 w-5 ${activeTab === 'security' ? 'text-primary' : 'opacity-70'}`} />
            Security
          </button>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-8 min-h-[500px]">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Profile Information</h2>
              <div className="flex items-center gap-6 mb-8">
                <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-3xl shadow-lg shadow-primary/10">
                  JD
                </div>
                <div>
                  <button className="bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium border border-border/50 hover:bg-secondary/80 transition-colors">
                    Change Avatar
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <input type="text" defaultValue="John" className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <input type="text" defaultValue="Doe" className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <input type="email" defaultValue="john.doe@example.com" className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Bio / Studio Name</label>
                  <textarea defaultValue="John Doe Photography" className="w-full h-24 bg-background/50 border border-border/50 rounded-xl p-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in duration-500">
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
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const axios = (await import('axios')).default;
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

              <div className="bg-background/40 border border-border/50 rounded-xl p-6 flex items-center justify-between group hover:border-border transition-colors opacity-70">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#6772E5]/10 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#6772E5]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.967 0C5.46 0 0 5.46 0 11.967s5.46 11.967 11.967 11.967 11.967-5.46 11.967-11.967S18.475 0 11.967 0zM12 18.23l-.117-.008a6.22 6.22 0 0 1-4.102-1.742l1.62-1.928a3.784 3.784 0 0 0 2.454 1.108c1.233 0 1.94-.528 1.94-1.284 0-.875-.78-1.157-2.316-1.558-2.073-.55-3.697-1.423-3.697-3.633 0-2.046 1.58-3.418 3.8-3.418a5.534 5.534 0 0 1 3.447 1.184l-1.398 1.928a3.36 3.36 0 0 0-2.08-.85c-1.077 0-1.636.514-1.636 1.192 0 .74.654 1.072 2.124 1.454 2.227.564 3.896 1.412 3.896 3.69 0 2.28-1.737 3.865-3.935 3.865z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Stripe</h3>
                    <p className="text-sm text-muted-foreground">Accept payments for extra photo downloads.</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg border border-border/50 transition-colors">
                  Connect
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Notification Preferences</h2>
              <p className="text-muted-foreground text-sm">Choose how you want to be notified about activity in your galleries.</p>
              
              <div className="space-y-4">
                {[
                  { title: 'New Client Favorite', desc: 'When a client favorites a photo.' },
                  { title: 'Gallery Expiry Warning', desc: 'When a gallery is 3 days away from expiring.' },
                  { title: 'Product Updates', desc: 'News about LensVault features.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-background/30 rounded-xl border border-border/50">
                    <div>
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={i !== 2} className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/50 pb-4">Security Settings</h2>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full h-11 bg-background/50 border border-border/50 rounded-xl px-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="space-y-2">
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
