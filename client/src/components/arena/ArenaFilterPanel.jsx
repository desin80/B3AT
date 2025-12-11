import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import attackIcon from "../../assets/attack.png";
import defendIcon from "../../assets/defend.png";

const TeamSlot = ({ index, studentId, onClick, onClear, studentMap }) => {
    const isSpecial = index >= 4;
    const student = studentMap[studentId];

    return (
        <div className="relative group">
            <div
                className={`
                    w-12 h-12 rounded border cursor-pointer transition-all flex items-center justify-center overflow-hidden
                    ${
                        studentId
                            ? "border-sky-400 ring-1 ring-sky-200"
                            : "border-gray-300 border-dashed hover:border-sky-400 bg-white/50"
                    }
                    ${isSpecial && index === 4 ? "ml-2" : ""} 
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
                    <span className="text-gray-300 text-xs font-bold">
                        {index + 1}
                    </span>
                )}
            </div>

            {studentId && (
                <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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

const ArenaFilterPanel = ({
    filters,
    onChange,
    studentList,
    onOpenSelector,
}) => {
    const { t } = useTranslation();
    const studentMap = React.useMemo(() => {
        const map = {};
        studentList.forEach((s) => (map[s.Id] = s));
        return map;
    }, [studentList]);

    const handleSlotClick = (side, index) => {
        onOpenSelector((student) => {
            const key = side === "atk" ? "atkSlots" : "defSlots";
            const newSlots = { ...filters[key], [index]: student.Id };
            onChange({ ...filters, [key]: newSlots });
        }, index);
    };

    const handleSlotClear = (side, index) => {
        const key = side === "atk" ? "atkSlots" : "defSlots";
        const newSlots = { ...filters[key] };
        delete newSlots[index];
        onChange({ ...filters, [key]: newSlots });
    };

    return (
        <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl p-5 mb-6 shadow-sm animate-fade-in-up">
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end gap-4 pb-4 border-b border-gray-200/50">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            {t("arena.filter.min_win_rate")}
                        </label>
                        <input
                            type="number"
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-sky-500 outline-none"
                            placeholder="0-100"
                            value={
                                filters.minWinRate
                                    ? filters.minWinRate * 100
                                    : ""
                            }
                            onChange={(e) => {
                                const val = e.target.value
                                    ? parseFloat(e.target.value) / 100
                                    : null;
                                onChange({ ...filters, minWinRate: val });
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            {t("arena.filter.min_battles")}
                        </label>
                        <input
                            type="number"
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-sky-500 outline-none"
                            placeholder="e.g. 10"
                            value={filters.minBattles || ""}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    minBattles: e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                })
                            }
                        />
                    </div>

                    <button
                        className="ml-auto text-sm text-gray-500 hover:text-red-500 underline"
                        onClick={() => onChange({})}
                    >
                        {t("arena.filter.reset")}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <img
                                src={attackIcon}
                                alt="Attack"
                                className="w-5 h-5"
                            />
                            {t("arena.filter.atk_team")}
                        </h4>
                        <div className="flex gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                                <TeamSlot
                                    key={`atk-${idx}`}
                                    index={idx}
                                    studentId={filters.atkSlots?.[idx]}
                                    studentMap={studentMap}
                                    onClick={() => handleSlotClick("atk", idx)}
                                    onClear={() => handleSlotClear("atk", idx)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <img
                                src={defendIcon}
                                alt="Defend"
                                className="w-5 h-5"
                            />
                            {t("arena.filter.def_team")}
                        </h4>
                        <div className="flex gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                                <TeamSlot
                                    key={`def-${idx}`}
                                    index={idx}
                                    studentId={filters.defSlots?.[idx]}
                                    studentMap={studentMap}
                                    onClick={() => handleSlotClick("def", idx)}
                                    onClear={() => handleSlotClear("def", idx)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArenaFilterPanel;
