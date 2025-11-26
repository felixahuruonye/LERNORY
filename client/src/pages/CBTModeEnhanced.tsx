import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle2, BookOpen, TrendingUp, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

const mockQuestions = [
  {
    id: '1',
    subject: 'English',
    question: 'Which of the following is a synonym for "ubiquitous"?',
    options: ['Rare and uncommon', 'Present everywhere', 'Difficult to understand', 'Unique and special'],
    correct: 'B',
    explanation: 'Ubiquitous means present, appearing, or found everywhere.',
  },
  {
    id: '2',
    subject: 'Mathematics',
    question: 'What is the derivative of x² + 3x + 5?',
    options: ['2x + 3', 'x + 3', '2x² + 3', 'x² + 3'],
    correct: 'A',
    explanation: 'Using power rule: d/dx(x²) = 2x, d/dx(3x) = 3, d/dx(5) = 0.',
  },
  {
    id: '3',
    subject: 'Physics',
    question: 'What is the SI unit of force?',
    options: ['Kilogram', 'Newton', 'Pascal', 'Joule'],
    correct: 'B',
    explanation: 'The SI unit of force is Newton (N), defined as kg⋅m/s².',
  },
];

export default function CBTModeEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<any>(null);
  const [view, setView] = useState<'dashboard' | 'exam' | 'results' | 'history' | 'analytics'>('dashboard');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch exam history
  const { data: examHistory } = useQuery({
    queryKey: ['/api/cbt/history'],
    queryFn: () => apiRequest('GET', '/api/cbt/history'),
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/cbt/analytics'],
    queryFn: () => apiRequest('GET', '/api/cbt/analytics'),
  });

  // Grade exam mutation
  const gradeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/cbt/grade', data);
    },
    onSuccess: (data) => {
      setExamResult(data.gradingResult);
      setView('results');
      toast({ title: 'Exam Graded!', description: `Your score: ${data.gradingResult.score}%` });
    },
  });

  // Timer
  useEffect(() => {
    if (isExamActive && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isExamActive, timeRemaining]);

  // Keyboard handling
  useEffect(() => {
    if (!isExamActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key)) {
        const optionIndex = key.charCodeAt(0) - 65;
        setAnswers((prev) => ({ ...prev, [mockQuestions[currentQuestionIndex].id]: String.fromCharCode(65 + optionIndex) }));

        if (currentQuestionIndex < mockQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      }

      if (e.key === 'ArrowRight' && currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }

      if (e.key === 'Escape') {
        handleSubmitExam();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isExamActive, currentQuestionIndex]);

  const handleStartExam = () => {
    setIsExamActive(true);
    setTimeRemaining(30 * 60); // 30 minutes
    setAnswers({});
    setCurrentQuestionIndex(0);
    setView('exam');
    toast({ description: 'Exam started. Press A/B/C/D to answer.' });
  };

  const handleSubmitExam = async () => {
    gradeMutation.mutate({
      questions: mockQuestions,
      answers,
    });
    setIsExamActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Results view
  if (view === 'results' && examResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              Exam Results - LEARNORY
            </h1>
            <Badge className="px-4 py-2 text-lg">{examResult.score}%</Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Score</p>
              <p className="text-3xl font-bold text-green-600">{examResult.score}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Strong Topics</p>
              <p className="text-sm">{examResult.strongTopics?.join(', ') || 'None'}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Weak Topics</p>
              <p className="text-sm text-red-600">{examResult.weakTopics?.join(', ') || 'None'}</p>
            </Card>
          </div>

          <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-950">
            <p className="text-lg font-bold mb-2">Recommendations</p>
            <ul className="space-y-2">
              {examResult.recommendations?.map((rec: string, idx: number) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex gap-4">
            <Button onClick={() => { setView('dashboard'); setExamResult(null); }} className="flex-1">
              Back to Dashboard
            </Button>
            <Button onClick={() => setView('history')} variant="outline" className="flex-1">
              View History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // History view
  if (view === 'history') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-8">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => setView('dashboard')} variant="outline" className="mb-8">← Back</Button>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-8">
            <History className="w-10 h-10" />
            Exam History
          </h1>

          {examHistory?.length ? (
            <div className="space-y-4">
              {examHistory.map((exam: any) => (
                <Card key={exam.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{exam.examType} - {exam.subjects?.join(', ')}</p>
                      <p className="text-sm text-muted-foreground">{new Date(exam.createdAt).toLocaleDateString()}</p>
                      <p className="mt-2">{exam.summary}</p>
                    </div>
                    <Badge>{exam.score}%</Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No exam history yet</p>
          )}
        </div>
      </div>
    );
  }

  // Analytics view
  if (view === 'analytics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-8">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => setView('dashboard')} variant="outline" className="mb-8">← Back</Button>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-8">
            <TrendingUp className="w-10 h-10" />
            Performance Analytics
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            {analytics?.map((stat: any) => (
              <Card key={stat.id} className="p-6">
                <p className="font-bold">{stat.subject} - {stat.topic}</p>
                <p className="text-sm text-muted-foreground">Attempts: {stat.attemptCount}</p>
                <p className="text-2xl font-bold mt-2">{stat.averageScore}%</p>
                <Badge className="mt-2">{stat.strengthLevel}</Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Exam interface
  if (view === 'exam' && isExamActive) {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 text-white">
          <h1 className="text-2xl font-bold">LEARNORY CBT</h1>
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-mono text-red-500">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="flex gap-8 flex-1">
          <div className="w-32 bg-slate-800 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-2">
              {mockQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded text-xs font-bold ${
                    answers[q.id] ? 'bg-green-500 text-white' : currentQuestionIndex === idx ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {answers[q.id] ? '✓' : idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <Card className="bg-white dark:bg-slate-800 p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: String.fromCharCode(65 + idx) }));
                      if (currentQuestionIndex < mockQuestions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      answers[currentQuestion.id] === String.fromCharCode(65 + idx)
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + idx)}.</span> {option}
                  </button>
                ))}
              </div>
            </Card>

            <div className="flex gap-4">
              <Button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} variant="outline" className="flex-1">
                ← Previous
              </Button>
              <Button onClick={() => setCurrentQuestionIndex(Math.min(mockQuestions.length - 1, currentQuestionIndex + 1))} disabled={currentQuestionIndex === mockQuestions.length - 1} variant="outline" className="flex-1">
                Next →
              </Button>
              <Button onClick={handleSubmitExam} className="flex-1">Submit (ESC)</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-500" />
          LEARNORY CBT Mode
        </h1>
        <p className="text-muted-foreground mb-8">AI-Powered Exam Simulation with Gemini Grading</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Start Exam</h2>
            <p className="text-muted-foreground mb-6">Take a timed exam with real-time question tracking, Gemini-powered grading, and detailed analytics.</p>
            <Button onClick={handleStartExam} className="w-full text-lg py-6">Start Exam</Button>
          </Card>

          <div className="space-y-4">
            <Card className="p-6 cursor-pointer hover:bg-secondary" onClick={() => setView('history')}>
              <h3 className="font-bold mb-2 flex items-center gap-2"><History className="w-4 h-4" /> Exam History</h3>
              <p className="text-sm text-muted-foreground">{examHistory?.length || 0} exams completed</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:bg-secondary" onClick={() => setView('analytics')}>
              <h3 className="font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Analytics</h3>
              <p className="text-sm text-muted-foreground">View performance by topic</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
