import React, { createContext,  useContext, useState, ReactNode, useEffect } from 'react';
//import { onAuthStateChanged } from "firebase/auth";
//import { auth } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  subscriptionPlan?: 'free' | 'basic' | 'premium' | 'pro';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      
      // Since backend doesn't return user info in /login, we extract from email or use defaults
      // In a real app, you'd fetch user details or decode the JWT
      const userData: User = {
        id: data.user?.id || Date.now().toString(),
        name: data.user?.name || email.split("@")[0],
        email: email,
        role: "student",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        subscriptionPlan: "free",
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

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // 1. Try to signup the user (backend handles "already exists" logic)
      const signupRes = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleUser.displayName,
          email: googleUser.email,
          password: googleUser.uid, // Use UID as password for Google users
        }),
      });

      const signupData = await signupRes.json();
      
      if (!signupRes.ok && signupData.message !== "User already exists") {
        throw new Error(signupData.message || "Google Signup failed");
      }

      // 2. Now login to get the token
      await login(googleUser.email!, googleUser.uid);

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
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Automatically login after successful signup to get the token
      await login(email, password);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loginWithGoogle, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
 