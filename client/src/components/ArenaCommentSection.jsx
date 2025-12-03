import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const ArenaCommentSection = ({ atkSig, defSig }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState([]);

    const [inputVal, setInputVal] = useState("");
    const [username, setUsername] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem("kani_username");
        if (savedName) setUsername(savedName);
        loadComments();
    }, [atkSig, defSig]);

    const loadComments = async () => {
        try {
            const data = await api.getComments(atkSig, defSig);
            setComments(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputVal.trim()) return;

        setIsLoading(true);
        try {
            await api.addComment(atkSig, defSig, username, inputVal);

            if (username.trim()) {
                localStorage.setItem("kani_username", username);
            }

            setInputVal("");
            loadComments();
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t("arena.comments.delete_confirm"))) return;
        try {
            await api.deleteComment(id);
            setComments(comments.filter((c) => c.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const formatDate = (ts) => {
        return new Date(ts * 1000).toLocaleString();
    };

    return (
        <div className="w-full bg-gray-50 border-t border-gray-200 p-4 animate-fade-in-up rounded-b-[0.85rem]">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                </svg>
                {t("arena.comments.title")}
            </h4>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    className="w-24 md:w-32 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder={t("arena.comments.placeholder_name")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    maxLength={12}
                />

                <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder={t("arena.comments.placeholder")}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isLoading}
                />

                <button
                    type="submit"
                    disabled={isLoading || !inputVal.trim()}
                    className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {t("arena.comments.submit")}
                </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                    <p className="text-gray-400 text-xs italic text-center py-2">
                        {t("arena.comments.no_comments")}
                    </p>
                ) : (
                    comments.map((c) => (
                        <div
                            key={c.id}
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative group"
                        >
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs font-bold text-sky-700">
                                    {c.username || "Sensei"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {formatDate(c.created_at)}
                                </span>
                            </div>
                            <p className="text-gray-800 text-sm whitespace-pre-wrap break-all pr-6">
                                {c.content}
                            </p>

                            <button
                                onClick={() => handleDelete(c.id)}
                                className="absolute bottom-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title={t("common.delete")}
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
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ArenaCommentSection;
