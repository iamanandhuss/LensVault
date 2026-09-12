import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FolderHeart, Image as ImageIcon, Heart, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-extrabold text-foreground">{value}</p>
      </div>
      <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center shadow-inner">
        <Icon className="h-7 w-7 text-primary" />
      </div>
    </div>
    {trend && (
      <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
        <span className="px-2 py-1 bg-green-500/10 text-green-500 font-semibold rounded-md border border-green-500/20">{trend}</span> 
        <span>from last month</span>
      </div>
    )}
  </div>
);

const DashboardHome = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/dashboard/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg">Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Clients" value={stats?.totalClients || 0} icon={Users} />
        <StatCard title="Active Galleries" value={stats?.activeGalleries || 0} icon={FolderHeart} />
        <StatCard title="Total Photos" value={stats?.totalPhotos || 0} icon={ImageIcon} />
        <StatCard title="Total Favorites" value={stats?.totalFavorites || 0} icon={Heart} />
      </div>

      <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl mt-12 overflow-hidden">
        <div className="px-8 py-6 border-b border-border/50 bg-background/50">
          <h3 className="font-bold text-xl text-foreground">Recent Galleries</h3>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50">
                <tr>
                  <th className="px-8 py-5 font-bold">Gallery Name</th>
                  <th className="px-8 py-5 font-bold">Client</th>
                  <th className="px-8 py-5 font-bold">Photos</th>
                  <th className="px-8 py-5 font-bold">Favorites</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-card/20">
                {stats?.recentGalleries?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground text-lg">
                      No galleries created yet.
                    </td>
                  </tr>
                ) : (
                  stats?.recentGalleries?.map((gallery: any) => (
                    <tr key={gallery._id} className="hover:bg-secondary/40 transition-colors group">
                      <td className="px-8 py-5 font-bold text-foreground">{gallery.name}</td>
                      <td className="px-8 py-5 text-muted-foreground">{gallery.clientName}</td>
                      <td className="px-8 py-5 text-muted-foreground font-medium">{gallery.photoCount}</td>
                      <td className="px-8 py-5 text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <Heart className={`h-4 w-4 ${gallery.favoriteCount > 0 ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                          {gallery.favoriteCount}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 text-xs rounded-full font-bold border ${
                          gallery.isActive 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                        }`}>
                          {gallery.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
