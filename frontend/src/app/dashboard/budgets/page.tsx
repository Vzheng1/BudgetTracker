"use client"

import { useState, useEffect } from "react"
import { budgetsApi } from "@/lib/api"
import { Budget, CATEGORIES } from "@/types"

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [showForm, setShowForm] = useState(false)
    const [category, setCategory] = useState("")
    const [limitAmount, setLimitAmount] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { fetchBudgets() }, [])

    const fetchBudgets = async () => {
        try {
            setLoading(true)
            const data = await budgetsApi.list()
            setBudgets(data)
        } catch {
            setError("Failed to fetch budgets")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!category || !limitAmount) { setError("Please fill in all fields"); return }
        if (parseFloat(limitAmount) <= 0) { setError("Amount must be greater than 0"); return }
        try {
            setSaving(true)
            setError("")
            const newBudget = await budgetsApi.create({ category, limit_amount: parseFloat(limitAmount) })
            setBudgets([...budgets, newBudget])
            setShowForm(false)
            setCategory("")
            setLimitAmount("")
        } catch (err: any) {
            setError(err.message || "Failed to create budget")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (budget: Budget) => setDeleteTarget(budget)

    const confirmDelete = async () => {
        if (!deleteTarget) return
        try {
            setDeleting(true)
            await budgetsApi.delete(deleteTarget.id)
            setBudgets(budgets.filter((b) => b.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err: any) {
            setError(err.message || "Failed to delete budget")
        } finally {
            setDeleting(false)
        }
    }

    const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

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
    const categoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#64748b"

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
    const categoryIcon = (cat: string) => CATEGORY_ICONS[cat] ?? "category"



    const totalAllocated = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const overallPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
    const usedCategories = budgets.map((b) => b.category)
    const availableCategories = CATEGORIES.filter((c) => !usedCategories.includes(c))

    const [featuredBudget, ...restBudgets] = budgets

    return (
        <div className="flex flex-col gap-6">
            {/* Header — total allocated left, button bottom-aligned right */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="label-caps mb-1">Total Allocated</p>
                    {!loading && budgets.length > 0 ? (
                        <>
                            <p className="text-on-surface font-bold font-mono-money" style={{ fontSize: "48px", lineHeight: "56px" }}>{fmt(totalAllocated)}</p>
                            <p className="text-on-surface-variant text-sm mt-1">
                                {fmt(totalSpent)} spent · {overallPct.toFixed(0)}% utilization
                            </p>
                        </>
                    ) : (
                        <p className="text-on-surface font-bold" style={{ fontSize: "48px", lineHeight: "56px" }}>$0.00</p>
                    )}
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{showForm ? "close" : "add"}</span>
                    {showForm ? "Cancel" : "Add Budget"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="alert-error">
                    {error}
                </div>
            )}

            {/* Add budget form */}
            {showForm && (
                <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-on-surface text-sm font-semibold mb-4">New Budget</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-on-surface-variant text-xs font-medium">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-surface-container-high text-on-surface px-3 py-2 rounded-xl text-sm border border-outline-variant focus:outline-none focus:border-primary"
                            >
                                <option value="">Select category</option>
                                {availableCategories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-on-surface-variant text-xs font-medium">Monthly Limit ($)</label>
                            <input
                                type="number"
                                value={limitAmount}
                                onChange={(e) => setLimitAmount(e.target.value)}
                                placeholder="e.g. 500"
                                className="bg-surface-container-high text-on-surface px-3 py-2 rounded-xl text-sm border border-outline-variant focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="mt-4 bg-primary-container hover:opacity-90 disabled:opacity-50 text-on-primary-container px-5 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        {saving ? "Saving..." : "Save Budget"}
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-16 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined animate-spin block mx-auto mb-2" style={{ fontSize: "28px" }}>
                        progress_activity
                    </span>
                    Loading budgets...
                </div>
            )}

            {/* Empty state */}
            {!loading && budgets.length === 0 && (
                <div className="glass-card rounded-2xl p-16 text-center luminous-glow">
                    <span className="material-symbols-outlined block mx-auto mb-3 text-on-surface-variant" style={{ fontSize: "48px" }}>
                        donut_large
                    </span>
                    <p className="text-on-surface-variant text-sm font-medium">No budgets set yet</p>
                    <p className="text-on-surface-variant/50 text-xs mt-1">Add a budget to start tracking your spending limits</p>
                </div>
            )}

            {/* Bento grid */}
            {!loading && budgets.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {/* Featured budget — spans 2 cols */}
                    {featuredBudget && (
                        <div className="col-span-2 relative overflow-hidden glass-card rounded-2xl p-6 luminous-glow" style={{ borderTop: `3px solid ${categoryColor(featuredBudget.category)}` }}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${categoryColor(featuredBudget.category)}20` }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "24px", color: categoryColor(featuredBudget.category) }}>{categoryIcon(featuredBudget.category)}</span>
                                        </div>
                                        <div>
                                            <p className="text-on-surface font-semibold text-xl">{featuredBudget.category}</p>
                                            <p className="text-on-surface-variant text-base">Monthly budget</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(featuredBudget)}
                                        className="text-on-surface-variant hover:text-error transition-colors"
                                        title="Remove budget"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                                    </button>
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <div>
                                        <p className="text-on-surface-variant text-sm mb-1">Spent</p>
                                        <p className="font-bold text-on-surface" style={{ fontSize: "40px", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                                            {fmt(featuredBudget.spent)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-on-surface-variant text-sm mb-1">Limit</p>
                                        <p className="text-3xl font-bold" style={{ fontFamily: "'Hanken Grotesk', sans-serif", color: "rgba(255,255,255,0.6)" }}>{fmt(featuredBudget.limit_amount)}</p>
                                    </div>
                                </div>
                                <div className="progress-track mb-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(featuredBudget.utilization_pct, 100)}%`,
                                            backgroundColor: featuredBudget.utilization_pct >= 80 ? "var(--color-error)" : categoryColor(featuredBudget.category),
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-on-surface-variant">{featuredBudget.utilization_pct.toFixed(0)}% used</span>
                                    <span className="font-medium" style={{ color: categoryColor(featuredBudget.category), fontFamily: "'JetBrains Mono', monospace" }}>
                                        {featuredBudget.remaining >= 0
                                            ? `${fmt(featuredBudget.remaining)} remaining`
                                            : `${fmt(Math.abs(featuredBudget.remaining))} over budget`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rest of budgets — 1 col each, up to 3 per row */}
                    {restBudgets.map((budget) => (
                        <div key={budget.id} className="card-glass" style={{ borderTop: `3px solid ${categoryColor(budget.category)}` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${categoryColor(budget.category)}20` }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: categoryColor(budget.category) }}>{categoryIcon(budget.category)}</span>
                                    </div>
                                    <div>
                                        <p className="text-on-surface text-base font-semibold">{budget.category}</p>
                                        <p className="text-on-surface-variant text-sm">Monthly budget</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(budget)}
                                    className="text-on-surface-variant hover:text-error transition-colors"
                                    title="Remove budget"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                </button>
                            </div>
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="text-on-surface-variant text-sm">Spent</p>
                                    <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
                                        {fmt(budget.spent)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-on-surface-variant text-sm">Limit</p>
                                    <p className="text-base font-bold" style={{ fontFamily: "'Hanken Grotesk', sans-serif", color: "rgba(255,255,255,0.6)" }}>{fmt(budget.limit_amount)}</p>
                                </div>
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-1.5 mb-2">
                                <div
                                    className="h-1.5 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(budget.utilization_pct, 100)}%`,
                                        backgroundColor: budget.utilization_pct >= 80 ? "var(--color-error)" : categoryColor(budget.category),
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">{budget.utilization_pct.toFixed(0)}% used</span>
                                <span className="font-medium" style={{ color: categoryColor(budget.category), fontFamily: "'JetBrains Mono', monospace" }}>
                                    {budget.remaining >= 0
                                        ? `${fmt(budget.remaining)} left`
                                        : `${fmt(Math.abs(budget.remaining))} over`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Category Activity table */}
            {!loading && budgets.length > 0 && (
                <div className="card-glass-table">
                    <div className="px-6 py-4 border-b border-outline-variant/30">
                        <h3 className="text-on-surface text-sm font-semibold">Category Activity</h3>
                        <p className="text-on-surface-variant text-xs mt-0.5">Budget utilization by category, highest first</p>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-outline-variant/30">
                                <th className="text-left label-caps px-6 py-3">Category</th>
                                <th className="text-right label-caps px-6 py-3">Spent</th>
                                <th className="text-right label-caps px-6 py-3">Limit</th>
                                <th className="text-right label-caps px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...budgets]
                                .sort((a, b) => b.utilization_pct - a.utilization_pct)
                                .map((budget) => (
                                    <tr
                                        key={budget.id}
                                        className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container/20 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: categoryColor(budget.category) }}>{categoryIcon(budget.category)}</span>
                                                <span className="text-on-surface text-sm">{budget.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-on-surface text-sm font-mono-money">{fmt(budget.spent)}</td>
                                        <td className="px-6 py-4 text-right text-on-surface-variant text-sm font-mono-money">{fmt(budget.limit_amount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                budget.utilization_pct >= 100
                                                    ? "bg-error/20 text-error"
                                                    : budget.utilization_pct >= 80
                                                    ? "bg-error/10 text-error"
                                                    : "bg-secondary-fixed-dim/10 text-secondary-fixed-dim"
                                            }`}>
                                                {budget.utilization_pct.toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
                >
                    <div className="card-glass w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-error" style={{ fontSize: "20px" }}>delete</span>
                            </div>
                            <div>
                                <h2 className="text-on-surface text-base font-semibold">Delete Budget</h2>
                                <p className="text-on-surface-variant text-xs mt-0.5">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-on-surface-variant text-sm mb-6">
                            Are you sure you want to delete the{" "}
                            <span className="font-semibold" style={{ color: categoryColor(deleteTarget.category) }}>
                                {deleteTarget.category}
                            </span>{" "}
                            budget? Your transaction history will not be affected.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="btn-secondary flex-1"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 bg-error/20 hover:bg-error/30 disabled:opacity-50 text-error border border-error/30 hover:border-error/60 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
