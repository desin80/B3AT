import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import api from "../../services/api";

const StatPill = ({ label, value, accent = "sky" }) => {
    const accentClasses =
        accent === "sky"
            ? "bg-sky-50 border-sky-100 text-sky-700"
            : "bg-gray-50 border-gray-100 text-gray-700";
    return (
        <div
            className={`px-3 py-2 rounded-lg border ${accentClasses} flex items-center justify-between gap-3`}
        >
            <span className="text-[11px] uppercase font-bold tracking-wide text-gray-500">
                {label}
            </span>
            <span className="font-extrabold tabular-nums">{value}</span>
        </div>
    );
};

const SectionTitle = ({ children }) => (
    <div className="text-[11px] uppercase font-bold tracking-wide text-gray-500">
        {children}
    </div>
);

const formatPotential = (potentialStats) => {
    if (!potentialStats) return null;
    const a = potentialStats[1] ?? 0;
    const b = potentialStats[2] ?? 0;
    const c = potentialStats[3] ?? 0;
    if (a === 0 && b === 0 && c === 0) return null;
    return { a, b, c };
};

const StudentProgressModal = ({
    isOpen,
    onClose,
    studentId,
    loadout,
    sideLabel = "",
}) => {
    const { t, i18n } = useTranslation();
    const [student, setStudent] = useState(null);

    const equip = useMemo(() => {
        const eq = loadout?.equipment_tiers || [];
        return [eq[0] || 0, eq[1] || 0, eq[2] || 0];
    }, [loadout]);

    const pot = useMemo(
        () => formatPotential(loadout?.potential_stats),
        [loadout],
    );

    const isStriker = String(studentId || "").startsWith("1");
    const roleLabel = studentId
        ? t(
              isStriker
                  ? "arena.progress.role.striker"
                  : "arena.progress.role.special",
              isStriker ? "Striker" : "Special",
          )
        : "";

    useEffect(() => {
        let cancelled = false;
        if (!isOpen || !studentId) {
            setStudent(null);
            return;
        }
        api.getStudentById(studentId, i18n.language).then((s) => {
            if (!cancelled) setStudent(s);
        });
        return () => {
            cancelled = true;
        };
    }, [isOpen, studentId, i18n.language]);

    if (!isOpen) return null;

    const star = loadout?.star ?? 0;
    const weaponStar = loadout?.weapon_star ?? 0;
    const level = loadout?.level ?? 0;

    const ex = loadout?.ex_skill_level ?? 0;
    const ns = loadout?.public_skill_level ?? 0;
    const ps = loadout?.passive_skill_level ?? 0;
    const ss = loadout?.extra_passive_skill_level ?? 0;

    const gear = loadout?.gear_tier ?? 0;

    const modal = (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                            {studentId ? (
                                <img
                                    src={`https://schaledb.com/images/student/icon/${studentId}.webp`}
                                    alt={studentId}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : null}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg text-gray-800">
                                    {student?.Name || `ID ${studentId}`}
                                </h3>
                                {(sideLabel || roleLabel) && (
                                    <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                                        {[sideLabel, roleLabel]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                )}
                            </div>
                            {loadout ? null : (
                                <div className="text-xs text-gray-500">
                                    {t(
                                        "arena.progress.no_data",
                                        "No loadout data",
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close"
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

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <StatPill label="Lv" value={level || "-"} />
                        <StatPill label="Star" value={star || "-"} />
                        <StatPill label="UE" value={weaponStar || "-"} />
                    </div>

                    <div className="space-y-2">
                        <SectionTitle>
                            {t("arena.progress.skills", "Skills")}
                        </SectionTitle>
                        <div className="grid grid-cols-4 gap-3">
                            <StatPill
                                label="EX"
                                value={ex || "-"}
                                accent="gray"
                            />
                            <StatPill
                                label="NS"
                                value={ns || "-"}
                                accent="gray"
                            />
                            <StatPill
                                label="PS"
                                value={ps || "-"}
                                accent="gray"
                            />
                            <StatPill
                                label="SS"
                                value={ss || "-"}
                                accent="gray"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionTitle>
                            {t("arena.progress.equipment", "Equipment")}
                        </SectionTitle>
                        <div className="grid grid-cols-4 gap-3">
                            <StatPill
                                label="Eq1"
                                value={equip[0] || "-"}
                                accent="gray"
                            />
                            <StatPill
                                label="Eq2"
                                value={equip[1] || "-"}
                                accent="gray"
                            />
                            <StatPill
                                label="Eq3"
                                value={equip[2] || "-"}
                                accent="gray"
                            />
                            <StatPill
                                label="Gear"
                                value={gear || "-"}
                                accent="gray"
                            />
                        </div>
                    </div>

                    {pot && (
                        <div className="space-y-2">
                            <SectionTitle>
                                {t("arena.progress.potential", "Potential")}
                            </SectionTitle>
                            <div className="grid grid-cols-3 gap-3">
                                <StatPill
                                    label="P1"
                                    value={pot.a}
                                    accent="gray"
                                />
                                <StatPill
                                    label="P2"
                                    value={pot.b}
                                    accent="gray"
                                />
                                <StatPill
                                    label="P3"
                                    value={pot.c}
                                    accent="gray"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined"
        ? createPortal(modal, document.body)
        : modal;
};

export default StudentProgressModal;
