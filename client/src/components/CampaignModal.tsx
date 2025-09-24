import { useState, useRef } from "react";
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
    directHandles: [] as string[],
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent results
  const { data: results } = useQuery({
    queryKey: ['/api/results/recent'],
    retry: false,
  });

  // Fetch user to check plan
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
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
      setFormData({ name: "", dmMessage: "", resultIds: [], scheduledAt: "", directHandles: [] });
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

    // Use direct handles OR recent results  
    const targetHandles = formData.directHandles.length > 0 
      ? formData.directHandles 
      : (results as any[])?.slice(0, 10).filter((r: any) => r.igHandle).map((r: any) => r.igHandle) || [];

    if (targetHandles.length === 0) {
      toast({
        title: "No Handles Available",
        description: "Please upload Instagram handles or extract some from websites first",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: formData.name,
      dmMessage: formData.dmMessage,
      handles: targetHandles,
      scheduledAt: formData.scheduledAt || null,
      totalHandles: targetHandles.length,
    });
  };

  const availableResults = (results as any[])?.filter((r: any) => r.igHandle) || [];
  const userPlan = (user as any)?.plan || 'free';
  const isProPlan = userPlan === 'pro' || userPlan === 'agency';

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      
      // Parse CSV to extract Instagram handles
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const handles: string[] = [];
        
        for (let i = 1; i < lines.length; i++) { // Skip header
          const line = lines[i].trim();
          if (line) {
            const columns = line.split(',');
            // Look for Instagram handle in any column
            for (const col of columns) {
              const cleanCol = col.trim().replace(/['"]/g, '');
              if (cleanCol.includes('@') || cleanCol.includes('instagram.com/')) {
                let handle = cleanCol;
                if (handle.includes('instagram.com/')) {
                  handle = '@' + handle.split('instagram.com/')[1].split('/')[0];
                } else if (!handle.startsWith('@')) {
                  handle = '@' + handle;
                }
                handles.push(handle);
                break;
              }
            }
          }
        }
        
        if (handles.length > 0) {
          setFormData(prev => ({ ...prev, directHandles: handles }));
          toast({
            title: "Handles Loaded",
            description: `Loaded ${handles.length} Instagram handles from CSV`,
          });
        } else {
          toast({
            title: "No Handles Found",
            description: "No Instagram handles found in CSV. Make sure you have @username or instagram.com/username columns.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

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
            <div className="flex gap-4 mb-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleFileUpload}
                className="flex-1"
                data-testid="button-upload-handles"
              >
                <i className="fas fa-upload mr-2"></i>
                Upload Instagram Handles CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-handles-csv"
              />
            </div>
            
            {formData.directHandles.length > 0 ? (
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  {formData.directHandles.length} Instagram handles uploaded
                </div>
                <div className="glass-card rounded-xl p-4 max-h-32 overflow-y-auto">
                  {formData.directHandles.slice(0, 10).map((handle: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 py-1">
                      <span className="text-primary font-mono text-sm">{handle}</span>
                    </div>
                  ))}
                  {formData.directHandles.length > 10 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      ...and {formData.directHandles.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            ) : availableResults.length > 0 ? (
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  {availableResults.length} extracted handles available. Latest {Math.min(10, availableResults.length)} will be used.
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
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No Instagram handles available. Upload a CSV or extract from websites first.
              </div>
            )}
          </div>

          {isProPlan && (
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
          )}
          
          {!isProPlan && (
            <div className="glass-card rounded-xl p-4 border border-primary/30">
              <div className="flex items-center space-x-3">
                <i className="fas fa-crown text-primary text-lg"></i>
                <div>
                  <div className="text-sm font-medium text-foreground">Scheduling Feature</div>
                  <div className="text-xs text-muted-foreground">Available in Pro and Agency plans</div>
                </div>
              </div>
            </div>
          )}

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
              disabled={createCampaignMutation.isPending || (formData.directHandles.length === 0 && availableResults.length === 0)}
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