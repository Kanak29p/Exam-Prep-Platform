import { useState } from 'react';
import { Video, Calendar, Clock, Users, Play, BookOpen, Star, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const upcomingClasses = [
  {
    id: 1,
    title: 'PTE Speaking Masterclass',
    instructor: 'Dr. Sarah Johnson',
    instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    date: '2026-05-12',
    time: '10:00 AM - 11:30 AM',
    duration: 90,
    students: 45,
    maxStudents: 50,
    level: 'Intermediate',
    topics: ['Read Aloud', 'Repeat Sentence', 'Describe Image'],
    rating: 4.9,
  },
  {
    id: 2,
    title: 'Writing Techniques & Tips',
    instructor: 'Prof. Michael Chen',
    instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    date: '2026-05-13',
    time: '2:00 PM - 3:30 PM',
    duration: 90,
    students: 38,
    maxStudents: 50,
    level: 'Advanced',
    topics: ['Essay Writing', 'Summarize Written Text'],
    rating: 4.8,
  },
  {
    id: 3,
    title: 'Listening Skills Workshop',
    instructor: 'Emma Williams',
    instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    date: '2026-05-14',
    time: '4:00 PM - 5:30 PM',
    duration: 90,
    students: 42,
    maxStudents: 50,
    level: 'All Levels',
    topics: ['Summarize Spoken Text', 'Fill in the Blanks', 'Write from Dictation'],
    rating: 4.9,
  },
];

const recordedClasses = [
  {
    id: 1,
    title: 'Complete PTE Reading Strategy',
    instructor: 'Dr. Rahul Verma',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250',
    duration: 95,
    views: 1240,
    rating: 4.7,
    date: '2026-05-01',
  },
  {
    id: 2,
    title: 'PTE Speaking: Common Mistakes',
    instructor: 'Prof. Priya Sharma',
    thumbnail: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=250',
    duration: 85,
    views: 2150,
    rating: 4.9,
    date: '2026-04-28',
  },
  {
    id: 3,
    title: 'Essay Writing Masterclass',
    instructor: 'Dr. David Lee',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250',
    duration: 120,
    views: 1890,
    rating: 4.8,
    date: '2026-04-25',
  },
];

export function LiveClassesPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recorded'>('upcoming');

  const handleJoinClass = (classId: number) => {
    toast.success('Joining class... Opening video conference');
  };

  const handleRegister = (classId: number) => {
    toast.success('Successfully registered for the class!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Video className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Live Classes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Learn from expert instructors in interactive live sessions
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Video className="h-8 w-8 text-blue-600 mb-3" />
            <div className="text-3xl font-bold mb-1">24</div>
            <div className="text-gray-600 dark:text-gray-400">Classes This Month</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <div className="text-3xl font-bold mb-1">150+</div>
            <div className="text-gray-600 dark:text-gray-400">Students Enrolled</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <BookOpen className="h-8 w-8 text-green-600 mb-3" />
            <div className="text-3xl font-bold mb-1">45</div>
            <div className="text-gray-600 dark:text-gray-400">Recorded Classes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Star className="h-8 w-8 text-yellow-500 mb-3" />
            <div className="text-3xl font-bold mb-1">4.8</div>
            <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="inline-block h-5 w-5 mr-2" />
              Upcoming Classes
            </button>
            <button
              onClick={() => setActiveTab('recorded')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'recorded'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Play className="inline-block h-5 w-5 mr-2" />
              Recorded Classes
            </button>
          </div>

          <div className="p-6">
            {/* Upcoming Classes */}
            {activeTab === 'upcoming' && (
              <div className="space-y-6">
                {upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{classItem.title}</h3>
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={classItem.instructorAvatar}
                                alt={classItem.instructor}
                                className="h-10 w-10 rounded-full"
                              />
                              <div>
                                <div className="font-semibold">{classItem.instructor}</div>
                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{classItem.rating}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full text-sm font-semibold">
                            {classItem.level}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span>{classItem.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <span>{classItem.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span>{classItem.students}/{classItem.maxStudents} enrolled</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Video className="h-5 w-5 text-blue-600" />
                            <span>{classItem.duration} minutes</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm font-semibold mb-2">Topics Covered:</div>
                          <div className="flex flex-wrap gap-2">
                            {classItem.topics.map((topic, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg text-sm"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${(classItem.students / classItem.maxStudents) * 100}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {classItem.maxStudents - classItem.students} spots remaining
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:w-48">
                        <button
                          onClick={() => handleRegister(classItem.id)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Register Now
                        </button>
                        <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recorded Classes */}
            {activeTab === 'recorded' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recordedClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all group"
                  >
                    <div className="relative">
                      <img src={classItem.thumbnail} alt={classItem.title} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleJoinClass(classItem.id)}
                          className="p-4 bg-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Play className="h-8 w-8 text-blue-600" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-sm rounded">
                        {classItem.duration} min
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{classItem.title}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        by {classItem.instructor}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{classItem.rating}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {classItem.views.toLocaleString()} views
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinClass(classItem.id)}
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        Watch Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">Why Join Live Classes?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Video, title: 'Interactive Learning', desc: 'Ask questions and get instant feedback' },
              { icon: Users, title: 'Expert Instructors', desc: 'Learn from certified PTE trainers' },
              { icon: CheckCircle, title: 'Proven Results', desc: '95% students improve their scores' },
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-xl mb-2">{benefit.title}</h3>
                <p className="text-white/90">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
