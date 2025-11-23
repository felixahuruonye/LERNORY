import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Trash2, Copy, ChevronLeft, Eye, Code2, BookOpen, X } from "lucide-react";

export default function WebsiteGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState("");

  // Fetch all websites
  const { data: websites = [], isLoading } = useQuery({
    queryKey: ["/api/websites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/websites");
      return res.json();
    },
  });

  // Generate website mutation
  const generateMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await apiRequest("POST", "/api/websites/generate", { prompt: promptText });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      setSelectedWebsite(data.id);
      setPrompt("");
      toast({
        title: "Website Generated!",
        description: "Your website has been created successfully.",
      });
    },
    onError: (error: any) => {
      const message = error?.message || error?.error || "Failed to generate website";
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Toggle favorite
  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await apiRequest("PATCH", `/api/websites/${id}`, { isFavorite: !isFavorite });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
    },
  });

  // Delete website
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/websites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      setSelectedWebsite(null);
      toast({
        title: "Deleted",
        description: "Website removed successfully.",
      });
    },
  });

  // Explain code for beginners
  const explainMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/websites/${id}/explain`);
      return res.json();
    },
    onSuccess: (data) => {
      setExplanation(data.explanation);
      setShowExplanation(true);
    },
    onError: (error: any) => {
      const message = error?.message || error?.error || "Failed to explain code";
      toast({
        title: "Explanation Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const selectedWebsiteData = websites.find((w: any) => w.id === selectedWebsite);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/chat")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-center flex-1">Website Generator</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/website-menu")}
              data-testid="button-open-menu"
            >
              Features Menu
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Input & List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Generate Form */}
            <Card className="p-4 space-y-3">
              <h2 className="font-semibold text-sm">Create Website</h2>
              <Textarea
                placeholder="Describe the website you want to create... e.g., 'A modern portfolio website for a freelance designer with dark theme'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none min-h-[100px]"
                data-testid="input-website-prompt"
              />
              <Button
                onClick={() => generateMutation.mutate(prompt)}
                disabled={!prompt.trim() || generateMutation.isPending}
                className="w-full hover-elevate active-elevate-2"
                data-testid="button-generate-website"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Website"
                )}
              </Button>
            </Card>

            {/* Websites List */}
            <Card className="p-4 space-y-2">
              <h2 className="font-semibold text-sm mb-3">Your Websites ({websites.length})</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : websites.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No websites yet</p>
                ) : (
                  websites.map((website: any) => (
                    <div
                      key={website.id}
                      onClick={() => setSelectedWebsite(website.id)}
                      className={`p-2 rounded-md cursor-pointer text-xs transition-colors hover-elevate ${
                        selectedWebsite === website.id
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-muted/50 hover:bg-muted border border-transparent"
                      }`}
                      data-testid={`website-item-${website.id}`}
                    >
                      <div className="font-medium truncate">{website.title}</div>
                      <div className="text-muted-foreground text-xs truncate">{website.description}</div>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{website.viewCount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel - Preview & Code */}
          {generateMutation.isPending ? (
            <div className="lg:col-span-3">
              <Card className="p-12 text-center text-muted-foreground space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin" />
                <div>
                  <p className="text-lg font-semibold mb-2">Generating your website...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment. Gemini AI is creating your custom website.</p>
                </div>
              </Card>
            </div>
          ) : selectedWebsiteData ? (
            <div className="lg:col-span-3 space-y-4">
              {/* Toolbar */}
              <Card className="p-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold flex-1">{selectedWebsiteData.title}</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/view/${selectedWebsiteData.id}`)}
                    className="hover-elevate active-elevate-2"
                    data-testid="button-view-website"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => explainMutation.mutate(selectedWebsiteData.id)}
                    disabled={explainMutation.isPending}
                    className="hover-elevate active-elevate-2"
                    data-testid="button-learn-code"
                  >
                    {explainMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <BookOpen className="h-4 w-4 mr-2" />
                    )}
                    Learn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => favoriteMutation.mutate({ id: selectedWebsiteData.id, isFavorite: selectedWebsiteData.isFavorite })}
                    className="hover-elevate active-elevate-2"
                    data-testid="button-toggle-favorite"
                  >
                    <Heart className={`h-4 w-4 ${selectedWebsiteData.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedWebsiteData.htmlCode);
                      toast({ title: "Copied", description: "HTML code copied to clipboard" });
                    }}
                    className="hover-elevate active-elevate-2"
                    data-testid="button-copy-code"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(selectedWebsiteData.id)}
                    className="hover-elevate active-elevate-2 text-destructive"
                    data-testid="button-delete-website"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Tabs - Preview & Code */}
              <Tabs defaultValue="preview" className="space-y-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview" data-testid="tab-preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="html" data-testid="tab-html">
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" data-testid="tab-css">
                    CSS
                  </TabsTrigger>
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-4">
                  <Card className="p-0 overflow-hidden border-2">
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>${selectedWebsiteData.title}</title>
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            ${selectedWebsiteData.cssCode}
                          </style>
                        </head>
                        <body>
                          ${selectedWebsiteData.htmlCode}
                          <script>
                            ${selectedWebsiteData.jsCode || ""}
                          </script>
                        </body>
                        </html>
                      `}
                      className="w-full h-[600px] border-0"
                      title="Website Preview"
                      data-testid="iframe-preview"
                    />
                  </Card>
                </TabsContent>

                {/* HTML Tab */}
                <TabsContent value="html" className="mt-4">
                  <Card className="p-4">
                    <pre className="text-xs overflow-x-auto max-h-[600px] overflow-y-auto bg-muted/50 p-4 rounded">
                      <code>{selectedWebsiteData.htmlCode}</code>
                    </pre>
                  </Card>
                </TabsContent>

                {/* CSS Tab */}
                <TabsContent value="css" className="mt-4">
                  <Card className="p-4">
                    <pre className="text-xs overflow-x-auto max-h-[600px] overflow-y-auto bg-muted/50 p-4 rounded">
                      <code>{selectedWebsiteData.cssCode}</code>
                    </pre>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="lg:col-span-3">
              <Card className="p-12 text-center text-muted-foreground">
                <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generate your first website to get started</p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Code Explanation Modal */}
      <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-code-explanation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learn How This Code Works
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {explanation}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={() => setShowExplanation(false)}
            data-testid="button-close-explanation"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
