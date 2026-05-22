import { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Crown, Zap } from 'lucide-react';

const leaderboardData = [
  { rank: 1, name: 'Rahul Verma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', score: 88, tests: 25, improvement: 15, country: '🇮🇳' },
  { rank: 2, name: 'Priya Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', score: 85, tests: 22, improvement: 12, country: '🇮🇳' },
  { rank: 3, name: 'David Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', score: 84, tests: 28, improvement: 18, country: '🇨🇳' },
  { rank: 4, name: 'Sarah Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', score: 82, tests: 20, improvement: 10, country: '🇺🇸' },
  { rank: 5, name: 'Anjali Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali', score: 81, tests: 24, improvement: 14, country: '🇮🇳' },
  { rank: 6, name: 'Michael Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', score: 80, tests: 19, improvement: 11, country: '🇰🇷' },
  { rank: 7, name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', score: 79, tests: 21, improvement: 9, country: '🇬🇧' },
  { rank: 8, name: 'Vikram Singh', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram', score: 78, tests: 26, improvement: 16, country: '🇮🇳' },
  { rank: 9, name: 'Jessica Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica', score: 77, tests: 18, improvement: 8, country: '🇦🇺' },
  { rank: 10, name: 'Ahmed Hassan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', score: 76, tests: 23, improvement: 13, country: '🇦🇪' },
];

export function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'alltime'>('month');

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
  };

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-white dark:bg-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Global Leaderboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Compete with students worldwide and track your ranking
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">Top 10%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Your Current Rank</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">82/90</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Your Best Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">5,240</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Rankings</h2>
              <div className="flex gap-2">
                {[
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'alltime', label: 'All Time' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTimeFilter(filter.id as any)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      timeFilter === filter.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
              {/* 2nd Place */}
              <div className="flex flex-col items-center pt-8">
                <div className="relative">
                  <img
                    src={leaderboardData[1].avatar}
                    alt={leaderboardData[1].name}
                    className="h-20 w-20 rounded-full border-4 border-gray-400 shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-300 to-gray-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="font-semibold">{leaderboardData[1].name}</div>
                  <div className="text-2xl font-bold text-gray-600">{leaderboardData[1].score}</div>
                </div>
                <div className="mt-4 w-full bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg p-6 text-center text-white font-bold">
                  <Medal className="h-8 w-8 mx-auto mb-2" />
                  Silver
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={leaderboardData[0].avatar}
                    alt={leaderboardData[0].name}
                    className="h-24 w-24 rounded-full border-4 border-yellow-400 shadow-2xl"
                  />
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
                    1
                  </div>
                  <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-3 text-center">
                  <div className="font-bold text-lg">{leaderboardData[0].name}</div>
                  <div className="text-3xl font-bold text-yellow-600">{leaderboardData[0].score}</div>
                </div>
                <div className="mt-4 w-full bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg p-8 text-center text-white font-bold">
                  <Trophy className="h-10 w-10 mx-auto mb-2" />
                  Gold
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center pt-8">
                <div className="relative">
                  <img
                    src={leaderboardData[2].avatar}
                    alt={leaderboardData[2].name}
                    className="h-20 w-20 rounded-full border-4 border-orange-600 shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="font-semibold">{leaderboardData[2].name}</div>
                  <div className="text-2xl font-bold text-orange-600">{leaderboardData[2].score}</div>
                </div>
                <div className="mt-4 w-full bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-lg p-6 text-center text-white font-bold">
                  <Award className="h-8 w-8 mx-auto mb-2" />
                  Bronze
                </div>
              </div>
            </div>

            {/* Full Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Student</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Score</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Tests</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboardData.map((student) => (
                    <tr
                      key={student.rank}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        student.rank <= 3 ? getRankBackground(student.rank) + ' text-white' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(student.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img src={student.avatar} alt={student.name} className="h-10 w-10 rounded-full" />
                          <div>
                            <div className={`font-semibold ${student.rank <= 3 ? 'text-white' : ''}`}>
                              {student.name} {student.country}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`text-2xl font-bold ${student.rank <= 3 ? 'text-white' : 'text-blue-600'}`}>
                          {student.score}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={student.rank <= 3 ? 'text-white' : ''}>{student.tests}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`flex items-center justify-center gap-1 ${
                          student.rank <= 3 ? 'text-white' : 'text-green-600'
                        }`}>
                          <TrendingUp className="h-4 w-4" />
                          +{student.improvement}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
