import React, { createContext,  useContext, useState, ReactNode, useEffect } from 'react';
//import { onAuthStateChanged } from "firebase/auth";
//import { auth } from "../../firebase";

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
    `http://localhost:3000/users?email=${email}&password=${password}`
  );

  const data = await response.json();

  if (data.length === 0) {

    throw new Error("Invalid credentials");

  }

  const loggedUser = data[0];

  setUser({
    id: loggedUser.id,
    name: loggedUser.name,
    email: loggedUser.email,
    role: 'student',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loggedUser.name}`,
    subscriptionPlan: 'free'
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

  const loginWithGoogle = (firebaseUser: any) => {
  setUser({
    id: firebaseUser.uid,
    name: firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    role: "student",
    avatar: firebaseUser.photoURL || "",
    subscriptionPlan: "free"
  });
};

  const signup = async (name: string, email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({
      id: '1',
      name,
      email,
      role: 'student',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      subscriptionPlan: 'free'
    });
  };

  const logout = () => {
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
