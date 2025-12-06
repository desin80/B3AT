import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

import attackIcon from "../assets/attack.png";
import defendIcon from "../assets/defend.png";
import vsIcon from "../assets/vs.png";
import cardBg from "../assets/card_bg.png";
import unknownBg from "../assets/card_bg_unknown.png";
import ArenaCommentSection from "./ArenaCommentSection";

const formatTeamStructure = (teamIds) => {
    const strikers = teamIds.filter((id) => String(id).startsWith("1"));
    const specials = teamIds.filter((id) => String(id).startsWith("2"));

    const filledStrikers = [...strikers];
    while (filledStrikers.length < 4) {
        filledStrikers.push(null);
    }

    const filledSpecials = [...specials];
    while (filledSpecials.length < 2) {
        filledSpecials.push(null);
    }

    return {
        strikers: filledStrikers.slice(0, 4),
        specials: filledSpecials.slice(0, 2),
    };
};

const StatWithTooltip = ({
    label,
    value,
    tooltipText,
    colorClass = "text-gray-700",
    bgClass = "",
    icon = null,
    align = "center",
}) => {
    let positionClass = "left-1/2 transform -translate-x-1/2";
    let arrowClass = "left-1/2 transform -translate-x-1/2";

    if (align === "right") {
        positionClass = "right-0 translate-x-0";
        arrowClass = "right-4";
    } else if (align === "left") {
        positionClass = "left-0 translate-x-0";
        arrowClass = "left-4";
    }

    return (
        <div className="group/stat relative flex items-center gap-2 cursor-help z-0 hover:z-50">
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-dotted border-gray-400 hover:border-gray-600 transition-colors">
                    {label}
                </span>
                <span
                    className={`text-sm font-semibold ${colorClass} ${bgClass} ${
                        bgClass ? "px-2 py-0.5 rounded border" : ""
                    }`}
                >
                    {value}
                </span>
                {icon}
            </div>
            <div
                className={`absolute bottom-full mb-2 w-48 p-2 bg-gray-800/95 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/stat:opacity-100 group-hover/stat:visible transition-all duration-200 z-[100] pointer-events-none text-center ${positionClass}`}
            >
                {tooltipText}
                <div
                    className={`absolute top-full border-4 border-transparent border-t-gray-800/95 ${arrowClass}`}
                ></div>
            </div>
        </div>
    );
};

const StudentCard = ({ studentId, isSpecial }) => {
    const bgImage = studentId ? cardBg : unknownBg;

    return (
        <div
            className="rs-char-card"
            title={studentId ? `ID: ${studentId}` : "Empty"}
            style={{ marginLeft: isSpecial ? "0.5rem" : "0" }}
        >
            <div
                className="background-plate"
                style={{ backgroundImage: `url(${bgImage})` }}
            ></div>

            {studentId && (
                <img
                    className="portrait-image"
                    src={`https://schaledb.com/images/student/icon/${studentId}.webp`}
                    alt={studentId}
                    loading="lazy"
                    onError={(e) => {
                        e.target.style.display = "none";
                    }}
                />
            )}
        </div>
    );
};

const TeamAvatars = ({ teamIds }) => {
    const { strikers, specials } = formatTeamStructure(teamIds);

    return (
        <div className="team-avatars" onMouseDown={(e) => e.stopPropagation()}>
            {strikers.map((id, index) => (
                <StudentCard
                    key={`striker-${index}`}
                    studentId={id}
                    isSpecial={false}
                />
            ))}

            {specials.map((id, index) => (
                <StudentCard
                    key={`special-${index}`}
                    studentId={id}
                    isSpecial={index === 0}
                />
            ))}
        </div>
    );
};

const ArenaSummaryCard = ({
    summary,
    onDelete,
    isSelected,
    onClick,
    isChecked,
    onToggleCheck,
}) => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const { showConfirm } = useUI();

    const [showComments, setShowComments] = useState(false);

    const winRate = (summary.winRate * 100).toFixed(0);
    const smoothRate = (summary.avgWinRate * 100).toFixed(1);
    const wilsonScore = (summary.wilsonScore * 100).toFixed(1);
    const isLowSample = summary.total < 30;

    let winRateColorClass = "text-sky-600";
    if (summary.winRate >= 0.6) winRateColorClass = "text-red-600 font-bold";
    else if (summary.winRate <= 0.4) winRateColorClass = "text-blue-600";

    const toggleComments = (e) => {
        e.stopPropagation();
        setShowComments(!showComments);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        showConfirm(
            t("common.delete_confirm", "Delete Record"),
            t(
                "arena.delete_warning",
                "Are you sure you want to delete this record?"
            ),
            () => onDelete(summary.atk_sig, summary.def_sig, summary.server)
        );
    };

    const handleCardClick = (e) => {
        if (isAdmin && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            e.stopPropagation();
            onToggleCheck(summary, !isChecked);
        } else {
            if (onClick) onClick(e);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`arena-card flex flex-col items-start p-0 transition-all duration-200 cursor-pointer relative group/card select-none
                ${
                    isChecked
                        ? "ring-2 ring-red-500 bg-red-50/50"
                        : isSelected
                        ? "selected-highlight"
                        : ""
                }
            `}
            title={
                isAdmin ? "Hold Ctrl + Click to select for batch delete" : ""
            }
        >
            {isAdmin && (
                <button
                    onClick={handleDeleteClick}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm border border-gray-200 opacity-0 group-hover/card:opacity-100 transition-all duration-200"
                    title="Delete Summary"
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
            )}

            <div className="flex items-center w-full px-5 py-3">
                <div className="team-display-container">
                    <TeamAvatars teamIds={summary.attackingTeam} />
                    <div className="icon-display attacking-icon">
                        <img src={attackIcon} alt="Attacking" />
                    </div>
                </div>

                <div className="vs-icon">
                    <img src={vsIcon} alt="VS" />
                </div>

                <div className="team-display-container">
                    <div className="icon-display defending-icon">
                        <img src={defendIcon} alt="Defending" />
                    </div>
                    <TeamAvatars teamIds={summary.defendingTeam} />
                </div>

                <div className="summary-stats">
                    <p className="wins-losses text-gray-700 whitespace-nowrap text-sm mb-0.5">
                        {t("arena.recordStat", {
                            wins: summary.wins,
                            losses: summary.losses,
                        })}
                    </p>
                    <p
                        className={`win-rate ${winRateColorClass} whitespace-nowrap text-2xl`}
                    >
                        {winRate}%
                    </p>
                </div>
            </div>

            <div
                className={`w-full bg-gray-100/40 border-t border-gray-300/60 px-5 py-2 flex items-center justify-between ${
                    showComments ? "" : "rounded-b-[0.85rem]"
                }`}
            >
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wide">
                            {t(
                                `arena.servers.${(
                                    summary.server || "global"
                                ).toLowerCase()}`
                            )}
                        </span>
                    </div>

                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-md border border-sky-100 shadow-sm"
                        title={t("arena.season")}
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-wide">
                            {summary.season ? `S${summary.season}` : "S?"}
                        </span>
                    </div>

                    {summary.tag && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 shadow-sm"
                            title="Strategy Tag"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                            </svg>
                            <span className="text-xs font-bold">
                                {t(`arena.tags.${summary.tag}`)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <StatWithTooltip
                        label={t("arena.stats.label_sample")}
                        value={summary.total}
                        tooltipText={t("arena.stats_desc.sample")}
                        bgClass="bg-white/60 font-mono border-gray-200"
                        icon={
                            isLowSample && (
                                <span
                                    className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 cursor-help"
                                    title={t("arena.stats.low_sample_warning")}
                                >
                                    {t("arena.stats.low_sample_warning")}
                                </span>
                            )
                        }
                    />

                    <div className="w-px h-4 bg-gray-400/40"></div>

                    <StatWithTooltip
                        label={t("arena.stats.label_posterior")}
                        value={`${smoothRate}%`}
                        tooltipText={t("arena.stats_desc.posterior")}
                    />

                    <div className="w-px h-4 bg-gray-400/40"></div>

                    <StatWithTooltip
                        label={t("arena.stats.label_wilson")}
                        value={`${wilsonScore}%`}
                        tooltipText={t("arena.stats_desc.wilson")}
                        colorClass="text-purple-700 font-bold"
                        align="right"
                    />
                    <div className="w-px h-4 bg-gray-400/40"></div>

                    <button
                        onClick={toggleComments}
                        className={`p-1.5 rounded-md transition-colors ${
                            showComments
                                ? "bg-sky-100 text-sky-600"
                                : "hover:bg-gray-200 text-gray-500"
                        }`}
                        title={t("arena.comments.title")}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            {showComments && (
                <ArenaCommentSection
                    server={summary.server}
                    atkSig={summary.atk_sig}
                    defSig={summary.def_sig}
                />
            )}
        </div>
    );
};

export default ArenaSummaryCard;
