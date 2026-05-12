import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Clock, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const writingQuestions = [
  {
    id: 1,
    type: 'Summarize Written Text',
    text: "Artificial Intelligence has revolutionized numerous industries, from healthcare to finance. Machine learning algorithms can now diagnose diseases with unprecedented accuracy, predict market trends, and even create art. However, concerns about job displacement, privacy, and ethical considerations remain significant challenges. As AI continues to evolve, society must balance innovation with responsibility, ensuring that technological advancement benefits humanity while addressing potential risks and societal impacts.",
    timeLimit: 600, // 10 minutes
    wordLimit: { min: 5, max: 75 },
  },
  {
    id: 2,
    type: 'Essay',
    prompt: "Some people believe that social media has made us more connected than ever before. Others argue that it has actually made us more isolated. Discuss both views and give your own opinion.",
    timeLimit: 1200, // 20 minutes
    wordLimit: { min: 200, max: 300 },
  },
];

export function WritingPractice() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(writingQuestions[0].timeLimit);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiScore, setAiScore] = useState<any>(null);

  const question = writingQuestions[currentQuestion];
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    setAnswer('');
    setTimeLeft(question.timeLimit);
    setIsSubmitted(false);
    setAiScore(null);
  }, [currentQuestion]);

  useEffect(() => {
    if (!isSubmitted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted]);

  const handleAutoSubmit = () => {
    if (answer.trim()) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (wordCount < question.wordLimit.min || wordCount > question.wordLimit.max) {
      toast.error(`Word count must be between ${question.wordLimit.min} and ${question.wordLimit.max} words`);
      return;
    }

    setIsSubmitted(true);
    toast.success('Answer submitted! AI is evaluating...');

    // Mock AI evaluation
    setTimeout(() => {
      setAiScore({
        overall: 82,
        grammar: 85,
        vocabulary: 88,
        coherence: 80,
        content: 78,
        feedback: [
          { type: 'positive', text: 'Excellent use of academic vocabulary' },
          { type: 'positive', text: 'Good paragraph structure and flow' },
          { type: 'improvement', text: 'Consider using more complex sentence structures' },
          { type: 'improvement', text: 'Some grammatical errors in verb tenses' },
        ],
        corrections: [
          { original: 'has made', suggestion: 'have made', reason: 'Subject-verb agreement' },
        ],
      });
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Writing Practice</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestion + 1} of {writingQuestions.length}
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${((currentQuestion + 1) / writingQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg font-semibold">
                  {question.type}
                </div>
                <div className={`flex items-center gap-3 text-2xl font-bold ${
                  timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'
                }`}>
                  <Clock className="h-6 w-6" />
                  {formatTime(timeLeft)}
                </div>
              </div>

              {question.type === 'Summarize Written Text' ? (
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                  <p className="text-lg leading-relaxed">{question.text}</p>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
                  <h3 className="font-semibold mb-3">Essay Topic:</h3>
                  <p className="text-lg leading-relaxed">{question.prompt}</p>
                </div>
              )}

              {/* Writing Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">Your Answer:</label>
                  <div className={`text-sm ${
                    wordCount < question.wordLimit.min || wordCount > question.wordLimit.max
                      ? 'text-red-500 font-semibold'
                      : 'text-green-500 font-semibold'
                  }`}>
                    {wordCount} / {question.wordLimit.max} words
                  </div>
                </div>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={isSubmitted}
                  className="w-full h-80 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 resize-none font-mono"
                  placeholder={`Start writing your ${question.type.toLowerCase()} here...`}
                />

                {!isSubmitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={!answer.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            </div>

            {/* AI Evaluation */}
            {aiScore && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-bold">AI Evaluation Results</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Overall', score: aiScore.overall, color: 'purple' },
                    { label: 'Grammar', score: aiScore.grammar, color: 'blue' },
                    { label: 'Vocabulary', score: aiScore.vocabulary, color: 'green' },
                    { label: 'Coherence', score: aiScore.coherence, color: 'orange' },
                    { label: 'Content', score: aiScore.content, color: 'pink' },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-3xl font-bold text-${item.color}-600 mb-1`}>{item.score}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold">Feedback:</h4>
                  {aiScore.feedback.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-3 rounded-lg ${
                        item.type === 'positive'
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                      }`}
                    >
                      {item.type === 'positive' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>

                {aiScore.corrections.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Grammar Corrections:</h4>
                    <div className="space-y-2">
                      {aiScore.corrections.map((correction: any, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="line-through text-red-600">{correction.original}</span>
                            <span>→</span>
                            <span className="text-green-600 font-semibold">{correction.suggestion}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{correction.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <FileText className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Read the {question.type === 'Essay' ? 'topic' : 'passage'} carefully</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Word limit: {question.wordLimit.min}-{question.wordLimit.max} words</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Time limit: {question.timeLimit / 60} minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Use proper grammar and vocabulary</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="font-bold mb-3">💡 Writing Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Plan your answer before writing</li>
                <li>• Use varied sentence structures</li>
                <li>• Check grammar and spelling</li>
                <li>• Stay within word limits</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="inline-block h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion(Math.min(writingQuestions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === writingQuestions.length - 1}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
