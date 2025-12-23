import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("b3at_admin_token");
        const storedRole = localStorage.getItem("b3at_role");
        if (token) {
            const effectiveRole = storedRole || "admin"; // backward compatibility
            setRole(effectiveRole);
            setIsAdmin(effectiveRole === "admin");
        } else {
            setIsAdmin(false);
            setRole(null);
        }
    }, []);

    const login = (token, userRole = "admin") => {
        localStorage.setItem("b3at_admin_token", token);
        localStorage.setItem("b3at_role", userRole);
        setIsAdmin(userRole === "admin");
        setRole(userRole);
    };

    const logout = () => {
        localStorage.removeItem("b3at_admin_token");
        localStorage.removeItem("b3at_role");
        setIsAdmin(false);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ isAdmin, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
