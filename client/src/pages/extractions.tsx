import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import RecentResults from "@/components/RecentResults";
import QuickActions from "@/components/QuickActions";
import { useQuery } from "@tanstack/react-query";

export default function ExtractionsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Fetch extractions
  const { data: extractions, isLoading: extractionsLoading } = useQuery({
    queryKey: ['/api/extractions'],
    retry: false,
  });

  // Fetch all results
  const { data: results, isLoading: resultsLoading } = useQuery({
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
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-gradient mb-4">
            🔍 Instagram Extractions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload CSV files and extract Instagram handles automatically ✨
          </p>
        </section>

        <QuickActions />

        {/* Extraction Jobs Status */}
        {(extractions as any[]) && (extractions as any[]).length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground flex items-center">
              <i className="fas fa-cog text-primary mr-3"></i>
              Extraction Jobs
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {(extractions as any[]).map((job: any) => (
                <div key={job.id} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Extraction Job #{job.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()} • {job.total} domains
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : job.status === 'running'
                        ? 'bg-blue-500/20 text-blue-400'
                        : job.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">
                        {job.completed + job.failed} / {job.total}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="progress-bar h-2 rounded-full" 
                        style={{ 
                          width: job.total > 0 
                            ? `${Math.min(((job.completed + job.failed) / job.total) * 100, 100)}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-400">{job.completed}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">{job.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-400">{job.total - job.completed - job.failed}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <RecentResults 
          results={(results as any[]) || []} 
          isLoading={resultsLoading} 
        />
      </main>
    </div>
  );
}
