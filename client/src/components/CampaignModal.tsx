import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CampaignModal({ isOpen, onClose }: CampaignModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    dmMessage: "",
    resultIds: [],
    scheduledAt: "",
  });

  // Fetch recent results
  const { data: results } = useQuery({
    queryKey: ['/api/results/recent'],
    retry: false,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await apiRequest("POST", "/api/campaigns", campaignData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your DM campaign has been created successfully! 🚀",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      onClose();
      setFormData({ name: "", dmMessage: "", resultIds: [], scheduledAt: "" });
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
        title: "Failed to Create Campaign",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dmMessage) {
      toast({
        title: "Missing Information",
        description: "Please fill in campaign name and DM message",
        variant: "destructive",
      });
      return;
    }

    // Use recent results if no specific results selected
    const targetResults = formData.resultIds.length > 0 
      ? formData.resultIds 
      : (results as any[])?.slice(0, 10).map((r: any) => r.id) || [];

    createCampaignMutation.mutate({
      name: formData.name,
      dmMessage: formData.dmMessage,
      resultIds: targetResults,
      scheduledAt: formData.scheduledAt || null,
      totalHandles: targetResults.length,
    });
  };

  const availableResults = (results as any[])?.filter((r: any) => r.igHandle) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">
            🚀 Create DM Campaign
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up your Instagram DM campaign with extracted handles
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Campaign Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Instagram Outreach Campaign"
              className="bg-muted border-border"
              data-testid="input-campaign-name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">DM Message</label>
            <Textarea
              value={formData.dmMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, dmMessage: e.target.value }))}
              placeholder="Hey! I found your Instagram from your website. I love what you're doing and would love to collaborate..."
              className="bg-muted border-border min-h-[100px]"
              data-testid="textarea-dm-message"
            />
            <div className="text-xs text-muted-foreground">
              Write your outreach message. Keep it personal and engaging!
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target Handles</label>
            <div className="text-sm text-muted-foreground mb-2">
              {availableResults.length > 0 
                ? `${availableResults.length} extracted handles available. Latest ${Math.min(10, availableResults.length)} will be used.`
                : "No extracted handles found. Upload and extract some first!"}
            </div>
            <div className="glass-card rounded-xl p-4 max-h-32 overflow-y-auto">
              {availableResults.slice(0, 10).map((result: any) => (
                <div key={result.id} className="flex items-center space-x-2 py-1">
                  <span className="text-primary font-mono text-sm">{result.igHandle}</span>
                  <span className="text-muted-foreground text-xs">({result.domain})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Schedule (Optional)</label>
            <Input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              className="bg-muted border-border"
              data-testid="input-schedule"
            />
            <div className="text-xs text-muted-foreground">
              Leave empty to start campaign manually
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-campaign"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCampaignMutation.isPending || availableResults.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
              data-testid="button-create-campaign"
            >
              <i className="fas fa-rocket mr-2"></i>
              {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}