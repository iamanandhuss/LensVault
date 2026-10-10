import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const SubscriptionPage = () => {
  const [plan, setPlan] = useState('FREE');
  useEffect(() => {
    axios.get(`${API_URL}/api/subscriptions/status`, { withCredentials: true })
      .then(response => setPlan(response.data.plan || 'FREE'))
      .catch(error => console.error('Failed to load subscription status', error));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h1>
        <p className="text-muted-foreground mt-2">Get unlimited galleries and advanced Google Drive integration.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        {/* Starter Plan */}
        <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-xl p-8 relative flex flex-col hover:border-border transition-colors">
          <div className="absolute top-0 right-0 bg-secondary/80 backdrop-blur-md text-xs font-bold px-4 py-2 rounded-bl-xl rounded-tr-3xl border-b border-l border-border/50">
            {plan === 'FREE' ? 'CURRENT PLAN' : ''}
          </div>
          <h3 className="text-2xl font-bold text-foreground">Free</h3>
          <div className="mt-6 flex items-baseline text-5xl font-extrabold text-foreground">
            ₹0
            <span className="ml-2 text-xl font-medium text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-10 space-y-5 flex-1">
            <li className="flex items-center text-sm">
              <span className="mr-4 text-primary">✓</span> 10 Active Galleries
            </li>
            <li className="flex items-center text-sm">
              <span className="mr-4 text-primary">✓</span> 500 photos per gallery
            </li>
            <li className="flex items-center text-sm">
              <span className="mr-4 text-primary">✓</span> Basic Favorites
            </li>
          </ul>
          <button disabled className="mt-10 w-full bg-secondary/50 text-muted-foreground py-3.5 rounded-xl font-medium cursor-not-allowed border border-border/50">
            {plan === 'FREE' ? 'Active Plan' : 'Free plan'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl rounded-3xl border border-primary/30 shadow-2xl shadow-primary/10 p-8 relative flex flex-col hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] tracking-wide">
            RECOMMENDED
          </div>
          <h3 className="text-2xl font-bold text-foreground">Pro</h3>
          <div className="mt-6 flex items-baseline text-5xl font-extrabold text-foreground">
            ₹1499
            <span className="ml-2 text-xl font-medium text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-10 space-y-5 flex-1">
            <li className="flex items-center text-sm font-medium">
              <span className="mr-4 text-primary font-bold">✓</span> Unlimited Galleries
            </li>
            <li className="flex items-center text-sm font-medium">
              <span className="mr-4 text-primary font-bold">✓</span> Google Drive Integration
            </li>
            <li className="flex items-center text-sm font-medium">
              <span className="mr-4 text-primary font-bold">✓</span> Unlimited photos
            </li>
            <li className="flex items-center text-sm font-medium">
              <span className="mr-4 text-primary font-bold">✓</span> Custom branding
            </li>
          </ul>
          <button disabled className="mt-10 w-full bg-secondary/50 text-muted-foreground py-3.5 rounded-xl font-semibold cursor-not-allowed border border-border/50">
            {plan === 'PRO' ? 'Current plan' : 'Paid plans coming soon'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
