import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Reply, Search, Plus, TrendingUp, Clock, MessageCircle, Users, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../lib/api';

const categories = ['All', 'Speaking', 'Writing', 'Reading', 'Listening', 'General'];

export function ForumPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>('recent');

  // Stats State
  const [stats, setStats] = useState({
    totalDiscussions: 0,
    activeMembers: 0,
    totalReplies: 0,
    totalViews: 0,
    trendingTopics: [] as string[]
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal Create Post State
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [newPostContent, setNewPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Post Detail / Reply Modal State
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/forum/posts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
      } else {
        toast.error("Failed to load forum posts");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/forum/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalDiscussions: data.totalDiscussions || 0,
          activeMembers: data.activeMembers || 0,
          totalReplies: data.totalReplies || 0,
          totalViews: data.totalViews || 0,
          trendingTopics: data.trendingTopics || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch forum stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/forum/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory
        })
      });

      if (res.ok) {
        toast.success("Discussion posted successfully!");
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostCategory('General');
        setShowNewPostModal(false);
        fetchPosts();
        fetchStats();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to create post");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating post");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'trending') {
      return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
    }
    if (sortBy === 'popular') {
      return b.likes - a.likes;
    }
    // Default 'recent': newer posts first
    return b.id - a.id;
  });

  // Optimistic like toggle synced with backend
  const handleLike = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.userLiked;
        return {
          ...p,
          likes: alreadyLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
          userLiked: !alreadyLiked
        };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => {
        if (!prev) return null;
        const alreadyLiked = prev.userLiked;
        return {
          ...prev,
          likes: alreadyLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
          userLiked: !alreadyLiked
        };
      });
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        // Revert on error
        fetchPosts();
        toast.error("Failed to update like status");
      } else {
        // Refresh stats in background to reflect change
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchPosts();
    }
  };

  // Open post, fetch replies, increment views
  const handleOpenPost = async (post: any) => {
    setSelectedPost(post);
    setNewReplyContent('');
    setReplies([]);
    
    // Load replies
    fetchReplies(post.id);

    // Optimistically update views in UI
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return { ...p, views: (p.views || 0) + 1 };
      }
      return p;
    }));
    setSelectedPost((prev: any) => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/forum/posts/${post.id}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchStats();
    } catch (err) {
      console.error("Failed to increment views on backend:", err);
    }
  };

  const fetchReplies = async (postId: number) => {
    try {
      setRepliesLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/replies`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      } else {
        toast.error("Failed to load replies");
      }
    } catch (err) {
      console.error("Error loading replies:", err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newReplyContent.trim()) return;

    try {
      setReplySubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/forum/posts/${selectedPost.id}/replies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: newReplyContent
        })
      });

      if (res.ok) {
        setNewReplyContent('');
        toast.success("Reply posted!");
        
        // Refresh replies list
        fetchReplies(selectedPost.id);

        // Increment reply count locally
        setPosts(prev => prev.map(p => {
          if (p.id === selectedPost.id) {
            return { ...p, replies: (p.replies || 0) + 1 };
          }
          return p;
        }));
        setSelectedPost((prev: any) => prev ? { ...prev, replies: (prev.replies || 0) + 1 } : null);
        
        // Refresh global statistics
        fetchStats();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to submit reply");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while posting reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto animate-fade-in">
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
              onClick={() => setShowNewPostModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
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
            <div className="text-3xl font-bold mb-1">{loading || statsLoading ? "..." : stats.totalDiscussions}</div>
            <div className="text-gray-600 dark:text-gray-400">Total Discussions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <div className="text-3xl font-bold mb-1">{loading || statsLoading ? "..." : stats.activeMembers}</div>
            <div className="text-gray-600 dark:text-gray-400">Active Members</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <MessageCircle className="h-8 w-8 text-green-600 mb-3" />
            <div className="text-3xl font-bold mb-1">{loading || statsLoading ? "..." : stats.totalReplies}</div>
            <div className="text-gray-600 dark:text-gray-400">Total Replies</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <TrendingUp className="h-8 w-8 text-orange-600 mb-3" />
            <div className="text-3xl font-bold mb-1">{loading || statsLoading ? "..." : stats.totalViews}</div>
            <div className="text-gray-600 dark:text-gray-400">Discussion Views</div>
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
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'
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
                {(statsLoading ? ['Speaking Tips', 'Mock Test Strategy', 'Essay Writing', 'Time Management'] : stats.trendingTopics).map((topic, index) => (
                  <div key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium leading-tight line-clamp-2">{topic}</span>
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="recent">Most Recent</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {loading ? (
                // Loading Skeleton
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse h-40"></div>
                ))
              ) : sortedPosts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 font-semibold">No discussions found matching your filters.</p>
                  <p className="text-xs text-gray-400 mt-1">Be the first to post a new topic!</p>
                </div>
              ) : (
                sortedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleOpenPost(post)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-gray-305 dark:hover:border-gray-650 transition-all cursor-pointer"
                  >
                    <div className="flex gap-4">
                      <img src={post.avatar} alt={post.author} className="h-12 w-12 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700" />

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-850 dark:text-white hover:text-blue-600 transition-colors">
                                {post.title}
                              </h3>
                              {post.isTrending && (
                                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded text-xs font-semibold flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Trending
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <span className="font-semibold">{post.author}</span>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded font-semibold text-[10px] uppercase tracking-wider">
                                {post.category}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                {post.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-650 dark:text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                        <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                          <button 
                            onClick={(e) => handleLike(post.id, e)}
                            className={`flex items-center gap-2 hover:text-blue-600 transition-colors font-semibold ${post.userLiked ? 'text-blue-600' : ''}`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${post.userLiked ? 'fill-blue-500 stroke-blue-600' : ''}`} />
                            <span>{post.likes}</span>
                          </button>
                          <div className="flex items-center gap-2 font-semibold">
                            <Reply className="h-4 w-4" />
                            <span>{post.replies} replies</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-gray-850 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Create New Discussion</h3>
              <button 
                onClick={() => setShowNewPostModal(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Discussion Title
                </label>
                <input
                  type="text"
                  required
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="e.g. How to prepare for Repeat Sentence?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Category
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Speaking">Speaking</option>
                  <option value="Writing">Writing</option>
                  <option value="Reading">Reading</option>
                  <option value="Listening">Listening</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Content / Details
                </label>
                <textarea
                  required
                  rows={5}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your question, tips, or discussion topic details here..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Discussion'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-gray-850 w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform scale-100 transition-all duration-300 max-h-[90vh] flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-white/20 text-white rounded text-xs font-semibold uppercase tracking-wider">
                  {selectedPost.category}
                </span>
                <span className="text-xs opacity-90">• Opened Discussion</span>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Original Post */}
              <div className="flex gap-4 border-b border-gray-150 dark:border-gray-700 pb-6">
                <img src={selectedPost.avatar} alt={selectedPost.author} className="h-12 w-12 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-805 dark:text-white">{selectedPost.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {selectedPost.timeAgo}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                    {selectedPost.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                  
                  {/* Likes and Views Info */}
                  <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                    <button 
                      onClick={(e) => handleLike(selectedPost.id, e)}
                      className={`flex items-center gap-2 hover:text-blue-600 transition-colors font-semibold ${selectedPost.userLiked ? 'text-blue-600' : ''}`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${selectedPost.userLiked ? 'fill-blue-500 stroke-blue-600' : ''}`} />
                      <span>{selectedPost.likes} likes</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{selectedPost.views} views</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <Reply className="h-5 w-5 text-purple-600 rotate-180" />
                  Replies ({selectedPost.replies})
                </h3>

                {repliesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : replies.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                      No replies yet. Be the first to join the conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <div 
                        key={reply.id} 
                        className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-150 dark:border-gray-750 flex gap-3 hover:border-gray-200 dark:hover:border-gray-755 transition-all"
                      >
                        <img src={reply.avatar} alt={reply.author} className="h-9 w-9 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-gray-805 dark:text-white">{reply.author}</span>
                            <span className="text-[10px] text-gray-505 dark:text-gray-400 flex items-center gap-1 font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              {reply.timeAgo}
                            </span>
                          </div>
                          <p className="text-gray-650 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Reply Form */}
            <form onSubmit={handleCreateReply} className="border-t border-gray-200 dark:border-gray-750 p-4 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  value={newReplyContent}
                  onChange={(e) => setNewReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={replySubmitting || !newReplyContent.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replySubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Reply'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
