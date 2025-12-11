import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const StudentSelectorModal = ({
    isOpen,
    onClose,
    onSelect,
    students,
    filterType = "all",
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStudents = useMemo(() => {
        let result = students;

        if (filterType === "striker") {
            result = result.filter((s) => String(s.Id).startsWith("1"));
        } else if (filterType === "special") {
            result = result.filter((s) => String(s.Id).startsWith("2"));
        }

        if (!searchTerm) return result;
        const lower = searchTerm.toLowerCase();
        return result.filter(
            (s) =>
                s.Name.toLowerCase().includes(lower) ||
                s.Id.toString().includes(lower)
        );
    }, [students, searchTerm, filterType]);

    if (!isOpen) return null;

    let title = t("arena.filter.select_student");
    if (filterType === "striker") title += " (Striker)";
    if (filterType === "special") title += " (Special)";

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
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
                <div className="p-4 border-b border-gray-100">
                    <input
                        type="text"
                        placeholder={t("arena.filter.search_placeholder")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {filteredStudents.map((student) => (
                            <div
                                key={student.Id}
                                className="group cursor-pointer flex flex-col items-center gap-1"
                                onClick={() => {
                                    onSelect(student);
                                    onClose();

                                    setSearchTerm("");
                                }}
                            >
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group-hover:border-sky-500 group-hover:ring-2 ring-sky-300 transition-all bg-white">
                                    <img
                                        src={`https://schaledb.com/images/student/icon/${student.Id}.webp`}
                                        alt={student.Name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                <span className="text-xs text-center text-gray-600 truncate w-full px-1 group-hover:text-sky-700">
                                    {student.Name}
                                </span>
                            </div>
                        ))}
                        {filteredStudents.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400">
                                {t("arena.filter.no_result")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSelectorModal;
