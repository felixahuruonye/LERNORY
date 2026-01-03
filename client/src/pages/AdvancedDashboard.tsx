import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  Search,
  Sparkles,
  MessageSquare,
  Code2,
  Mic,
  ImageIcon,
  Brain,
  Zap,
  Clock,
  FolderOpen,
  Settings,
  LogOut,
  Monitor,
  Bell,
  X,
  History,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Crown,
} from "lucide-react";

// Fuzzy search algorithm
const fuzzyMatch = (query: string, text: string): number => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  if (t.includes(q)) return 100;
  
  let score = 0;
  let queryIdx = 0;
  
  for (let i = 0; i < t.length && queryIdx < q.length; i++) {
    if (t[i] === q[queryIdx]) {
      score += 10;
      queryIdx++;
    } else {
      score -= 1;
    }
  }
  
  return queryIdx === q.length ? Math.max(0, score) : -1;
};

export default function AdvancedDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // AI Tools Hub
  const aiTools = [
    { id: "chat", name: "Advanced Chat", icon: MessageSquare, description: "Multi-mode conversational AI", color: "from-blue-500 to-cyan-500", href: "/advanced-chat", keywords: ["chat", "ask", "ai", "tutor", "help"] },
    { id: "website", name: "Website Generator", icon: Code2, description: "AI-powered code generation", color: "from-green-500 to-emerald-500", href: "/website-generator", keywords: ["website", "code", "generate", "build", "web"] },
    { id: "live", name: "Live Session", icon: Mic, description: "Real-time transcription & recording", color: "from-rose-500 to-pink-500", href: "/live-session", keywords: ["live", "session", "voice", "record", "transcribe"] },
    { id: "image", name: "Image Generation", icon: ImageIcon, description: "DALL-E & image tools", color: "from-orange-500 to-red-500", href: "/image-gen", keywords: ["image", "generate", "photo", "visual", "art"] },
    { id: "memory", name: "Memory Panel", icon: Brain, description: "Learning memory system", color: "from-teal-500 to-cyan-500", href: "/memory", keywords: ["memory", "learn", "remember", "notes", "history"] },
    { id: "cbt", name: "CBT Mode", icon: Monitor, description: "Exam simulation (JAMB/WAEC/NECO)", color: "from-amber-500 to-yellow-500", href: "/cbt-mode", keywords: ["exam", "test", "cbt", "jamb", "waec", "practice"] },
    { id: "workspace", name: "Project Workspace", icon: FolderOpen, description: "Organize your projects", color: "from-purple-500 to-pink-500", href: "/project-workspace", keywords: ["project", "workspace", "organize", "folder", "task"] },
    { id: "settings", name: "Settings", icon: Settings, description: "Customize your experience", color: "from-indigo-500 to-blue-500", href: "/settings", keywords: ["settings", "config", "preferences", "customize"] },
  ];

  // Quick Actions
  const quickActions = [
    { label: "Ask LEARNORY", icon: MessageSquare, href: "/chat", color: "bg-blue-500/10" },
    { label: "Advanced Chat", icon: Sparkles, href: "/advanced-chat", color: "bg-purple-500/10" },
    { label: "Generate Website", icon: Code2, href: "/website-generator", color: "bg-emerald-500/10" },
    { label: "Live Session", icon: Mic, href: "/live-session", color: "bg-rose-500/10" },
  ];

  // Search Categories
  const searchCategories = [
    { label: "All", value: "all", icon: Search },
    { label: "Chat History", value: "chat", icon: MessageSquare },
    { label: "Memory", value: "memory", icon: Brain },
    { label: "Study Plans", value: "study_plan", icon: BookOpen },
    { label: "Exams", value: "exam", icon: Monitor },
    { label: "Websites", value: "website", icon: Code2 },
    { label: "Images", value: "image", icon: ImageIcon },
    { label: "Projects", value: "project", icon: FolderOpen },
    { label: "Lessons", value: "lesson", icon: BookOpen },
  ];

  // Global search query hook
  // Subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
    enabled: !!user,
  });

  // Global search query hook
  const { data: searchResults = { results: [] }, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { results: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      if (!res.ok) return { results: [] };
      return res.json();
    },
    enabled: !!searchQuery && showSearchDropdown,
  });

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboardSearchHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowSearchDropdown(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchDropdown(!!value || searchHistory.length > 0);
  };

  const addToSearchHistory = (query: string) => {
    if (query.trim()) {
      const updated = [query, ...searchHistory.filter((q) => q !== query)].slice(0, 5);
      setSearchHistory(updated);
      try {
        localStorage.setItem("dashboardSearchHistory", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save search history:", e);
      }
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem("dashboardSearchHistory");
    } catch (e) {
      console.error("Failed to clear search history:", e);
    }
  };

  // Filter tools based on search query
  const filteredTools = searchQuery
    ? aiTools
        .map((tool) => {
          const nameMatch = fuzzyMatch(searchQuery, tool.name);
          const descMatch = fuzzyMatch(searchQuery, tool.description);
          const keywordMatch = tool.keywords.some(
            (kw) => fuzzyMatch(searchQuery, kw) > 0
          )
            ? 50
            : -1;

          const score = Math.max(nameMatch, descMatch, keywordMatch);
          return { ...tool, score };
        })
        .filter((tool) => tool.score > 0)
        .sort((a, b) => b.score - a.score)
    : [];

  const handleToolClick = (toolName: string) => {
    addToSearchHistory(toolName);
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      MessageSquare,
      Brain,
      BookOpen,
      Monitor,
      Code2,
      ImageIcon,
      FolderOpen,
      Search,
    };
    return iconMap[iconName] || Search;
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-pulse text-muted-foreground">Loading LERNORY...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-1000 ease-in-out animate-in fade-in zoom-in-95">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10 glassmorphism transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                LERNORY ULTRA
              </h1>
            </div>

            {/* Advanced Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Search everything... (Cmd+K)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                className="pl-10 pr-8 bg-secondary/50 border-primary/20 focus:border-primary/50"
                data-testid="input-search-dashboard"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover-elevate"
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <Card className="absolute top-full left-0 right-0 mt-2 shadow-xl border-primary/20 max-h-96 overflow-y-auto z-50">
                  {/* Search Results from Backend */}
                  {searchQuery && searchResults.results.length > 0 && (
                    <div>
                      <div className="px-3 py-2 border-b border-primary/10">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Global Results ({searchResults.results.length})
                        </p>
                      </div>
                      <div className="divide-y divide-primary/10">
                        {searchResults.results.map((result: any) => {
                          const ResultIcon = getIconComponent(result.icon);
                          return (
                            <Link
                              key={`${result.type}-${result.id}`}
                              href={result.href || "/advanced-chat"}
                              onClick={() => handleToolClick(result.title)}
                            >
                              <button
                                className="w-full px-3 py-2 hover:bg-secondary/50 transition-colors text-left flex items-center gap-3 group"
                                data-testid={`button-search-result-${result.type}`}
                                onClick={() => {
                                  if (result.type === "image") {
                                    setSelectedImage(result);
                                  }
                                }}
                              >
                                {result.type === "image" && result.imageUrl ? (
                                  <img src={result.imageUrl} alt={result.title} className="h-8 w-8 rounded object-cover" />
                                ) : (
                                  <ResultIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tools Search Results */}
                  {searchQuery && filteredTools.length > 0 && (
                    <div>
                      <div className="px-3 py-2 border-b border-primary/10">
                        <p className="text-xs font-semibold text-muted-foreground">Tools</p>
                      </div>
                      <div className="divide-y divide-primary/10">
                        {filteredTools.map((tool) => (
                          <Link key={tool.id} href={tool.href} onClick={() => handleToolClick(tool.name)}>
                            <button
                              className="w-full px-3 py-2 hover:bg-secondary/50 transition-colors text-left flex items-center gap-3 group"
                              data-testid={`button-search-tool-${tool.id}`}
                            >
                              <tool.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchQuery && searchResults.results.length === 0 && filteredTools.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
                      <p className="text-xs text-muted-foreground mt-1">Try searching for chat, images, projects, or study plans</p>
                    </div>
                  )}

                  {/* Search History */}
                  {!searchQuery && searchHistory.length > 0 && (
                    <div>
                      <div className="px-3 py-2 flex items-center justify-between border-b border-primary/10">
                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <History className="h-3 w-3" />
                          Recent searches
                        </p>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-clear-search-history"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="divide-y divide-primary/10">
                        {searchHistory.map((query, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(query);
                              handleToolClick(query);
                            }}
                            className="w-full px-3 py-2 hover:bg-secondary/50 transition-colors text-left flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            data-testid={`button-history-${idx}`}
                          >
                            <History className="h-3 w-3" />
                            {query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {subscriptionStatus?.tier && subscriptionStatus.tier !== 'free' && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs" data-testid="badge-subscription">
                  <Crown className="h-3 w-3 text-primary" />
                  <span className="font-medium text-primary capitalize">{subscriptionStatus.tier}</span>
                </div>
              )}
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="gap-2 flex sm:flex" data-testid="button-upgrade">
                  <Zap className="h-4 w-4" />
                  Upgrade
                </Button>
              </Link>
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild className="hover-elevate relative" data-testid="link-notifications">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="hover-elevate" data-testid="link-settings">
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" asChild className="hover-elevate active-elevate-2" data-testid="button-logout">
                <a href="/api/logout" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-bold">Welcome back, {user.firstName || user.email}!</h2>
            <Sparkles className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleDateString()} • Press Cmd+K to search everything
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className={`${action.color} hover-elevate cursor-pointer h-full transition-all`} data-testid={`card-action-${action.label.toLowerCase().replace(" ", "-")}`}>
                <div className="p-6 text-center">
                  <action.icon className="h-8 w-8 mx-auto mb-2 text-foreground" />
                  <p className="font-semibold text-sm">{action.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Search Categories */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            What do you want to search today?
          </h3>
          <div className="relative flex items-center gap-2">
            <div
              className="flex gap-3 overflow-x-auto scroll-smooth px-12"
              data-testid="scroll-categories"
            >
              {searchCategories.map((cat) => {
                const CatIcon = cat.icon;
                
                // Show "All" always, others only if showAllCategories is true
                if (cat.value !== 'all' && !showAllCategories) return null;

                const categoryLinks: Record<string, string> = {
                  all: "/advanced-chat",
                  chat: "/advanced-chat",
                  memory: "/memory",
                  study_plan: "/study-plans",
                  exam: "/cbt-mode",
                  website: "/website-generator",
                  image: "/image-gen",
                  project: "/project-workspace",
                  lesson: "/advanced-chat",
                };
                return (
                  <Link
                    key={cat.value}
                    href={categoryLinks[cat.value] || "/advanced-chat"}
                  >
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary border border-primary/20 rounded-full whitespace-nowrap hover-elevate transition-all"
                      data-testid={`button-category-${cat.value}`}
                      onClick={(e) => {
                        if (cat.value === 'all') {
                          e.preventDefault();
                          setShowAllCategories(true);
                        }
                      }}
                    >
                      <CatIcon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Tools Hub */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            AI Tools Hub
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiTools.map((tool) => (
              <Link key={tool.id} href={tool.href || "/advanced-chat"} className="block">
                <Card
                  className="hover-elevate cursor-pointer h-full transition-all group relative overflow-hidden glassmorphism border-primary/10 hover:border-primary/30 shadow-lg hover:shadow-primary/20 hover:-translate-y-2"
                  onMouseEnter={() => setHoveredCard(tool.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  data-testid={`card-tool-${tool.id}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <CardHeader className="relative">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${tool.color} mb-3`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                    <Button
                      size="sm"
                      className="w-full hover-elevate"
                      asChild
                      data-testid={`button-open-${tool.id}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Get Started Button */}
        <div className="mt-12">
          <Link href="/advanced-chat">
            <Button className="gap-2" size="lg" data-testid="button-get-started">
              <Sparkles className="h-5 w-5" />
              Start Learning Now
            </Button>
          </Link>
        </div>
      </main>

      {/* Image Gallery Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-image-gallery">
            <div className="flex flex-col gap-4">
              <img src={selectedImage.imageUrl} alt={selectedImage.title} className="w-full rounded-lg object-cover max-h-96" data-testid="img-gallery-preview" />
              <div>
                <p className="font-semibold mb-2" data-testid="text-image-title">{selectedImage.title}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-image-prompt">{selectedImage.description}</p>
              </div>
              <Link href={selectedImage.href || "/image-gen"}>
                <Button className="w-full" data-testid="button-open-image">
                  View & Edit in Generator
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
