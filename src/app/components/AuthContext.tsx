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

  useEffect(() => {
  setLoading(false);
}, []);

  /*useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        role: "student",
        avatar: firebaseUser.photoURL || "",
        subscriptionPlan: "free"
      });
    } else {
      setUser(null);
    }

    setLoading(false); // 👈 IMPORTANT: auth check completed
  });

  return () => unsubscribe();
}, []);*/

  const login = async (email: string, password: string) => {
    try{
    setLoading(true); 
    // Mock login - in production, this would call your API
    /*await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({
      id: '1',
      name: 'John Doe',
      email,
      role: email.includes('admin') ? 'admin' : 'student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      subscriptionPlan: 'premium'
    });*/

  const response = await fetch(
  "https://exam-prep-platform-backend.onrender.com//api/auth/login",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  }
);

const data = await response.json();

if (!response.ok) {

  throw new Error(data.message);

}

localStorage.setItem("token", data.token);

setUser({
  id: data.user?.id || "1",
  name: data.user?.name || email.split("@")[0],
  email: email,
  role: "student",
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
  subscriptionPlan: "free",
});
    }
    catch (error) {
    console.log("Login error:", error);
    throw error; // 👈 IMPORTANT: rethrow so UI can handle it
  }
    finally{
      setLoading(false);
    }

  };

  const loginWithGoogle = async () => {

  try {

    setLoading(true);

    const result = await signInWithPopup(auth, provider);

    const googleUser = result.user;

    // save user in database
    const response=await fetch("https://exam-prep-platform-backend.onrender.com//api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: googleUser.displayName,
        email: googleUser.email,
        password: googleUser.uid
      })
    });

    const data = await response.json();

// if user already exists, don't stop app
if (!response.ok && data.message !== "User already exists") {
  throw new Error(data.message);
}

    // set frontend user state
    setUser({
      id: googleUser.uid,
      name: googleUser.displayName || "",
      email: googleUser.email || "",
      role: "student",
      avatar: googleUser.photoURL || "",
      subscriptionPlan: "free"
    });

  } catch (error) {

    console.log("Google login error:", error);
    throw error;

  } finally {

    setLoading(false);

  }
};

  const signup = async (name: string, email: string, password: string) => {
  try {
    setLoading(true);

    const response = await fetch("https://exam-prep-platform-backend.onrender.com//api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    // set user in frontend state
    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: "student",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      subscriptionPlan: "free"
    });

  } catch (error) {
    console.log("Signup error:", error);
    throw error;
  } finally {
    setLoading(false);
  }
};

  const logout = () => {
    setUser(null);
  };
console.log(user,"useruseruseruseruseruseruser");

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
