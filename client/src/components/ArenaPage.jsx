import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import ArenaSummaryCard from "../components/ArenaSummaryCard";
import Pagination from "../components/Pagination";
import ArenaFilterPanel from "../components/ArenaFilterPanel";
import StudentSelectorModal from "../components/StudentSelectorModal";
import "./ArenaPage.css";

const ITEMS_PER_PAGE = 20;

const ArenaPage = () => {
    const { t, i18n } = useTranslation();

    const [summaries, setSummaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [studentList, setStudentList] = useState([]);
    const [ignoreSpecials, setIgnoreSpecials] = useState(false);
    const [season, setSeason] = useState(null);
    const [seasonsList, setSeasonsList] = useState([]);
    const [sort, setSort] = useState("default");
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({});
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorCallback, setSelectorCallback] = useState(null);
    const [modalFilterType, setModalFilterType] = useState("all");
    const [server, setServer] = useState("all");

    useEffect(() => {
        const loadMeta = async () => {
            const [sList, stuList] = await Promise.all([
                api.getSeasons(server),
                api.getAllStudents(i18n.language),
            ]);
            setSeasonsList(sList);
            setStudentList(stuList);
            if (season && !sList.includes(season)) {
                setSeason(null);
            }
        };
        loadMeta();
    }, [i18n.language, server]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const queryFilters = {
                season,
                ...filters,
            };

            const data = await api.getArenaSummaries(
                page,
                queryFilters,
                ITEMS_PER_PAGE,
                sort,
                ignoreSpecials,
                server
            );
            setSummaries(data.data);
            setTotalCount(data.total);
        } catch (error) {
            console.error("Error loading arena data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, season, sort, filters, ignoreSpecials, server]);

    const handleOpenSelector = (callback, index) => {
        setSelectorCallback(() => callback);
        if (index !== undefined && index !== null) {
            setModalFilterType(index < 4 ? "striker" : "special");
        } else {
            setModalFilterType("all");
        }
        setIsSelectorOpen(true);
    };

    return (
        <div className="w-full">
            {/* Filter Toggle Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 bg-white/50 p-4 rounded-lg border border-gray-200 backdrop-blur-sm gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {t("arena.title")}
                    </h2>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`text-sm px-3 py-1.5 rounded-md border transition-all flex items-center gap-2 ${
                            showFilter
                                ? "bg-sky-50 border-sky-200 text-sky-700"
                                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
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
                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            />
                        </svg>
                        {t("arena.filter.filter") || "Filter"}
                        {Object.keys(filters).length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        )}
                    </button>

                    <div className="flex items-center gap-2 ml-2 bg-white px-3 py-1.5 rounded-md border border-gray-300 shadow-sm">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={ignoreSpecials}
                                onChange={(e) => {
                                    setIgnoreSpecials(e.target.checked);
                                    setPage(1);
                                }}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                            <span className="ml-2 text-sm font-medium text-gray-700 select-none">
                                {t("arena.filter.ignore_specials")}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">
                            {t("arena.server")}
                        </span>
                        <select
                            className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                            value={server}
                            onChange={(e) => {
                                setServer(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">
                                {t("common.all") || "All"}
                            </option>
                            <option value="global">
                                {t("arena.server_global")}
                            </option>
                            <option value="jp">{t("arena.server_jp")}</option>
                            <option value="cn">{t("arena.server_cn")}</option>
                        </select>
                    </div>

                    <span className="text-xs font-bold text-gray-500 uppercase">
                        {t("arena.season")}
                    </span>
                    <select
                        className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                        value={season || ""}
                        onChange={(e) => {
                            setSeason(
                                e.target.value ? parseInt(e.target.value) : null
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            {t("arena.all_seasons") || "All Seasons"}
                        </option>
                        {seasonsList.map((s) => (
                            <option key={s} value={s}>
                                S{s}
                            </option>
                        ))}
                    </select>

                    <select
                        className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            setPage(1);
                        }}
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
                        <option value="newest">{t("arena.sort.newest")}</option>
                    </select>
                </div>
            </div>

            {showFilter && (
                <ArenaFilterPanel
                    filters={filters}
                    onChange={(newFilters) => {
                        setFilters(newFilters);
                        setPage(1);
                    }}
                    studentList={studentList}
                    onOpenSelector={handleOpenSelector}
                />
            )}

            <div className="overflow-x-auto pb-4">
                <div className="min-w-[900px]">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-500 text-lg">
                            {t("common.loading")}
                        </div>
                    ) : summaries.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-lg">
                            {t("arena.noData")}
                        </div>
                    ) : (
                        summaries.map((item) => (
                            <ArenaSummaryCard
                                key={`${item.season}-${item.atk_sig}-${item.def_sig}`}
                                summary={item}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className="mt-6">
                <Pagination
                    currentPage={page}
                    totalItems={totalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setPage}
                />
            </div>

            <StudentSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                students={studentList}
                filterType={modalFilterType}
                onSelect={(student) => {
                    if (selectorCallback) selectorCallback(student);
                }}
            />
        </div>
    );
};

export default ArenaPage;
