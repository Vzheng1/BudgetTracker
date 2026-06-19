"use client"

import { useState, useEffect, useMemo } from "react"
import { transactionsApi } from "@/lib/api"
import { Transaction, CATEGORIES } from "@/types"

const LIMIT = 20

const CATEGORY_BADGE: Record<string, string> = {
    Food: "bg-[rgba(133,99,202,0.18)] text-tertiary",
    Shopping: "bg-[rgba(0,223,193,0.18)] text-secondary-fixed-dim",
    Transportation: "bg-[rgba(181,196,255,0.18)] text-primary-fixed-dim",
    Entertainment: "bg-[rgba(255,180,171,0.18)] text-error",
    Healthcare: "bg-[rgba(38,254,220,0.18)] text-secondary",
    Utilities: "bg-[rgba(210,187,255,0.18)] text-tertiary-fixed-dim",
    Travel: "bg-[rgba(181,196,255,0.18)] text-primary",
    Subscriptions: "bg-[rgba(181,196,255,0.18)] text-primary-fixed-dim",
    Other: "bg-surface-container-highest/50 text-on-surface-variant",
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [total, setTotal] = useState(0)
    const [categoryFilter, setCategoryFilter] = useState("")
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        setPage(0)
    }, [categoryFilter])

    useEffect(() => {
        fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter, page])

    const fetchTransactions = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await transactionsApi.list({
                category: categoryFilter || undefined,
                limit: LIMIT,
                offset: page * LIMIT,
            })
            setTransactions(data.transactions)
            setTotal(data.total)
        } catch {
            setError("Failed to load transactions")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this transaction?")) return
        try {
            await transactionsApi.delete(id)
            setTransactions(transactions.filter((t) => t.id !== id))
            setTotal((n) => n - 1)
        } catch {
            setError("Failed to delete transaction")
        }
    }

    const handleCorrect = async (id: string, currentCategory: string) => {
        const newCategory = prompt(`Change category from "${currentCategory}" to:`, currentCategory)
        if (!newCategory || newCategory === currentCategory) return
        try {
            await transactionsApi.correct(id, newCategory)
            setTransactions(transactions.map((t) => (t.id === id ? { ...t, category: newCategory as any } : t)))
        } catch {
            setError("Failed to update category")
        }
    }

    const fmt = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

    const fmtDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })

    const totalSpend = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions])

    const topCategory = useMemo(() => {
        const cats: Record<string, number> = {}
        transactions.forEach((t) => { cats[t.category] = (cats[t.category] || 0) + t.amount })
        const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1])
        return sorted[0]?.[0] ?? "—"
    }, [transactions])

    const needsReviewCount = useMemo(() => transactions.filter((t) => t.needs_review).length, [transactions])

    const totalPages = Math.ceil(total / LIMIT)
    const start = page * LIMIT + 1
    const end = Math.min((page + 1) * LIMIT, total)

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-surface-container border border-outline-variant text-on-surface-variant px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={fetchTransactions}
                    className="btn-secondary"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}></span>
                    Refresh Data
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="alert-error">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="card-glass-table">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-outline-variant">
                            <th className="text-left label-caps px-6 py-4">
                                Merchant
                            </th>
                            <th className="text-left label-caps px-6 py-4">
                                Category
                            </th>
                            <th className="text-left label-caps px-6 py-4">
                                Date
                            </th>
                            <th className="text-right label-caps px-6 py-4">
                                Amount
                            </th>
                            <th className="text-right label-caps px-6 py-4">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={5} className="text-center py-16 text-on-surface-variant text-sm">
                                    <span className="material-symbols-outlined animate-spin block mx-auto mb-2" style={{ fontSize: "24px" }}>
                                        progress_activity
                                    </span>
                                    Loading transactions...
                                </td>
                            </tr>
                        )}
                        {!loading && transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-16">
                                    <span className="material-symbols-outlined block mx-auto mb-3 text-on-surface-variant" style={{ fontSize: "40px" }}>
                                        receipt_long
                                    </span>
                                    <p className="text-on-surface-variant text-sm">No transactions found</p>
                                    <p className="text-on-surface-variant/50 text-xs mt-1">Connect Gmail to automatically import receipts</p>
                                </td>
                            </tr>
                        )}
                        {!loading && transactions.map((t) => {
                            const badge = CATEGORY_BADGE[t.category] ?? CATEGORY_BADGE.Other
                            return (
                                <tr
                                    key={t.id}
                                    className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-on-surface text-sm font-medium">{t.merchant}</p>
                                                {t.description && (
                                                    <p className="text-on-surface-variant text-xs mt-0.5 truncate max-w-xs">{t.description}</p>
                                                )}
                                                {t.needs_review && (
                                                    <span className="inline-block mt-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                                        Needs review
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleCorrect(t.id, t.category)}
                                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-opacity hover:opacity-75 ${badge}`}
                                        >
                                            {t.category}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-on-surface-variant text-sm">{fmtDate(t.date)}</td>
                                    <td className="px-6 py-4 text-right text-on-surface text-sm font-semibold font-mono">
                                        {fmt(t.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="text-on-surface-variant hover:text-error transition-colors"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Pagination footer */}
                {!loading && total > 0 && (
                    <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between">
                        <p className="text-on-surface-variant text-xs">
                            Showing {start}–{end} of {total} transactions
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="btn-icon"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>l</span>
                            </button>
                            <span className="text-on-surface-variant text-xs px-2">{page + 1} / {totalPages || 1}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="btn-icon"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>r</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Insight cards */}
            {!loading && transactions.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="card-glass">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-secondary-fixed-dim" style={{ fontSize: "20px" }}>payments</span>
                            <p className="label-caps">Page Total</p>
                        </div>
                        <p className="text-on-surface text-2xl font-bold font-mono">{fmt(totalSpend)}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{transactions.length} transactions shown</p>
                    </div>
                    <div className="card-glass">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: "20px" }}>category</span>
                            <p className="label-caps">Top Category</p>
                        </div>
                        <p className="text-on-surface text-2xl font-bold">{topCategory}</p>
                        <p className="text-on-surface-variant text-xs mt-1">Highest spend category</p>
                    </div>
                    <div className="card-glass">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>pending_actions</span>
                            <p className="label-caps">Needs Review</p>
                        </div>
                        <p className="text-on-surface text-2xl font-bold">{needsReviewCount}</p>
                        <p className="text-on-surface-variant text-xs mt-1">Unverified transactions</p>
                    </div>
                </div>
            )}
        </div>
    )
}
