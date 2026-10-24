import React from "react";
import api from '../utils/axios';
export const AuthContext = React.createContext();

// Read the saved session once, on first render (no effect needed).
const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) ?? null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(readStoredUser);

  const saveSession = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("token", data.token);
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data);
      return data;
    }
    catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      saveSession(data);
      return data;
    }
    catch (error) {
      console.error("OTP verification failed:", error);
      throw error;
    }
  }

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  // Registration only creates an unverified account and emails a code.
  // The user is logged in later, by verifyOtp().
  const register = async (username, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      return data;
    }
    catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyOtp, register }}>
      {children}
    </AuthContext.Provider>
  );
}
