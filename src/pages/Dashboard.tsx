import { Link } from 'react-router-dom';
import { TrendingUp, Target, Award, Clock, BookOpen, Mic, Edit, Headphones, Calendar, Trophy, BarChart3, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from "../components/organisms/ErrorBoundary";
import { API_BASE_URL } from "../lib/api";

export function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/auth/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
          return;
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 w-64 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-48 rounded-lg"></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-32 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>

          {/* Main Layout Skeleton */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-[380px]"></div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-[380px]"></div>
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-[380px]"></div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-[220px]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scoreData = dashboardData?.scoreProgress || [];
  const moduleScores = dashboardData?.modulePerformance || [];
  const skillRadar = dashboardData?.skillRadar || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-600 dark:text-gray-400">Here's your PTE preparation progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8" />
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Overall</span>
            </div>
            <div className="text-4xl font-bold mb-1">{dashboardData?.overallScore || 0}/90</div>
            <div className="text-blue-100">Current PTE Score (Target: {dashboardData?.targetScore || 0})</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <span className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">+{dashboardData?.pointsImproved || 0}</span>
            </div>
            <div className="text-4xl font-bold mb-1">{dashboardData?.pointsImproved || 0}</div>
            <div className="text-gray-600 dark:text-gray-400">Points Improved</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8 text-purple-500" />
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{dashboardData?.mockTestsCompleted || 0}/15</div>
            <div className="text-gray-600 dark:text-gray-400">Mock Tests Completed</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-orange-500" />
              <span className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">Active</span>
            </div>
            <div className="text-4xl font-bold mb-1">{dashboardData?.practiceTime || "0m"}</div>
            <div className="text-gray-600 dark:text-gray-400">Practice Time</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Score Progress</h2>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <ErrorBoundary>
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
                {scoreData.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-[1px] rounded-lg">
                    <p className="text-gray-600 dark:text-gray-300 font-semibold text-center">No progress data available yet.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start practicing to see your score trends!</p>
                  </div>
                )}
              </div>
              </ErrorBoundary>
            </div>

            {/* Module Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-6">Module Performance</h2>
              <ErrorBoundary>
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moduleScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="module" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {moduleScores.every((m: any) => m.score === 0) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-[1px] rounded-lg">
                    <p className="text-gray-600 dark:text-gray-300 font-semibold text-center">No module performance data available yet.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submit practice questions to see module averages.</p>
                  </div>
                )}
              </div>
              </ErrorBoundary>
            </div>

            {/* Quick Practice */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-6">Quick Practice</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Mic, title: 'Speaking', questions: '250+ Questions', color: 'blue' },
                  { icon: Edit, title: 'Writing', questions: '180+ Questions', color: 'purple' },
                  { icon: BookOpen, title: 'Reading', questions: '320+ Questions', color: 'green' },
                  { icon: Headphones, title: 'Listening', questions: '290+ Questions', color: 'orange' },
                ].map((module, index) => (
                  <Link
                    key={index}
                    to={`/practice/${module.title.toLowerCase()}`}
                    className={`p-4 border-2 border-${module.color}-200 dark:border-${module.color}-800 rounded-xl hover:shadow-lg transition-all group`}
                  >
                    <div className={`bg-gradient-to-r from-${module.color}-500 to-${module.color}-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{module.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{module.questions}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skill Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-6">Skill Analysis</h2>
              <ErrorBoundary>
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillRadar}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="skill" stroke="#9ca3af" />
                    <PolarRadiusAxis stroke="#9ca3af" />
                    <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
                {skillRadar.every((s: any) => s.score === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-[1px] rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 font-semibold text-center text-sm">No skill analysis available yet.</p>
                  </div>
                )}
              </div>
              </ErrorBoundary>
            </div>

            {/* Upcoming Tests */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Upcoming Tests</h2>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Full Mock Test #13', date: 'May 12, 2026', time: '10:00 AM' },
                  { title: 'Speaking Module Test', date: 'May 14, 2026', time: '2:00 PM' },
                  { title: 'Writing Practice Test', date: 'May 15, 2026', time: '4:00 PM' },
                ].map((test, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
                    <div className="font-semibold mb-1">{test.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{test.date} • {test.time}</div>
                  </div>
                ))}
              </div>
              <Link to="/mock-tests" className="mt-4 block text-center py-2 text-blue-600 hover:underline font-semibold">
                View All Tests
              </Link>
            </div>

            {/* Subscription */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-6 shadow-lg">
              <Zap className="h-8 w-8 mb-3" />
              <h3 className="text-lg font-bold mb-2">Premium Plan</h3>
              <p className="text-sm text-purple-100 mb-4">Unlimited access to all features</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Valid until Jun 15, 2026</span>
                <Link to="/pricing" className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                  Upgrade
                </Link>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold">AI Recommendations</h2>
              </div>
              <ul className="space-y-3 text-sm">
                {(dashboardData?.recommendations || []).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

