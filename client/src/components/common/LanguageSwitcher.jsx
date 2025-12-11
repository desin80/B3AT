import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith("zh") ? "en" : "zh";
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-white/50 hover:bg-white/80 rounded-md border border-gray-300 text-sm transition-all"
        >
            {i18n.language.startsWith("zh") ? "English" : "中文"}
        </button>
    );
};

export default LanguageSwitcher;
