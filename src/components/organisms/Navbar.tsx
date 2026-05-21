import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, Moon, Sun, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from 'next-themes';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PTE Master
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link to="/" className={`hover:text-blue-600 transition-colors ${isActive('/') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  Home
                </Link>
                <Link to="/pricing" className={`hover:text-blue-600 transition-colors ${isActive('/pricing') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  Pricing
                </Link>
                <Link to="/leaderboard" className={`hover:text-blue-600 transition-colors ${isActive('/leaderboard') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  Leaderboard
                </Link>
                <Link to="/live-classes" className={`hover:text-blue-600 transition-colors ${isActive('/live-classes') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  Classes
                </Link>
              </>
            ) : (
              <>
                {user?.role === 'student' && (
                  <>
                    <Link to="/dashboard" className={`hover:text-blue-600 transition-colors ${isActive('/dashboard') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      Dashboard
                    </Link>
                    <Link to="/practice" className={`hover:text-blue-600 transition-colors ${isActive('/practice') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      Practice
                    </Link>
                    <Link to="/mock-tests" className={`hover:text-blue-600 transition-colors ${isActive('/mock-tests') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      Tests
                    </Link>
                    <Link to="/forum" className={`hover:text-blue-600 transition-colors ${isActive('/forum') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      Forum
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className={`hover:text-blue-600 transition-colors ${isActive('/admin') ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-medium">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <button onClick={logout} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left text-red-600">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link to="/" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              Home
            </Link>
            <Link to="/features" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              Features
            </Link>
            <Link to="/pricing" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              Pricing
            </Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  Login
                </Link>
                <Link to="/signup" className="block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center">
                  Sign Up
                </Link>
              </>
            ) : (
              <button onClick={logout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
