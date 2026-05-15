import { Link } from 'react-router-dom';
import { TrendingUp, Target, Award, Clock, BookOpen, Mic, Edit, Headphones, Calendar, Trophy, BarChart3, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../components/AuthContext';
import { useEffect } from 'react';
import { ErrorBoundary } from "../components/ErrorBoundary";

const scoreData = [
  { date: 'Jan 15', score: 45 },
  { date: 'Jan 22', score: 52 },
  { date: 'Jan 29', score: 58 },
  { date: 'Feb 5', score: 65 },
  { date: 'Feb 12', score: 71 },
  { date: 'Feb 19', score: 76 },
  { date: 'Feb 26', score: 82 },
];

const moduleScores = [
  { module: 'Speaking', score: 80 },
  { module: 'Writing', score: 75 },
  { module: 'Reading', score: 85 },
  { module: 'Listening', score: 78 },
];

const skillRadar = [
  { skill: 'Pronunciation', score: 85 },
  { skill: 'Fluency', score: 78 },
  { skill: 'Grammar', score: 82 },
  { skill: 'Vocabulary', score: 88 },
  { skill: 'Spelling', score: 80 },
  { skill: 'Content', score: 76 },
];

export function Dashboard() {
  const { user } = useAuth();

  console.log(user);

  useEffect(() => {

  const fetchDashboard = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/auth/dashboard",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(data);

    } catch (error) {

      console.log(error);

    }
  };

  fetchDashboard();

}, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-600 dark:text-gray-400">Here's your PTE preparation progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8" />
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Overall</span>
            </div>
            <div className="text-4xl font-bold mb-1">82/90</div>
            <div className="text-blue-100">Current PTE Score</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <span className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">+12</span>
            </div>
            <div className="text-4xl font-bold mb-1">37</div>
            <div className="text-gray-600 dark:text-gray-400">Points Improved</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8 text-purple-500" />
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold mb-1">12/15</div>
            <div className="text-gray-600 dark:text-gray-400">Mock Tests Completed</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-orange-500" />
              <span className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">Active</span>
            </div>
            <div className="text-4xl font-bold mb-1">48h</div>
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
              </ErrorBoundary>
            </div>

            {/* Module Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-6">Module Performance</h2>
              <ErrorBoundary>
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
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillRadar}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="skill" stroke="#9ca3af" />
                  <PolarRadiusAxis stroke="#9ca3af" />
                  <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
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
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Focus on improving fluency in speaking module</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Practice more fill-in-the-blanks for reading</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Work on essay structure and coherence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Increase listening practice time by 30 mins/day</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

