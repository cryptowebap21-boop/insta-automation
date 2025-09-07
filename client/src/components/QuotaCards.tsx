import { User } from "@shared/schema";

interface QuotaCardsProps {
  user: User;
}

export default function QuotaCards({ user }: QuotaCardsProps) {
  const extractionPercentage = (user.dailyExtractQuota || 0) > 0 
    ? ((user.extractsUsedToday || 0) / (user.dailyExtractQuota || 1)) * 100 
    : 0;
    
  const dmPercentage = (user.dailyDmQuota || 0) > 0 
    ? ((user.dmsUsedToday || 0) / (user.dailyDmQuota || 1)) * 100 
    : 0;

  const planPricing = {
    free: '$0',
    starter: '$55/mo',
    pro: '$87/mo',
    agency: '$155/mo'
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card rounded-2xl p-6 hover-glow" data-testid="card-extractions">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <i className="fas fa-download text-white"></i>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Extractions</h3>
              <p className="text-sm text-muted-foreground">Daily Quota</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-gradient" data-testid="text-extractions-used">
            {user.extractsUsedToday || 0}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="text-foreground">
              <span data-testid="text-extractions-used-detail">{user.extractsUsedToday || 0}</span> / <span data-testid="text-extractions-limit">{user.dailyExtractQuota || 150}</span>
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="progress-bar h-2 rounded-full" 
              style={{ width: `${Math.min(extractionPercentage, 100)}%` }}
              data-testid="progress-extractions"
            ></div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 hover-glow" data-testid="card-dms">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <i className="fas fa-paper-plane text-white"></i>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">DMs Sent</h3>
              <p className="text-sm text-muted-foreground">Daily Quota</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-gradient" data-testid="text-dms-used">
            {user.dmsUsedToday || 0}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="text-foreground">
              <span data-testid="text-dms-used-detail">{user.dmsUsedToday || 0}</span> / <span data-testid="text-dms-limit">{user.dailyDmQuota || 10}</span>
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="progress-bar h-2 rounded-full" 
              style={{ width: `${Math.min(dmPercentage, 100)}%` }}
              data-testid="progress-dms"
            ></div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 hover-glow" data-testid="card-plan">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
              <i className="fas fa-crown text-white"></i>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Current Plan</h3>
              <p className="text-sm text-muted-foreground capitalize" data-testid="text-plan-name">
                {user.plan || 'Free'} Plan
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-neon-green" data-testid="text-plan-price">
            {planPricing[user.plan as keyof typeof planPricing] || '$0'}
          </span>
        </div>
        <button className="w-full bg-gradient-to-r from-primary to-pink-500 text-primary-foreground py-2 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity" data-testid="button-upgrade">
          Upgrade to Pro 🎉
        </button>
      </div>
    </section>
  );
}
