import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  Image as ImageIcon,
  Settings,
  Download,
  Trash2,
  Wand2,
  Loader2,
  History,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ImageGenAdvanced() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("1024x1024");
  const [resolution, setResolution] = useState("1024");

  const handleDeleteImage = async (imageId: string) => {
    try {
      await apiRequest("DELETE", `/api/generated-images/${imageId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({ title: "Image deleted", description: "Image removed from history" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
    }
  };

  const { data: generatedImages = [], isLoading: imagesLoading } = useQuery<any[]>({
    queryKey: ["/api/generated-images"],
    enabled: !!user,
  });

  const generateImageMutation = useMutation({
    mutationFn: async (data: { prompt: string; style: string; resolution: string }) => {
      const response = await apiRequest("POST", "/api/generate-image", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Image generated!", description: "Your image has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      setPrompt("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const styles = [
    { id: "photorealistic", name: "Photorealistic", icon: "📸" },
    { id: "illustrated", name: "Illustrated", icon: "🎨" },
    { id: "sketch", name: "Sketch", icon: "✏️" },
    { id: "3d", name: "3D Render", icon: "🎮" },
    { id: "watercolor", name: "Watercolor", icon: "🌊" },
    { id: "neon", name: "Neon", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover-elevate" data-testid="button-back">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <ImageIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Image Generator</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generator Panel */}
          <Card className="hover-elevate" data-testid="card-image-generator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Create New Image
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Describe your image</label>
                <Textarea
                  placeholder="A futuristic city at night with neon lights, cyberpunk style..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                  data-testid="textarea-image-prompt"
                />
              </div>

              {/* Style Templates */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {styles.map((style) => (
                    <Button
                      key={style.id}
                      variant={selectedStyle === style.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStyle(style.id)}
                      className="hover-elevate h-auto py-3"
                      data-testid={`button-style-${style.id}`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{style.icon}</div>
                        <p className="text-xs">{style.name}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {["1024x1024", "1024x768", "768x1024"].map((ratio) => (
                    <Button
                      key={ratio}
                      variant={aspectRatio === ratio ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspectRatio(ratio)}
                      className="hover-elevate"
                      data-testid={`button-ratio-${ratio.replace("x", "-")}`}
                    >
                      {ratio}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {["512", "768", "1024"].map((res) => (
                    <Button
                      key={res}
                      variant={resolution === res ? "default" : "outline"}
                      size="sm"
                      onClick={() => setResolution(res)}
                      className="hover-elevate"
                      data-testid={`button-resolution-${res}`}
                    >
                      {res}p
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                size="lg"
                className="w-full hover-elevate"
                onClick={() => generateImageMutation.mutate({ prompt, style: selectedStyle, resolution })}
                disabled={generateImageMutation.isPending || !prompt}
                data-testid="button-generate-image"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* History & Preview */}
          <div className="space-y-6">
            {/* Preview of last generated */}
            {generatedImages.length > 0 && (
              <Card className="overflow-hidden hover-elevate" data-testid="card-preview">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Latest Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full aspect-square bg-secondary/50 rounded-lg overflow-hidden">
                    <img
                      src={generatedImages[0].imageUrl}
                      alt={generatedImages[0].prompt}
                      className="w-full h-full object-cover"
                      data-testid="img-preview"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">{generatedImages[0].prompt}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover-elevate"
                        asChild
                        data-testid="button-download-preview"
                      >
                        <a href={generatedImages[0].imageUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="hover-elevate"
                        onClick={() => handleDeleteImage(generatedImages[0].id)}
                        data-testid="button-delete-preview"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image History */}
            <Card data-testid="card-history">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    History
                  </span>
                  <Badge>{generatedImages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imagesLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                ) : generatedImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No images generated yet. Create your first image to get started!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {generatedImages.map((img: any) => (
                      <div key={img.id} className="group relative overflow-hidden rounded-lg hover-elevate" data-testid={`card-history-item-${img.id}`}>
                        <img
                          src={img.imageUrl}
                          alt={img.prompt}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" className="hover-elevate" data-testid={`button-edit-${img.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="hover-elevate" onClick={() => handleDeleteImage(img.id)} data-testid={`button-delete-${img.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
