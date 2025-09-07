import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(10, "Message content must be at least 10 characters"),
  spintaxVariations: z.number().min(1).max(20),
  sendRate: z.enum(["conservative", "moderate", "aggressive"]),
});

type TemplateForm = z.infer<typeof templateSchema>;

export default function TemplateBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewContent, setPreviewContent] = useState("");

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      content: "",
      spintaxVariations: 3,
      sendRate: "moderate",
    },
  });

  // Fetch existing templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    retry: false,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: TemplateForm) => {
      const response = await apiRequest("POST", "/api/templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Your DM template has been saved successfully! 🎉",
      });
      form.reset();
      setPreviewContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
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
        title: "Failed to Create Template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TemplateForm) => {
    createTemplateMutation.mutate(data);
  };

  const handleContentChange = (content: string) => {
    form.setValue("content", content);
    
    // Generate preview with sample data
    const preview = content
      .replace(/\{\{name\}\}/g, "Sarah")
      .replace(/\{\{topic\}\}/g, "fitness nutrition")
      .replace(/\{\{brand\}\}/g, "FitLife")
      .replace(/\{\{followers\}\}/g, "25.3K");
    
    setPreviewContent(preview);
  };

  const insertPlaceholder = (placeholder: string) => {
    const currentContent = form.getValues("content");
    const newContent = currentContent + `{{${placeholder}}}`;
    handleContentChange(newContent);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground flex items-center">
          <i className="fas fa-edit text-primary mr-3"></i>
          DM Template Builder
        </h2>
        <Button className="bg-gradient-to-r from-primary to-pink-500 hover:opacity-90" data-testid="button-new-template">
          <i className="fas fa-plus mr-2"></i>New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Form */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle>Create Template</CardTitle>
            <CardDescription>
              Design personalized DM templates with placeholders and spintax variations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Fitness Influencer Outreach"
                  {...form.register("name")}
                  data-testid="input-template-name"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="content">Message Template</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {["name", "topic", "brand", "followers"].map((placeholder) => (
                      <button
                        key={placeholder}
                        type="button"
                        onClick={() => insertPlaceholder(placeholder)}
                        className="px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                        data-testid={`button-placeholder-${placeholder}`}
                      >
                        {`{{${placeholder}}}`}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    id="content"
                    rows={6}
                    placeholder="Hey {{name}}! 👋 I love your content about {{topic}}. I'm reaching out because..."
                    {...form.register("content")}
                    onChange={(e) => handleContentChange(e.target.value)}
                    data-testid="textarea-template-content"
                  />
                </div>
                {form.formState.errors.content && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spintaxVariations">Spintax Variations</Label>
                  <Select
                    value={form.watch("spintaxVariations").toString()}
                    onValueChange={(value) => form.setValue("spintaxVariations", parseInt(value))}
                  >
                    <SelectTrigger data-testid="select-spintax-variations">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 variations</SelectItem>
                      <SelectItem value="5">5 variations</SelectItem>
                      <SelectItem value="10">10 variations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sendRate">Send Rate</Label>
                  <Select
                    value={form.watch("sendRate")}
                    onValueChange={(value) => form.setValue("sendRate", value as "conservative" | "moderate" | "aggressive")}
                  >
                    <SelectTrigger data-testid="select-send-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative (1/hour)</SelectItem>
                      <SelectItem value="moderate">Moderate (3/hour)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (5/hour)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-primary to-pink-500 hover:opacity-90"
                  disabled={createTemplateMutation.isPending}
                  data-testid="button-save-template"
                >
                  <i className="fas fa-save mr-2"></i>
                  {createTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-test-template"
                >
                  <i className="fas fa-paper-plane mr-2"></i>Test Send
                </Button>
              </div>
            </form>

            {/* Preview */}
            {previewContent && (
              <Card className="border border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-400 text-sm flex items-center">
                    <i className="fas fa-eye mr-2"></i>Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic" data-testid="text-template-preview">
                    "{previewContent}"
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Existing Templates */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle>Saved Templates</CardTitle>
            <CardDescription>
              Manage your existing DM templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (templates as any[]) && (templates as any[]).length > 0 ? (
              <div className="space-y-4">
                {(templates as any[]).map((template: any) => (
                  <div key={template.id} className="glass-card rounded-xl p-4 space-y-2" data-testid={`template-${template.id}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground" data-testid={`template-name-${template.id}`}>
                        {template.name}
                      </h4>
                      <div className="flex space-x-2">
                        <button className="text-muted-foreground hover:text-foreground" data-testid={`button-edit-${template.id}`}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="text-muted-foreground hover:text-red-400" data-testid={`button-delete-${template.id}`}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`template-content-${template.id}`}>
                      {template.content}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{template.spintaxVariations} variations</span>
                      <span className="capitalize">{template.sendRate} rate</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 opacity-50">
                  <i className="fas fa-edit text-white"></i>
                </div>
                <p className="text-muted-foreground">No templates yet. Create your first template!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
