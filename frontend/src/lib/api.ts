import { Budget } from "@/types"

// Base URL for API calls to the backend
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"


// Helper function to get the user's access token from local storage
function getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
}


// Generic request function used for API calls - Caller specifies the type the response will be
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

    // Invalid response -> invalid token/ expired -> clear from storage and redirect to login 
    if (res.status === 401) {
        localStorage.removeItem("access_token")
        window.location.href = "/login"
        throw new Error("Unauthorized")
    }

    // Handle other errors and print in detail so it can be dealt with accordingly 
    if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || "Something went wrong")
    }

    // Parse and return the JSON response body
    return res.json()
}


// --- AuthAPI: FastAPI authentication related API calls -----------

export const authApi = {
    // (1) Gets Google OAuth URL from backend + frontend redirects user to URL to start login flow
    getGoogleUrl: () =>
        request<{ url: string }>("/api/v1/auth/google/url"),

    // (2) Gets currently logged in user's profile information + checks if user is still authenticated
    getMe: () =>
        request<{ id: string; email: string; name: string; gmail_connected: boolean }>("/api/v1/auth/me"),
}


// --- TransactionsAPI: FastAPI transactions related API calls -----------

export const transactionsApi = {
    // (1) Fetches all transactions, with optional filters
    list: (params?: { category?: string; needs_review?: boolean }) => {
        const query = new URLSearchParams()
        if (params?.category) query.set("category", params.category)
        if (params?.needs_review) query.set("needs_review", "true")
        return request<any[]>(`/api/v1/transactions?${query}`)
    },

    // (2) Submits a manual category correction for a transaction
    //   - Feeds into the ML training pipeline for future categorization
    correct: (id: string, category: string) =>
        request(`/api/v1/transactions/${id}/correct`, {
            method: "POST",
            body: JSON.stringify({ category }),
        }),

    // (3) Soft deletes a transaction by ID - marks as deleted, but doesn't remove from database
    delete: (id: string) =>
        request(`/api/v1/transactions/${id}`, { method: "DELETE" }),
}

// --- BudgetsAPI: FastAPI budgets related API calls --------------------

export const budgetsApi = {
    // (1) Fetches all budgets with their current spent/remaining amounts
    list: () => request<any[]>("/api/v1/budgets"),

    // (2) Creates a new budget for a category
    create: (data: { category: string; limit_amount: number }) =>
        request<Budget>("/api/v1/budgets", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // (3) Deletes a budget by ID
    delete: (id: string) =>
        request(`/api/v1/budgets/${id}`, { method: "DELETE" }),
}

// --- DashboardAPI: FastAPI dashboard related API calls -----------
export const dashboardApi = {
    // Fetches all dashboard data - including totals, category breakdown, user stats, recent transactions, etc.
    get: () => request<any>("/api/v1/dashboard"),
}

// --- EmailAPI: FastAPI email related API calls -----------
export const emailApi = {
    // Triggers a manual sync of the user's emails - Tells backend to fetch and process new emails
    sync: () => request("/api/v1/emails/sync", { method: "POST" }),
}

// --- ChatAPI: FastAPI chat related API calls -----------
export const chatApi = {
    // Sends a message to the chat API and returns the reply
    send: (message: string, history: { role: string; content: string }[]) =>
        request<{ reply: string }>("/api/v1/chat", {
            method: "POST",
            body: JSON.stringify({ message, history }),
        }),
}