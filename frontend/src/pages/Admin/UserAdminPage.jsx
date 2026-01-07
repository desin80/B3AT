import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const UserAdminPage = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [form, setForm] = useState({
        username: "",
        password: "",
        role: "user",
    });
    const [busyId, setBusyId] = useState(null);

    const selfUsername = useMemo(() => {
        try {
            return localStorage.getItem("b3at_username") || "";
        } catch (e) {
            return "";
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        loadUsers();
    }, [isAdmin]);

    const loadUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (e) {
            setError(
                e.message || t("admin_users.error_load", "Failed to load users")
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");
        try {
            await api.createUser(
                form.username.trim(),
                form.password,
                form.role
            );
            setForm({ username: "", password: "", role: "user" });
            setStatus(t("admin_users.created", "User created"));
            await loadUsers();
        } catch (e) {
            setError(
                e.message ||
                    t("admin_users.error_create", "Failed to create user")
            );
        }
    };

    const changeRole = async (id, role) => {
        setBusyId(id);
        setStatus("");
        setError("");
        try {
            await api.updateUserRole(id, role);
            await loadUsers();
            setStatus(t("admin_users.role_updated", "Role updated"));
        } catch (e) {
            setError(
                e.message ||
                    t("admin_users.error_role", "Failed to update role")
            );
        } finally {
            setBusyId(null);
        }
    };

    const removeUser = async (id, username) => {
        const confirmMsg = t(
            "admin_users.delete_confirm",
            `Delete user "${username}"?`,
            { name: username }
        );
        if (!window.confirm(confirmMsg)) return;
        setBusyId(id);
        setStatus("");
        setError("");
        try {
            await api.deleteUser(id);
            await loadUsers();
            setStatus(t("admin_users.deleted", "User deleted"));
        } catch (e) {
            setError(
                e.message ||
                    t("admin_users.error_delete", "Failed to delete user")
            );
        } finally {
            setBusyId(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-700 mb-4">
                    {t(
                        "admin_users.only_admin",
                        "Only admins can access this page."
                    )}
                </p>
                <button
                    className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
                    onClick={() => navigate("/login")}
                >
                    {t("admin_users.goto_login", "Go to Login")}
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t("admin_users.title", "User Management")}
                    </h1>
                </div>
                <div className="text-sm text-gray-500">
                    {loading
                        ? t("admin_users.loading", "Loading...")
                        : t("admin_users.total", "Total: {{count}} users", {
                              count: users.length,
                          })}
                </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("admin_users.add_user", "Add User")}
                </h2>
                <form
                    onSubmit={handleAdd}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <input
                        type="text"
                        placeholder={t("admin_users.username", "Username")}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={form.username}
                        onChange={(e) =>
                            setForm({ ...form, username: e.target.value })
                        }
                        required
                    />
                    <input
                        type="password"
                        placeholder={t("admin_users.password", "Password")}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        required
                    />
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={form.role}
                        onChange={(e) =>
                            setForm({ ...form, role: e.target.value })
                        }
                    >
                        <option value="user">
                            {t("admin_users.role_user", "User")}
                        </option>
                        <option value="admin">
                            {t("admin_users.role_admin", "Admin")}
                        </option>
                    </select>
                    <button
                        type="submit"
                        className="bg-sky-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-sky-700 transition"
                    >
                        {t("admin_users.create", "Create")}
                    </button>
                </form>
            </div>

            {(status || error) && (
                <div
                    className={`p-3 rounded-lg border text-sm ${
                        error
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-green-50 text-green-700 border-green-200"
                    }`}
                >
                    {error || status}
                </div>
            )}

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {t("admin_users.list_title", "Users")}
                    </h2>
                    {/* <button
                        onClick={loadUsers}
                        className="text-sm text-sky-600 hover:text-sky-700 font-semibold"
                    >
                        {t("admin_users.refresh", "Refresh")}
                    </button> */}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left px-5 py-3 font-semibold">
                                    {t("admin_users.username", "Username")}
                                </th>
                                <th className="text-left px-5 py-3 font-semibold">
                                    {t("admin_users.role", "Role")}
                                </th>
                                <th className="text-left px-5 py-3 font-semibold">
                                    {t("admin_users.created_time", "Created")}
                                </th>
                                <th className="text-left px-5 py-3 font-semibold">
                                    {t("admin_users.updated_time", "Updated")}
                                </th>
                                <th className="text-right px-5 py-3 font-semibold">
                                    {/* {t("admin_users.actions", "Actions")} */}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td
                                        className="px-5 py-4 text-gray-500"
                                        colSpan={5}
                                    >
                                        {t(
                                            "admin_users.no_users",
                                            "No users yet."
                                        )}
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td
                                        className="px-5 py-4 text-gray-500"
                                        colSpan={5}
                                    >
                                        {t("admin_users.loading", "Loading...")}
                                    </td>
                                </tr>
                            )}
                            {users.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-t border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <td className="px-5 py-3 font-semibold text-gray-800">
                                        {u.username}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`${
                                                u.role === "admin"
                                                    ? "text-purple-700"
                                                    : "text-sky-700"
                                            } text-sm font-semibold`}
                                        >
                                            {u.role === "admin"
                                                ? t(
                                                      "admin_users.role_admin",
                                                      "Admin"
                                                  )
                                                : t(
                                                      "admin_users.role_user",
                                                      "User"
                                                  )}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600">
                                        {u.created_at
                                            ? new Date(
                                                  u.created_at * 1000
                                              ).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="px-5 py-3 text-gray-600">
                                        {u.updated_at
                                            ? new Date(
                                                  u.updated_at * 1000
                                              ).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="px-5 py-3 text-right space-x-2">
                                        {u.role !== "admin" && (
                                            <button
                                                className="px-3 py-1 rounded border border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-xs"
                                                disabled={busyId === u.id}
                                                onClick={() =>
                                                    changeRole(u.id, "admin")
                                                }
                                            >
                                                {t(
                                                    "admin_users.promote",
                                                    "Promote to Admin"
                                                )}
                                            </button>
                                        )}
                                        {u.role === "admin" && (
                                            <button
                                                className="px-3 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs"
                                                disabled={busyId === u.id}
                                                onClick={() =>
                                                    changeRole(u.id, "user")
                                                }
                                            >
                                                {t(
                                                    "admin_users.demote",
                                                    "Set as User"
                                                )}
                                            </button>
                                        )}
                                        <button
                                            className="px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs"
                                            disabled={
                                                busyId === u.id ||
                                                u.username === selfUsername
                                            }
                                            onClick={() =>
                                                removeUser(u.id, u.username)
                                            }
                                            title={
                                                u.username === selfUsername
                                                    ? t(
                                                          "admin_users.no_self_delete",
                                                          "Cannot delete current user"
                                                      )
                                                    : t(
                                                          "admin_users.delete",
                                                          "Delete user"
                                                      )
                                            }
                                        >
                                            {t("admin_users.delete", "Delete")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserAdminPage;
