import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Monitor, Keyboard, MousePointer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EXAM_TYPES = [
  { id: 'jamb', label: 'JAMB UTME' },
  { id: 'waec', label: 'WAEC' },
  { id: 'neco', label: 'NECO' },
];

const SUBJECTS: Record<string, string[]> = {
  jamb: ['English', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Government'],
  waec: ['English', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Government'],
  neco: ['English', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Government'],
};

const DURATIONS = [
  { id: '30', label: '30 minutes' },
  { id: '60', label: '1 hour' },
  { id: '120', label: '2 hours' },
  { id: '180', label: '3 hours (Full Exam)' },
];

export default function CBTMode() {
  const { toast } = useToast();
  const [examType, setExamType] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [isExamActive, setIsExamActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mock data for questions
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
    },
  ];

  useEffect(() => {
    if (isExamActive && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isExamActive && timeRemaining === 0) {
      handleEndExam();
    }
  }, [isExamActive, timeRemaining]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleStartExam = () => {
    if (!examType || selectedSubjects.length === 0 || !duration) {
      toast({ title: 'Error', description: 'Please select exam type, subjects, and duration', variant: 'destructive' });
      return;
    }
    setTimeRemaining(parseInt(duration) * 60);
    setIsExamActive(true);
    toast({ title: 'Exam Started', description: 'Good luck!' });
  };

  const handleEndExam = () => {
    setIsExamActive(false);
    toast({ title: 'Exam Ended', description: 'Your answers have been submitted' });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dashboard
  if (!isExamActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Monitor className="w-10 h-10 text-blue-400" />
            CBT Mode - Exam Simulation
          </h1>
          <p className="text-slate-300 mb-8">Realistic computer-based testing experience</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Exam Configuration</h2>

              {/* Exam Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Exam Type</label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {EXAM_TYPES.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id} className="text-white">
                        {exam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Duration
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {DURATIONS.map((dur) => (
                      <SelectItem key={dur.id} value={dur.id} className="text-white">
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-3">Subjects</label>
                <div className="space-y-2">
                  {examType && SUBJECTS[examType]?.map((subject) => (
                    <label key={subject} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-slate-700/50">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-slate-300">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartExam}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                data-testid="button-start-exam"
              >
                Start Exam
              </Button>
            </Card>

            {/* Info Panel */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Realistic Testing Environment</h3>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex gap-3">
                  <Monitor className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Realistic computer monitor display</span>
                </li>
                <li className="flex gap-3">
                  <Keyboard className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Interactive keyboard for answers</span>
                </li>
                <li className="flex gap-3">
                  <MousePointer className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Mouse control simulation</span>
                </li>
                <li className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Automatic timeout on timer expiration</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Exam Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        {/* Monitor Frame */}
        <div className="bg-gradient-to-b from-slate-900 to-black rounded-xl shadow-2xl p-1">
          {/* Monitor Bezel */}
          <div className="bg-slate-700 rounded-lg p-6">
            {/* Screen Content */}
            <div className="bg-white rounded-lg p-8 min-h-96 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-200">
                <span className="text-lg font-bold text-slate-700">
                  Question {currentQuestion + 1} of {mockQuestions.length}
                </span>
                <span className="text-2xl font-bold text-red-600" data-testid="text-timer">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <div className="mb-8">
                <p className="text-xl font-semibold text-slate-800 mb-6">
                  {mockQuestions[currentQuestion]?.question}
                </p>

                <div className="space-y-3">
                  {mockQuestions[currentQuestion]?.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option.id}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="ml-4 text-lg text-slate-700">
                        <strong>{option.id}.</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  variant="outline"
                  disabled={currentQuestion === 0}
                  data-testid="button-previous"
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setCurrentQuestion(Math.min(mockQuestions.length - 1, currentQuestion + 1))
                  }
                  disabled={currentQuestion === mockQuestions.length - 1}
                  data-testid="button-next"
                >
                  Next
                </Button>
                <Button
                  onClick={handleEndExam}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-submit-exam"
                >
                  Submit Exam
                </Button>
              </div>
            </div>
          </div>

          {/* Monitor Stand */}
          <div className="h-8 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-lg flex items-center justify-center">
            <div className="w-32 h-2 bg-slate-600 rounded"></div>
          </div>
        </div>

        {/* Keyboard and Mouse */}
        <div className="mt-8 flex justify-between items-end">
          {/* Keyboard */}
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-xs text-slate-400">
                K
              </div>
            ))}
          </div>

          {/* Mouse */}
          <div className="relative w-16 h-10 bg-slate-700 rounded-full border-2 border-slate-600 flex items-center justify-center cursor-move">
            <div
              className="absolute w-2 h-2 bg-red-500 rounded-full"
              style={{
                transform: `translate(${(mousePos.x % 200) - 100}px, ${(mousePos.y % 100) - 50}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
