import React from "react";
import { useTranslation } from "react-i18next";

const LoadingSpinner = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[60vh]">
            <div className="w-16 h-16 border-[5px] border-gray-200 border-t-sky-500 rounded-full animate-spin"></div>
            <p className="mt-6 text-gray-400 font-semibold text-lg animate-pulse tracking-wide">
                {t("common.loading")}
            </p>
        </div>
    );
};

export default LoadingSpinner;
