import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api";

const ResetPage = () => {
    const [username, setUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setStatus(t("auth.reset_mismatch", "New passwords do not match"));
            setIsError(true);
            return;
        }
        setLoading(true);
        setStatus("");
        try {
            await api.resetPassword(username, oldPassword, newPassword);
            setIsError(false);
            setStatus(
                t("auth.reset_success", "Password updated. Please login again.")
            );
            setTimeout(() => navigate("/login"), 1200);
        } catch (err) {
            setIsError(true);
            setStatus(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                    {t("auth.reset_title", "Reset Password")}
                </h2>
                {status && (
                    <div
                        className={`p-3 rounded mb-4 text-sm ${
                            isError
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-green-50 text-green-600 border border-green-200"
                        }`}
                    >
                        {status}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t("auth.username", "Username")}
                        </label>
                        <input
                            type="text"
                            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t("auth.old_password", "Old Password")}
                        </label>
                        <input
                            type="password"
                            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t("auth.new_password", "New Password")}
                        </label>
                        <input
                            type="password"
                            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t("auth.confirm_password", "Confirm Password")}
                        </label>
                        <input
                            type="password"
                            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 text-white py-2 rounded-md hover:bg-sky-700 transition-colors font-bold disabled:opacity-50"
                    >
                        {loading
                            ? t("auth.reset_updating", "Updating...")
                            : t("auth.reset_cta", "Reset Password")}
                    </button>
                    <div className="text-center text-sm text-gray-500">
                        <Link
                            to="/login"
                            className="text-sky-600 hover:text-sky-700 font-semibold"
                        >
                            {t("auth.back_login", "Back to Login")}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPage;
