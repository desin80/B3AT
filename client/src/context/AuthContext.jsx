import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("b3at_admin_token");
        if (token) setIsAdmin(true);
    }, []);

    const login = (token) => {
        localStorage.setItem("b3at_admin_token", token);
        setIsAdmin(true);
    };

    const logout = () => {
        localStorage.removeItem("b3at_admin_token");
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
