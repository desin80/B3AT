import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import api from "../../services/api";

import attackIcon from "../../assets/attack.png";
import defendIcon from "../../assets/defend.png";
import vsIcon from "../../assets/vs.png";
import cardBg from "../../assets/card_bg.png";
import unknownBg from "../../assets/card_bg_unknown.png";
import charStarIcon from "../../assets/char_star.png";
import weaponStarIcon from "../../assets/weapon_star.png";
import ArenaCommentSection from "./ArenaCommentSection";
import LoadingSpinner from "../common/LoadingSpinner";

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

const LoadoutBadge = ({ star = 0, weaponStar = 0 }) => {
    const hasWeapon = weaponStar > 0;
    return (
        <div
            className={`loadout-badge ${hasWeapon ? "has-weapon" : ""}`}
            title={`★${star}${hasWeapon ? ` / W★${weaponStar}` : ""}`}
        >
            <div className="loadout-layer char-layer">
                <img src={charStarIcon} alt="Star" className="loadout-icon" />
                <span className="loadout-value">{star}</span>
            </div>
            {hasWeapon && (
                <div className="loadout-layer weapon-layer">
                    <img
                        src={weaponStarIcon}
                        alt="Weapon Star"
                        className="loadout-icon"
                    />
                    <span className="loadout-value">{weaponStar}</span>
                </div>
            )}
        </div>
    );
};

const StudentCard = ({ studentId, isSpecial, loadout }) => {
    const bgImage = studentId ? cardBg : unknownBg;

    const star = loadout?.star ?? 0;
    const weaponStar = loadout?.weapon_star ?? 0;

    return (
        <div
            className="rs-char-card"
            title={
                studentId
                    ? `ID: ${studentId}${
                          loadout
                              ? `\nStar: ${star}\nWeapon: ${weaponStar}`
                              : ""
                      }`
                    : "Empty"
            }
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
            {studentId && loadout && (
                <LoadoutBadge star={star} weaponStar={weaponStar} />
            )}
        </div>
    );
};

const TeamAvatars = ({ teamIds, loadouts }) => {
    const { strikers, specials } = formatTeamStructure(teamIds);

    const loadoutMap = useMemo(() => {
        const map = {};
        (loadouts || []).forEach((entry) => {
            map[entry.id] = entry;
        });
        return map;
    }, [loadouts]);

    return (
        <div className="team-avatars" onMouseDown={(e) => e.stopPropagation()}>
            {strikers.map((id, index) => (
                <StudentCard
                    key={`striker-${index}`}
                    studentId={id}
                    isSpecial={false}
                    loadout={loadoutMap[id]}
                />
            ))}

            {specials.map((id, index) => (
                <StudentCard
                    key={`special-${index}`}
                    studentId={id}
                    isSpecial={index === 0}
                    loadout={loadoutMap[id]}
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
    onRefreshSummary,
}) => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const { showConfirm, showToast } = useUI();

    const [showComments, setShowComments] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [hasLoadedDetail, setHasLoadedDetail] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState(new Set());
    const [detailPage, setDetailPage] = useState(1);
    const [detailSort, setDetailSort] = useState("default");
    const [detailTotalPages, setDetailTotalPages] = useState(0);

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
            () =>
                onDelete(
                    summary.atk_sig,
                    summary.def_sig,
                    summary.server,
                    summary.season,
                    summary.tag || ""
                )
        );
    };

    const DETAIL_PAGE_SIZE = 20;

    const loadDetails = async (page = detailPage, sort = detailSort) => {
        setIsLoadingDetail(true);
        try {
            const res = await api.getSummaryDetails(
                summary.atk_sig,
                summary.def_sig,
                summary.server || "global",
                summary.season || null,
                summary.tag || null,
                page,
                DETAIL_PAGE_SIZE,
                sort
            );
            setDetails(res.data || []);
            setHasLoadedDetail(true);
            setSelectedDetails(new Set());
            setDetailPage(page);
            setDetailSort(sort);
            setDetailTotalPages(res.totalPages || 0);
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to load details", "error");
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCardClick = (e) => {
        if (isAdmin && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            e.stopPropagation();
            onToggleCheck(summary, !isChecked);
            return;
        }
        if (onClick) onClick(e);

        const nextExpanded = !isExpanded;
        setIsExpanded(nextExpanded);
        if (nextExpanded && !hasLoadedDetail && !isLoadingDetail) {
            loadDetails(1, detailSort);
        }
    };

    const toggleDetailSelect = (hash) => {
        const next = new Set(selectedDetails);
        if (next.has(hash)) next.delete(hash);
        else next.add(hash);
        setSelectedDetails(next);
    };

    const stopDetailClick = (e) => {
        e.stopPropagation();
    };

    const handleDeleteDetails = () => {
        if (selectedDetails.size === 0) return;
        showConfirm(
            t("common.delete_confirm", "Delete Record"),
            t("arena.delete_warning", "Are you sure you want to delete this record?"),
            async () => {
                try {
                    const items = Array.from(selectedDetails).map((hash) => ({
                        server: summary.server,
                        season: summary.season,
                        tag: summary.tag || "",
                        atk_sig: summary.atk_sig,
                        def_sig: summary.def_sig,
                        loadout_hash: hash,
                    }));
                    await api.deleteSummaryDetails(items);
                    showToast(t("common.delete_success"), "success");
                    setSelectedDetails(new Set());
                    await loadDetails(detailPage, detailSort);
                    if (onRefreshSummary) {
                        onRefreshSummary();
                    }
                } catch (err) {
                    showToast(err.message || "Delete failed", "error");
                }
            }
        );
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
            {isExpanded && (
                <div
                    className={`w-full bg-white/80 border-t border-gray-200 px-4 py-3 space-y-3 ${
                        showComments ? "" : "rounded-b-[0.85rem]"
                    }`}
                >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <svg
                                className="w-4 h-4 text-sky-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c1.657 0 3-.843 3-1.882C15 5.077 13.657 4 12 4s-3 1.077-3 2.118C9 7.157 10.343 8 12 8zm0 0v12m0-12c-3.866 0-7 1.79-7 4v2m7-6c3.866 0 7 1.79 7 4v2m-7 6c-3.866 0-7-1.79-7-4v-2m7 6c3.866 0 7-1.79 7-4v-2"
                                />
                            </svg>
                            {t("arena.detail.title", "Loadout Details")}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600" onClick={stopDetailClick}>
                            <select
                                className="border border-gray-300 rounded px-2 py-1 bg-white"
                                value={detailSort}
                                onChange={(e) => loadDetails(1, e.target.value)}
                                onClick={stopDetailClick}
                            >
                                <option value="composite">
                                    {t("arena.sort.composite")}
                                </option>
                                <option value="default">
                                    {t("arena.sort.default")}
                                </option>
                                <option value="win_rate_desc">
                                    {t("arena.sort.winRateDesc")}
                                </option>
                                <option value="win_rate_asc">
                                    {t("arena.sort.winRateAsc")}
                                </option>
                                <option value="newest">
                                    {t("arena.sort.newest")}
                                </option>
                            </select>
                            {detailTotalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            stopDetailClick(e);
                                            loadDetails(
                                                Math.max(1, detailPage - 1),
                                                detailSort
                                            );
                                        }}
                                        className="px-2 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                                        disabled={detailPage <= 1 || isLoadingDetail}
                                    >
                                        {t("common.prev")}
                                    </button>
                                    <span className="text-gray-500">
                                        {detailPage}/{detailTotalPages}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            stopDetailClick(e);
                                            loadDetails(
                                                Math.min(detailTotalPages, detailPage + 1),
                                                detailSort
                                            );
                                        }}
                                        className="px-2 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                                        disabled={
                                            detailPage >= detailTotalPages || isLoadingDetail
                                        }
                                    >
                                        {t("common.next")}
                                    </button>
                                </div>
                            )}
                            {isLoadingDetail && (
                                <span className="text-[11px] text-gray-400">
                                    {t("common.loading", "Loading...")}
                                </span>
                            )}
                        </div>
                    </div>

                    {isLoadingDetail ? (
                        <div className="py-4">
                            <LoadingSpinner />
                        </div>
                    ) : details.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-3">
                            {t(
                                "arena.detail.empty",
                                "No detailed loadouts yet."
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {isAdmin && selectedDetails.size > 0 && (
                                <div className="flex justify-end" onClick={stopDetailClick}>
                                    <button
                                        onClick={handleDeleteDetails}
                                        className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                                    >
                                        {t("arena.batch.delete_selected", "Delete Selected")}
                                    </button>
                                </div>
                            )}
                            {details.map((item, idx) => {
                                const winRateDetail =
                                    item.total > 0
                                        ? Math.round(
                                              (item.wins / item.total) * 100
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={`${item.loadout_hash}-${idx}`}
                                        className={`bg-sky-50/40 border border-sky-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm ${
                                            selectedDetails.has(item.loadout_hash)
                                                ? "ring-2 ring-red-400"
                                                : ""
                                        }`}
                                        onClick={(e) => {
                                            stopDetailClick(e);
                                            if (isAdmin) toggleDetailSelect(item.loadout_hash);
                                        }}
                                    >
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <div className="font-semibold text-gray-700">
                                                {t(
                                                    "arena.detail.loadout_label",
                                                    "Loadout"
                                                )}{" "}
                                                #{idx + 1}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-gray-700">
                                                        {t("arena.recordStat", {
                                                            wins: item.wins,
                                                            losses: item.losses,
                                                        })}
                                                    </span>
                                                    <span className="font-semibold text-sky-700 text-lg">
                                                        {winRateDetail}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="team-display-container">
                                                    <TeamAvatars
                                                        teamIds={item.attackingTeam}
                                                        loadouts={item.atk_loadout}
                                                    />
                                                <div className="icon-display attacking-icon">
                                                    <img
                                                        src={attackIcon}
                                                        alt="Attacking"
                                                    />
                                                </div>
                                            </div>

                                            <div className="vs-icon">
                                                <img src={vsIcon} alt="VS" />
                                            </div>

                                            <div className="team-display-container">
                                                <div className="icon-display defending-icon">
                                                    <img
                                                        src={defendIcon}
                                                        alt="Defending"
                                                    />
                                                </div>
                                                <TeamAvatars
                                                    teamIds={item.defendingTeam}
                                                    loadouts={item.def_loadout}
                                                />
                                            </div>

                                            <div className="ml-auto flex flex-col gap-1 text-xs text-gray-600">
                                                <div className="flex items-center justify-between min-w-[170px] px-3 py-1 rounded bg-white border border-gray-200">
                                                    <span className="text-[11px] text-gray-500">
                                                        {t("arena.stats.label_sample")}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">
                                                        {item.total}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between min-w-[170px] px-3 py-1 rounded bg-white border border-gray-200">
                                                    <span className="text-[11px] text-gray-500">
                                                        {t("arena.stats.label_wilson")}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">
                                                        {(item.wilsonScore * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between min-w-[170px] px-3 py-1 rounded bg-white border border-gray-200">
                                                    <span className="text-[11px] text-gray-500">
                                                        {t("arena.stats.label_posterior")}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">
                                                        {(item.avgWinRate * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
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
