import React from "react";

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

export default ManualConfirmModal;
