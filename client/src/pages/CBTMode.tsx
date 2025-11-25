import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Monitor, Volume2 } from 'lucide-react';
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

// Complete QWERTY keyboard layout
const KEYBOARD_ROWS = [
  { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], label: 'Numbers' },
  { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], label: 'QWERTY' },
  { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], label: 'ASDFGH...' },
  { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], label: 'ZXCVBN...' },
  { keys: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'], label: 'Symbols' },
];

const mockQuestions = [
  {
    id: '1',
    subject: 'English',
    number: 1,
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
    number: 2,
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

export default function CBTMode() {
  const { toast } = useToast();
  const [examType, setExamType] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [isExamActive, setIsExamActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('');
  const [keyPressedTime, setKeyPressedTime] = useState(0);
  const monitorRef = useRef<HTMLDivElement>(null);

  // Timer countdown
  useEffect(() => {
    if (isExamActive && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isExamActive && timeRemaining === 0) {
      handleEndExam();
    }
  }, [isExamActive, timeRemaining]);

  // Track mouse position
  useEffect(() => {
    if (!isExamActive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isExamActive]);

  // Handle keyboard input
  useEffect(() => {
    if (!isExamActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      setLastKeyPressed(key);
      setKeyPressedTime(Date.now());

      // A, B, C, D for answer selection
      if (['A', 'B', 'C', 'D'].includes(key)) {
        setSelectedAnswer(key);
        toast({ title: `Answer Selected: ${key}`, description: 'Press Arrow Keys to navigate' });
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowRight') {
        setCurrentQuestion(Math.min(mockQuestions.length - 1, currentQuestion + 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentQuestion(Math.max(0, currentQuestion - 1));
      }

      // ESC to end exam
      if (e.key === 'Escape') {
        handleEndExam();
      }

      // Prevent default behavior for controlled keys
      if (['A', 'B', 'C', 'D', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(key) || e.key.startsWith('Arrow')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isExamActive, currentQuestion]);

  // Clear last key after animation
  useEffect(() => {
    if (keyPressedTime === 0) return;
    const timer = setTimeout(() => setLastKeyPressed(''), 300);
    return () => clearTimeout(timer);
  }, [keyPressedTime]);

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
    setSelectedAnswer(null);
    setCurrentQuestion(0);
    toast({ title: 'Exam Started', description: 'Use A, B, C, D keys to answer • Arrow keys to navigate • ESC to end' });
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
          <p className="text-slate-300 mb-8">Realistic computer-based testing with keyboard & mouse control</p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Exam Configuration</h2>

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

            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex gap-3">
                  <Monitor className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span><strong>Monitor is NOT touchscreen</strong> - use keyboard & mouse only</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 text-blue-400 flex-shrink-0 font-bold">⌨️</span>
                  <span><strong>Press A, B, C, D</strong> to select answers</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 text-blue-400 flex-shrink-0 font-bold">⬅️➡️</span>
                  <span><strong>Arrow keys</strong> to navigate questions</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 text-blue-400 flex-shrink-0 font-bold">🖱️</span>
                  <span><strong>Mouse position</strong> tracked (visualization only)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 text-blue-400 flex-shrink-0 font-bold">ESC</span>
                  <span><strong>Press ESC</strong> to end exam</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        {/* Monitor Frame */}
        <div className="w-full max-w-5xl">
          <div className="bg-gradient-to-b from-slate-800 to-black rounded-2xl shadow-2xl p-2 border-4 border-slate-700">
            {/* Monitor Bezel */}
            <div className="bg-slate-600 rounded-xl p-6">
              {/* Screen Content - NO TOUCH SCREEN */}
              <div 
                ref={monitorRef}
                className="bg-white rounded-lg p-8 min-h-96 shadow-xl cursor-default"
                style={{ pointerEvents: 'none' }} // Disable all pointer events on monitor
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-300">
                  <span className="text-lg font-bold text-slate-700" data-testid="text-question-number">
                    Question {currentQuestion + 1} of {mockQuestions.length}
                  </span>
                  <span className="text-3xl font-bold text-red-600 tabular-nums" data-testid="text-timer">
                    {formatTime(timeRemaining)}
                  </span>
                </div>

                <div className="mb-8">
                  <p className="text-xl font-semibold text-slate-800 mb-8">
                    {mockQuestions[currentQuestion]?.question}
                  </p>

                  <div className="space-y-4">
                    {mockQuestions[currentQuestion]?.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center p-4 border-3 rounded-lg font-medium text-lg transition-all ${
                          selectedAnswer === option.id
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-700 text-white mr-4 font-bold flex-shrink-0">
                          {option.id}
                        </span>
                        <span>{option.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-sm text-slate-500">
                  Press A, B, C, or D to select • Use Arrow Keys to navigate
                </div>
              </div>
            </div>

            {/* Monitor Stand */}
            <div className="h-6 bg-gradient-to-b from-slate-600 to-slate-700 rounded-b-xl flex items-center justify-center">
              <div className="w-40 h-2 bg-slate-500 rounded"></div>
            </div>
          </div>

          {/* Keyboard */}
          <div className="mt-8 bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-xl border-2 border-slate-700 shadow-2xl">
            <div className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
              <span className="text-base">⌨️ KEYBOARD</span>
              {lastKeyPressed && (
                <span className="ml-auto bg-green-500 px-3 py-1 rounded text-white text-sm animate-pulse">
                  Last Key: {lastKeyPressed}
                </span>
              )}
            </div>

            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 mb-3 justify-center">
                {row.keys.map((key) => (
                  <button
                    key={key}
                    className={`w-10 h-10 rounded font-bold text-xs transition-all transform ${
                      lastKeyPressed === key
                        ? 'bg-green-500 scale-95 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:scale-95'
                    }`}
                    onMouseDown={() => {
                      setLastKeyPressed(key);
                      if (['A', 'B', 'C', 'D'].includes(key)) {
                        setSelectedAnswer(key);
                      }
                    }}
                    onMouseUp={() => setLastKeyPressed('')}
                    data-testid={`key-${key}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Mouse Visualization */}
          <div className="mt-6 flex gap-4 items-center justify-center">
            <div className="text-slate-300 text-sm font-semibold">🖱️ Mouse Position:</div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-mono">
              X: {mousePos.x} | Y: {mousePos.y}
            </div>
            <Button
              onClick={handleEndExam}
              className="ml-auto bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-end-exam"
            >
              ESC - End Exam
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
