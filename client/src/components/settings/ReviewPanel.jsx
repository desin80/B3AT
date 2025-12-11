import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUI } from "../../context/UIContext";
import api from "../../services/api";
import attackIcon from "../../assets/attack.png";
import defendIcon from "../../assets/defend.png";

const ReviewPanel = ({ onRefresh, studentMap }) => {
    const { t } = useTranslation();
    const { showToast, showConfirm } = useUI();
    const [activeTab, setActiveTab] = useState("pending");
    const [list, setList] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await api.getSubmissions();
            setList(data);
        } catch (e) {
            console.error(e);
            showToast("Failed to load pending submissions", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getSubmissionHistory();
            setHistoryList(data);
        } catch (e) {
            console.error(e);
            showToast("Failed to load history", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "pending") {
            fetchPending();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const handleAction = (item, action) => {
        const isApprove = action === "approve";
        showConfirm(
            isApprove
                ? t("settings.review_panel.approve")
                : t("settings.review_panel.reject"),
            isApprove
                ? t("settings.review_panel.confirm_approve", {
                      count: item.wins + item.losses,
                  })
                : t("settings.review_panel.confirm_reject"),
            async () => {
                try {
                    if (isApprove) await api.approveSubmission(item.id);
                    else await api.rejectSubmission(item.id);

                    showToast(
                        isApprove
                            ? t("settings.review_panel.approved_success")
                            : t("settings.review_panel.rejected_success"),
                        "success"
                    );
                    fetchPending();
                    if (isApprove) onRefresh();
                } catch (e) {
                    showToast(e.message, "error");
                }
            }
        );
    };

    const handleRevert = (item) => {
        const isApproved = item.status === "approved";

        showConfirm(
            t("settings.review_panel.revert_title", "Revert Submission"),
            isApproved
                ? t("settings.review_panel.revert_confirm")
                : t("settings.review_panel.revert_confirm_rejected"),
            async () => {
                try {
                    await api.revertSubmission(item.id);
                    showToast(
                        t(
                            "settings.review_panel.revert_success",
                            "Reverted successfully"
                        ),
                        "success"
                    );
                    fetchHistory();

                    if (isApproved) {
                        onRefresh();
                    }
                } catch (e) {
                    showToast(e.message, "error");
                }
            }
        );
    };

    const API_ROOT = useMemo(() => {
        const envUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        return envUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    }, []);

    const renderTeamImages = (teamIds) => {
        return (
            <div className="flex gap-1 flex-wrap">
                {teamIds.map((id, idx) => {
                    if (!id) return null;
                    const student = studentMap[id];
                    const isSpecial = idx >= 4;

                    return (
                        <div
                            key={idx}
                            className={`w-9 h-9 rounded border border-gray-200 overflow-hidden bg-white relative group
                                ${isSpecial && idx === 4 ? "ml-2" : ""}
                            `}
                            title={student ? student.Name : id}
                        >
                            <img
                                src={`https://schaledb.com/images/student/icon/${id}.webp`}
                                className="w-full h-full object-cover"
                                alt=""
                                loading="lazy"
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderItem = (item, isHistory) => (
        <div
            key={item.id}
            className={`bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all
                ${
                    isHistory && item.status === "rejected"
                        ? "border-red-200 opacity-75"
                        : "border-gray-200"
                }
                ${
                    isHistory && item.status === "approved"
                        ? "border-green-200"
                        : ""
                }
            `}
        >
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center gap-2">
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-gray-500 items-center">
                    {isHistory && (
                        <span
                            className={`px-2 py-0.5 rounded border shadow-sm uppercase ${
                                item.status === "approved"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                            }`}
                        >
                            {t(`settings.review_panel.status_${item.status}`)}
                        </span>
                    )}

                    <span className="px-2 py-0.5 bg-white rounded border border-gray-200 shadow-sm">
                        {t(`settings.manual_section.server_${item.server}`)}
                    </span>
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded border border-sky-100 shadow-sm">
                        S{item.season}
                    </span>
                    {item.tag && (
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded border border-yellow-100 shadow-sm">
                            {t(`settings.manual_section.${item.tag}`)}
                        </span>
                    )}
                    <span className="text-gray-400 font-normal normal-case ml-1">
                        {new Date(item.created_at * 1000).toLocaleString()}
                    </span>
                </div>

                <div className="flex gap-2">
                    {!isHistory ? (
                        <>
                            <button
                                onClick={() => handleAction(item, "approve")}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                            >
                                {t("settings.review_panel.approve")}
                            </button>
                            <button
                                onClick={() => handleAction(item, "reject")}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                            >
                                {t("settings.review_panel.reject")}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleRevert(item)}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1"
                            title="Revert to Pending"
                        >
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
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                />
                            </svg>
                            {t("settings.review_panel.revert", "Revert")}
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 flex flex-col md:flex-row gap-4 items-start">
                {item.image_path && (
                    <div
                        className="w-full md:w-32 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden cursor-pointer border border-gray-200 group relative"
                        onClick={() =>
                            window.open(
                                `${API_ROOT}${item.image_path}`,
                                "_blank"
                            )
                        }
                    >
                        <img
                            src={`${API_ROOT}${item.image_path}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            alt="proof"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-white text-xs font-bold drop-shadow-md">
                                View
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            {item.wins} {t("settings.manual_section.win_short")}
                        </span>
                        <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            {item.losses}{" "}
                            {t("settings.manual_section.loss_short")}
                        </span>
                    </div>
                    {item.note && (
                        <div className="bg-amber-50 p-2.5 rounded text-xs text-gray-700 border border-amber-100 flex gap-2 w-full">
                            <span className="italic">"{item.note}"</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-4 pt-0">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                            <img
                                src={attackIcon}
                                className="w-3 h-3 opacity-60"
                                alt=""
                            />
                            {t("settings.manual_section.atk")}
                        </div>
                        {renderTeamImages(item.atk_team)}
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                            <img
                                src={defendIcon}
                                className="w-3 h-3 opacity-60"
                                alt=""
                            />
                            {t("settings.manual_section.def")}
                        </div>
                        {renderTeamImages(item.def_team)}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white/70 backdrop-blur-md border border-orange-200 rounded-xl shadow-sm mb-8 animate-fade-in-up overflow-hidden">
            <div className="flex border-b border-orange-100 bg-orange-50/50">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${
                        activeTab === "pending"
                            ? "border-orange-500 text-orange-700 bg-white"
                            : "border-transparent text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                >
                    {t("settings.review_panel.tab_pending", "Pending Reviews")}
                    {list.length > 0 && (
                        <span className="ml-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-xs">
                            {list.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${
                        activeTab === "history"
                            ? "border-orange-500 text-orange-700 bg-white"
                            : "border-transparent text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                >
                    {t("settings.review_panel.tab_history", "History Log")}
                </button>
            </div>

            <div className="p-6">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <p className="text-gray-400 text-center py-4">
                            {t("common.loading", "Loading...")}
                        </p>
                    ) : activeTab === "pending" ? (
                        list.length === 0 ? (
                            <p className="text-gray-400 italic text-center py-4">
                                {t("settings.review_panel.empty")}
                            </p>
                        ) : (
                            list.map((item) => renderItem(item, false))
                        )
                    ) : historyList.length === 0 ? (
                        <p className="text-gray-400 italic text-center py-4">
                            {t(
                                "settings.review_panel.history_empty",
                                "No history found."
                            )}
                        </p>
                    ) : (
                        historyList.map((item) => renderItem(item, true))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewPanel;
