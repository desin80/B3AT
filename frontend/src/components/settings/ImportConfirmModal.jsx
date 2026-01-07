import React from "react";

const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ImportConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    file,
    defaults,
    t,
}) => {
    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {t("settings.import_section.confirm_title")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
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
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex items-start gap-3">
                        <svg
                            className="w-6 h-6 text-sky-500 mt-0.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <div>
                            <p className="font-bold text-gray-800 text-sm break-all">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        {t("settings.import_section.confirm_desc")}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-gray-400 text-xs uppercase font-bold mb-1">
                                {t("settings.manual_section.server")}
                            </span>
                            <span className="font-bold text-gray-800">
                                {t(
                                    `settings.manual_section.server_${defaults.server}`
                                )}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-gray-400 text-xs uppercase font-bold mb-1">
                                {t("settings.manual_section.season")}
                            </span>
                            <span className="font-bold text-gray-800">
                                S{defaults.season}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold shadow-md transition-all active:scale-95"
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportConfirmModal;
