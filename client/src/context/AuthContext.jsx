import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState(null);
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("b3at_admin_token");
        const storedRole = localStorage.getItem("b3at_role");
        const storedUsername = localStorage.getItem("b3at_username");
        if (token) {
            const effectiveRole = storedRole || "admin"; // backward compatibility
            setRole(effectiveRole);
            setIsAdmin(effectiveRole === "admin");
            setUsername(storedUsername || null);
        } else {
            setIsAdmin(false);
            setRole(null);
            setUsername(null);
        }
    }, []);

    const login = (token, userRole = "admin", userName = null) => {
        localStorage.setItem("b3at_admin_token", token);
        localStorage.setItem("b3at_role", userRole);
        if (userName) {
            localStorage.setItem("b3at_username", userName);
            setUsername(userName);
        }
        setIsAdmin(userRole === "admin");
        setRole(userRole);
    };

    const logout = () => {
        localStorage.removeItem("b3at_admin_token");
        localStorage.removeItem("b3at_role");
        localStorage.removeItem("b3at_username");
        setIsAdmin(false);
        setRole(null);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{ isAdmin, role, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
