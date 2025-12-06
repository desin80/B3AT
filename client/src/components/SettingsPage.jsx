import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import api from "../services/api";
import StudentSelectorModal from "./StudentSelectorModal";
import attackIcon from "../assets/attack.png";
import defendIcon from "../assets/defend.png";

const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const TeamEditorSlot = ({ index, studentId, onClick, onClear, studentMap }) => {
    const isSpecial = index >= 4;
    const student = studentMap[studentId];

    return (
        <div className="relative group shrink-0">
            <div
                className={`
                    w-14 h-14 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center overflow-hidden bg-white shadow-sm
                    ${
                        studentId
                            ? "border-sky-400"
                            : "border-gray-200 border-dashed hover:border-sky-300"
                    }
                    ${isSpecial && index === 4 ? "ml-3" : ""} 
                `}
                onClick={onClick}
                title={student ? student.Name : `Slot ${index + 1}`}
            >
                {studentId ? (
                    <img
                        src={`https://schaledb.com/images/student/icon/${studentId}.webp`}
                        className="w-full h-full object-cover"
                        alt={student.Name}
                    />
                ) : (
                    <span className="text-gray-300 text-lg font-bold">+</span>
                )}
            </div>
            {studentId > 0 && (
                <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:scale-110"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                >
                    &times;
                </button>
            )}
        </div>
    );
};

const ReviewPanel = ({ onRefresh, studentMap }) => {
    const { t } = useTranslation();
    const { showToast, showConfirm } = useUI();
    const [list, setList] = useState([]);

    const fetchList = async () => {
        try {
            const data = await api.getSubmissions();
            setList(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

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
                    fetchList();
                    if (isApprove) onRefresh();
                } catch (e) {
                    showToast(e.message, "error");
                }
            }
        );
    };

    const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "").replace(
        "/api",
        ""
    );

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

    return (
        <div className="bg-white/70 backdrop-blur-md border border-orange-200 rounded-xl p-6 shadow-sm mb-8 animate-fade-in-up">
            <h2 className="text-lg font-bold text-orange-700 mb-4 flex items-center gap-2">
                {t("settings.review_panel.title")}
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {list.length === 0 ? (
                    <p className="text-gray-400 italic text-center py-4">
                        {t("settings.review_panel.empty")}
                    </p>
                ) : (
                    list.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden"
                        >
                            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center gap-2">
                                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-gray-500 items-center">
                                    <span className="px-2 py-0.5 bg-white rounded border border-gray-200 shadow-sm">
                                        {t(
                                            `settings.manual_section.server_${item.server}`
                                        )}
                                    </span>
                                    <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded border border-sky-100 shadow-sm">
                                        S{item.season}
                                    </span>
                                    {item.tag && (
                                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded border border-yellow-100 shadow-sm">
                                            {t(
                                                `settings.manual_section.${item.tag}`
                                            )}
                                        </span>
                                    )}
                                    <span className="text-gray-400 font-normal normal-case ml-1">
                                        {new Date(
                                            item.created_at * 1000
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleAction(item, "approve")
                                        }
                                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                                    >
                                        {t("settings.review_panel.approve")}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleAction(item, "reject")
                                        }
                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                                    >
                                        {t("settings.review_panel.reject")}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col md:flex-row gap-4 items-start">
                                {item.image_path && (
                                    <div
                                        className="w-full md:w-32 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden cursor-pointer border border-gray-200 group relative"
                                        onClick={() =>
                                            window.open(
                                                API_ROOT + item.image_path,
                                                "_blank"
                                            )
                                        }
                                    >
                                        <img
                                            src={API_ROOT + item.image_path}
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
                                            {item.wins}{" "}
                                            {t(
                                                "settings.manual_section.win_short"
                                            )}
                                        </span>
                                        <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                            {item.losses}{" "}
                                            {t(
                                                "settings.manual_section.loss_short"
                                            )}
                                        </span>
                                    </div>

                                    {item.note && (
                                        <div className="bg-amber-50 p-2.5 rounded text-xs text-gray-700 border border-amber-100 flex gap-2 w-full">
                                            <span className="italic">
                                                "{item.note}"
                                            </span>
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
                    ))
                )}
            </div>
        </div>
    );
};

const ImportConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    file,
    defaults,
    t,
}) => {
    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {t("settings.import_section.confirm_title")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex items-start gap-3">
                        <svg
                            className="w-6 h-6 text-sky-500 mt-0.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <div>
                            <p className="font-bold text-gray-800 text-sm break-all">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        {t("settings.import_section.confirm_desc")}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-gray-400 text-xs uppercase font-bold mb-1">
                                {t("settings.manual_section.server")}
                            </span>
                            <span className="font-bold text-gray-800">
                                {t(
                                    `settings.manual_section.server_${defaults.server}`
                                )}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-gray-400 text-xs uppercase font-bold mb-1">
                                {t("settings.manual_section.season")}
                            </span>
                            <span className="font-bold text-gray-800">
                                S{defaults.season}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold shadow-md transition-all active:scale-95"
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ManualConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    data,
    studentMap,
    t,
    isAdmin,
}) => {
    if (!isOpen) return null;
    const { atkTeam, defTeam, season, server, tag, wins, losses } = data;
    const renderTeamIcons = (teamIds) => (
        <div className="flex gap-1.5 flex-wrap">
            {teamIds.map((id, idx) => {
                if (id === 0) return null;
                const student = studentMap[id];
                return (
                    <div
                        key={idx}
                        className={`w-10 h-10 rounded border border-gray-200 overflow-hidden bg-white ${
                            idx === 4 ? "ml-2" : ""
                        }`}
                        title={student ? student.Name : id}
                    >
                        <img
                            src={`https://schaledb.com/images/student/icon/${id}.webp`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </div>
                );
            })}
        </div>
    );
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {isAdmin
                            ? t("settings.manual_section.confirm_title")
                            : t("settings.manual_section.submit_request")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-500 text-xs uppercase font-bold">
                                {t("settings.manual_section.server")} /{" "}
                                {t("settings.manual_section.season")}
                            </span>
                            <span className="font-medium text-gray-800">
                                {t(`settings.manual_section.server_${server}`)}{" "}
                                / S{season}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-500 text-xs uppercase font-bold">
                                {t("settings.manual_section.result")}
                            </span>
                            <span className="font-bold text-green-600">
                                {wins}
                                {t("settings.manual_section.win_short")}
                            </span>
                            <span className="mx-1 text-gray-400">/</span>
                            <span className="font-bold text-red-500">
                                {losses}
                                {t("settings.manual_section.loss_short")}
                            </span>
                        </div>
                    </div>
                    {tag && (
                        <div className="text-sm bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg border border-yellow-100">
                            {t("settings.manual_section.tag")}:{" "}
                            {t(`settings.manual_section.${tag}`)}
                        </div>
                    )}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            {t("settings.manual_section.atk")}
                        </h4>
                        {renderTeamIcons(atkTeam)}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {t("settings.manual_section.def")}
                        </h4>
                        {renderTeamIcons(defTeam)}
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black font-bold shadow-md transition-all active:scale-95"
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
};

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
