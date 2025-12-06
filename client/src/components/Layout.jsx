import React, { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import Footer from "./Footer";
import "./Layout.css";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { isAdmin, logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path
            ? "bg-gray-100 text-sky-600 font-semibold"
            : "hover:bg-gray-200 text-gray-600";
    };

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * 8);
        const imageUrl = `/assets/bg${randomIndex}.jpg`;

        document.body.style.setProperty(
            "--random-bg-image",
            `url('${imageUrl}')`
        );
    }, []);

    return (
        <div className="flex flex-col min-h-screen relative">
            <nav className="fixed top-0 left-0 right-0 z-50 topbar-bg shadow-md">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link
                                to="/"
                                className="flex-shrink-0 transition-opacity hover:opacity-80"
                            >
                                <img
                                    className="h-10 w-auto rounded-md"
                                    src={logo}
                                    alt="Logo"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />
                            </Link>

                            <div className="hidden md:flex space-x-2">
                                <Link
                                    to="/"
                                    className={`px-4 py-2 rounded-md text-sm transition-colors ${isActive(
                                        "/"
                                    )}`}
                                >
                                    {t("nav.home")}
                                </Link>
                                <Link
                                    to="/arena"
                                    className={`px-4 py-2 rounded-md text-sm transition-colors ${isActive(
                                        "/arena"
                                    )}`}
                                >
                                    {t("nav.arena")}
                                </Link>
                                <Link
                                    to="/settings"
                                    className={`px-4 py-2 rounded-md text-sm transition-colors ${isActive(
                                        "/settings"
                                    )}`}
                                >
                                    {t("nav.settings")}
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <LanguageSwitcher />

                            {isAdmin && (
                                <button
                                    onClick={logout}
                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 text-sm transition-all font-medium"
                                >
                                    {t("common.logout", "Logout")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex flex-col container mx-auto max-w-7xl pt-20 md:pt-24 p-4 md:p-8 w-full">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default Layout;
