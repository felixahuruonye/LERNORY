import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

const EXAM_TYPES = [
  { id: 'jamb', label: 'JAMB UTME' },
  { id: 'waec', label: 'WAEC' },
  { id: 'neco', label: 'NECO' },
  { id: 'sat', label: 'SAT' },
  { id: 'gre', label: 'GRE' },
  { id: 'gmat', label: 'GMAT' },
];

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  jamb: ['English', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Government'],
  waec: ['English', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Government'],
  neco: ['English', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Government'],
  sat: ['Math', 'Reading', 'Writing'],
  gre: ['Verbal', 'Quantitative', 'Analytical'],
  gmat: ['Verbal', 'Quantitative', 'Analytical', 'Integrated Reasoning'],
};

const mockQuestions = [
  {
    id: '1',
    subject: 'English',
    question: 'Which of the following is a synonym for "ubiquitous"?',
    options: [
      { id: 'A', text: 'Rare and uncommon' },
      { id: 'B', text: 'Present everywhere' },
      { id: 'C', text: 'Difficult to understand' },
      { id: 'D', text: 'Unique and special' },
    ],
    correct: 'B',
    explanation: 'Ubiquitous means present, appearing, or found everywhere. The correct answer is B.',
  },
  {
    id: '2',
    subject: 'Mathematics',
    question: 'What is the derivative of x² + 3x + 5?',
    options: [
      { id: 'A', text: '2x + 3' },
      { id: 'B', text: 'x + 3' },
      { id: 'C', text: '2x² + 3' },
      { id: 'D', text: 'x² + 3' },
    ],
    correct: 'A',
    explanation: 'Using power rule: d/dx(x²) = 2x, d/dx(3x) = 3, d/dx(5) = 0. Result: 2x + 3',
  },
  {
    id: '3',
    subject: 'Physics',
    question: 'What is the SI unit of force?',
    options: [
      { id: 'A', text: 'Kilogram' },
      { id: 'B', text: 'Newton' },
      { id: 'C', text: 'Pascal' },
      { id: 'D', text: 'Joule' },
    ],
    correct: 'B',
    explanation: 'The SI unit of force is Newton (N), defined as kg⋅m/s².',
  },
  {
    id: '4',
    subject: 'Chemistry',
    question: 'What is the atomic number of Carbon?',
    options: [
      { id: 'A', text: '4' },
      { id: 'B', text: '6' },
      { id: 'C', text: '8' },
      { id: 'D', text: '12' },
    ],
    correct: 'B',
    explanation: 'Carbon has atomic number 6, with electron configuration 1s²2s²2p².',
  },
  {
    id: '5',
    subject: 'Biology',
    question: 'Which organelle is the powerhouse of the cell?',
    options: [
      { id: 'A', text: 'Nucleus' },
      { id: 'B', text: 'Ribosome' },
      { id: 'C', text: 'Mitochondria' },
      { id: 'D', text: 'Golgi apparatus' },
    ],
    correct: 'C',
    explanation: 'Mitochondria produces ATP through cellular respiration, powering cellular functions.',
  },
];

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    correct: boolean;
    explanation: string;
  }>;
  summary: string;
}

export default function CBTMode() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examType, setExamType] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [isExamActive, setIsExamActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const startTime = new Date();

  // Timer
  useEffect(() => {
    if (isExamActive && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isExamActive && timeRemaining === 0) {
      handleEndExam();
    }
  }, [isExamActive, timeRemaining]);

  // Keyboard input - A/B/C/D auto-advances to next question
  useEffect(() => {
    if (!isExamActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key)) {
        setAnswers((prev) => ({ ...prev, [mockQuestions[currentQuestionIndex].id]: key }));
        toast({ description: `Answer selected: ${key}` });

        // Auto-advance to next question
        if (currentQuestionIndex < mockQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          handleEndExam();
        }
        e.preventDefault();
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowRight' && currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        e.preventDefault();
      }

      // ESC to end exam
      if (e.key === 'Escape') {
        handleEndExam();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isExamActive, currentQuestionIndex]);

  const handleStartExam = () => {
    if (!examType || selectedSubjects.length === 0 || !duration) {
      toast({
        title: 'Error',
        description: 'Please select exam type, subjects, and duration',
        variant: 'destructive',
      });
      return;
    }
    setTimeRemaining(parseInt(duration) * 60);
    setIsExamActive(true);
    setAnswers({});
    setCurrentQuestionIndex(0);
    toast({ description: 'Exam started. Press A/B/C/D to answer. Arrow keys to navigate. ESC to end.' });
  };

  const handleEndExam = () => {
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    let correctCount = 0;
    const resultAnswers = mockQuestions.map((q) => {
      const isCorrect = answers[q.id] === q.correct;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        userAnswer: answers[q.id] || 'N/A',
        correct: isCorrect,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correctCount / mockQuestions.length) * 100);

    setExamResult({
      totalQuestions: mockQuestions.length,
      correctAnswers: correctCount,
      score,
      timeSpent,
      answers: resultAnswers,
      summary: `You scored ${score}% (${correctCount}/${mockQuestions.length} correct). Time spent: ${Math.floor(timeSpent / 60)} minutes.`,
    });

    setIsExamActive(false);

    // Store exam result in memory
    if (user?.id) {
      apiRequest('POST', '/api/memory/preferences', {
        categoryId: 'exam_history',
        itemKey: 'latest_exam',
        value: JSON.stringify({
          exam: examType,
          subjects: selectedSubjects,
          score,
          date: new Date().toISOString(),
        }),
      }).catch(console.error);
    }

    toast({ title: 'Exam Completed!', description: `Your score: ${score}%` });
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Exam Result Summary
  if (examResult && !isExamActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              Exam Summary - LEARNORY
            </h1>
            <Badge className="px-4 py-2 text-lg">{examResult.score}%</Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Score</p>
              <p className="text-3xl font-bold text-green-600">{examResult.score}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Correct Answers</p>
              <p className="text-3xl font-bold">{examResult.correctAnswers}/{examResult.totalQuestions}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Time Spent</p>
              <p className="text-3xl font-bold">{Math.floor(examResult.timeSpent / 60)} min</p>
            </Card>
          </div>

          <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">Analysis</p>
            <p className="text-blue-800 dark:text-blue-200 mt-2">{examResult.summary}</p>
          </Card>

          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Detailed Results
            </h2>
            {examResult.answers.map((answer, idx) => (
              <Card key={answer.questionId} className={`p-6 ${answer.correct ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${answer.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {answer.correct ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Question {idx + 1}: {mockQuestions[idx].question}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your answer: <strong>{answer.userAnswer}</strong>
                      {!answer.correct && <span className="text-red-600"> (Correct: {mockQuestions[idx].correct})</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{answer.explanation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={() => { setExamResult(null); setExamType(''); }} className="flex-1">
              Take Another Exam
            </Button>
            <Button onClick={() => setShowHistory(true)} variant="outline" className="flex-1">
              View History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Interface
  if (isExamActive) {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
          <h1 className="text-2xl font-bold">LEARNORY CBT</h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-mono font-bold text-red-500">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-sm">
              Progress: {answeredCount}/{mockQuestions.length}
            </div>
          </div>
        </div>

        <div className="flex gap-8 flex-1">
          {/* Question Tracker (Left Sidebar) */}
          <div className="w-32 bg-slate-800 rounded-lg p-4 overflow-y-auto">
            <p className="text-sm font-semibold text-slate-300 mb-4">Questions</p>
            <div className="grid grid-cols-4 gap-2">
              {mockQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                    answers[q.id]
                      ? 'bg-green-500 text-white'
                      : currentQuestionIndex === idx
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  data-testid={`btn-question-${idx + 1}`}
                >
                  {answers[q.id] ? '✓' : idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Question Card */}
            <Card className="bg-white dark:bg-slate-800 p-8 mb-6 min-h-96">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Question {currentQuestionIndex + 1} of {mockQuestions.length} • {currentQuestion.subject}
                </p>
                <h2 className="text-2xl font-bold">{currentQuestion.question}</h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion.id] === option.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.id }));
                      if (currentQuestionIndex < mockQuestions.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      }
                    }}
                    data-testid={`option-${option.id}`}
                  >
                    <p className="font-bold">{option.id}. {option.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="flex-1"
                data-testid="btn-previous"
              >
                ← Previous
              </Button>
              <Button
                onClick={() => setCurrentQuestionIndex(Math.min(mockQuestions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === mockQuestions.length - 1}
                variant="outline"
                className="flex-1"
                data-testid="btn-next"
              >
                Next →
              </Button>
              <Button onClick={handleEndExam} variant="destructive" className="flex-1" data-testid="btn-submit-exam">
                Submit Exam (ESC)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-500" />
          LEARNORY CBT Mode
        </h1>
        <p className="text-muted-foreground mb-8">Keyboard-only Computer-Based Testing. Press keys A-D to answer and auto-advance.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Configuration */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Exam Configuration</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Type</label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Subjects</label>
                {examType && SUBJECTS_BY_EXAM[examType]?.map((subject) => (
                  <label key={subject} className="flex items-center gap-3 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                    />
                    <span>{subject}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleStartExam} className="w-full text-lg py-6" data-testid="btn-start-exam">
                Start Exam
              </Button>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-100">How to Use</h3>
            <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-3">
                <span className="font-bold">⌨️</span>
                <span><strong>A, B, C, D:</strong> Select answer and auto-advance</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">⬅️➡️</span>
                <span><strong>Arrow keys:</strong> Navigate between questions</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">🟩</span>
                <span><strong>Green number:</strong> Question answered</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">⬜</span>
                <span><strong>Blank number:</strong> Question not answered</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">ESC</span>
                <span><strong>End exam:</strong> Submit and see results</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">📊</span>
                <span><strong>Summary:</strong> Gemini-powered analysis & explanations</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
