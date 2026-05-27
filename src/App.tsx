import {
  Routes,
  Route,
  Navigate,
  BrowserRouter,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";
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
import { messaging } from "./lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useEffect } from "react";
import { API_BASE_URL } from "./lib/api";

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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !messaging) return;

    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Register the Service Worker explicitly using import.meta.env.BASE_URL
          const swUrl = `${import.meta.env.BASE_URL || '/'}firebase-messaging-sw.js`;
          let registration;
          try {
            registration = await navigator.serviceWorker.register(swUrl);
            console.log("[FCM SW] Service Worker registered:", registration.scope);
          } catch (swErr) {
            console.warn("[FCM SW] Registration failed, falling back to ready:", swErr);
            registration = await navigator.serviceWorker.ready;
          }

          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
          });

          if (token) {
            console.log("[FCM] Client Token:", token);
            const jwtToken = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/api/notifications/token`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${jwtToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ token, deviceType: "web" })
            });
          }
        }
      } catch (err) {
        console.error("[FCM] Failed to initialize notifications:", err);
      }
    };

    setupNotifications();

    // Setup foreground message handler
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] Foreground message received:", payload);
      const title = payload.notification?.title || "Notification";
      const body = payload.notification?.body || "";
      const clickUrl = payload.data?.url;

      toast.info(title, {
        description: body,
        duration: 8000,
        action: clickUrl ? {
          label: "View",
          onClick: () => {
            const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
            let finalUrl = clickUrl;
            if (clickUrl.startsWith("/") && !clickUrl.startsWith(baseUrl + "/")) {
              finalUrl = `${baseUrl}${clickUrl}`;
            }
            window.location.href = finalUrl;
          }
        } : undefined
      });
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

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

// Derive the router basename from Vite's BASE_URL so we don't hard-code the
// gh-pages prefix here. Strip trailing slash so react-router doesn't double it.
const ROUTER_BASENAME =
  (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter basename={ROUTER_BASENAME}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
