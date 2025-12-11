import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./HomePage.css";

import arenaIcon from "../../assets/attack.png";

const HomePage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex-grow flex flex-col items-center justify-center relative p-5 animate-fade-in-up">
            <div className="text-center mb-12 relative z-10">
                <h2 className="text-lg md:text-xl font-bold text-sky-600 tracking-[0.2em] uppercase mb-1 font-[nexonFont]">
                    Blue Archive
                </h2>

                <h1 className="text-4xl md:text-6xl font-black text-gray-800 font-[nexonFont] drop-shadow-sm p-2 leading-tight">
                    <span className="inline-block text-sky-600 pr-2">
                        Arena
                    </span>{" "}
                    Analysis Tool
                </h1>

                <div className="w-24 h-1 bg-sky-400 mx-auto mt-4 rounded-full opacity-60"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4">
                <Link to="/arena" className="block group">
                    <button className="shortcut-button relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <img
                                src={arenaIcon}
                                className="w-32 h-32 transform rotate-12"
                                alt="bg-deco"
                            />
                        </div>
                        <div className="shortcut-button-content relative z-10">
                            <img
                                className="shortcut-icon group-hover:scale-110 transition-transform duration-300 shadow-md"
                                src={arenaIcon}
                                alt="Arena"
                            />
                            <div className="shortcut-text-content">
                                <h5 className="shortcut-title group-hover:text-sky-600 transition-colors text-2xl">
                                    {t("home.arena.title")}
                                </h5>
                                <p className="shortcut-description text-base mt-1">
                                    {t("home.arena.description")}
                                </p>
                            </div>
                        </div>
                    </button>
                </Link>

                <Link to="/settings" className="block group">
                    <button className="shortcut-button relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg
                                className="w-32 h-32 text-gray-800 transform -rotate-12"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="shortcut-button-content relative z-10">
                            <div className="shortcut-icon group-hover:scale-110 transition-transform duration-300 shadow-md flex items-center justify-center bg-gray-100 text-gray-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="shortcut-text-content">
                                <h5 className="shortcut-title group-hover:text-gray-800 transition-colors text-2xl">
                                    {t("nav.settings")}
                                </h5>
                                <p className="shortcut-description text-base mt-1">
                                    {t("settings.description") ||
                                        "Import Data & Manage DB"}
                                </p>
                            </div>
                        </div>
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
