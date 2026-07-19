import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { type User, useGetMe, getGetMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("jobera_token"));
  const [user, setUser] = useState<User | null>(null);

  // Setup auth token getter for custom fetch
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("jobera_token"));
  }, []);

  const { data: meData, isLoading: isLoadingMe } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("jobera_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("jobera_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading: !!token && isLoadingMe && !user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
