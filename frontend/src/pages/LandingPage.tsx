import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Lock, FolderHeart, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">LensVault</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <Link to="/login" className="hover:text-primary transition-colors">Log in</Link>
          <Link to="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            Start Free
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-24 lg:py-32 xl:py-48 flex justify-center text-center px-4">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter sm:text-5xl">
              Deliver beautiful photo galleries. <br className="hidden md:block" />
              Collect client favorites effortlessly.
            </h1>
            <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
              Create private client galleries from your existing Google Drive storage, share them securely, and let clients select their favorite images in a stunning, mobile-friendly interface.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/register" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a href="#demo" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                View Demo
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-24 bg-secondary/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderHeart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Google Drive Integration</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Connect your Google Drive and select folders directly. No need to re-upload hundreds of high-res images to another platform.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Access</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every gallery generates a unique, unguessable URL and a secret key. Clients simply enter the key to view their private collection.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Frictionless Favorites</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Clients can easily mark their favorite photos without creating an account. You instantly see their selections in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 px-6 border-t flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>© 2026 LensVault SaaS. All rights reserved.</p>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <Link to="#" className="hover:underline">Terms</Link>
          <Link to="#" className="hover:underline">Privacy</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
