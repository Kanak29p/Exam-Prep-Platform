import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  HashRouter,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { Navbar } from "./components/Navbar";
import { ChatSupport } from "./components/ChatSupport";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { Dashboard } from "./pages/Dashboard";
import { PracticePage } from "./pages/PracticePage";
import { SpeakingPractice } from "./pages/SpeakingPractice";
import { WritingPractice } from "./pages/WritingPractice";
import { MockTestPage } from "./pages/MockTestPage";
import { AdminPanel } from "./pages/AdminPanel";
import { PricingPage } from "./pages/PricingPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveClassesPage } from "./pages/LiveClassesPage";
import { ForumPage } from "./pages/ForumPage";
import { ProfilePage } from "./pages/ProfilePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  console.log("ProtectedRoute user:", user);

  return isAuthenticated ? (
    loading ? (
      <div>loading</div>
    ) : (
      <>{children}</>
    )
  ) : (
    <Navigate to="/login" />
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && user?.role === "admin" ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" />
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/live-classes" element={<LiveClassesPage />} />
        <Route path="/forum" element={<ForumPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <PracticePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/speaking/*"
          element={
            <ProtectedRoute>
              <SpeakingPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/writing/*"
          element={
            <ProtectedRoute>
              <WritingPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-tests"
          element={
            <ProtectedRoute>
              <MockTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Routes>
      <ChatSupport />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <HashRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
