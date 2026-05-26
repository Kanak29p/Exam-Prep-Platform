import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  signInWithPopup,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, provider } from "../lib/firebase";
import { API_BASE_URL } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  avatar?: string;
  subscriptionPlan?: "free" | "basic" | "premium" | "pro";
  phone?: string;
  location?: string;
  targetScore?: number;
  examDate?: string;
  bio?: string;
  country?: string;
  state?: string;
  city?: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleSignup: () => Promise<any>;
  googleLogin: () => Promise<any>;
  sendPasswordReset: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // You could optionally verify the token with a /me endpoint here
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Failed to parse saved user:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const sanitizedEmail = email.trim().toLowerCase();

      // 1. Login with Firebase first
      const userCredential = await signInWithEmailAndPassword(
        auth,
        sanitizedEmail,
        password,
      );

      const firebaseUser = userCredential.user;

      // 2. Check email verification
      // Refresh latest Firebase user data
      await firebaseUser.reload();

      // Get updated user
      const updatedUser = auth.currentUser;

      const isGoogleLinked = updatedUser?.providerData.some(
        (provider) => provider.providerId === "google.com",
      );

      if (!updatedUser?.emailVerified && !isGoogleLinked) {
        await signOut(auth);

        throw new Error("Please verify your email before login");
      }

      const firebaseToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      const userData: User = {
        id: data.user?.id || Date.now().toString(),
        name: data.user?.name || sanitizedEmail.split("@")[0],
        email: sanitizedEmail,
        role: data.user?.role ?? "student",
        avatar: data.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        subscriptionPlan: "free",
        phone: data.user?.phone || "",
        location: data.user?.location || "",
        targetScore: data.user?.targetScore || 0,
        examDate: data.user?.examDate || "",
        bio: data.user?.bio || "",
        country: data.user?.country || "",
        state: data.user?.state || "",
        city: data.user?.city || "",
        plan: data.user?.plan || "Free",
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // 1. Try to signup the user (backend handles "already exists" logic)
      const signupRes = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleUser.displayName,
          email: googleUser.email,
        }),
      });

      const signupData = await signupRes.json();

      // 2. Create user object directly from Google
      const userData: User = {
        id: googleUser.uid,
        name:
          googleUser.displayName || googleUser.email?.split("@")[0] || "User",
        email: googleUser.email!,
        role: "student",
        avatar:
          googleUser.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.email}`,
        subscriptionPlan: "free",
        phone: "",
        location: "",
        targetScore: 0,
        examDate: "",
        bio: "",
        country: "",
        state: "",
        city: "",
        plan: "Free",
      };

      const firebaseToken = await googleUser.getIdToken();

      return {
        ...userData,
        isNewUser: signupData.isNewUser,
        firebaseToken,
        googleUser,
      };
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      setLoading(true);

      // 1. Firebase Google Login
      const result = await signInWithPopup(auth, provider);

      const googleUser = result.user;

      // 2. Get Firebase token
      const firebaseToken = await googleUser.getIdToken();

      // 3. Call BACKEND LOGIN API
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseToken,
        }),
      });

      const data = await response.json();

      // 4. If user not in DB
      if (!response.ok) {
        // logout firebase session
        await signOut(auth);

        throw new Error(data.message || "Please signup first");
      }

      // 5. Create frontend user object
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar:
          data.user.avatar ||
          googleUser.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.email}`,
        subscriptionPlan: "free",
        phone: data.user.phone || "",
        location: data.user.location || "",
        targetScore: data.user.targetScore || 0,
        examDate: data.user.examDate || "",
        bio: data.user.bio || "",
        country: data.user.country || "",
        state: data.user.state || "",
        city: data.user.city || "",
        plan: data.user.plan || "Free",
      };

      // 6. Store session
      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(userData));

      // 7. Set state
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Google login error:", error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const sanitizedEmail = email.trim().toLowerCase();

      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        sanitizedEmail,
        password,
      );

      // 2. Send verification email
      await sendEmailVerification(userCredential.user);

      // 3. Sign out until verified
      await signOut(auth);

      // 3. Save user in backend
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: sanitizedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase signOut error:", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      const sanitizedEmail = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, sanitizedEmail);
    } catch (error: any) {
      console.error("Password reset error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        signup,
        logout,
        googleSignup,
        googleLogin,
        sendPasswordReset,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
