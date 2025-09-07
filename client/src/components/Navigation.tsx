import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Navigation() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                <i className="fas fa-paper-plane text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold text-gradient">IGExtract Pro</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard">
              <a className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-dashboard">
                Dashboard
              </a>
            </Link>
            <Link href="/campaigns">
              <a className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-campaigns">
                Campaigns
              </a>
            </Link>
            <Link href="/templates">
              <a className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-templates">
                Templates
              </a>
            </Link>
            <Link href="/accounts">
              <a className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-accounts">
                Accounts
              </a>
            </Link>
            {user && (
              <div className="flex items-center space-x-2 glass-card px-3 py-1.5 rounded-full" data-testid="user-info">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground" data-testid="user-email">
                  {(user as any)?.email || 'User'}
                </span>
              </div>
            ) as React.ReactNode}
            <a 
              href="/api/logout" 
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              data-testid="nav-logout"
            >
              Logout
            </a>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden glass-card p-2 rounded-lg" data-testid="button-mobile-menu">
            <i className="fas fa-bars text-foreground"></i>
          </button>
        </nav>
      </div>
    </header>
  );
}
