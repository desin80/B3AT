import React from "react";

const ArenaHeader = ({
    t,
    showFilter,
    setShowFilter,
    filters,
    server,
    setServer,
    season,
    setSeason,
    seasonsList,
    sort,
    setSort,
    setPage,
}) => {
    return (
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
                        <option value="all">{t("common.all") || "All"}</option>
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
                    <option value="default">{t("arena.sort.default")}</option>
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
    );
};

export default ArenaHeader;
