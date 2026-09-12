import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Mail, Phone, Loader2, Plus, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients`, { withCredentials: true });
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/clients`, {
        name,
        email,
        phone,
        notes
      }, { withCredentials: true });

      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      fetchClients(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage your photography clients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-16 text-center flex flex-col items-center">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-foreground">No clients yet</h3>
          <p className="text-muted-foreground max-w-sm mb-8 text-lg">Create your first client to start delivering galleries and collecting favorites.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-base hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] hover:-translate-y-1"
          >
            Create Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map(client => (
            <div key={client._id} className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-8 hover:-translate-y-1 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner group-hover:scale-110 transition-transform">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-xl tracking-tight text-foreground">{client.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Client</span>
                </div>
              </div>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                  <Mail className="h-4 w-4 text-primary/70" /> 
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <Phone className="h-4 w-4 text-primary/70" /> 
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full min-h-[80px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
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
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-primary text-primary-foreground rounded-md font-medium flex justify-center items-center text-sm hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
