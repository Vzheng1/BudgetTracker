/* User - Represents a user in the system
    -> All information should be imported from Gmail
*/
export type User = {
    id: string
    email: string
    name: string
    picture?: string
    gmail_connected: boolean
}

/* Transaction - Represents each individual transaction from email receipts*/
export type Transaction = {
    id: string
    merchant: string
    amount: number
    currency: string
    date: string
    category: Category
    description?: string
    needs_review: boolean
    created_at: string
}

/* Budget - Represents a budget the user set for a specific category*/
export type Budget = {
    id: string
    category: Category
    limit_amount: number
    period: "monthly"
    spent: number
    remaining: number
    utilization_pct: number
}

/* Insight - Represents a data-driven insight derived from the user's transactions*/
export type Insight = {
    id: string
    message: string
    insight_type: string
    created_at: string
}

/* ChatMessage - Represents a message in the chat */
export type ChatMessage = {
    role: "user" | "assistant"
    content: string
}

// Different categories a transaction can belong to
export type Category =
    | "Food"
    | "Shopping"
    | "Transportation"
    | "Entertainment"
    | "Healthcare"
    | "Utilities"
    | "Travel"
    | "Subscriptions"
    | "Other"

export const CATEGORIES: Category[] = [
    "Food",
    "Shopping",
    "Transportation",
    "Entertainment",
    "Healthcare",
    "Utilities",
    "Travel",
    "Subscriptions",
    "Other",
]

export const CATEGORY_COLORS: Record<Category, string> = {
    Food: "#f97316",
    Shopping: "#8b5cf6",
    Transportation: "#3b82f6",
    Entertainment: "#ec4899",
    Healthcare: "#10b981",
    Utilities: "#f59e0b",
    Travel: "#06b6d4",
    Subscriptions: "#6366f1",
    Other: "#64748b",
}