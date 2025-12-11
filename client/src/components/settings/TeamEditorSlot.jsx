import React from "react";

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

export default TeamEditorSlot;
