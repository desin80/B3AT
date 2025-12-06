import React, { createContext, useState, useContext, useCallback } from "react";
import { useTranslation } from "react-i18next";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const { t } = useTranslation();
    const showToast = useCallback((message, type = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const [dialog, setDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
    });

    const showConfirm = useCallback((title, message, onConfirm) => {
        setDialog({
            isOpen: true,
            title,
            message,
            onConfirm,
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(async () => {
        if (dialog.onConfirm) {
            await dialog.onConfirm();
        }
        closeConfirm();
    }, [dialog, closeConfirm]);

    return (
        <UIContext.Provider value={{ showToast, showConfirm }}>
            {children}
            <div className="fixed top-20 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[200px] max-w-sm p-4 rounded-lg shadow-lg border-l-4 bg-white/95 backdrop-blur animate-fade-in-up flex items-center justify-between gap-3
                        ${
                            toast.type === "success"
                                ? "border-green-500 text-green-700"
                                : toast.type === "error"
                                ? "border-red-500 text-red-700"
                                : "border-sky-500 text-sky-700"
                        }`}
                    >
                        <span className="text-sm font-medium">
                            {toast.message}
                        </span>
                        <button
                            onClick={() =>
                                setToasts((prev) =>
                                    prev.filter((t) => t.id !== toast.id)
                                )
                            }
                            className="text-gray-400 hover:text-gray-600"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            {dialog.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {dialog.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-6">
                            {dialog.message}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeConfirm}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {t("common.cancel", "Cancel")}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors font-medium"
                            >
                                {t("common.confirm", "Confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);
