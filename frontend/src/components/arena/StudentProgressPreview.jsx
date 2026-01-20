import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const StudentProgressPreview = ({ isOpen, anchorRect, studentId, loadout }) => {
    const { i18n } = useTranslation();
    const [student, setStudent] = useState(null);

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

    const equip = useMemo(() => {
        const eq = loadout?.equipment_tiers || [];
        return [eq[0] || 0, eq[1] || 0, eq[2] || 0];
    }, [loadout]);

    if (!isOpen || !anchorRect || !loadout || !studentId) return null;

    const level = loadout?.level ?? 0;
    const star = loadout?.star ?? 0;
    const weaponStar = loadout?.weapon_star ?? 0;
    const ex = loadout?.ex_skill_level ?? 0;
    const ns = loadout?.public_skill_level ?? 0;
    const ps = loadout?.passive_skill_level ?? 0;
    const ss = loadout?.extra_passive_skill_level ?? 0;
    const gear = loadout?.gear_tier ?? 0;

    const pot = loadout?.potential_stats || null;
    const p1 = pot?.[1] ?? 0;
    const p2 = pot?.[2] ?? 0;
    const p3 = pot?.[3] ?? 0;
    const hasPot = (p1 || 0) > 0 || (p2 || 0) > 0 || (p3 || 0) > 0;

    const width = hasPot ? 226 : 216;
    const margin = 10;
    const centerY = anchorRect.top + anchorRect.height / 2;

    const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

    const preferRight = anchorRect.right + margin + width <= viewportW - 8;
    const left = preferRight
        ? anchorRect.right + margin
        : anchorRect.left - margin - width;

    const style = {
        position: "fixed",
        left: clamp(left, 8, viewportW - width - 8),
        top: clamp(centerY, 28, viewportH - 28),
        transform: "translateY(-50%)",
        width,
    };

    const content = (
        <div
            className="fixed inset-0 z-[115] pointer-events-none"
            aria-hidden="true"
        >
            <div style={style}>
                <div className="bg-white/95 backdrop-blur border border-gray-200 shadow-xl rounded-lg px-3 py-2 text-xs text-gray-700">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-200 bg-white shrink-0">
                            <img
                                src={`https://schaledb.com/images/student/icon/${studentId}.webp`}
                                alt={student?.Name || studentId}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="font-extrabold text-gray-800 truncate">
                                {student?.Name || `ID ${studentId}`}
                            </div>
                            <div className="text-[11px] text-gray-500 tabular-nums">
                                Lv{level || "-"} · ★{star || "-"} · UE
                                {weaponStar || "-"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] tabular-nums">
                        <div className="px-2 py-1 rounded border border-gray-100 bg-gray-50 text-center whitespace-nowrap">
                            EX {ex || "-"}
                        </div>
                        <div className="px-2 py-1 rounded border border-gray-100 bg-gray-50 text-center whitespace-nowrap">
                            NS {ns || "-"}
                        </div>
                        <div className="px-2 py-1 rounded border border-gray-100 bg-gray-50 text-center whitespace-nowrap">
                            PS {ps || "-"}
                        </div>
                        <div className="px-2 py-1 rounded border border-gray-100 bg-gray-50 text-center whitespace-nowrap">
                            SS {ss || "-"}
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] tabular-nums">
                        <div className="text-gray-600">
                            Eq {equip[0] || "-"} / {equip[1] || "-"} /{" "}
                            {equip[2] || "-"}
                        </div>
                        <div className="text-gray-600">G{gear || "-"}</div>
                    </div>

                    {hasPot && (
                        <div className="mt-1 text-[11px] text-gray-600 tabular-nums">
                            Pot {p1 || "-"} / {p2 || "-"} / {p3 || "-"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined"
        ? createPortal(content, document.body)
        : content;
};

export default StudentProgressPreview;
