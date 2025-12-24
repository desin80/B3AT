const ENV_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE = ENV_URL.endsWith("/api") ? ENV_URL : `${ENV_URL}/api`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("b3at_admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = {
    checkHealth: async () => {
        try {
            const rootUrl = API_BASE.replace(/\/api$/, "");
            const res = await fetch(`${rootUrl}/`);
            return res.ok;
        } catch (e) {
            console.warn("Backend not reachable", e);
            return false;
        }
    },

    login: async (username, password) => {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(`${API_BASE}/token`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Login failed");
        return await res.json();
    },

    resetPassword: async (username, oldPassword, newPassword) => {
        const res = await fetch(`${API_BASE}/reset_password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                old_password: oldPassword,
                new_password: newPassword,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Reset password failed");
        return data;
    },

    uploadData: async (file, defaultServer = "global", defaultSeason = 9) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("default_server", defaultServer);
        formData.append("default_season", defaultSeason);

        const res = await fetch(`${API_BASE}/upload`, {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
            },
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Upload failed");
        }
        return data;
    },

    getAllStudents: async (lang = "en") => {
        try {
            const dbLang = lang.startsWith("zh") ? "zh" : "en";

            const res = await fetch(
                `https://schaledb.com/data/${dbLang}/students.json`
            );
            if (!res.ok) throw new Error("Failed to load student data");
            const data = await res.json();

            return Object.values(data);
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    getArenaSummaries: async (
        page = 1,
        filters = {},
        limit = 20,
        sort = "default",
        server = "global"
    ) => {
        const params = new URLSearchParams({ page, limit, sort, server });

        if (filters.season) params.append("season", filters.season);

        if (filters.minWinRate)
            params.append("min_win_rate", filters.minWinRate);
        if (filters.maxWinRate)
            params.append("max_win_rate", filters.maxWinRate);
        if (filters.minBattles)
            params.append("min_battles", filters.minBattles);

        if (filters.atkContains && filters.atkContains.length > 0)
            params.append("atk_contains", filters.atkContains.join(","));
        if (filters.defContains && filters.defContains.length > 0)
            params.append("def_contains", filters.defContains.join(","));

        if (filters.atkSlots && Object.keys(filters.atkSlots).length > 0) {
            const slots = Object.entries(filters.atkSlots)
                .map(([idx, id]) => `${idx}:${id}`)
                .join(",");
            params.append("atk_slots", slots);
        }
        if (filters.defSlots && Object.keys(filters.defSlots).length > 0) {
            const slots = Object.entries(filters.defSlots)
                .map(([idx, id]) => `${idx}:${id}`)
                .join(",");
            params.append("def_slots", slots);
        }

        const res = await fetch(`${API_BASE}/summaries?${params}`);
        if (!res.ok) throw new Error("Failed to fetch summaries");
        return await res.json();
    },

    getSummaryDetails: async (
        atkSig,
        defSig,
        server = "global",
        season = null,
        tag = null,
        page = 1,
        limit = 30,
        sort = "default"
    ) => {
        const params = new URLSearchParams({
            atk_sig: atkSig,
            def_sig: defSig,
            server,
            page,
            limit,
            sort,
        });
        if (season) params.append("season", season);
        if (tag) params.append("tag", tag);

        const res = await fetch(`${API_BASE}/summaries/detail?${params}`);
        if (!res.ok) throw new Error("Failed to fetch detail summaries");
        return await res.json();
    },

    deleteSummaryDetails: async (items) => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/summaries/detail/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify({ items }),
        });
        if (!res.ok) throw new Error("Failed to delete detail records");
        return await res.json();
    },

    deleteArenaSummary: async (atkSig, defSig, server, season, tag = "") => {
        const res = await fetch(`${API_BASE}/summaries/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({
                atk_sig: atkSig,
                def_sig: defSig,
                server,
                season,
                tag,
            }),
        });
        if (!res.ok) throw new Error("Delete failed (Auth required?)");
        return await res.json();
    },
    batchDeleteSummaries: async (items) => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/summaries/batch_delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify({ items }),
        });
        if (!res.ok) throw new Error("Batch delete failed");
        return await res.json();
    },
    getSeasons: async (server = null) => {
        try {
            let url = `${API_BASE}/seasons`;
            if (server && server !== "all") {
                url += `?server=${server}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch seasons");
            return await res.json();
        } catch (e) {
            console.warn("Error fetching seasons, using fallback", e);
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        }
    },
    getComments: async (atkSig, defSig, server = "global") => {
        const params = new URLSearchParams({
            atk_sig: atkSig,
            def_sig: defSig,
            server: server,
        });
        const res = await fetch(`${API_BASE}/comments?${params}`);
        if (!res.ok) throw new Error("Failed to load comments");
        return await res.json();
    },

    addComment: async (
        atkSig,
        defSig,
        server,
        username,
        content,
        parentId = null
    ) => {
        const res = await fetch(`${API_BASE}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                server: server || "global",
                atk_sig: atkSig,
                def_sig: defSig,
                username: username || "Sensei",
                content,
                parent_id: parentId,
            }),
        });
        if (!res.ok) throw new Error("Failed to post comment");
        return await res.json();
    },
    deleteComment: async (id) => {
        const res = await fetch(`${API_BASE}/comments/${id}`, {
            method: "DELETE",
            headers: { ...getAuthHeaders() },
        });
        if (!res.ok) throw new Error("Failed to delete (Auth required?)");
        return await res.json();
    },

    manualAddRecord: async (payload) => {
        const res = await fetch(`${API_BASE}/manual_add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add records");
        return await res.json();
    },
    submitRequest: async (formData) => {
        const res = await fetch(`${API_BASE}/submissions`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Submission failed");
        return await res.json();
    },

    getSubmissions: async () => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/submissions`, { headers });
        if (!res.ok) throw new Error("Failed to fetch submissions");
        return await res.json();
    },

    approveSubmission: async (id) => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/submissions/${id}/approve`, {
            method: "POST",
            headers,
        });
        if (!res.ok) throw new Error("Approval failed");
        return await res.json();
    },

    rejectSubmission: async (id) => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/submissions/${id}/reject`, {
            method: "POST",
            headers,
        });
        if (!res.ok) throw new Error("Rejection failed");
        return await res.json();
    },
    getSubmissionHistory: async () => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/submissions/history`, { headers });
        if (!res.ok) throw new Error("Failed to fetch history");
        return await res.json();
    },

    revertSubmission: async (id) => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/submissions/${id}/revert`, {
            method: "POST",
            headers,
        });
        if (!res.ok) throw new Error("Revert failed");
        return await res.json();
    },
    getUsers: async () => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/users`, { headers });
        if (!res.ok) throw new Error("Failed to load users");
        return await res.json();
    },
    createUser: async (username, password, role = "user") => {
        const headers = {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        };
        const res = await fetch(`${API_BASE}/users`, {
            method: "POST",
            headers,
            body: JSON.stringify({ username, password, role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Create user failed");
        return data;
    },
    updateUserRole: async (id, role) => {
        const headers = {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        };
        const res = await fetch(`${API_BASE}/users/${id}/role`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Update role failed");
        return data;
    },
    deleteUser: async (id) => {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: "DELETE",
            headers,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Delete user failed");
        return data;
    },
};

export default api;
