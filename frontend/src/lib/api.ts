const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken()

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
        },
    })

    if (res.status === 401) {
        localStorage.removeItem("access_token")
        window.location.href = "/login"
        throw new Error("Unauthorized")
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || "Something went wrong")
    }

    return res.json()
}

export const authApi = {
    getGoogleUrl: () =>
        request<{ url: string }>("/api/v1/auth/google/url"),

    getMe: () =>
        request<{ id: string; email: string; name: string; gmail_connected: boolean }>("/api/v1/auth/me"),
}

export const transactionsApi = {
    list: (params?: { category?: string; needs_review?: boolean }) => {
        const query = new URLSearchParams()
        if (params?.category) query.set("category", params.category)
        if (params?.needs_review) query.set("needs_review", "true")
        return request<any[]>(`/api/v1/transactions?${query}`)
    },

    correct: (id: string, category: string) =>
        request(`/api/v1/transactions/${id}/correct`, {
            method: "POST",
            body: JSON.stringify({ category }),
        }),

    delete: (id: string) =>
        request(`/api/v1/transactions/${id}`, { method: "DELETE" }),
}

export const budgetsApi = {
    list: () => request<any[]>("/api/v1/budgets"),

    create: (data: { category: string; limit_amount: number }) =>
        request("/api/v1/budgets", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request(`/api/v1/budgets/${id}`, { method: "DELETE" }),
}

export const dashboardApi = {
    get: () => request<any>("/api/v1/dashboard"),
}

export const emailApi = {
    sync: () => request("/api/v1/emails/sync", { method: "POST" }),
}

export const chatApi = {
    send: (message: string, history: { role: string; content: string }[]) =>
        request<{ reply: string }>("/api/v1/chat", {
            method: "POST",
            body: JSON.stringify({ message, history }),
        }),
}