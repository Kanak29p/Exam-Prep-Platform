import { useState } from 'react';
import { MessageSquare, ThumbsUp, Reply, Search, Plus, TrendingUp, Clock, MessageCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

const forumPosts = [
  {
    id: 1,
    title: 'How to improve speaking fluency in 2 weeks?',
    author: 'Priya Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    category: 'Speaking',
    content: 'I have my PTE exam in 2 weeks and struggling with speaking fluency. Any tips?',
    likes: 24,
    replies: 12,
    views: 340,
    timeAgo: '2 hours ago',
    isTrending: true,
  },
  {
    id: 2,
    title: 'Best resources for essay writing practice?',
    author: 'Rahul Verma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    category: 'Writing',
    content: 'Looking for good essay topics and sample answers. Please share resources!',
    likes: 18,
    replies: 8,
    views: 215,
    timeAgo: '5 hours ago',
    isTrending: false,
  },
  {
    id: 3,
    title: 'Read Aloud pronunciation tips needed',
    author: 'Anjali Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
    category: 'Speaking',
    content: 'I keep making mistakes in pronunciation during Read Aloud. How can I improve?',
    likes: 31,
    replies: 15,
    views: 450,
    timeAgo: '1 day ago',
    isTrending: true,
  },
  {
    id: 4,
    title: 'Summarize Written Text strategy',
    author: 'Vikram Singh',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    category: 'Writing',
    content: 'What is the best approach for SWT? Should I include all points or focus on main ideas?',
    likes: 22,
    replies: 10,
    views: 380,
    timeAgo: '1 day ago',
    isTrending: false,
  },
  {
    id: 5,
    title: 'Fill in the Blanks - Reading tips?',
    author: 'Sneha Reddy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    category: 'Reading',
    content: 'I find R&W fill in the blanks very challenging. Any strategies to tackle this?',
    likes: 15,
    replies: 6,
    views: 190,
    timeAgo: '2 days ago',
    isTrending: false,
  },
];

const categories = ['All', 'Speaking', 'Writing', 'Reading', 'Listening', 'General'];

export function ForumPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>('recent');

  const filteredPosts = forumPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleNewPost = () => {
    toast.info('New post feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Discussion Forum</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with fellow PTE aspirants and share knowledge
              </p>
            </div>
            <button
              onClick={handleNewPost}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
            <div className="text-3xl font-bold mb-1">1,245</div>
            <div className="text-gray-600 dark:text-gray-400">Total Discussions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <div className="text-3xl font-bold mb-1">3,840</div>
            <div className="text-gray-600 dark:text-gray-400">Active Members</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <MessageCircle className="h-8 w-8 text-green-600 mb-3" />
            <div className="text-3xl font-bold mb-1">8,920</div>
            <div className="text-gray-600 dark:text-gray-400">Total Replies</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <TrendingUp className="h-8 w-8 text-orange-600 mb-3" />
            <div className="text-3xl font-bold mb-1">125</div>
            <div className="text-gray-600 dark:text-gray-400">Posts Today</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Trending Topics
              </h3>
              <div className="space-y-3">
                {['Speaking Tips', 'Mock Test Strategy', 'Essay Writing', 'Time Management'].map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Sort */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search discussions..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="recent">Most Recent</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex gap-4">
                    <img src={post.avatar} alt={post.author} className="h-12 w-12 rounded-full flex-shrink-0" />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold hover:text-blue-600 transition-colors">
                              {post.title}
                            </h3>
                            {post.isTrending && (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded text-xs font-semibold flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Trending
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">{post.author}</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded">
                              {post.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {post.timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">{post.content}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="font-semibold">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                          <Reply className="h-4 w-4" />
                          <span className="font-semibold">{post.replies} replies</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.views} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
