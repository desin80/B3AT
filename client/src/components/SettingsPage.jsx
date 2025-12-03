import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import StudentSelectorModal from "./StudentSelectorModal";
import attackIcon from "../assets/attack.png";
import defendIcon from "../assets/defend.png";

const TeamEditorSlot = ({ index, studentId, onClick, onClear, studentMap }) => {
    const isSpecial = index >= 4;
    const student = studentMap[studentId];

    return (
        <div className="relative group">
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
            {studentId && (
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

const SettingsPage = () => {
    const { t, i18n } = useTranslation();

    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [season, setSeason] = useState(1);
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

    useEffect(() => {
        api.getAllStudents(i18n.language).then(setStudentList);
    }, [i18n.language]);

    const studentMap = React.useMemo(() => {
        const map = {};
        studentList.forEach((s) => (map[s.Id] = s));
        return map;
    }, [studentList]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus(t("settings.import_section.uploading"));

        try {
            const result = await api.uploadData(file);
            setUploadStatus("✅ " + t("settings.import_section.success"));
        } catch (err) {
            console.error(err);
            setUploadStatus("❌ Error: " + err.message);
        } finally {
            setUploading(false);
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

    const handleManualSubmit = async () => {
        const cleanAtk = atkTeam.filter((id) => id > 0);
        const cleanDef = defTeam.filter((id) => id > 0);

        if (cleanAtk.length === 0 || cleanDef.length === 0) {
            setManualStatus("❌ Teams cannot be empty");
            return;
        }

        setAdding(true);
        setManualStatus(t("settings.manual_section.adding"));

        try {
            await api.manualAddRecord({
                season: parseInt(season),
                tag: tag,
                atk_team: cleanAtk,
                def_team: cleanDef,
                wins: parseInt(wins),
                losses: parseInt(losses),
            });
            setManualStatus(
                "✅ " +
                    t("settings.manual_section.success", {
                        count: parseInt(wins) + parseInt(losses),
                    })
            );
        } catch (err) {
            setManualStatus("❌ Error: " + err.message);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up">
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

            <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-gray-700 mb-2">
                    {t("settings.import_section.title")}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    {t("settings.import_section.desc")}
                </p>

                <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm active:scale-95">
                        {t("settings.import_section.button")}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                    {uploadStatus && (
                        <span
                            className={`text-sm font-medium ${
                                uploadStatus.includes("Error")
                                    ? "text-red-500"
                                    : "text-green-600"
                            }`}
                        >
                            {uploadStatus}
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-700 mb-2">
                    {t("settings.manual_section.title")}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    {t("settings.manual_section.desc")}
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

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleManualSubmit}
                        disabled={adding}
                        className="bg-gray-800 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {adding
                            ? t("settings.manual_section.adding")
                            : t("settings.manual_section.submit")}
                    </button>
                    {manualStatus && (
                        <span
                            className={`text-sm font-medium ${
                                manualStatus.includes("Error")
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
        </div>
    );
};

export default SettingsPage;
