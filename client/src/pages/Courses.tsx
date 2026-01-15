import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  BookOpen,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Sparkles,
  FileText,
  Upload,
  Loader2,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { Link } from "wouter";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  syllabus: any;
  materials: any[];
  enrollmentCount: number;
  duration: string;
  rating: number;
  creatorId: string;
  createdAt: string;
}

const CATEGORIES = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Government",
  "Economics",
  "Computer Science",
  "General",
];

export default function Courses() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    duration: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create course");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setShowCreateDialog(false);
      setFormData({ title: "", description: "", category: "", price: 0, duration: "" });
      setUploadedFiles([]);
      setUploadProgress(0);
      toast({ title: "Success", description: "Course created successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.type === "application/pdf" || 
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "text/plain"
    );
    if (validFiles.length !== acceptedFiles.length) {
      toast({ title: "Warning", description: "Some files were skipped. Only PDF, DOCX, and TXT allowed.", variant: "destructive" });
    }
    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleCreateCourse = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("price", formData.price.toString());
    data.append("duration", formData.duration);
    
    uploadedFiles.forEach((file, index) => {
      data.append(`materials`, file);
    });

    // Simulate upload progress
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      await createCourseMutation.mutateAsync(data);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (authLoading || !user || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isTeacher = user.role === "teacher" || user.role === "lecturer" || user.role === "school";

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background transition-all duration-700 ease-in-out animate-in fade-in zoom-in-95">
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <a data-testid="link-back">
                    <ArrowLeft className="h-5 w-5" />
                  </a>
                </Link>
              </Button>
              <h1 className="font-display font-semibold text-lg">Course Marketplace</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          {isTeacher && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-course">
                  <Plus className="h-4 w-4" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Create New Course
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <Label htmlFor="title">Course Title *</Label>
                    <Input 
                      id="title"
                      placeholder="e.g., Complete Physics for JAMB"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      data-testid="input-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description"
                      placeholder="Describe what students will learn..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input 
                        id="duration"
                        placeholder="e.g., 8 weeks"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        data-testid="input-duration"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price (Naira)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="price"
                        type="number"
                        min="0"
                        placeholder="0 for free"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        className="pl-10"
                        data-testid="input-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 for a free course</p>
                  </div>

                  <div>
                    <Label>Course Materials (PDF, DOCX, TXT)</Label>
                    <div 
                      {...getRootProps()} 
                      className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                      data-testid="dropzone"
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      {isDragActive ? (
                        <p className="text-primary">Drop files here...</p>
                      ) : (
                        <>
                          <p className="text-muted-foreground">Drag & drop files here, or click to select</p>
                          <p className="text-xs text-muted-foreground mt-1">Max 10 files, 10MB each</p>
                        </>
                      )}
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFile(index)}
                              data-testid={`button-remove-file-${index}`}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {createCourseMutation.isPending && uploadProgress > 0 && (
                    <div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleCreateCourse}
                    disabled={createCourseMutation.isPending}
                    className="w-full gap-2"
                    data-testid="button-submit-course"
                  >
                    {createCourseMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Course...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Create Course
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <ScrollReveal>
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-semibold mb-3">
                  {isTeacher ? "Create Your First Course" : "No Courses Found"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {isTeacher
                    ? "Upload your teaching materials and create comprehensive courses for students"
                    : "Try searching for another topic or check back later"}
                </p>
                {isTeacher && (
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => setShowCreateDialog(true)}
                    data-testid="button-get-started"
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Course
                  </Button>
                )}
              </div>
            </ScrollReveal>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredCourses.map((course, index) => (
              <ScrollReveal key={course.id} delay={index * 100}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full glassmorphism border-primary/10 shadow-lg hover:shadow-primary/20 transition-all duration-300" data-testid={`card-course-${index}`}>
                  <CardHeader>
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-chart-2/20 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      {course.price > 0 ? (
                        <Badge className="bg-chart-2/10 text-chart-2">₦{course.price.toLocaleString()}</Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    {course.category && (
                      <Badge variant="outline" className="mb-4">{course.category}</Badge>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollmentCount || 0}</span>
                      </div>
                      {course.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      {course.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{course.rating}</span>
                        </div>
                      )}
                    </div>
                    <Button className="w-full" data-testid={`button-view-course-${index}`}>
                      {isTeacher ? "Manage Course" : "Enroll Now"}
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
