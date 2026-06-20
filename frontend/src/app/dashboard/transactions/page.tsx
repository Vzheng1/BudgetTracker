"use client"

import { useState, useEffect, useMemo } from "react"
import { transactionsApi } from "@/lib/api"
import { Transaction, CATEGORIES } from "@/types"



const CATEGORY_COLORS: Record<string, string> = {
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

const CATEGORY_ICONS: Record<string, string> = {
    Food: "restaurant",
    Shopping: "shopping_bag",
    Transportation: "directions_car",
    Entertainment: "movie",
    Healthcare: "health_and_safety",
    Utilities: "bolt",
    Travel: "flight",
    Subscriptions: "subscriptions",
    Other: "category",
}

const TIME_FILTERS = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
    { label: "Last 6 Months", value: "6m" },
    { label: "Last Year", value: "1y" },
]

function getTimeFilterSince(value: string): Date | null {
    const now = new Date()
    switch (value) {
        case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate())
        case "7d":  return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
        case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        case "6m":  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        case "1y":  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        default: return null
    }
}

const EMPTY_FORM = {
    merchant: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    category: "Other" as string,
    description: "",
}

const today = () => new Date().toISOString().slice(0, 10)

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [total, setTotal] = useState(0)
    const [categoryFilter, setCategoryFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("all")
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(5)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Add modal
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [formError, setFormError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // Edit modal
    const [editTarget, setEditTarget] = useState<Transaction | null>(null)
    const [editForm, setEditForm] = useState(EMPTY_FORM)
    const [editError, setEditError] = useState("")
    const [editSubmitting, setEditSubmitting] = useState(false)

    useEffect(() => { setPage(0) }, [categoryFilter, timeFilter, pageSize])

    useEffect(() => { fetchTransactions() }, [categoryFilter, timeFilter, page, pageSize])

    const fetchTransactions = async () => {
        try {
            setLoading(true)
            setError("")
            const useTimeFilter = timeFilter !== "all"
            const data = await transactionsApi.list({
                category: categoryFilter || undefined,
                limit: useTimeFilter ? 1000 : pageSize,
                offset: useTimeFilter ? 0 : page * pageSize,
            })
            if (useTimeFilter) {
                const since = getTimeFilterSince(timeFilter)!
                const filtered = data.transactions.filter(
                    (t: any) => new Date(t.date) >= since
                )
                setTransactions(filtered)
                setTotal(filtered.length)
            } else {
                setTransactions(data.transactions)
                setTotal(data.total)
            }
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

    const openAdd = () => {
        setForm({ ...EMPTY_FORM, date: today() })
        setFormError("")
        setShowModal(true)
    }

    const openEdit = (t: Transaction) => {
        setEditTarget(t)
        setEditForm({
            merchant: t.merchant,
            amount: String(t.amount),
            date: t.date.slice(0, 10),
            category: t.category,
            description: t.description || "",
        })
        setEditError("")
    }

    const handleCreate = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!form.merchant.trim()) { setFormError("Merchant is required"); return }
        const amount = parseFloat(form.amount)
        if (isNaN(amount) || amount <= 0) { setFormError("Enter a valid positive amount"); return }
        if (!form.date || form.date > today()) { setFormError("Date must be today or earlier"); return }
        setSubmitting(true)
        setFormError("")
        try {
            const created = await transactionsApi.create({
                merchant: form.merchant.trim(),
                amount,
                date: form.date,
                category: form.category,
                description: form.description.trim() || undefined,
            })
            setTransactions((prev) => [created, ...prev])
            setTotal((n) => n + 1)
            setShowModal(false)
        } catch (err: any) {
            setFormError(err.message || "Failed to create transaction")
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!editTarget) return
        if (!editForm.merchant.trim()) { setEditError("Merchant is required"); return }
        const amount = parseFloat(editForm.amount)
        if (isNaN(amount) || amount <= 0) { setEditError("Enter a valid positive amount"); return }
        if (!editForm.date || editForm.date > today()) { setEditError("Date must be today or earlier"); return }
        setEditSubmitting(true)
        setEditError("")
        try {
            const updated = await transactionsApi.update(editTarget.id, {
                merchant: editForm.merchant.trim(),
                amount,
                date: editForm.date,
                category: editForm.category,
                description: editForm.description.trim() || undefined,
            })
            setTransactions((prev) => prev.map((t) => (t.id === editTarget.id ? updated : t)))
            setEditTarget(null)
        } catch (err: any) {
            setEditError(err.message || "Failed to update transaction")
        } finally {
            setEditSubmitting(false)
        }
    }

    const fmt = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

    const fmtDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

    const totalSpend = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions])

    const topCategory = useMemo(() => {
        const cats: Record<string, number> = {}
        transactions.forEach((t) => { cats[t.category] = (cats[t.category] || 0) + t.amount })
        const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1])
        return sorted[0]?.[0] ?? "—"
    }, [transactions])

    const needsReviewCount = useMemo(() => transactions.filter((t) => t.needs_review).length, [transactions])

    const isTimePaginated = timeFilter === "all"
    const totalPages = Math.ceil(total / pageSize)
    const start = page * pageSize + 1
    const end = Math.min((page + 1) * pageSize, total)

    const inputClass = "w-full bg-surface-container border border-outline-variant text-on-surface px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary"

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex items-end justify-between">
                <div className="flex items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-on-surface-variant text-xs font-medium">Category Filter</span>
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
                    <div className="flex flex-col gap-1">
                        <span className="text-on-surface-variant text-xs font-medium">Time Filter</span>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-surface-container border border-outline-variant text-on-surface-variant px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                            {TIME_FILTERS.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-on-surface-variant text-xs font-medium">Per Page</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="bg-surface-container border border-outline-variant text-on-surface-variant px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                            {[5, 10, 20, 50].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={openAdd} className="btn-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                    Add Transaction
                </button>
            </div>

            {/* Error */}
            {error && <div className="alert-error">{error}</div>}

            {/* Table */}
            <div className="card-glass-table">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-outline-variant">
                            <th className="text-left label-caps px-6 py-4">Merchant & Details</th>
                            <th className="text-center label-caps px-6 py-4">Category</th>
                            <th className="text-center label-caps px-6 py-4">Date</th>
                            <th className="text-right label-caps px-6 py-4">Amount</th>
                            <th className="text-center label-caps px-6 py-4">Actions</th>
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
                            const color = CATEGORY_COLORS[t.category] ?? "#64748b"
                            const icon = CATEGORY_ICONS[t.category] ?? "category"
                            return (
                                <tr
                                    key={t.id}
                                    className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/30 transition-colors"
                                >
                                    {/* Merchant & Details */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const color = CATEGORY_COLORS[t.category] ?? "#64748b"
                                                return (
                                                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color }}>{icon}</span>
                                                    </div>
                                                )
                                            })()}
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
                                    {/* Category */}
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className="text-xs px-3 py-1.5 rounded-full font-medium"
                                            style={{ fontFamily: "'Hanken Grotesk', sans-serif", backgroundColor: `${color}20`, color }}
                                        >
                                            {t.category}
                                        </span>
                                    </td>
                                    {/* Date */}
                                    <td className="px-6 py-4 text-center text-on-surface-variant text-sm" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
                                        {fmtDate(t.date)}
                                    </td>
                                    {/* Amount */}
                                    <td className="px-6 py-4 text-right text-on-surface text-sm font-semibold font-mono">
                                        {fmt(t.amount)}
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => openEdit(t)}
                                                className="text-on-surface-variant hover:text-on-surface transition-colors"
                                                title="Edit"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-on-surface-variant hover:text-error transition-colors"
                                                title="Delete"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Pagination footer — only when not time-filtered */}
                {!loading && isTimePaginated && total > 0 && (
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
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
                            </button>
                            <span className="text-on-surface-variant text-xs px-2">{page + 1} / {totalPages || 1}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="btn-icon"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
                {!loading && !isTimePaginated && total > 0 && (
                    <div className="px-6 py-4 border-t border-outline-variant/30">
                        <p className="text-on-surface-variant text-xs">{total} transaction{total !== 1 ? "s" : ""} in this period</p>
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

            {/* Add Transaction Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
                >
                    <div className="card-glass w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-on-surface text-lg font-semibold">Add Transaction</h2>
                            <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
                            </button>
                        </div>
                        {formError && <div className="alert-error mb-4">{formError}</div>}
                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <div>
                                <label className="label-caps block mb-1.5">Merchant</label>
                                <input type="text" placeholder="e.g. Whole Foods" value={form.merchant}
                                    onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
                                    className={inputClass} autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label-caps block mb-1.5">Amount (USD)</label>
                                    <input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount}
                                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className="label-caps block mb-1.5">Date</label>
                                    <input type="date" value={form.date} max={today()}
                                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                        className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="label-caps block mb-1.5">Category</label>
                                <select value={form.category}
                                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                    className={`${inputClass} text-on-surface-variant cursor-pointer`}>
                                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-caps block mb-1.5">Description <span className="normal-case text-on-surface-variant/60 font-normal">(optional)</span></label>
                                <input type="text" placeholder="e.g. Weekly groceries" value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    className={inputClass} />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                                    {submitting ? "Saving…" : "Save Transaction"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Transaction Modal */}
            {editTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null) }}
                >
                    <div className="card-glass w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-on-surface text-lg font-semibold">Edit Transaction</h2>
                            <button onClick={() => setEditTarget(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
                            </button>
                        </div>
                        {editError && <div className="alert-error mb-4">{editError}</div>}
                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="label-caps block mb-1.5">Merchant</label>
                                <input type="text" value={editForm.merchant}
                                    onChange={(e) => setEditForm((f) => ({ ...f, merchant: e.target.value }))}
                                    className={inputClass} autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label-caps block mb-1.5">Amount (USD)</label>
                                    <input type="number" min="0.01" step="0.01" value={editForm.amount}
                                        onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className="label-caps block mb-1.5">Date</label>
                                    <input type="date" value={editForm.date} max={today()}
                                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                                        className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="label-caps block mb-1.5">Category</label>
                                <select value={editForm.category}
                                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                                    className={`${inputClass} text-on-surface-variant cursor-pointer`}>
                                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-caps block mb-1.5">Description <span className="normal-case text-on-surface-variant/60 font-normal">(optional)</span></label>
                                <input type="text" placeholder="e.g. Weekly groceries" value={editForm.description}
                                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                    className={inputClass} />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary flex-1" disabled={editSubmitting}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1" disabled={editSubmitting}>
                                    {editSubmitting ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
