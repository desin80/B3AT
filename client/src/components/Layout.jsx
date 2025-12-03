import React, { useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Layout.css";

const Layout = () => {
    const { t } = useTranslation();

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * 8);
        const imageUrl = `/assets/bg${randomIndex}.jpg`;

        document.body.style.setProperty(
            "--random-bg-image",
            `url('${imageUrl}')`
        );
    }, []);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 topbar-bg shadow-md">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <Link
                                        to="/"
                                        className="hover:bg-gray-200 px-3 py-2 rounded-md topbar-title transition-colors text-gray-800"
                                    >
                                        {t("nav.home")}
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <Link
                                        to="/arena"
                                        className="hover:bg-gray-200 px-3 py-2 rounded-md topbar-title transition-colors text-gray-800"
                                    >
                                        {t("nav.arena")}
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <Link
                                        to="/settings"
                                        className="hover:bg-gray-200 px-3 py-2 rounded-md topbar-title transition-colors text-gray-800"
                                    >
                                        {t("nav.settings")}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto max-w-7xl pt-20 md:pt-24 p-4 md:p-8 flex flex-col min-h-screen">
                <Outlet />
            </main>
        </>
    );
};

export default Layout;
