import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-purple-900/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                <i className="fas fa-paper-plane text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold text-gradient">IGExtract Pro</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/api/login">
                <button className="bg-gradient-to-r from-primary to-pink-500 text-primary-foreground px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity" data-testid="button-login">
                  Get Started 🚀
                </button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <section className="text-center space-y-8 mb-16">
          <h1 className="text-4xl md:text-7xl font-black text-gradient mb-6">
            Instagram DM<br />
            Automation Made<br />
            <span className="text-neon-green">Easy</span> ✨
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Extract Instagram handles from websites and automate your DM campaigns like a pro. 
            The Gen Z marketing toolkit that gets results! 💪
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link href="/api/login">
              <button className="bg-gradient-to-r from-primary to-pink-500 text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl" data-testid="button-start-free">
                <i className="fas fa-rocket mr-2"></i>
                Start Free Today
              </button>
            </Link>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <i className="fas fa-check text-neon-green"></i>
              <span>No credit card required</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="glass-card rounded-2xl p-8 text-center hover-glow">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 animate-float">
              <i className="fas fa-search text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Smart Extraction</h3>
            <p className="text-muted-foreground">
              Upload a CSV of websites and we'll automatically find Instagram handles with high accuracy.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 text-center hover-glow">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 animate-float" style={{ animationDelay: '0.5s' }}>
              <i className="fas fa-paper-plane text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">DM Automation</h3>
            <p className="text-muted-foreground">
              Create personalized DM templates with spintax variations and automate your outreach.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 text-center hover-glow">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center mb-6 animate-float" style={{ animationDelay: '1s' }}>
              <i className="fas fa-chart-line text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Real-time Analytics</h3>
            <p className="text-muted-foreground">
              Track your campaigns with live progress updates and detailed analytics.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            Choose Your Plan 💎
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="glass-card rounded-2xl p-6 border border-border">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Free</h3>
                <div className="text-3xl font-black text-gradient mt-2">$0</div>
                <div className="text-sm text-muted-foreground">Forever</div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  150 extractions/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  10 DMs/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  Basic templates
                </li>
              </ul>
              <Link href="/api/login">
                <button className="w-full glass-card py-3 rounded-xl font-medium hover:bg-white/10 transition-colors" data-testid="button-plan-free">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="glass-card rounded-2xl p-6 border border-border">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Starter</h3>
                <div className="text-3xl font-black text-gradient mt-2">$55</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  200 extractions/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  200 DMs/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  Advanced templates
                </li>
              </ul>
              <Link href="/api/login">
                <button className="w-full glass-card py-3 rounded-xl font-medium hover:bg-white/10 transition-colors" data-testid="button-plan-starter">
                  Choose Plan
                </button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="glass-card rounded-2xl p-6 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Pro</h3>
                <div className="text-3xl font-black text-gradient mt-2">$87</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  330 extractions/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  330 DMs/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  DM scheduling
                </li>
              </ul>
              <Link href="/api/login">
                <button className="w-full bg-gradient-to-r from-primary to-pink-500 text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-opacity" data-testid="button-plan-pro">
                  Choose Plan
                </button>
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="glass-card rounded-2xl p-6 border border-border">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Agency</h3>
                <div className="text-3xl font-black text-gradient mt-2">$155</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  500 extractions/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  500 DMs/day
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-neon-green mr-2"></i>
                  Multi-account support
                </li>
              </ul>
              <Link href="/api/login">
                <button className="w-full glass-card py-3 rounded-xl font-medium hover:bg-white/10 transition-colors" data-testid="button-plan-agency">
                  Choose Plan
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-muted-foreground">
            Ready to supercharge your Instagram marketing? 🔥
          </p>
          <Link href="/api/login">
            <button className="mt-4 bg-gradient-to-r from-primary to-pink-500 text-primary-foreground px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform" data-testid="button-footer-cta">
              Get Started Now
            </button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
