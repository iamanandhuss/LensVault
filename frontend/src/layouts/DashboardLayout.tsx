import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Camera, Users, FolderHeart, LayoutDashboard, CreditCard, Settings, LogOut } from 'lucide-react';
import axios from 'axios';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/dashboard/clients', icon: Users },
    { name: 'Galleries', path: '/dashboard/galleries', icon: FolderHeart },
    { name: 'Subscription', path: '/dashboard/subscription', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden">
      {/* Abstract Background Elements for Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 bg-card/60 backdrop-blur-2xl border-r border-border/50 flex flex-col z-10">
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">LensVault</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:translate-x-1'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-2">
          <Link to="/dashboard/settings" className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all duration-300 hover:translate-x-1">
            <Settings className="h-5 w-5 opacity-70" />
            Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-300 hover:translate-x-1"
          >
            <LogOut className="h-5 w-5 opacity-70" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-20 bg-card/40 backdrop-blur-xl border-b border-border/50 flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground px-3 py-1 bg-secondary/50 rounded-full border border-border/50">Pro Plan</div>
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shadow-lg shadow-primary/10 cursor-pointer hover:scale-105 transition-transform">
              JD
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
