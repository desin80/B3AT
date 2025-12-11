import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
    const { t } = useTranslation();

    const GITHUB_REPO_URL = "https://github.com/desin80/B3AT";
    const GITHUB_PROFILE_URL = "https://github.com/desin80";

    return (
        <footer className="w-full bg-white/70 backdrop-blur-md border-t border-gray-200 mt-auto z-40">
            <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <div className="text-center md:text-left space-y-1">
                        <p className="font-medium text-gray-700">
                            Made by{" "}
                            <a
                                href={GITHUB_PROFILE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-sky-600 transition-colors"
                            >
                                desin80
                            </a>
                        </p>
                        <p className="text-xs text-gray-400">
                            {t(
                                "common.footer.disclaimer",
                                "Fan-made project. Not affiliated with NEXON Games / Yostar."
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <a
                            href={GITHUB_REPO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-black transition-colors flex items-center gap-1.5 group"
                            aria-label="GitHub Repository"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="group-hover:underline">
                                GitHub
                            </span>
                        </a>

                        <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                        <a
                            href="https://schaledb.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-sky-600 transition-colors flex items-center gap-1.5 group"
                        >
                            <span className="group-hover:underline">
                                {t("common.footer.data_source", "Data Source")}:
                                SchaleDB
                            </span>
                            <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
