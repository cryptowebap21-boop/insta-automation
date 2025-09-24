import { useState } from "react";
import { Campaign } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import CampaignModal from "./CampaignModal";

interface ActiveCampaignsProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export default function ActiveCampaigns({ campaigns, isLoading }: ActiveCampaignsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const startCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Started",
        description: "Your campaign is now running! 🚀",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Failed to Start Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/pause`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Failed to Pause Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground flex items-center">
            <i className="fas fa-rocket text-primary mr-3"></i>
            Active Campaigns
          </h2>
        </div>
        <div className="glass-card rounded-2xl p-6 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </section>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status !== 'completed' && c.status !== 'failed');

  return (
    <>
      <CampaignModal 
        isOpen={showCampaignModal} 
        onClose={() => setShowCampaignModal(false)} 
      />
      <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground flex items-center">
          <i className="fas fa-rocket text-primary mr-3"></i>
          Active Campaigns
        </h2>
        <button className="glass-card px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-filter-campaigns">
          <i className="fas fa-filter mr-2"></i>Filter
        </button>
      </div>

      {activeCampaigns.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 opacity-50">
            <i className="fas fa-paper-plane text-white text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Active Campaigns</h3>
          <p className="text-muted-foreground mb-4">Create your first DM campaign to start engaging with Instagram influencers!</p>
          <button 
            className="bg-gradient-to-r from-primary to-pink-500 text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity" 
            onClick={() => setShowCampaignModal(true)}
            data-testid="button-create-first-campaign"
          >
            <i className="fas fa-plus mr-2"></i>Create Campaign
          </button>
        </div>
      ) : (
        activeCampaigns.map((campaign) => (
          <div key={campaign.id} className="glass-card rounded-2xl p-6 space-y-4" data-testid={`campaign-${campaign.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                  <i className="fas fa-bullseye text-white"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid={`campaign-name-${campaign.id}`}>
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Unknown'} • {campaign.totalHandles || 0} handles
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.status === 'running' 
                    ? 'bg-green-500/20 text-green-400' 
                    : campaign.status === 'scheduled'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`} data-testid={`campaign-status-${campaign.id}`}>
                  <i className={`fas ${
                    campaign.status === 'running' 
                      ? 'fa-play' 
                      : campaign.status === 'scheduled'
                      ? 'fa-clock'
                      : 'fa-pause'
                  } mr-1`}></i>
                  {campaign.status}
                </span>
                <button className="text-muted-foreground hover:text-foreground" data-testid={`campaign-menu-${campaign.id}`}>
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>

            {/* Campaign Progress */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400" data-testid={`campaign-sent-${campaign.id}`}>
                  {campaign.sent || 0}
                </div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400" data-testid={`campaign-replied-${campaign.id}`}>
                  {campaign.replied || 0}
                </div>
                <div className="text-sm text-muted-foreground">Replied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400" data-testid={`campaign-interested-${campaign.id}`}>
                  {campaign.interested || 0}
                </div>
                <div className="text-sm text-muted-foreground">Interested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400" data-testid={`campaign-failed-${campaign.id}`}>
                  {campaign.failed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground">
                  {campaign.sent || 0} / {campaign.totalHandles || 0}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="progress-bar h-3 rounded-full" 
                  style={{ 
                    width: (campaign.totalHandles || 0) > 0 
                      ? `${Math.min(((campaign.sent || 0) / (campaign.totalHandles || 1)) * 100, 100)}%` 
                      : '0%' 
                  }}
                  data-testid={`campaign-progress-${campaign.id}`}
                ></div>
              </div>
            </div>

            <div className="flex space-x-3">
              {campaign.status === 'running' ? (
                <button 
                  className="flex-1 glass-card py-2 px-4 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                  onClick={() => pauseCampaignMutation.mutate(campaign.id)}
                  disabled={pauseCampaignMutation.isPending}
                  data-testid={`button-pause-${campaign.id}`}
                >
                  <i className="fas fa-pause mr-2"></i>Pause
                </button>
              ) : (
                <button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-400 text-white py-2 px-4 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  onClick={() => startCampaignMutation.mutate(campaign.id)}
                  disabled={startCampaignMutation.isPending}
                  data-testid={`button-start-${campaign.id}`}
                >
                  <i className="fas fa-play mr-2"></i>Start Now
                </button>
              )}
              <button className="flex-1 glass-card py-2 px-4 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors" data-testid={`button-analytics-${campaign.id}`}>
                <i className="fas fa-chart-bar mr-2"></i>Analytics
              </button>
              <button className="flex-1 glass-card py-2 px-4 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors" data-testid={`button-export-${campaign.id}`}>
                <i className="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>
        ))
      )}
    </section>
    </>
  );
}
