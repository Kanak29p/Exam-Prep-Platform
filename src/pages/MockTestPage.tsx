import { useState, useEffect, useRef } from 'react';
import { 
  Clock, Play, CheckCircle, AlertCircle, Trophy, TrendingUp, Calendar, 
  Download, Award, BookOpen, ArrowRight, ChevronRight, Loader2, ChevronLeft, 
  FileText, Check, XCircle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../lib/api';
import { AudioRecorder } from '../components/organisms/AudioRecorder';

// PTE canonical order definition for parts and timing
const SECTION_PARTS: Record<string, string> = {
  'speaking': 'Part 1: Speaking & Writing',
  'writing': 'Part 1: Speaking & Writing',
  'reading': 'Part 2: Reading',
  'listening': 'Part 3: Listening'
};

type Question = {
  ID: number;
  QUESTION_TEXT: string;
  AUDIO_URL?: string;
  IMAGE_URL?: string;
  OPTIONS?: string;
  INSTRUCTION?: string;
  TITLE?: string;
  CATEGORY: string;
  SUB_CATEGORY: string;
  AUDIO_WAITING_TIME?: number;
  RECORDING_WAITING_TIME?: number;
  RECORDING_TIME?: number;
  HAS_AUDIO?: boolean;
  NEXT_BUTTON_BEHAVIOR?: string;
  PATTERN_CATEGORY?: string;
  PATTERN_SUB_CATEGORY?: string;
};

type MockTest = {
  ID: number;
  TITLE: string;
  DESCRIPTION?: string;
  TOTAL_QUESTIONS: number;
  TOTAL_DURATION_MINUTES: number;
  STATUS: string;
};

function parseTimeToSeconds(val?: string | number, defaultSec = 40): number {
  if (val === undefined || val === null) return defaultSec;
  if (typeof val === 'number') return val;
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? defaultSec : parsed;
}

export function MockTestPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'completed'>('available');
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  
  // Backend lists and loading
  const [dbTests, setDbTests] = useState<MockTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Active exam attempts state
  const [pendingAttempts, setPendingAttempts] = useState<any[]>([]);
  const [completedAttempts, setCompletedAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);

  // Active exam state
  const [takingTest, setTakingTest] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Test Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // User answers and grades
  const [grades, setGrades] = useState<Record<number, { score: number; feedback: string; accuracy: number; userResponse: string }>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Speaking question states
  const [timerStage, setTimerStage] = useState<'idle' | 'audio-countdown' | 'audio-playing' | 'rec-countdown' | 'recording' | 'completed' | 'submitted'>('idle');
  const [countdownVal, setCountdownVal] = useState(0);
  const [triggerRecord, setTriggerRecord] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Writing states
  const [writingAnswer, setWritingAnswer] = useState('');
  const [writingWordCount, setWritingWordCount] = useState(0);

  // Reading & Listening states
  const [selectedSingle, setSelectedSingle] = useState('');
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [selectedReorder, setSelectedReorder] = useState<string[]>([]);
  const [selectedBlanks, setSelectedBlanks] = useState<string[]>([]);
  const [selectedIncorrectWord, setSelectedIncorrectWord] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [clickedWord, setClickedWord] = useState('');

  // Finished test report
  const [completedReport, setCompletedReport] = useState<any>(null);

  // Fetch mock tests from backend
  const fetchMockTests = async () => {
    try {
      setLoadingTests(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/mock-tests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDbTests(data);
      } else {
        toast.error('Failed to load mock tests from database.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to connect to backend.');
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      setLoadingAttempts(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/mock-tests/attempts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter((a: any) => a.STATUS === 'pending');
        const completed = data.filter((a: any) => a.STATUS === 'completed');
        setPendingAttempts(pending);
        setCompletedAttempts(completed);
      } else {
        toast.error('Failed to load test attempts.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to backend.');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const saveProgress = async (attemptId: string, currentIdxVal: number, timeRemainingVal: number, gradesVal: any) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/mock-tests/attempts/${attemptId}/progress`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentQuestionIndex: currentIdxVal,
          timeRemaining: timeRemainingVal,
          grades: gradesVal
        })
      });
    } catch (err) {
      console.error('Failed to save progress to backend:', err);
    }
  };

  const handleResumeAttempt = (attempt: any) => {
    const mockTestObj = dbTests.find(t => t.ID === attempt.MOCK_TEST_ID) || {
      ID: attempt.MOCK_TEST_ID,
      TITLE: attempt.TITLE,
      DESCRIPTION: attempt.DESCRIPTION,
      TOTAL_QUESTIONS: attempt.TOTAL_QUESTIONS,
      TOTAL_DURATION_MINUTES: attempt.TOTAL_DURATION_MINUTES,
      STATUS: 'active'
    };
    
    setSelectedTest(mockTestObj);
    setCurrentAttemptId(attempt.ID);
    setQuestions(JSON.parse(attempt.QUESTIONS));
    setCurrentIdx(attempt.CURRENT_QUESTION_INDEX);
    setTimeRemaining(attempt.TIME_REMAINING);
    setGrades(JSON.parse(attempt.GRADES));
    setTakingTest(true);
    setIsTimerActive(true);
    toast.success(`Resumed ${attempt.TITLE} from question ${attempt.CURRENT_QUESTION_INDEX + 1}.`);
  };

  const handleViewReport = (attempt: any) => {
    const parsedQuestions = JSON.parse(attempt.QUESTIONS);
    const parsedGrades = JSON.parse(attempt.GRADES);
    setCompletedReport({
      title: attempt.TITLE,
      totalQuestions: parsedQuestions.length,
      overallScore: attempt.OVERALL_SCORE,
      speakingScore: attempt.SPEAKING_SCORE,
      writingScore: attempt.WRITING_SCORE,
      readingScore: attempt.READING_SCORE,
      listeningScore: attempt.LISTENING_SCORE,
      date: new Date(attempt.CREATED_AT || attempt.UPDATED_AT).toLocaleDateString(),
      details: parsedQuestions.map((q: any, idx: number) => ({
        title: q.TITLE || `${q.SUB_CATEGORY} Exercise`,
        category: q.CATEGORY,
        subCategory: q.SUB_CATEGORY,
        userResponse: parsedGrades[idx]?.userResponse || 'No response',
        correctAnswer: q.CORRECT_ANSWER || 'N/A',
        score: parsedGrades[idx]?.score || 10,
        feedback: parsedGrades[idx]?.feedback || 'No evaluation.'
      }))
    });
  };

  useEffect(() => {
    fetchMockTests();
    fetchAttempts();
  }, []);


  // Overall Test Countdown Timer
  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0) {
      if (isTimerActive && timeRemaining <= 0) {
        handleFinishTest(true); // Auto submit on timeout
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isTimerActive, timeRemaining]);

  // Speaking question preparation timer
  useEffect(() => {
    if (!takingTest || questions.length === 0) return;
    const currentQ = questions[currentIdx];
    
    // Normalize Category dynamically
    const catLower = currentQ?.CATEGORY?.toLowerCase() || '';
    const subCatLower = (currentQ?.SUB_CATEGORY || '').toLowerCase();
    let category = catLower;
    if (catLower === 'speaking & writing' || catLower === 'speaking' || catLower === 'writing') {
      if (subCatLower.includes('summarize written') || subCatLower.includes('essay')) {
        category = 'writing';
      } else {
        category = 'speaking';
      }
    }

    if (category !== 'speaking') return;

    let intervalId: any = null;

    if (timerStage === 'audio-countdown') {
      intervalId = setInterval(() => {
        setCountdownVal(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setTimerStage('audio-playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerStage === 'rec-countdown') {
      intervalId = setInterval(() => {
        setCountdownVal(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setTimerStage('recording');
            setTriggerRecord(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerStage, takingTest, questions, currentIdx]);

  // Audio Playback event
  useEffect(() => {
    if (timerStage === 'audio-playing' && audioPlayer) {
      audioPlayer.play().catch(err => {
        console.error('Audio playback error:', err);
        // Fallback to recording preparation if block occurs
        const currentQ = questions[currentIdx];
        const recWait = parseTimeToSeconds(currentQ?.RECORDING_WAITING_TIME, 5);
        setTimerStage('rec-countdown');
        setCountdownVal(recWait);
      });
    }
  }, [timerStage, audioPlayer]);

  // Initialize inputs/timers on question change
  useEffect(() => {
    if (!takingTest || questions.length === 0) return;
    const currentQ = questions[currentIdx];
    
    // Normalize Category
    const catLower = currentQ?.CATEGORY?.toLowerCase() || '';
    const subCat = (currentQ?.SUB_CATEGORY || '').toLowerCase();
    let category = catLower;
    if (catLower === 'speaking & writing' || catLower === 'speaking' || catLower === 'writing') {
      if (subCat.includes('summarize written') || subCat.includes('essay')) {
        category = 'writing';
      } else {
        category = 'speaking';
      }
    }

    // Reset Submission Status
    setIsSubmitted(!!grades[currentIdx]);

    // Reset Speaking States
    setTimerStage('idle');
    setCountdownVal(0);
    setTriggerRecord(false);

    if (category === 'speaking') {
      const audioWait = parseTimeToSeconds(currentQ?.AUDIO_WAITING_TIME, 0);
      const recWait = parseTimeToSeconds(currentQ?.RECORDING_WAITING_TIME, 5);

      if (currentQ.AUDIO_URL) {
        if (audioWait > 0) {
          setTimerStage('audio-countdown');
          setCountdownVal(audioWait);
        } else {
          setTimerStage('audio-playing');
        }
      } else {
        if (recWait > 0) {
          setTimerStage('rec-countdown');
          setCountdownVal(recWait);
        } else {
          setTimerStage('recording');
          setTriggerRecord(true);
        }
      }
    }

    // Reset Writing States
    setWritingAnswer('');
    setWritingWordCount(0);

    // Reset Reading & Listening States
    setSelectedSingle('');
    setSelectedMultiple([]);
    setSelectedReorder([]);
    setSelectedIncorrectWord('');
    setTypedAnswer('');
    setClickedWord('');

    if (subCat.includes('fill in')) {
      let passage = currentQ.QUESTION_TEXT;
      const quoteMatch = currentQ.QUESTION_TEXT.match(/"([^"]+)"/);
      if (quoteMatch) {
        passage = quoteMatch[1];
      } else {
        passage = currentQ.QUESTION_TEXT.replace(/^.*(?:options|Options):[^\n:]+:\s*/i, '');
      }
      const segments = passage.split(/_{2,}/);
      setSelectedBlanks(Array(segments.length - 1).fill(''));
    } else {
      setSelectedBlanks([]);
    }
  }, [currentIdx, takingTest, questions]);

  const handleStartTest = (test: MockTest) => {
    setSelectedTest(test);
    setShowStartModal(true);
  };

  const confirmStart = async () => {
    if (!selectedTest) return;
    setShowStartModal(false);
    setLoadingQuestions(true);
    setTakingTest(true);
    setGrades({});
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/mock-tests/attempts/${selectedTest.ID}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.questions || data.questions.length === 0) {
          toast.error('This mock test has no questions configured yet.');
          setTakingTest(false);
        } else {
          setCurrentAttemptId(data.id);
          setQuestions(data.questions);
          setCurrentIdx(0);
          setTimeRemaining(selectedTest.TOTAL_DURATION_MINUTES * 60);
          setIsTimerActive(true);
          toast.success(`Started ${selectedTest.TITLE}. Good luck!`);
        }
      } else {
        toast.error('Failed to generate mock test questions.');
        setTakingTest(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to backend.');
      setTakingTest(false);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Submit current answer to backend database to get grading
  const submitCurrentAnswer = async (): Promise<boolean> => {
    const currentQ = questions[currentIdx];
    
    // Normalize Category
    const catLower = currentQ.CATEGORY.toLowerCase();
    const subCat = (currentQ.SUB_CATEGORY || '').toLowerCase();
    let category = catLower;
    if (catLower === 'speaking & writing' || catLower === 'speaking' || catLower === 'writing') {
      if (subCat.includes('summarize written') || subCat.includes('essay')) {
        category = 'writing';
      } else {
        category = 'speaking';
      }
    }
    
    let answerText = '';
    let finalAudioUrl: string | null = null;

    if (category === 'speaking') {
      if (grades[currentIdx]) {
        setIsSubmitted(true);
        return true;
      }
      answerText = 'No spoken response recorded.';
    } else if (category === 'writing') {
      answerText = writingAnswer;
    } else {
      // Reading & Listening
      const isMcqSingle = subCat.includes('single') || subCat.includes('summary') || subCat.includes('missing word');
      const isMcqMultiple = subCat.includes('multiple') && !subCat.includes('single');
      const isReorder = subCat.includes('reorder');
      const isIncorrectWord = subCat.includes('incorrect word');
      const isFitb = subCat.includes('fill in');
      const isDictation = subCat.includes('dictation');
      const isSpokenSummary = subCat.includes('summarize spoken') || subCat.includes('summarize discussion');

      if (isMcqSingle) {
        answerText = selectedSingle;
      } else if (isMcqMultiple) {
        answerText = selectedMultiple.join(', ');
      } else if (isReorder) {
        const letters = selectedReorder.map(opt => opt.trim().substring(0, 1));
        answerText = letters.join(' → ');
      } else if (isIncorrectWord) {
        answerText = selectedIncorrectWord;
      } else if (isFitb) {
        answerText = selectedBlanks.join(', ');
      } else if (isDictation || isSpokenSummary) {
        answerText = typedAnswer;
      }
    }

    try {
      setSubmittingAnswer(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/questions/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: currentQ.ID,
          audioUrl: finalAudioUrl,
          answerText,
          score: 0,
          feedback: ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newGradeEntry = {
          score: data.score || 10,
          feedback: data.feedback || 'Answer recorded.',
          accuracy: data.accuracy !== undefined ? data.accuracy : 100,
          userResponse: answerText
        };
        
        setGrades(prev => {
          const nextGrades = { ...prev, [currentIdx]: newGradeEntry };
          if (currentAttemptId) {
            saveProgress(currentAttemptId, currentIdx, timeRemaining, nextGrades);
          }
          return nextGrades;
        });

        setIsSubmitted(true);
        toast.success('Answer locked and submitted successfully!');
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      if (currentAttemptId) {
        saveProgress(currentAttemptId, nextIdx, timeRemaining, grades);
      }
    } else {
      handleFinishTest(false);
    }
  };

  const handleFinishTest = async (timeOut = false) => {
    setIsTimerActive(false);
    setTakingTest(false);

    if (timeOut) {
      toast.info('Time limit reached! Submitting exam.');
    } else {
      toast.success('Mock test completed! Calculating score report...');
    }

    // Compile results & sub-scores
    let totalScore = 0;
    let speakingSum = 0, speakingCount = 0;
    let writingSum = 0, writingCount = 0;
    let readingSum = 0, readingCount = 0;
    let listeningSum = 0, listeningCount = 0;

    questions.forEach((q, idx) => {
      const g = grades[idx] || { score: 10, feedback: 'No response submitted.', accuracy: 0, userResponse: '' };
      totalScore += g.score;

      const catLower = q.CATEGORY.toLowerCase();
      const subCatLower = (q.SUB_CATEGORY || '').toLowerCase();
      let category = catLower;
      if (catLower === 'speaking & writing' || catLower === 'speaking' || catLower === 'writing') {
        if (subCatLower.includes('summarize written') || subCatLower.includes('essay')) {
          category = 'writing';
        } else {
          category = 'speaking';
        }
      }

      if (category === 'speaking' || q.PATTERN_CATEGORY?.toLowerCase() === 'speaking') {
        speakingSum += g.score;
        speakingCount++;
      } else if (category === 'writing' || q.PATTERN_CATEGORY?.toLowerCase() === 'writing') {
        writingSum += g.score;
        writingCount++;
      } else if (category === 'reading' || q.PATTERN_CATEGORY?.toLowerCase() === 'reading') {
        readingSum += g.score;
        readingCount++;
      } else if (category === 'listening' || q.PATTERN_CATEGORY?.toLowerCase() === 'listening') {
        listeningSum += g.score;
        listeningCount++;
      }
    });

    const averageScore = questions.length > 0 ? Math.round(totalScore / questions.length) : 10;
    const speakingAvg = speakingCount > 0 ? Math.round(speakingSum / speakingCount) : 10;
    const writingAvg = writingCount > 0 ? Math.round(writingSum / writingCount) : 10;
    const readingAvg = readingCount > 0 ? Math.round(readingSum / readingCount) : 10;
    const listeningAvg = listeningCount > 0 ? Math.round(listeningSum / listeningCount) : 10;

    setCompletedReport({
      title: selectedTest?.TITLE || 'PTE Mock Test',
      totalQuestions: questions.length,
      overallScore: averageScore,
      speakingScore: speakingAvg,
      writingScore: writingAvg,
      readingScore: readingAvg,
      listeningScore: listeningAvg,
      date: new Date().toLocaleDateString(),
      details: questions.map((q, idx) => ({
        title: q.TITLE || `${q.SUB_CATEGORY} Exercise`,
        category: q.CATEGORY,
        subCategory: q.SUB_CATEGORY,
        userResponse: grades[idx]?.userResponse || 'No response',
        correctAnswer: q.CORRECT_ANSWER || 'N/A',
        score: grades[idx]?.score || 10,
        feedback: grades[idx]?.feedback || 'No evaluation.'
      }))
    });

    if (currentAttemptId) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/mock-tests/attempts/${currentAttemptId}/submit`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grades: grades,
            overallScore: averageScore,
            speakingScore: speakingAvg,
            writingScore: writingAvg,
            readingScore: readingAvg,
            listeningScore: listeningAvg
          })
        });
        setCurrentAttemptId(null);
        fetchAttempts();
      } catch (err) {
        console.error('Failed to submit completed test attempt:', err);
      }
    }
  };

  const handleWritingChange = (val: string) => {
    setWritingAnswer(val);
    const words = val.trim().split(/\s+/).filter(Boolean);
    setWritingWordCount(words.length);
  };

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? hours.toString() + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Render question inputs depending on type
  const renderQuestionInputs = (q: Question) => {
    const catLower = q.CATEGORY.toLowerCase();
    const subCat = (q.SUB_CATEGORY || '').toLowerCase();
    let category = catLower;
    if (catLower === 'speaking & writing' || catLower === 'speaking' || catLower === 'writing') {
      if (subCat.includes('summarize written') || subCat.includes('essay')) {
        category = 'writing';
      } else {
        category = 'speaking';
      }
    }

    if (category === 'speaking') {
      return (
        <div className="space-y-4">
          {timerStage !== 'idle' && (
            <div className={`p-4 rounded-xl border transition-all duration-300 shadow-sm ${
              timerStage === 'recording'
                ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30'
                : timerStage === 'completed' || timerStage === 'submitted'
                ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      timerStage === 'recording' ? 'bg-red-400' : 'bg-green-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      timerStage === 'recording' ? 'bg-red-500' : 'bg-green-500'
                    }`}></span>
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                    {timerStage === 'audio-countdown' && 'Preparing Audio...'}
                    {timerStage === 'audio-playing' && 'Playing Question Audio...'}
                    {timerStage === 'rec-countdown' && 'Preparation Time...'}
                    {timerStage === 'recording' && 'Recording Active...'}
                    {timerStage === 'completed' && 'Recording Complete'}
                    {timerStage === 'submitted' && 'Answer Recorded'}
                  </span>
                </div>
                <div className="text-right">
                  {(timerStage === 'audio-countdown' || timerStage === 'rec-countdown') && (
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {countdownVal}s
                    </span>
                  )}
                  {timerStage === 'audio-playing' && (
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Listening</span>
                  )}
                  {timerStage === 'recording' && (
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 animate-pulse">Speak Now</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {q.IMAGE_URL && (
            <img
              src={q.IMAGE_URL}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `${import.meta.env.BASE_URL || '/'}statistical_chart.png`;
              }}
              className="rounded-lg max-w-full h-auto object-contain max-h-[300px] shadow-sm border border-gray-200 dark:border-gray-700 mb-4"
              alt="Speaking Prompt Visual"
            />
          )}

          {q.AUDIO_URL && (
            <audio
              ref={(el) => {
                if (el && audioPlayer !== el) setAudioPlayer(el);
              }}
              className="w-full max-w-md hidden"
              onEnded={() => {
                const recWait = parseTimeToSeconds(q.RECORDING_WAITING_TIME, 5);
                setTimerStage('rec-countdown');
                setCountdownVal(recWait);
              }}
            >
              <source src={q.AUDIO_URL} />
            </audio>
          )}

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/10">
            <AudioRecorder
              key={currentIdx}
              maxTimeSeconds={parseTimeToSeconds(q.RECORDING_TIME, 40)}
              autoStartRecording={triggerRecord}
              onRecordingStart={() => {
                setTimerStage('recording');
                setTriggerRecord(false);
              }}
              onRecordingComplete={() => {
                setTimerStage('completed');
              }}
              onUploadSuccess={async (url, transcript) => {
                setTimerStage('submitted');
                try {
                  setSubmittingAnswer(true);
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_BASE_URL}/api/questions/submit`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      questionId: q.ID,
                      audioUrl: url,
                      answerText: transcript,
                      score: 0,
                      feedback: ''
                    })
                  });

                  if (res.ok) {
                    const data = await res.json();
                    const newGradeEntry = {
                      score: data.score !== undefined ? data.score : 90,
                      feedback: data.feedback || 'Speech successfully recorded and evaluated.',
                      accuracy: data.accuracy !== undefined ? data.accuracy : 100,
                      userResponse: transcript
                    };
                    
                    setGrades(prev => {
                      const nextGrades = { ...prev, [currentIdx]: newGradeEntry };
                      if (currentAttemptId) {
                        saveProgress(currentAttemptId, currentIdx, timeRemaining, nextGrades);
                      }
                      return nextGrades;
                    });
                    
                    setIsSubmitted(true);
                    toast.success('Audio response submitted and graded successfully!');
                  } else {
                    toast.error('Failed to submit response to grading server.');
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Error submitting audio response.');
                } finally {
                  setSubmittingAnswer(false);
                }
              }}
            />
          </div>
        </div>
      );
    }

    if (category === 'writing') {
      const isSummary = subCat.includes('summarize') || subCat.includes('summary');
      const minWords = isSummary ? 5 : 200;
      const maxWords = isSummary ? 75 : 300;

      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Type response (Target: {minWords}-{maxWords} words):</span>
            <span className="font-semibold font-mono">Words: {writingWordCount}</span>
          </div>
          <textarea
            value={writingAnswer}
            onChange={(e) => handleWritingChange(e.target.value)}
            disabled={isSubmitted}
            className="w-full min-h-[220px] p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
            placeholder="Type your response here..."
          />
          <div className="flex gap-4 pt-2">
            {!isSubmitted ? (
              <button
                onClick={submitCurrentAnswer}
                disabled={submittingAnswer || writingWordCount === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-350 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </button>
            ) : (
              <span className="text-green-600 font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> Answer Submitted
              </span>
            )}
          </div>
        </div>
      );
    }

    // Reading & Listening renderers
    const isMcqSingle = subCat.includes('single') || subCat.includes('summary') || subCat.includes('missing word');
    const isMcqMultiple = subCat.includes('multiple') && !subCat.includes('single');
    const isReorder = subCat.includes('reorder');
    const isIncorrectWord = subCat.includes('incorrect word');
    const isFitb = subCat.includes('fill in');

    const getOptionText = (opt: any): string => {
      if (typeof opt === 'object' && opt !== null) {
        return opt.text || opt.label || JSON.stringify(opt);
      }
      return String(opt);
    };

    let parsedOptions: any[] = [];
    try {
      const parsed = typeof q.OPTIONS === 'string' ? JSON.parse(q.OPTIONS) : q.OPTIONS;
      if (Array.isArray(parsed)) parsedOptions = parsed;
      else if (typeof q.OPTIONS === 'string') parsedOptions = q.OPTIONS.split(',').map(o => o.trim());
    } catch (e) {
      if (typeof q.OPTIONS === 'string') parsedOptions = q.OPTIONS.split(',').map(o => o.trim());
    }

    if (isFitb) {
      let passage = q.QUESTION_TEXT;
      let options: string[] = [];
      
      const optMatch = q.QUESTION_TEXT.match(/(?:options|Options):\s*([^:\n)]+)/i);
      if (optMatch) {
        options = optMatch[1].split(',').map(o => o.trim().replace(/[")&]/g, ''));
      }

      if (options.length === 0 && q.OPTIONS) {
        try {
          const parsed = typeof q.OPTIONS === 'string' ? JSON.parse(q.OPTIONS) : q.OPTIONS;
          if (Array.isArray(parsed)) {
            options = parsed.map(o => typeof o === 'object' ? (o.text || o.label || JSON.stringify(o)) : String(o));
          } else if (typeof q.OPTIONS === 'string') {
            options = q.OPTIONS.split(',').map(o => o.trim());
          }
        } catch (e) {
          if (typeof q.OPTIONS === 'string') {
            options = q.OPTIONS.split(',').map(o => o.trim());
          }
        }
      }
      
      const quoteMatch = q.QUESTION_TEXT.match(/"([^"]+)"/);
      if (quoteMatch) {
        passage = quoteMatch[1];
      } else {
        passage = q.QUESTION_TEXT.replace(/^.*(?:options|Options):[^\n:]+:\s*/i, '');
      }

      const segments = passage.split(/_{2,}/);
      const isDragAndDropFitb = category === 'reading' && 
        (subCat.includes('reading: fill in') || (subCat.includes('reading fill in') && !subCat.includes('&')));
      const isDropdownFitb = category === 'reading' && !isDragAndDropFitb;

      return (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-800/10 leading-relaxed text-base text-gray-800 dark:text-gray-200">
            {segments.map((segment, index) => (
              <span key={index}>
                {segment}
                {index < segments.length - 1 && (
                  isDragAndDropFitb ? (
                    <span
                      onClick={() => {
                        if (isSubmitted) return;
                        if (clickedWord) {
                          const newBlanks = [...selectedBlanks];
                          newBlanks[index] = clickedWord;
                          setSelectedBlanks(newBlanks);
                          setClickedWord('');
                        } else if (selectedBlanks[index]) {
                          const newBlanks = [...selectedBlanks];
                          newBlanks[index] = '';
                          setSelectedBlanks(newBlanks);
                        }
                      }}
                      className={`mx-2 inline-block min-w-[100px] h-[28px] align-middle border-2 rounded-lg text-center leading-6 px-2 text-sm font-semibold transition-all cursor-pointer select-none ${
                        selectedBlanks[index]
                          ? 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-300'
                          : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white/50 dark:bg-gray-900/50'
                      }`}
                    >
                      {selectedBlanks[index] || ''}
                    </span>
                  ) : isDropdownFitb ? (
                    <select
                      value={selectedBlanks[index] || ''}
                      onChange={(e) => {
                        const newBlanks = [...selectedBlanks];
                        newBlanks[index] = e.target.value;
                        setSelectedBlanks(newBlanks);
                      }}
                      disabled={isSubmitted}
                      className="mx-2 px-2 py-0.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-sm disabled:opacity-75 font-medium"
                    >
                      <option value="">--Select--</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedBlanks[index] || ''}
                      onChange={(e) => {
                        const newBlanks = [...selectedBlanks];
                        newBlanks[index] = e.target.value;
                        setSelectedBlanks(newBlanks);
                      }}
                      disabled={isSubmitted}
                      className="mx-2 px-2 py-0.5 w-28 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 text-sm inline-block disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      placeholder={`Blank ${index + 1}`}
                    />
                  )
                )}
              </span>
            ))}
          </div>

          {isDragAndDropFitb && options.length > 0 && (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/10">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Click a word then click a blank box to place it:</p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const isPlaced = selectedBlanks.includes(opt);
                  const isSelected = clickedWord === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (!isPlaced && !isSubmitted) setClickedWord(isSelected ? '' : opt);
                      }}
                      disabled={isPlaced || isSubmitted}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all select-none ${
                        isPlaced
                          ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-750 dark:text-gray-600 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-105'
                          : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submission and checkmarks */}
          <div className="flex gap-4 pt-2">
            {!isSubmitted ? (
              <button
                onClick={submitCurrentAnswer}
                disabled={submittingAnswer}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </button>
            ) : (
              <span className="text-green-600 font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> Submitted!
              </span>
            )}
          </div>
        </div>
      );
    }

    if (isIncorrectWord) {
      const textMatch = q.QUESTION_TEXT.match(/Text:\s*"([^"]+)"/i);
      let transcript = '';
      if (textMatch) {
        transcript = textMatch[1];
      } else {
        transcript = q.QUESTION_TEXT.replace(/^Audio:[^Text]+Text:\s*/i, '').replace(/Which word is incorrect\??/i, '').replace(/"/g, '').trim();
      }

      const words = transcript.split(/\s+/);

      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Click on the word that differs from the audio to select it:</p>
          <div className="flex flex-wrap gap-x-2 gap-y-3 leading-relaxed text-base p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-800/10 shadow-sm text-gray-800 dark:text-gray-200 font-medium">
            {words.map((word, idx) => {
              const cleanW = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '').toLowerCase();
              const isSelected = selectedIncorrectWord === cleanW;
              return (
                <span
                  key={idx}
                  onClick={() => {
                    if (!isSubmitted) setSelectedIncorrectWord(cleanW);
                  }}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all font-medium select-none ${
                    isSelected
                      ? 'bg-yellow-200 text-gray-900 dark:bg-yellow-800 dark:text-white shadow-sm ring-1 ring-yellow-400'
                      : 'hover:bg-gray-200/50 dark:hover:bg-gray-750'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {/* Submission buttons */}
          <div className="flex gap-4 pt-2">
            {!isSubmitted ? (
              <button
                onClick={submitCurrentAnswer}
                disabled={submittingAnswer || !selectedIncorrectWord}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-350 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </button>
            ) : (
              <span className="text-green-600 font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> Submitted!
              </span>
            )}
          </div>
        </div>
      );
    }

    // Default MCQs / Dictations / Reorders
    const isDictation = subCat.includes('dictation');
    const isSpokenSummary = subCat.includes('summarize spoken') || subCat.includes('summarize discussion');

    return (
      <div className="space-y-4">
        {/* MCQ options */}
        {isMcqSingle && parsedOptions.length > 0 && (
          <div className="space-y-2">
            {parsedOptions.map((opt, i) => {
              const optText = getOptionText(opt);
              const isSelected = selectedSingle === optText;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!isSubmitted) setSelectedSingle(optText);
                  }}
                  className={`p-3 border rounded-xl flex items-center transition-all cursor-pointer text-sm ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-500 dark:bg-blue-950/20 dark:border-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                  } ${isSubmitted ? 'opacity-80 cursor-default' : ''}`}
                >
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 shrink-0 ${
                    isSelected ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <span>{optText}</span>
                </div>
              );
            })}
          </div>
        )}

        {isMcqMultiple && parsedOptions.length > 0 && (
          <div className="space-y-2">
            {parsedOptions.map((opt, i) => {
              const optText = getOptionText(opt);
              const isSelected = selectedMultiple.includes(optText);
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isSubmitted) return;
                    if (isSelected) setSelectedMultiple(selectedMultiple.filter(item => item !== optText));
                    else setSelectedMultiple([...selectedMultiple, optText]);
                  }}
                  className={`p-3 border rounded-xl flex items-center transition-all cursor-pointer text-sm ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-500 dark:bg-blue-950/20 dark:border-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                  } ${isSubmitted ? 'opacity-80 cursor-default' : ''}`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center mr-3 shrink-0 ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span>{optText}</span>
                </div>
              );
            })}
          </div>
        )}

        {isReorder && parsedOptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-semibold text-xs text-gray-500">Click to place order:</h5>
              {parsedOptions.filter(opt => !selectedReorder.includes(opt)).map((opt, i) => {
                const optText = getOptionText(opt);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isSubmitted) setSelectedReorder([...selectedReorder, opt]);
                    }}
                    disabled={isSubmitted}
                    className="w-full text-left p-3 border rounded-xl bg-white hover:bg-blue-50/20 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-xs leading-relaxed disabled:opacity-75 disabled:cursor-default"
                  >
                    {optText}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 border-l pl-4 border-gray-200 dark:border-gray-750">
              <h5 className="font-semibold text-xs text-gray-500">Ordered sequence (Click to remove):</h5>
              {selectedReorder.map((opt, i) => {
                const optText = getOptionText(opt);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isSubmitted) setSelectedReorder(selectedReorder.filter(item => item !== opt));
                    }}
                    disabled={isSubmitted}
                    className="w-full text-left p-3 border rounded-xl bg-blue-50/15 border-blue-300 dark:bg-blue-950/20 text-xs leading-relaxed flex gap-2 disabled:opacity-75 disabled:cursor-default"
                  >
                    <span className="font-bold text-blue-500 font-mono">{i + 1}.</span>
                    <span className="flex-1">{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(isDictation || isSpokenSummary) && (
          <div className="space-y-2">
            <textarea
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              disabled={isSubmitted}
              className="w-full min-h-[140px] p-4 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y text-sm font-sans disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
              placeholder="Type your transcription response here..."
            />
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex gap-4 pt-2">
          {!isSubmitted ? (
            <button
              onClick={submitCurrentAnswer}
              disabled={submittingAnswer || (isMcqSingle && !selectedSingle) || (isMcqMultiple && selectedMultiple.length === 0) || (isReorder && selectedReorder.length === 0) || ((isDictation || isSpokenSummary) && !typedAnswer.trim())}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-350 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-bold"
            >
              {submittingAnswer ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </button>
          ) : (
            <span className="text-green-600 font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> Submitted!
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render loading questions screen explicitly to prevent layout jumps and overlay everything
  if (loadingQuestions) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col items-center justify-center space-y-4 font-sans p-6">
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-2xl flex flex-col items-center space-y-6 max-w-sm w-full text-center">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin absolute" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Setting Up Your Test</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Fetching questions and setting up the exam workspace. Please wait...
            </p>
          </div>
        </div>
      </div>
    );
  }  const jumpToCategory = (cat: string) => {
    const idx = questions.findIndex(q => {
      const qCat = q.CATEGORY.toLowerCase();
      const qSub = (q.SUB_CATEGORY || '').toLowerCase();
      let normalizedCat = qCat;
      if (qCat === 'speaking & writing' || qCat === 'speaking' || qCat === 'writing') {
        if (qSub.includes('summarize written') || qSub.includes('essay')) {
          normalizedCat = 'writing';
        } else {
          normalizedCat = 'speaking';
        }
      }
      return normalizedCat === cat.toLowerCase();
    });
    if (idx !== -1) {
      setCurrentIdx(idx);
    } else {
      toast.info(`No questions in ${cat} category.`);
    }
  };

  const getGroupedQuestions = () => {
    const groups: Record<string, { q: Question; originalIdx: number }[]> = {
      speaking: [],
      writing: [],
      reading: [],
      listening: []
    };

    questions.forEach((q, idx) => {
      const qCat = q.CATEGORY.toLowerCase();
      const qSub = (q.SUB_CATEGORY || '').toLowerCase();
      let normalizedCat = qCat;
      if (qCat === 'speaking & writing' || qCat === 'speaking' || qCat === 'writing') {
        if (qSub.includes('summarize written') || qSub.includes('essay')) {
          normalizedCat = 'writing';
        } else {
          normalizedCat = 'speaking';
        }
      }
      if (groups[normalizedCat]) {
        groups[normalizedCat].push({ q, originalIdx: idx });
      }
    });

    return groups;
  };

  // Render taking test interface
  if (takingTest && questions.length > 0) {
    const q = questions[currentIdx];
    
    // Normalize Category on the frontend as well for robustness
    const catLower = q.CATEGORY.toLowerCase();
    const subCatLower = (q.SUB_CATEGORY || '').toLowerCase();
    let category = catLower;
    if (catLower === 'speaking & writing' || catLower === 'speaking' || catLower === 'writing') {
      if (subCatLower.includes('summarize written') || subCatLower.includes('essay')) {
        category = 'writing';
      } else {
        category = 'speaking';
      }
    }

    const isSpeaking = category === 'speaking';
    const isWriting = category === 'writing';
    const isReadingOrListening = category === 'reading' || category === 'listening';

    const grouped = getGroupedQuestions();

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col pt-16 font-sans">
        {/* Test Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {SECTION_PARTS[q.CATEGORY.toLowerCase()] || q.CATEGORY}
              </span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                {selectedTest?.TITLE}
              </h2>
            </div>
            
            {/* Top Navigation for Categories */}
            <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-850 p-1.5 rounded-xl border border-gray-200 dark:border-gray-750">
              {['Speaking', 'Writing', 'Reading', 'Listening'].map(cat => {
                const isCatActive = category === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => jumpToCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-blue-650 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center md:text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">Progress</span>
              <span className="text-sm font-bold text-gray-800 dark:text-white">
                Question {currentIdx + 1} of {questions.length}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-750" />
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-1 transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Main Workspace Layout with Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 md:p-6 gap-6 items-start">
          
          {/* Sidebar Question Navigation Panel */}
          <aside className="w-full lg:w-64 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-md shrink-0 space-y-5 lg:sticky lg:top-24">
            <div className="border-b dark:border-gray-800 pb-2">
              <h3 className="font-bold text-sm uppercase text-gray-400 tracking-wider">Exam Map</h3>
              <p className="text-[10px] text-gray-400 mt-1">Jump to any question instantly</p>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {Object.entries(grouped).map(([catName, list]) => {
                if (list.length === 0) return null;
                const answeredCount = list.filter(item => grades[item.originalIdx]).length;
                return (
                  <div key={catName} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider font-mono">
                      <span className="capitalize">{catName}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({answeredCount}/{list.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {list.map((item, idx) => {
                        const isCurrent = item.originalIdx === currentIdx;
                        const isAnswered = !!grades[item.originalIdx];
                        return (
                          <button
                            key={item.originalIdx}
                            onClick={() => setCurrentIdx(item.originalIdx)}
                            className={`h-8 w-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md ring-2 ring-blue-400 dark:ring-blue-500 scale-105'
                                : isAnswered
                                ? 'bg-green-500 text-white hover:bg-green-600 border border-green-500'
                                : 'bg-gray-50 hover:bg-gray-150 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 border border-gray-200 dark:border-gray-750'
                            }`}
                            title={`${item.q.SUB_CATEGORY} - Q${idx + 1}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div className="flex-1 w-full space-y-6">
            {isReadingOrListening ? (
              // RENDER READING OR LISTENING SINGLE COLUMN LAYOUT
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-md border border-gray-200 dark:border-gray-800 space-y-6">
                {/* Question Header */}
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                    {q.SUB_CATEGORY}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {q.TITLE}
                  </h3>
                </div>

                {/* Yellow Instruction Card */}
                {q.INSTRUCTION && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl">
                    <span className="font-bold text-yellow-800 dark:text-yellow-400 block text-sm mb-1">Instruction:</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {q.INSTRUCTION}
                    </p>
                  </div>
                )}

                {/* Question Text / Stimulus for non-FITB, non-Highlight Incorrect Word questions */}
                {!subCatLower.includes('fill in') && !subCatLower.includes('incorrect word') && q.QUESTION_TEXT && (
                  <div className="p-5 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/10 shadow-sm leading-relaxed text-base text-gray-800 dark:text-gray-200 font-medium">
                    {q.QUESTION_TEXT}
                  </div>
                )}

                {/* Audio controls if present */}
                {q.AUDIO_URL && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-750 flex flex-col space-y-2 max-w-md">
                    <span className="text-xs text-gray-405 font-bold font-mono">AUDIO PROMPT:</span>
                    <audio controls className="w-full">
                      <source src={q.AUDIO_URL} />
                    </audio>
                  </div>
                )}

                {/* Interactive question content & options */}
                <div className="pt-2">
                  {renderQuestionInputs(q)}
                </div>
              </div>
            ) : (
              // RENDER SPEAKING OR WRITING TWO COLUMN LAYOUT
              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Left panel - prompt instructions & text */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800 space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      {q.SUB_CATEGORY}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                      {q.TITLE}
                    </h3>
                  </div>

                  {q.INSTRUCTION && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl">
                      <span className="font-bold text-yellow-800 dark:text-yellow-400 block text-sm mb-1">Instruction:</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {q.INSTRUCTION}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-150 dark:border-gray-800 pt-4">
                    <h4 className="font-semibold text-gray-400 text-xs mb-2 uppercase font-mono">Question Text / Stimulus:</h4>
                    <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-sans font-medium">
                      {q.QUESTION_TEXT}
                    </p>
                  </div>
                </section>

                {/* Right panel - user answer inputs */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800 min-h-[300px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white border-b pb-2 dark:border-gray-855 font-sans">
                      Your Answer Response
                    </h3>
                    {renderQuestionInputs(q)}
                  </div>
                </section>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md">
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to quit the exam? Your progress will be saved, and you can resume it later.')) {
                    setIsTimerActive(false);
                    if (currentAttemptId) {
                      await saveProgress(currentAttemptId, currentIdx, timeRemaining, grades);
                    }
                    setTakingTest(false);
                    setCurrentAttemptId(null);
                    fetchAttempts();
                    toast.success('Progress saved. You can resume this exam anytime.');
                  }
                }}
                className="px-5 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Quit Test
              </button>
              
              <button
                onClick={handleNext}
                disabled={submittingAnswer}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold cursor-pointer"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Answer...
                  </>
                ) : (
                  <>
                    {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Test'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Render completed exam results dashboard
  if (completedReport) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500/10 h-64 w-64 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 bg-purple-500/10 h-64 w-64 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
            
            <div className="space-y-3 relative z-10 text-center md:text-left">
              <span className="px-3 py-1 bg-green-150 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                Exam Completed
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">{completedReport.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Completed on {completedReport.date} • Total Questions: {completedReport.totalQuestions}
              </p>
            </div>

            {/* Score Ring */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center h-36 w-36 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-1 shadow-lg shadow-blue-500/20 font-sans">
                <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold bg-gradient-to-tr from-blue-600 to-purple-600 bg-clip-text text-transparent font-mono">
                    {completedReport.overallScore}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mt-0.5">
                    PTE Score
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Sub-scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-sans">
            {[
              { label: 'Speaking', score: completedReport.speakingScore, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10' },
              { label: 'Writing', score: completedReport.writingScore, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10' },
              { label: 'Reading', score: completedReport.readingScore, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10' },
              { label: 'Listening', score: completedReport.listeningScore, color: 'text-green-600 bg-green-50 dark:bg-green-900/10' },
            ].map((sub, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md flex flex-col items-center justify-between text-center"
              >
                <span className="font-semibold text-gray-500 dark:text-gray-400 text-sm">{sub.label}</span>
                <div className={`mt-3 mb-2 h-16 w-16 rounded-2xl ${sub.color} flex items-center justify-center font-extrabold text-2xl font-mono`}>
                  {sub.score}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ 90 Marks</span>
              </div>
            ))}
          </div>

          {/* Detailed Question Review List */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Question Evaluation Report</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Review your detailed responses and scores for each exercise.</p>
            </div>

            <div className="divide-y divide-gray-150 dark:divide-gray-750">
              {completedReport.details.map((detail: any, idx: number) => {
                const isCorrect = detail.score >= 50;
                return (
                  <div key={idx} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-gray-400 text-sm font-mono">{idx + 1}.</span>
                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{detail.title}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-semibold rounded uppercase">
                          {detail.subCategory}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1 pl-6">
                        <p className="text-gray-500 dark:text-gray-400">
                          <strong className="text-gray-700 dark:text-gray-300 font-semibold font-mono">Response: </strong> 
                          <span className="font-medium italic">{detail.userResponse || <span className="text-red-400 font-bold">Unanswered</span>}</span>
                        </p>
                        {detail.correctAnswer && detail.correctAnswer !== 'N/A' && (
                          <p className="text-green-600 dark:text-green-400">
                            <strong className="text-green-700 dark:text-green-500 font-semibold font-mono">Correct Answer: </strong> 
                            <span className="font-semibold">{detail.correctAnswer}</span>
                          </p>
                        )}
                        <p className="text-gray-650 dark:text-gray-400 leading-relaxed pl-2 border-l border-gray-200 dark:border-gray-700 italic">
                          {detail.feedback}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pl-6 md:pl-0 shrink-0">
                      <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700">
                        <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">{detail.score}</span>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Points</span>
                      </div>
                      {isCorrect ? (
                        <Check className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setCompletedReport(null)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all font-bold"
            >
              Return to Mock Tests
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Filtered available tests
  const filteredTests = dbTests.filter(test => {
    return activeTab === 'available' ? test.STATUS === 'active' : false;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 animate-in slide-in-from-top duration-300">Mock Tests</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Take full-length practice exams to prepare for your PTE test.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 font-sans">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <Trophy className="h-8 w-8 text-yellow-500 mb-3" />
            <div className="text-3xl font-bold mb-1">82</div>
            <div className="text-gray-650 dark:text-gray-450 text-sm">Best Overall Score</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
            <div className="text-3xl font-bold mb-1">1</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Completed Tests</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <TrendingUp className="h-8 w-8 text-blue-500 mb-3" />
            <div className="text-3xl font-bold mb-1">+4</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Target Improvement</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <Clock className="h-8 w-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold mb-1">2h</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Time Practiced</div>
          </div>
        </div>

        {/* Main List Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden font-sans">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === 'available'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/5 dark:bg-blue-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Available Exams
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/5 dark:bg-blue-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Pending Exams
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/5 dark:bg-blue-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Completed Attempts
            </button>
          </div>

          <div className="p-6">
            {loadingTests || loadingAttempts ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <span className="text-sm font-semibold text-gray-500">Querying database...</span>
              </div>
            ) : activeTab === 'available' ? (
              filteredTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No mock tests available</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">No configured tests found in the database. Please contact your database administrator to insert rows into MOCK_TESTS.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTests.map((test) => (
                    <div
                      key={test.ID}
                      className="p-6 border border-gray-250 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all bg-white dark:bg-gray-900/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{test.TITLE}</h3>
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/20 text-purple-600 uppercase tracking-wider">
                              Full Length
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                            {test.DESCRIPTION || 'Perform a mock examination to test Speaking, Writing, Reading, and Listening.'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{test.TOTAL_DURATION_MINUTES} Minutes</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span>{test.TOTAL_QUESTIONS} Questions Patterned</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartTest(test)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Play className="h-4 w-4 shrink-0" />
                          Start Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'pending' ? (
              pendingAttempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No pending tests</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">You do not have any incomplete mock tests. Start a test under the "Available Exams" tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAttempts.map((attempt) => {
                    const answeredCount = Object.keys(JSON.parse(attempt.GRADES || '{}')).length;
                    const totalQ = attempt.TOTAL_QUESTIONS;
                    return (
                      <div
                        key={attempt.ID}
                        className="p-6 border border-gray-250 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all bg-white dark:bg-gray-900/50"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{attempt.TITLE}</h3>
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 uppercase tracking-wider">
                                In Progress
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                              {attempt.DESCRIPTION || 'Perform a mock examination to test Speaking, Writing, Reading, and Listening.'}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{Math.round(attempt.TIME_REMAINING / 60)} Minutes Left</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-medium">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span>{answeredCount} of {totalQ} Questions Answered</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleResumeAttempt(attempt)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Play className="h-4 w-4 shrink-0" />
                            Resume Test
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              completedAttempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No completed attempts</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">You have not completed any mock tests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedAttempts.map((attempt) => (
                    <div
                      key={attempt.ID}
                      className="p-6 border border-gray-250 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all bg-white dark:bg-gray-900/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{attempt.TITLE}</h3>
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/20 text-green-600 uppercase tracking-wider">
                              Completed
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-550 dark:text-gray-400 pt-1">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{new Date(attempt.UPDATED_AT || attempt.CREATED_AT).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Award className="h-4 w-4 text-gray-400" />
                              <span>Overall Score: <strong>{attempt.OVERALL_SCORE}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium text-xs font-semibold text-blue-600 dark:text-blue-400">
                              <span>S: {attempt.SPEAKING_SCORE} | W: {attempt.WRITING_SCORE} | R: {attempt.READING_SCORE} | L: {attempt.LISTENING_SCORE}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewReport(attempt)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Start Test Confirmation Modal */}
      {showStartModal && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="bg-white dark:bg-gray-850 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-4 tracking-tight text-gray-805 dark:text-white">Start Examination</h2>
            
            <div className="space-y-4 mb-6">
              <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-900/30">
                <h3 className="font-extrabold text-blue-800 dark:text-blue-400 mb-2">{selectedTest.TITLE}</h3>
                <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Allocated Duration: {selectedTest.TOTAL_DURATION_MINUTES} Minutes
                  </li>
                  <li className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Target Question Set: {selectedTest.TOTAL_QUESTIONS} questions
                  </li>
                  <li className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Standard PTE Sequence Enforcement
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-200/50 dark:border-yellow-900/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-650 dark:text-gray-400 font-medium leading-relaxed">
                    Ensure a quiet, distraction-free environment and that your microphone is configured properly. Once initiated, the exam timer cannot be paused.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 px-5 py-3 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
