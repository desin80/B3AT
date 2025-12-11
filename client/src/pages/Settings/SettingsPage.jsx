import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import api from "../../services/api";

import StudentSelectorModal from "../../components/arena/StudentSelectorModal";
import ReviewPanel from "../../components/settings/ReviewPanel";
import TeamEditorSlot from "../../components/settings/TeamEditorSlot";
import ImportConfirmModal from "../../components/settings/ImportConfirmModal";
import ManualConfirmModal from "../../components/settings/ManualConfirmModal";

import attackIcon from "../../assets/attack.png";
import defendIcon from "../../assets/defend.png";

const SettingsPage = () => {
    const { t, i18n } = useTranslation();
    const { isAdmin } = useAuth();
    const { showToast } = useUI();

    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploadIsError, setUploadIsError] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [importServer, setImportServer] = useState("global");
    const [importSeason, setImportSeason] = useState(9);
    const [season, setSeason] = useState(9);
    const [atkTeam, setAtkTeam] = useState([0, 0, 0, 0, 0, 0]);
    const [defTeam, setDefTeam] = useState([0, 0, 0, 0, 0, 0]);
    const [wins, setWins] = useState(1);
    const [losses, setLosses] = useState(0);
    const [adding, setAdding] = useState(false);
    const [manualStatus, setManualStatus] = useState("");
    const [studentList, setStudentList] = useState([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorCallback, setSelectorCallback] = useState(null);
    const [modalFilterType, setModalFilterType] = useState("all");
    const [tag, setTag] = useState("");
    const [server, setServer] = useState("global");
    const [manualIsError, setManualIsError] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [note, setNote] = useState("");
    const [proofImage, setProofImage] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        api.getAllStudents(i18n.language).then(setStudentList);
    }, [i18n.language]);

    const studentMap = useMemo(() => {
        const map = {};
        studentList.forEach((s) => (map[s.Id] = s));
        return map;
    }, [studentList]);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const MAX_SIZE = 20 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setUploadStatus(t("settings.import_section.file_too_large"));
            setUploadIsError(true);
            event.target.value = null;
            return;
        }

        setUploadStatus("");
        setUploadIsError(false);
        setImportFile(file);
        setIsImportConfirmOpen(true);
        event.target.value = null;
    };

    const handleImportConfirm = async () => {
        setIsImportConfirmOpen(false);
        if (!importFile) return;

        setUploading(true);
        setUploadStatus(t("settings.import_section.uploading"));
        setUploadIsError(false);

        try {
            await api.uploadData(importFile, importServer, importSeason);

            setUploadStatus(t("settings.import_section.success"));
            setUploadIsError(false);
        } catch (err) {
            console.error(err);
            setUploadStatus("Error: " + err.message);
            setUploadIsError(true);
        } finally {
            setUploading(false);
            setImportFile(null);
        }
    };

    const openSelector = (side, index) => {
        setSelectorCallback(() => (student) => {
            if (side === "atk") {
                const newTeam = [...atkTeam];
                newTeam[index] = student.Id;
                setAtkTeam(newTeam);
            } else {
                const newTeam = [...defTeam];
                newTeam[index] = student.Id;
                setDefTeam(newTeam);
            }
        });
        setModalFilterType(index < 4 ? "striker" : "special");
        setIsSelectorOpen(true);
    };

    const clearSlot = (side, index) => {
        if (side === "atk") {
            const newTeam = [...atkTeam];
            newTeam[index] = 0;
            setAtkTeam(newTeam);
        } else {
            const newTeam = [...defTeam];
            newTeam[index] = 0;
            setDefTeam(newTeam);
        }
    };

    const handlePreSubmit = () => {
        const cleanAtk = atkTeam.filter((id) => id > 0);
        const cleanDef = defTeam.filter((id) => id > 0);
        if (cleanAtk.length === 0 || cleanDef.length === 0) {
            setManualStatus(t("settings.manual_section.error_empty"));
            setManualIsError(true);
            return;
        }
        const s = parseInt(season);
        const w = parseInt(wins);
        const l = parseInt(losses);
        const MAX_COUNT = 2000;
        if (s < 1) {
            setManualStatus(t("settings.manual_section.error_season"));
            setManualIsError(true);
            return;
        }
        if (w < 0 || l < 0) {
            setManualStatus(t("settings.manual_section.error_negative"));
            setManualIsError(true);
            return;
        }
        if (w > MAX_COUNT || l > MAX_COUNT) {
            setManualStatus(
                `${t("settings.manual_section.error_max_count", {
                    max: MAX_COUNT,
                })}`
            );
            setManualIsError(true);
            return;
        }
        if (w === 0 && l === 0) {
            setManualStatus(t("settings.manual_section.error_zero"));
            setManualIsError(true);
            return;
        }
        setManualStatus("");
        setManualIsError(false);
        setIsConfirmOpen(true);
    };

    const handleFinalSubmit = async () => {
        setIsConfirmOpen(false);
        setAdding(true);

        const cleanAtk = atkTeam.filter((id) => id > 0);
        const cleanDef = defTeam.filter((id) => id > 0);

        try {
            if (isAdmin) {
                setManualStatus(t("settings.manual_section.adding"));
                await api.manualAddRecord({
                    server: server,
                    season: parseInt(season),
                    tag: tag,
                    atk_team: cleanAtk,
                    def_team: cleanDef,
                    wins: parseInt(wins),
                    losses: parseInt(losses),
                });
                setManualStatus(
                    t("settings.manual_section.success", {
                        count: parseInt(wins) + parseInt(losses),
                    })
                );
                showToast(
                    t("settings.manual_section.success", {
                        count: parseInt(wins) + parseInt(losses),
                    }),
                    "success"
                );
            } else {
                setManualStatus(t("settings.manual_section.status_submitting"));
                const formData = new FormData();
                formData.append("server", server);
                formData.append("season", season);
                formData.append("tag", tag);
                formData.append("atk_team", JSON.stringify(cleanAtk));
                formData.append("def_team", JSON.stringify(cleanDef));
                formData.append("wins", wins);
                formData.append("losses", losses);
                formData.append("note", note);
                if (proofImage) {
                    formData.append("image", proofImage);
                }

                await api.submitRequest(formData);
                setManualStatus(t("settings.manual_section.status_submitted"));
                showToast(
                    t("settings.manual_section.status_submitted"),
                    "success"
                );
                setNote("");
                setProofImage(null);
            }
            setManualIsError(false);
        } catch (err) {
            setManualStatus("Error: " + err.message);
            setManualIsError(true);
            showToast(err.message, "error");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <span className="bg-sky-100 p-2 rounded-lg text-sky-600">
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
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                    </svg>
                </span>
                {t("settings.title")}
            </h1>

            {isAdmin && (
                <ReviewPanel
                    onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
                    studentMap={studentMap}
                />
            )}

            {isAdmin && (
                <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
                    <h2 className="text-lg font-bold text-gray-700 mb-2">
                        {t("settings.import_section.title")}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        {t("settings.import_section.desc")}
                    </p>

                    <div className="flex flex-wrap items-end gap-6 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {t("settings.import_section.default_server")}
                            </label>
                            <select
                                value={importServer}
                                onChange={(e) =>
                                    setImportServer(e.target.value)
                                }
                                className="w-full sm:w-32 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none bg-white text-sm"
                            >
                                <option value="global">
                                    {t("settings.manual_section.server_global")}
                                </option>
                                <option value="cn">
                                    {t("settings.manual_section.server_cn")}
                                </option>
                                <option value="jp">
                                    {t("settings.manual_section.server_jp")}
                                </option>
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {t("settings.import_section.default_season")}
                            </label>
                            <input
                                type="number"
                                value={importSeason}
                                onChange={(e) =>
                                    setImportSeason(e.target.value)
                                }
                                className="w-full sm:w-24 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                            />
                        </div>
                        <div className="w-full sm:w-auto sm:flex-1">
                            <div className="text-xs text-gray-400 italic mt-1 leading-relaxed">
                                {t("settings.import_section.default_helper")}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm active:scale-95 flex items-center gap-2">
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                />
                            </svg>
                            {t("settings.import_section.button")}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                        {uploadStatus && (
                            <span
                                className={`text-sm font-medium ${
                                    uploadIsError
                                        ? "text-red-500"
                                        : "text-green-600"
                                }`}
                            >
                                {uploadStatus}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-700 mb-2">
                    {isAdmin
                        ? t("settings.manual_section.title")
                        : t("settings.manual_section.submit_request")}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    {isAdmin
                        ? t("settings.manual_section.desc")
                        : t(
                              "settings.manual_section.desc_request",
                              "Submit your battle results for review."
                          )}
                </p>

                <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {t("settings.manual_section.season")}
                        </label>
                        <input
                            type="number"
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {t("settings.manual_section.server")}
                        </label>
                        <select
                            value={server}
                            onChange={(e) => setServer(e.target.value)}
                            className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none bg-white text-sm"
                        >
                            <option value="global">
                                {t("settings.manual_section.server_global")}
                            </option>
                            <option value="cn">
                                {t("settings.manual_section.server_cn")}
                            </option>
                            <option value="jp">
                                {t("settings.manual_section.server_jp")}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {t("settings.manual_section.tag")}
                        </label>
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none bg-white text-sm"
                        >
                            <option value="">
                                {t("settings.manual_section.tag_none")}
                            </option>
                            <option value="tag_low_atk">
                                {t("settings.manual_section.tag_low_atk")}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {t("settings.manual_section.wins")}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={wins}
                            onChange={(e) => setWins(e.target.value)}
                            className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none text-red-600 font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {t("settings.manual_section.losses")}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={losses}
                            onChange={(e) => setLosses(e.target.value)}
                            className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none text-blue-600 font-bold"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <img
                                src={attackIcon}
                                className="w-5 h-5"
                                alt="Atk"
                            />{" "}
                            {t("settings.manual_section.atk")}
                        </h3>
                        <div className="flex gap-2 p-3 bg-red-50/50 rounded-xl border border-red-100 overflow-x-auto">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <TeamEditorSlot
                                    key={i}
                                    index={i}
                                    studentId={atkTeam[i]}
                                    studentMap={studentMap}
                                    onClick={() => openSelector("atk", i)}
                                    onClear={() => clearSlot("atk", i)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <img
                                src={defendIcon}
                                className="w-5 h-5"
                                alt="Def"
                            />{" "}
                            {t("settings.manual_section.def")}
                        </h3>
                        <div className="flex gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 overflow-x-auto">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <TeamEditorSlot
                                    key={i}
                                    index={i}
                                    studentId={defTeam[i]}
                                    studentMap={studentMap}
                                    onClick={() => openSelector("def", i)}
                                    onClear={() => clearSlot("def", i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {!isAdmin && (
                    <div className="mt-6 mb-6 p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {t("settings.manual_section.proof")} (
                                {t("settings.manual_section.optional")})
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setProofImage(e.target.files[0])
                                }
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {t("settings.manual_section.note")}
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t(
                                    "settings.manual_section.note_placeholder"
                                )}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePreSubmit}
                        disabled={adding}
                        className={`px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 text-white 
                        ${
                            isAdmin
                                ? "bg-gray-800 hover:bg-black"
                                : "bg-sky-600 hover:bg-sky-700"
                        }`}
                    >
                        {adding
                            ? t("settings.manual_section.adding")
                            : isAdmin
                            ? t("settings.manual_section.submit")
                            : t("settings.manual_section.submit_request")}
                    </button>
                    {manualStatus && (
                        <span
                            className={`text-sm font-medium ${
                                manualIsError
                                    ? "text-red-500"
                                    : "text-green-600"
                            }`}
                        >
                            {manualStatus}
                        </span>
                    )}
                </div>
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

            <ManualConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleFinalSubmit}
                data={{ atkTeam, defTeam, season, server, tag, wins, losses }}
                studentMap={studentMap}
                t={t}
                isAdmin={isAdmin}
            />

            <ImportConfirmModal
                isOpen={isImportConfirmOpen}
                onClose={() => {
                    setIsImportConfirmOpen(false);
                    setImportFile(null);
                }}
                onConfirm={handleImportConfirm}
                file={importFile}
                defaults={{ server: importServer, season: importSeason }}
                t={t}
            />
        </div>
    );
};

export default SettingsPage;
