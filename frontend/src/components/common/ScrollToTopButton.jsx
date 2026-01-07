import React, { useState, useEffect } from "react";

const ScrollToTopButton = ({ t }) => {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 z-40 p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-xl transition-all duration-300 transform border border-sky-400/50 backdrop-blur-sm
                ${
                    showScrollTop
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10 pointer-events-none"
                }
            `}
            title={t?.("common.back_to_top") || "Back to Top"}
        >
            <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
            </svg>
        </button>
    );
};

export default ScrollToTopButton;
