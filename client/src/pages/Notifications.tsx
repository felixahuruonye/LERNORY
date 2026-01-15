import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ArrowRight, Check, Send, Loader, AlertCircle, Eye, BookOpen } from "lucide-react";
import { deleteNotification, sendChatHistoryNotifications, requestNotificationPermission } from "@/lib/notificationService";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useExamResults, useMarkNotificationRead } from "@/hooks/useSupabaseData";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface ExamHistory {
  id: string;
  examType: string;
  subjects: string[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  summary: string;
  questions?: any[];
  userAnswers?: Record<string, string>;
  createdAt: string;
}

function Notifications() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sendingHistory, setSendingHistory] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"default" | "granted" | "denied">("default");
  const [selectedReviewExam, setSelectedReviewExam] = useState<ExamHistory | null>(null);

  useEffect(() => {
    // Check notification permission on mount
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission as "default" | "granted" | "denied");
    }
  }, []);

  // Use Supabase hooks for faster loading
  const { data: notificationsData = [], isLoading, refetch } = useNotifications();
  const { data: examResultsData = [] } = useExamResults();
  const markReadMutation = useMarkNotificationRead();
  
  // Transform data to match expected interface
  const notifications: Notification[] = notificationsData.map((n: any) => ({
    id: n.id,
    type: n.type || 'info',
    title: n.title,
    message: n.message || '',
    actionUrl: n.action_url,
    read: n.read || false,
    createdAt: n.created_at,
  }));
  
  const examHistory: ExamHistory[] = examResultsData.map((e: any) => ({
    id: e.id,
    examType: e.exam_type,
    subjects: e.subjects || [],
    score: e.score,
    totalQuestions: e.total_questions,
    correctAnswers: e.correct_answers || 0,
    summary: e.summary || '',
    questions: e.questions,
    userAnswers: e.user_answers,
    createdAt: e.created_at,
  }));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supabase', 'notifications', user?.id] }),
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const res = await apiRequest('DELETE', `/api/cbt/history/${examId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'exam-results', user?.id] });
      toast({ title: "Exam deleted", description: "Exam removed from history" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
    },
  });

  const handleRequestPermission = async () => {
    console.log("Requesting notification permission...");
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermissionStatus("granted");
      toast({ title: "Permission Granted!", description: "You'll now receive notifications on your device." });
    } else {
      setPermissionStatus("denied");
      toast({ title: "Permission Denied", description: "Please enable notifications in your browser settings.", variant: "destructive" });
    }
  };

  const handleSendChatHistory = async () => {
    console.log("Send chat history clicked. Permission status:", permissionStatus);
    
    if (permissionStatus !== "granted") {
      console.log("Requesting permission first...");
      await handleRequestPermission();
      return;
    }

    setSendingHistory(true);
    try {
      console.log("Calling sendChatHistoryNotifications...");
      const result = await sendChatHistoryNotifications();
      console.log("Result:", result);
      toast({
        title: "Sent!",
        description: `${result.count} notifications sent to your device - check for notifications!`,
      });
      refetch();
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({ title: "Error", description: "Failed to send notifications", variant: "destructive" });
    } finally {
      setSendingHistory(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Show exam review modal
  if (selectedReviewExam) {
    const allReviewQuestions: any[] = selectedReviewExam.questions || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => setSelectedReviewExam(null)} variant="outline" className="mb-8">← Back to Notifications</Button>
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3 text-white">
            <BookOpen className="w-10 h-10" />
            {selectedReviewExam.examType} - Review
          </h1>
          <p className="text-gray-400 mb-8">Score: <span className="font-bold text-lg text-green-400">{selectedReviewExam.score}%</span></p>

          <div className="space-y-6">
            {allReviewQuestions.map((q: any, idx: number) => {
              const userAnswer = selectedReviewExam.userAnswers?.[q.id] || 'Not answered';
              const isCorrect = userAnswer === q.correct;
              
              return (
                <Card key={idx} className="p-6 bg-slate-800/50 border-slate-700" style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: isCorrect ? '#22c55e' : '#ef4444'
                }} data-testid={`card-exam-review-${idx}`}>
                  {/* Question Header */}
                  <div className="flex gap-3 mb-6 items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-white">Q{idx + 1}: {q.question}</p>
                    </div>
                    <Badge variant={isCorrect ? 'default' : 'destructive'} className="whitespace-nowrap">
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </Badge>
                  </div>

                  {/* Answer Comparison Section */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Your Answer */}
                    <div className="p-4 rounded-md bg-amber-900/30 border border-amber-700">
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Your Answer</p>
                      <div className="space-y-2">
                        {q.options?.map((opt: string, optIdx: number) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isUserAnswer = letter === userAnswer;
                          
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded text-sm font-mono ${
                                isUserAnswer 
                                  ? 'bg-amber-700/60 border border-amber-500 text-amber-100 font-bold'
                                  : 'text-gray-400'
                              }`}
                            >
                              <span className="font-bold text-white">{letter}.</span> {opt}
                              {isUserAnswer && <span className="ml-2 text-amber-300">← {isCorrect ? '✓' : '✗'}</span>}
                            </div>
                          );
                        })}
                        {userAnswer === 'Not answered' && (
                          <p className="text-sm text-amber-400 italic">No answer submitted</p>
                        )}
                      </div>
                    </div>

                    {/* Correct Answer */}
                    <div className="p-4 rounded-md bg-green-900/30 border border-green-700">
                      <p className="text-xs font-bold text-green-300 uppercase tracking-wider mb-3">Correct Answer</p>
                      <div className="space-y-2">
                        {q.options?.map((opt: string, optIdx: number) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrectAnswer = letter === q.correct;
                          
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded text-sm font-mono ${
                                isCorrectAnswer 
                                  ? 'bg-green-700/60 border border-green-500 text-green-100 font-bold'
                                  : 'text-gray-400'
                              }`}
                            >
                              <span className="font-bold text-white">{letter}.</span> {opt}
                              {isCorrectAnswer && <span className="ml-2 text-green-300">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* AI Correction/Explanation */}
                  <div className="p-4 bg-blue-900/30 rounded-md border border-blue-700">
                    <p className="text-sm font-bold text-blue-300 mb-2">📚 AI's Explanation (Why this is important):</p>
                    <p className="text-sm text-blue-200 leading-relaxed">{q.explanation}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Notifications & Exam History</h1>
          <div className="flex gap-2">
            {permissionStatus !== "granted" && (
              <Button
                onClick={handleRequestPermission}
                variant="outline"
                className="gap-2"
                data-testid="button-request-permission"
              >
                <AlertCircle className="w-4 h-4" /> Enable Notifications
              </Button>
            )}
            <Button
              onClick={handleSendChatHistory}
              disabled={sendingHistory || permissionStatus !== "granted"}
              className="gap-2"
              data-testid="button-send-chat-history"
            >
              {sendingHistory ? (
                <> <Loader className="w-4 h-4 animate-spin" /> Sending... </>
              ) : (
                <> <Send className="w-4 h-4" /> Send Chat History </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-gray-400 mb-6">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </p>

        {/* Exam History Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Exam History</h2>
          {examHistory?.length ? (
            <div className="space-y-3">
              {examHistory.map((exam) => (
                <Card key={exam.id} className="p-4 bg-slate-800/50 border-slate-700 hover:border-slate-600">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{exam.examType} - {exam.subjects?.join(', ')}</h3>
                      <p className="text-gray-300 text-sm">{new Date(exam.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-400 text-sm mt-1">{exam.summary}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-green-600">{exam.score}%</Badge>
                        <Badge variant="outline">{exam.correctAnswers}/{exam.totalQuestions} correct</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => setSelectedReviewExam(exam)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Delete this exam from history?')) {
                            deleteExamMutation.mutate(exam.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 bg-slate-800/50 border-slate-700 text-center">
              <p className="text-gray-400">No exams completed yet. Take an exam in CBT Mode to see results here!</p>
            </Card>
          )}
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Notifications
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 bg-slate-800/50 border-slate-700 text-center">
              <p className="text-gray-400">No notifications yet. Click "Send Chat History" to get started!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Card key={n.id} className="p-4 bg-slate-800/50 border-slate-700 hover:border-slate-600">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{n.title}</h3>
                      <p className="text-gray-300 text-sm">{n.message}</p>
                      <Badge className="mt-2 capitalize">{n.type.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex gap-2">
                      {!n.read && (
                        <Button size="icon" variant="ghost" onClick={() => markReadMutation.mutate(n.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {n.actionUrl && (
                        <Button size="icon" variant="ghost" onClick={() => navigate(n.actionUrl!)}>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(n.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
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

export default Notifications;
