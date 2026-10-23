import React from "react";
import api from '../utils/axios';
export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      return data;
    }
    catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp',{ email, otp });
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);
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

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setUser(data);
      return data;
    }
    catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, verifyOtp, register }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}