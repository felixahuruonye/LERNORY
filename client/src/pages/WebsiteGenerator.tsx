import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Trash2, Copy, ChevronLeft, Eye, Code2 } from "lucide-react";

export default function WebsiteGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);

  // Fetch all websites
  const { data: websites = [], isLoading } = useQuery({
    queryKey: ["/api/websites"],
    queryFn: () => apiRequest("/api/websites").then(r => r.json()),
  });

  // Generate website mutation
  const generateMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await apiRequest("/api/websites/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: promptText }),
      });
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
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate website",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite
  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await apiRequest(`/api/websites/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
    },
  });

  // Delete website
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/websites/${id}`, { method: "DELETE" });
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

  const selectedWebsiteData = websites.find((w: any) => w.id === selectedWebsite);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/chat")}
                data-testid="button-back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-center flex-1">Website Generator</h1>
            <div className="w-10" />
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
          {selectedWebsiteData ? (
            <div className="lg:col-span-3 space-y-4">
              {/* Toolbar */}
              <Card className="p-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold flex-1">{selectedWebsiteData.title}</h2>
                <div className="flex items-center gap-2">
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
    </div>
  );
}
