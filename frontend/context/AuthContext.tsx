"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthUser = {
  user_id: string;
  name: string;
  email?: string;
  role: "admin" | "user";
  token: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string, role: string, name: string, user_id: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null, isAdmin: false, isLoading: true,
  login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ss_auth");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const login = (token: string, role: string, name: string, user_id: string) => {
    const u: AuthUser = { token, role: role as "admin" | "user", name, user_id };
    localStorage.setItem("ss_auth", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("ss_auth");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Returns Bearer token header or empty object if not logged in. */
export function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
