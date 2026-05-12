import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, CheckCircle, AlertCircle, Trophy, TrendingUp, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

const mockTests = [
  {
    id: 1,
    title: 'PTE Mock Test #1',
    type: 'Full Test',
    duration: 120,
    questions: 90,
    status: 'completed',
    score: 82,
    date: '2026-05-05',
  },
  {
    id: 2,
    title: 'PTE Mock Test #2',
    type: 'Full Test',
    duration: 120,
    questions: 90,
    status: 'completed',
    score: 85,
    date: '2026-05-08',
  },
  {
    id: 3,
    title: 'Speaking Module Test',
    type: 'Module',
    duration: 30,
    questions: 25,
    status: 'completed',
    score: 88,
    date: '2026-05-09',
  },
  {
    id: 4,
    title: 'PTE Mock Test #3',
    type: 'Full Test',
    duration: 120,
    questions: 90,
    status: 'available',
  },
  {
    id: 5,
    title: 'Writing Module Test',
    type: 'Module',
    duration: 40,
    questions: 10,
    status: 'available',
  },
];

export function MockTestPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  const filteredTests = mockTests.filter((test) =>
    activeTab === 'available' ? test.status === 'available' : test.status === 'completed'
  );

  const handleStartTest = (test: any) => {
    setSelectedTest(test);
    setShowStartModal(true);
  };

  const confirmStart = () => {
    toast.success('Mock test started! Good luck!');
    setShowStartModal(false);
    // In production, this would navigate to the actual test interface
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mock Tests</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Take full-length practice exams to prepare for your PTE test
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Trophy className="h-8 w-8 text-yellow-500 mb-3" />
            <div className="text-3xl font-bold mb-1">85</div>
            <div className="text-gray-600 dark:text-gray-400">Best Score</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
            <div className="text-3xl font-bold mb-1">3</div>
            <div className="text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <TrendingUp className="h-8 w-8 text-blue-500 mb-3" />
            <div className="text-3xl font-bold mb-1">+6</div>
            <div className="text-gray-600 dark:text-gray-400">Improvement</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Clock className="h-8 w-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold mb-1">6h</div>
            <div className="text-gray-600 dark:text-gray-400">Practice Time</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'available'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Available Tests
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Completed Tests
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{test.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            test.type === 'Full Test'
                              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'
                              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                          }`}
                        >
                          {test.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{test.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>{test.questions} questions</span>
                        </div>
                        {test.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{test.date}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {test.status === 'completed' && (
                        <div className="text-center px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600">{test.score}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
                        </div>
                      )}

                      {test.status === 'available' ? (
                        <button
                          onClick={() => handleStartTest(test)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Play className="h-5 w-5" />
                          Start Test
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <Link
                            to={`/results/${test.id}`}
                            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            View Results
                          </Link>
                          <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Start Test Modal */}
      {showStartModal && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Start Mock Test</h2>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2">{selectedTest.title}</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Duration: {selectedTest.duration} minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Questions: {selectedTest.questions}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Auto-submit on timeout
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Make sure you're in a quiet environment. Once started, the timer cannot be paused.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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
