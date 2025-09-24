import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import CampaignModal from "./CampaignModal";

export default function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);
      const response = await apiRequest("POST", "/api/extractions/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Processing ${data.domains?.length || 0} domains. You'll see results soon!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/extractions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
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
        title: "Upload Failed",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  const handleExtractUpload = () => {
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
      uploadMutation.mutate(file);
    }
  };

  const handleDMCampaign = () => {
    setShowCampaignModal(true);
  };

  return (
    <>
      <CampaignModal 
        isOpen={showCampaignModal} 
        onClose={() => setShowCampaignModal(false)} 
      />
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card rounded-2xl p-8 hover-glow" data-testid="card-extract-action">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center animate-float">
            <i className="fas fa-file-csv text-white text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-foreground">Extract IG Handles</h3>
          <p className="text-muted-foreground">Upload a CSV of websites and we'll extract Instagram handles automatically ⚡</p>
          <button 
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-3 px-6 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleExtractUpload}
            disabled={uploadMutation.isPending}
            data-testid="button-upload-csv"
          >
            <i className="fas fa-upload mr-2"></i>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-file-csv"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 hover-glow" data-testid="card-campaign-action">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
            <i className="fas fa-paper-plane text-white text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-foreground">Build DM Campaign</h3>
          <p className="text-muted-foreground">Create personalized DM templates and manage your outreach campaigns 💬</p>
          <button 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:scale-105 transition-transform"
            onClick={handleDMCampaign}
            data-testid="button-create-campaign"
          >
            <i className="fas fa-plus mr-2"></i>Create Campaign
          </button>
        </div>
      </div>
    </section>
    </>
  );
}
