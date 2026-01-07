import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";

const CommentItem = ({
    comment,
    onDelete,
    onReply,
    currentReplyId,
    onSubmitReply,
    replyInput,
    setReplyInput,
    isLoading,
}) => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const { showConfirm } = useUI();
    const formatDate = (ts) => new Date(ts * 1000).toLocaleString();

    const isReply = !!comment.parent_id;

    return (
        <div
            className={`relative group ${
                isReply
                    ? "ml-8 mt-2 pl-3 border-l-2 border-gray-100"
                    : "bg-white border border-gray-200 shadow-sm rounded-lg p-3"
            }`}
        >
            <div className="flex justify-between items-baseline mb-1">
                <span
                    className={`text-xs font-bold ${
                        isReply ? "text-gray-600" : "text-sky-700"
                    }`}
                >
                    {comment.username || "Sensei"}
                </span>
                <span className="text-[10px] text-gray-400">
                    {formatDate(comment.created_at)}
                </span>
            </div>

            <p className="text-gray-800 text-sm whitespace-pre-wrap break-all pr-6 mb-1">
                {comment.content}
            </p>

            <div className="flex items-center gap-3">
                {!isReply && (
                    <button
                        onClick={() => onReply(comment.id)}
                        className="text-xs text-sky-500 hover:text-sky-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {t("arena.comments.reply")}
                    </button>
                )}
                {isAdmin && (
                    <button
                        onClick={() => {
                            showConfirm(
                                t("common.delete"),
                                t("arena.comments.delete_confirm"),
                                () => onDelete(comment.id)
                            );
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {t("common.delete")}
                    </button>
                )}
            </div>

            {currentReplyId === comment.id && (
                <div className="mt-3 p-2 bg-gray-50 rounded-md border border-sky-100 animate-fade-in-up">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                            placeholder={t("arena.comments.placeholder")}
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            autoFocus
                            disabled={isLoading}
                            onKeyDown={(e) =>
                                e.key === "Enter" && onSubmitReply(comment.id)
                            }
                        />
                        <button
                            onClick={() => onSubmitReply(comment.id)}
                            disabled={isLoading || !replyInput.trim()}
                            className="bg-sky-500 text-white px-3 py-1 rounded text-xs"
                        >
                            {t("arena.comments.submit")}
                        </button>
                        <button
                            onClick={() => onReply(null)}
                            className="text-gray-500 hover:text-gray-700 px-2 py-1 text-xs"
                        >
                            {t("arena.comments.cancel")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ArenaCommentSection = ({ atkSig, defSig, server }) => {
    const { t } = useTranslation();
    const { showToast } = useUI();
    const [comments, setComments] = useState([]);
    const [mainInput, setMainInput] = useState("");
    const [username, setUsername] = useState("");

    const [replyingTo, setReplyingTo] = useState(null);
    const [replyInput, setReplyInput] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem("b3at_username");
        if (savedName) setUsername(savedName);
        loadComments();
    }, [atkSig, defSig, server]);

    const loadComments = async () => {
        try {
            const data = await api.getComments(atkSig, defSig, server);
            setComments(data);
        } catch (e) {
            console.error(e);
        }
    };

    const structuredComments = useMemo(() => {
        const roots = [];
        const repliesMap = {};

        comments.forEach((c) => {
            if (c.parent_id) {
                if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
                repliesMap[c.parent_id].push(c);
            } else {
                roots.push(c);
            }
        });

        return { roots, repliesMap };
    }, [comments]);

    const handlePost = async (content, parentId = null) => {
        if (!content.trim()) return;
        setIsLoading(true);
        try {
            await api.addComment(
                atkSig,
                defSig,
                server,
                username,
                content,
                parentId
            );
            if (username.trim())
                localStorage.setItem("b3at_username", username);

            if (parentId) {
                setReplyInput("");
                setReplyingTo(null);
            } else {
                setMainInput("");
            }
            showToast(
                t("arena.comments.post_success", "Comment posted"),
                "success"
            );
            loadComments();
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteComment(id);
            setComments((prev) =>
                prev.filter((c) => c.id !== id && c.parent_id !== id)
            );
            showToast(t("common.delete_success", "Deleted"), "success");
        } catch (e) {
            showToast(e.message, "error");
        }
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

            <div className="flex gap-2 mb-6">
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
                    value={mainInput}
                    onChange={(e) => setMainInput(e.target.value)}
                    onKeyDown={(e) =>
                        e.key === "Enter" && handlePost(mainInput)
                    }
                    disabled={isLoading}
                />
                <button
                    onClick={() => handlePost(mainInput)}
                    disabled={isLoading || !mainInput.trim()}
                    className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {t("arena.comments.submit")}
                </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {structuredComments.roots.length === 0 ? (
                    <p className="text-gray-400 text-xs italic text-center py-2">
                        {t("arena.comments.no_comments")}
                    </p>
                ) : (
                    structuredComments.roots.map((root) => (
                        <div key={root.id}>
                            <CommentItem
                                comment={root}
                                onDelete={handleDelete}
                                onReply={setReplyingTo}
                                currentReplyId={replyingTo}
                                onSubmitReply={(parentId) =>
                                    handlePost(replyInput, parentId)
                                }
                                replyInput={replyInput}
                                setReplyInput={setReplyInput}
                                isLoading={isLoading}
                            />

                            {structuredComments.repliesMap[root.id] && (
                                <div className="space-y-2">
                                    {structuredComments.repliesMap[root.id].map(
                                        (reply) => (
                                            <CommentItem
                                                key={reply.id}
                                                comment={reply}
                                                onDelete={handleDelete}
                                                onReply={() => {}}
                                                currentReplyId={null}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ArenaCommentSection;
