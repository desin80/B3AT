import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/Home/HomePage";
import ArenaPage from "./pages/Arena/ArenaPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import LoginPage from "./pages/Login/LoginPage";
import ResetPage from "./pages/Reset/ResetPage";
import UserAdminPage from "./pages/Admin/UserAdminPage";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";

function App() {
    return (
        <UIProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<HomePage />} />
                            <Route path="arena" element={<ArenaPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="reset" element={<ResetPage />} />
                            <Route path="admin/users" element={<UserAdminPage />} />
                            <Route
                                path="*"
                                element={
                                    <div className="text-center p-10">
                                        404 Not Found
                                    </div>
                                }
                            />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </UIProvider>
    );
}

export default App;
