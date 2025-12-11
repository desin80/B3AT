import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";

import ArenaSummaryCard from "../../components/arena/ArenaSummaryCard";
import ArenaFilterPanel from "../../components/arena/ArenaFilterPanel";
import StudentSelectorModal from "../../components/arena/StudentSelectorModal";
import ArenaHeader from "../../components/arena/ArenaHeader";
import ArenaBatchAction from "../../components/arena/ArenaBatchAction";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ScrollToTopButton from "../../components/common/ScrollToTopButton";

import "./ArenaPage.css";

const ITEMS_PER_PAGE = 30;

const ArenaPage = () => {
    const { t, i18n } = useTranslation();
    const { isAdmin } = useAuth();
    const { showToast, showConfirm } = useUI();

    const [summaries, setSummaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [studentList, setStudentList] = useState([]);
    const [season, setSeason] = useState(null);
    const [seasonsList, setSeasonsList] = useState([]);
    const [sort, setSort] = useState("default");
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({});
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorCallback, setSelectorCallback] = useState(null);
    const [modalFilterType, setModalFilterType] = useState("all");
    const [server, setServer] = useState("all");
    const [selectedSet, setSelectedSet] = useState(new Set());

    const getItemKey = (item) =>
        `${item.server}|${item.season}|${item.atk_sig}|${item.def_sig}|${
            item.tag || ""
        }`;

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
                server
            );
            setSummaries(data.data);
            setTotalCount(data.total);
        } catch (error) {
            console.error("Error loading arena data", error);
            showToast("Failed to load data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setSelectedSet(new Set());
        fetchData();
    }, [page, season, sort, filters, server]);

    const handleOpenSelector = (callback, index) => {
        setSelectorCallback(() => callback);
        if (index !== undefined && index !== null) {
            setModalFilterType(index < 4 ? "striker" : "special");
        } else {
            setModalFilterType("all");
        }
        setIsSelectorOpen(true);
    };

    const handleDeleteSummary = async (
        atkSig,
        defSig,
        srv,
        seasonVal,
        tagVal
    ) => {
        try {
            await api.deleteArenaSummary(
                atkSig,
                defSig,
                srv,
                seasonVal,
                tagVal
            );
            showToast(
                t("common.delete_success", "Deleted successfully"),
                "success"
            );
            fetchData();
        } catch (e) {
            showToast(e.message, "error");
        }
    };

    const handleToggleCheck = (item, checked) => {
        const key = getItemKey(item);
        const newSet = new Set(selectedSet);
        if (checked) {
            newSet.add(key);
        } else {
            newSet.delete(key);
        }
        setSelectedSet(newSet);
    };

    const handleSelectAllPage = () => {
        const newSet = new Set(selectedSet);
        const allSelected =
            summaries.length > 0 &&
            summaries.every((item) => newSet.has(getItemKey(item)));

        if (allSelected) {
            summaries.forEach((item) => newSet.delete(getItemKey(item)));
        } else {
            summaries.forEach((item) => newSet.add(getItemKey(item)));
        }
        setSelectedSet(newSet);
    };

    const handleBatchDelete = () => {
        if (selectedSet.size === 0) return;

        showConfirm(
            t("arena.batch.confirm_title"),
            t("arena.batch.confirm_msg", { count: selectedSet.size }),
            async () => {
                try {
                    const itemsToDelete = Array.from(selectedSet).map((key) => {
                        const parts = key.split("|");
                        return {
                            server: parts[0],
                            season: parseInt(parts[1], 10),
                            atk_sig: parts[2],
                            def_sig: parts[3],
                            tag: parts.slice(4).join("|"),
                        };
                    });

                    await api.batchDeleteSummaries(itemsToDelete);
                    showToast(t("common.delete_success"), "success");
                    setSelectedSet(new Set());
                    fetchData();
                } catch (e) {
                    showToast(e.message, "error");
                }
            }
        );
    };

    return (
        <div className="w-full pb-24">
            <ArenaHeader
                t={t}
                showFilter={showFilter}
                setShowFilter={setShowFilter}
                filters={filters}
                server={server}
                setServer={setServer}
                season={season}
                setSeason={setSeason}
                seasonsList={seasonsList}
                sort={sort}
                setSort={setSort}
                setPage={setPage}
            />

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

            {!isLoading && totalCount > 0 && (
                <div className="mb-4">
                    <Pagination
                        currentPage={page}
                        totalItems={totalCount}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setPage}
                    />
                </div>
            )}

            <div className="overflow-x-auto pb-4">
                <div className="min-w-[900px] p-1">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : summaries.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-lg animate-fade-in">
                            {t("arena.noData")}
                        </div>
                    ) : (
                        summaries.map((item, index) => {
                            const key = getItemKey(item);
                            return (
                                <div
                                    key={key}
                                    className="animate-card-entry"
                                    style={{
                                        animationDelay: `${index * 0.05}s`,
                                    }}
                                >
                                    <ArenaSummaryCard
                                        summary={item}
                                        onDelete={handleDeleteSummary}
                                        isChecked={selectedSet.has(key)}
                                        onToggleCheck={handleToggleCheck}
                                    />
                                </div>
                            );
                        })
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

            <ScrollToTopButton t={t} />

            {isAdmin && (
                <ArenaBatchAction
                    t={t}
                    selectedSet={selectedSet}
                    setSelectedSet={setSelectedSet}
                    handleSelectAllPage={handleSelectAllPage}
                    handleBatchDelete={handleBatchDelete}
                    summaries={summaries}
                    getItemKey={getItemKey}
                />
            )}

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
