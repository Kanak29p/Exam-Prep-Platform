import {
  Routes,
  Route,
  Navigate,
  HashRouter,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/organisms/Navbar";
import { ChatSupport } from "./components/organisms/ChatSupport";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { Dashboard } from "./pages/Dashboard";
import { PracticePage } from "./pages/PracticePage";
import { MockTestPage } from "./pages/MockTestPage";
import { AdminPanel } from "./pages/AdminPanel";
import { PricingPage } from "./pages/PricingPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveClassesPage } from "./pages/LiveClassesPage";
import { ForumPage } from "./pages/ForumPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PageErrorBoundary } from "./components/organisms/PageErrorBoundary";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SectionQuestionsPage } from "./pages/SectionQuestionsPage";
import { QuestionPage } from "./pages/QuestionPage";



function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const hideChatSupport = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/leaderboard"
          element={
            <PageErrorBoundary>
              <LeaderboardPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="/live-classes"
          element={
            <PageErrorBoundary>
              <LiveClassesPage />
            </PageErrorBoundary>
          }
        />
        <Route
          path="/forum"
          element={
            <PageErrorBoundary>
              <ForumPage />
            </PageErrorBoundary>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/practice"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <PracticePage />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/practice/:module"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <PracticePage />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/practice/:module/:section"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <SectionQuestionsPage />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/practice/:module/:section/:questionId"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <QuestionPage />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />

        {/* <Route
          path="/practice/speaking/*"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <SpeakingPractice />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/practice/writing/*"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <WritingPractice />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        /> */}
        <Route
          path="/mock-tests"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <MockTestPage />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <PageErrorBoundary>
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            </PageErrorBoundary>
          }
        />
        <Route
          path="/admin"
          element={
            <PageErrorBoundary>
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            </PageErrorBoundary>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {!hideChatSupport && <ChatSupport />}
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
