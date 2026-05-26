import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Volume2, RotateCcw, ArrowRight, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const sampleQuestions = [
  {
    id: 1,
    type: 'Read Aloud',
    text: "The Industrial Revolution, which began in Britain in the late 18th century, marked a major turning point in human history. Almost every aspect of daily life was influenced in some way. In particular, average income and population began to exhibit unprecedented sustained growth.",
    prepTime: 40,
    recordTime: 40,
  },
  {
    id: 2,
    type: 'Read Aloud',
    text: "Climate change represents one of the most significant challenges facing humanity today. Rising global temperatures, melting ice caps, and extreme weather events are just some of the consequences of increased greenhouse gas emissions.",
    prepTime: 40,
    recordTime: 40,
  },
  {
    id: 3,
    type: 'Repeat Sentence',
    audioText: 'The university library will be closed for renovations next month.',
    prepTime: 3,
    recordTime: 15,
  },
  {
    id: 4,
    type: 'Describe Image',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600',
    prepTime: 25,
    recordTime: 40,
  },
];

export function SpeakingPractice() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState<'prep' | 'recording' | 'playback' | 'results'>('prep');
  const [timeLeft, setTimeLeft] = useState(sampleQuestions[0].prepTime);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [scores, setScores] = useState<any>(null);
  const timerRef = useRef<any>(null);

  const question = sampleQuestions[currentQuestion];

  useEffect(() => {
    setTimeLeft(question.prepTime);
    setPhase('prep');
    setIsRecording(false);
    setRecordedAudio(null);
    setScores(null);
  }, [currentQuestion]);

  useEffect(() => {
    if (phase === 'prep' || phase === 'recording') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (phase === 'prep') {
              setPhase('recording');
              setTimeLeft(question.recordTime);
              startRecording();
            } else if (phase === 'recording') {
              stopRecording();
              setPhase('playback');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [phase, question]);

  const startRecording = () => {
    setIsRecording(true);
    toast.success('Recording started');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordedAudio('mock-audio-url');
    toast.info('Recording stopped');

    // Mock AI evaluation
    setTimeout(() => {
      setScores({
        pronunciation: 85,
        fluency: 78,
        content: 82,
        overall: 82,
        feedback: [
          'Excellent pronunciation of complex words',
          'Maintain consistent pace throughout',
          'Good content coverage',
          'Work on pausing at appropriate points',
        ],
      });
    }, 2000);
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      toast.success('Practice session completed!');
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleReset = () => {
    setPhase('prep');
    setTimeLeft(question.prepTime);
    setIsRecording(false);
    setRecordedAudio(null);
    setScores(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Speaking Practice</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestion + 1} of {sampleQuestions.length}
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg font-semibold">
                  {question.type}
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                    {timeLeft}s
                  </div>
                  {phase === 'prep' && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">Preparation Time</div>
                  )}
                  {phase === 'recording' && (
                    <div className="flex items-center gap-2 text-red-500 animate-pulse">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-semibold">Recording</span>
                    </div>
                  )}
                </div>
              </div>

              {question.type === 'Read Aloud' && (
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg leading-relaxed">{question.text}</p>
                </div>
              )}

              {question.type === 'Repeat Sentence' && (
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <Volume2 className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Listen to the sentence and repeat it</p>
                  {phase === 'prep' && (
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Play className="inline-block h-5 w-5 mr-2" />
                      Play Audio
                    </button>
                  )}
                  {phase !== 'prep' && (
                    <div className="text-sm text-gray-500 italic">"{question.audioText}"</div>
                  )}
                </div>
              )}

              {question.type === 'Describe Image' && (
                <div className="space-y-4">
                  <img src={question.imageUrl} alt="Describe this" className="w-full rounded-lg" />
                  <p className="text-gray-600 dark:text-gray-400">Describe the image in detail</p>
                </div>
              )}

              {/* Recording Controls */}
              {phase === 'recording' && (
                <div className="mt-6 flex justify-center">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-full animate-pulse">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}

              {/* Playback */}
              {phase === 'playback' && recordedAudio && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                        <Play className="h-5 w-5" />
                      </button>
                      <div className="text-sm">
                        <div className="font-semibold">Your Recording</div>
                        <div className="text-gray-600 dark:text-gray-400">Click to play</div>
                      </div>
                    </div>
                    <button onClick={handleReset} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Evaluation */}
            {scores && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-6">AI Evaluation</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Pronunciation', score: scores.pronunciation, color: 'blue' },
                    { label: 'Fluency', score: scores.fluency, color: 'purple' },
                    { label: 'Content', score: scores.content, color: 'green' },
                    { label: 'Overall', score: scores.overall, color: 'orange' },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-3xl font-bold text-${item.color}-600 mb-1`}>{item.score}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {scores.feedback.map((item: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {index < 2 ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-4">Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">1.</span>
                  <span>Read/listen to the question carefully</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">2.</span>
                  <span>Use preparation time to plan your response</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">3.</span>
                  <span>Speak clearly when recording starts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">4.</span>
                  <span>Review AI feedback to improve</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-100 dark:border-gray-600">
              <h3 className="font-bold mb-3">💡 Quick Tip</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Maintain a steady pace and clear pronunciation. Don't rush through the content.
              </p>
            </div>

            {/* Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="inline-block h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Next
                  <ArrowRight className="inline-block h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
