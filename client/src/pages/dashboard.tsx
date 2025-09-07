import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import QuotaCards from "@/components/QuotaCards";
import QuickActions from "@/components/QuickActions";
import ActiveCampaigns from "@/components/ActiveCampaigns";
import RecentResults from "@/components/RecentResults";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'job_progress':
        case 'job_completed':
          queryClient.invalidateQueries({ queryKey: ['/api/extractions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/results/recent'] });
          break;
        case 'campaign_progress':
        case 'campaign_completed':
          queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
          break;
      }
    }
  }, [lastMessage, queryClient]);

  // Fetch user campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
    retry: false,
  });

  // Fetch recent results
  const { data: recentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/results/recent'],
    retry: false,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-purple-900/20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-purple-900/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-gradient mb-4" data-testid="text-welcome">
            🚀 Welcome Back!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Extract Instagram handles and manage DM campaigns like a pro. Your Gen Z marketing toolkit awaits! ✨
          </p>
        </section>

        {/* Quota Cards */}
        <QuotaCards user={user as any} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Active Campaigns */}
        <ActiveCampaigns 
          campaigns={(campaigns as any[]) || []} 
          isLoading={campaignsLoading} 
        />

        {/* Recent Results */}
        <RecentResults 
          results={(recentResults as any[]) || []} 
          isLoading={resultsLoading} 
        />

        {/* Analytics Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground flex items-center">
            <i className="fas fa-chart-line text-primary mr-3"></i>
            Analytics Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 text-center hover-glow" data-testid="card-analytics-views">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4">
                <i className="fas fa-eye text-white"></i>
              </div>
              <div className="text-2xl font-bold text-blue-400" data-testid="text-total-extractions">
                {(user as any)?.extractsUsedToday || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Extractions</div>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center hover-glow" data-testid="card-analytics-dms">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center mb-4">
                <i className="fas fa-paper-plane text-white"></i>
              </div>
              <div className="text-2xl font-bold text-green-400" data-testid="text-total-dms">
                {(user as any)?.dmsUsedToday || 0}
              </div>
              <div className="text-sm text-muted-foreground">DMs Sent Today</div>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center hover-glow" data-testid="card-analytics-campaigns">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <i className="fas fa-bullseye text-white"></i>
              </div>
              <div className="text-2xl font-bold text-purple-400" data-testid="text-active-campaigns">
                {(campaigns as any[])?.filter((c: any) => c.status === 'running').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center hover-glow" data-testid="card-analytics-plan">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-red-400 flex items-center justify-center mb-4">
                <i className="fas fa-crown text-white"></i>
              </div>
              <div className="text-2xl font-bold text-orange-400 capitalize" data-testid="text-user-plan">
                {(user as any)?.plan || 'free'}
              </div>
              <div className="text-sm text-muted-foreground">Current Plan</div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-primary to-pink-500 rounded-full shadow-2xl hover:scale-110 transition-transform animate-glow flex items-center justify-center" data-testid="button-floating-action">
          <i className="fas fa-plus text-white text-xl"></i>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-card border-t border-border/50 z-40">
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center p-3 text-primary" data-testid="nav-home">
            <i className="fas fa-home text-lg"></i>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center p-3 text-muted-foreground" data-testid="nav-analytics">
            <i className="fas fa-chart-bar text-lg"></i>
            <span className="text-xs mt-1">Analytics</span>
          </button>
          <button className="flex flex-col items-center p-3 text-muted-foreground" data-testid="nav-campaigns">
            <i className="fas fa-paper-plane text-lg"></i>
            <span className="text-xs mt-1">Campaigns</span>
          </button>
          <button className="flex flex-col items-center p-3 text-muted-foreground" data-testid="nav-profile">
            <i className="fas fa-user text-lg"></i>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
