import React from "react";

const ArenaBatchAction = ({
    t,
    selectedSet,
    setSelectedSet,
    handleSelectAllPage,
    handleBatchDelete,
    summaries,
    getItemKey,
}) => {
    if (selectedSet.size === 0) return null;

    const isAllPageSelected =
        summaries.length > 0 &&
        summaries.every((item) => selectedSet.has(getItemKey(item)));

    return (
        <div className="fixed bottom-6 left-0 right-0 mx-auto w-[90%] max-w-2xl z-[60] animate-fade-in-up">
            <div className="bg-gray-900/90 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center justify-between border border-gray-700">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-red-400">
                        {selectedSet.size}
                    </span>
                    <span className="text-sm text-gray-300">
                        {t("arena.batch.selected")}
                    </span>

                    <div className="h-4 w-px bg-gray-600 mx-2"></div>

                    <button
                        onClick={handleSelectAllPage}
                        className="text-sm text-gray-300 hover:text-white underline decoration-dotted"
                    >
                        {isAllPageSelected
                            ? t("arena.batch.deselect_page")
                            : t("arena.batch.select_page")}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedSet(new Set())}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={handleBatchDelete}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        {t("arena.batch.delete_selected")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArenaBatchAction;
