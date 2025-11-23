import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Download, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import type { GeneratedImage } from "@shared/schema";

export default function ImageGallery() {
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const { data: images = [], isLoading } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/generated-images"],
  });

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${prompt.substring(0, 20)}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/chat")}
              className="hover-elevate active-elevate-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Image Gallery</h1>
              <p className="text-sm text-muted-foreground">
                {images.length} {images.length === 1 ? "image" : "images"} generated
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No images yet</h2>
              <p className="text-muted-foreground mb-6">
                Generate images by clicking "Create Image" in the Chat
              </p>
              <Button
                onClick={() => setLocation("/chat")}
                className="hover-elevate active-elevate-2"
              >
                Go to Chat
              </Button>
            </div>
          ) : selectedImage ? (
            // Image Detail View
            <div className="max-w-3xl mx-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="mb-4 hover-elevate active-elevate-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gallery
              </Button>

              <Card className="p-6 space-y-4">
                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.prompt}
                    className="w-full h-auto"
                    data-testid={`img-detail-${selectedImage.id}`}
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Description</h2>
                  <p className="text-muted-foreground">{selectedImage.prompt}</p>
                </div>

                {selectedImage.relatedTopic && (
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Topic</h2>
                    <p className="text-muted-foreground">{selectedImage.relatedTopic}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Generated</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedImage.createdAt).toLocaleDateString()} at{" "}
                    {new Date(selectedImage.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadImage(selectedImage.imageUrl, selectedImage.prompt)}
                    className="flex-1 hover-elevate active-elevate-2"
                    data-testid="button-download-image"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            // Gallery Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                  data-testid={`card-image-${image.id}`}
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      data-testid={`img-gallery-${image.id}`}
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
