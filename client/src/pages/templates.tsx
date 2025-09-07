import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import TemplateBuilder from "@/components/TemplateBuilder";

export default function TemplatesPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

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
          <h1 className="text-4xl md:text-6xl font-black text-gradient mb-4" data-testid="text-templates-title">
            ✨ DM Templates
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create personalized DM templates with spintax variations and placeholders 🎯
          </p>
        </section>

        <TemplateBuilder />
      </main>
    </div>
  );
}
