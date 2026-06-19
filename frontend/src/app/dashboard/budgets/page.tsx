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

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this budget?")) return
        try {
            await budgetsApi.delete(id)
            setBudgets(budgets.filter((b) => b.id !== id))
        } catch (err: any) {
            setError(err.message || "Failed to delete budget")
        }
    }

    const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

    const barColor = (p: number) => p >= 80 ? "bg-error" : "bg-secondary-fixed-dim"
    const textColor = (p: number) => p >= 80 ? "text-error" : "text-secondary-fixed-dim"

    const totalAllocated = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const overallPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
    const usedCategories = budgets.map((b) => b.category)
    const availableCategories = CATEGORIES.filter((c) => !usedCategories.includes(c))

    const [featuredBudget, ...restBudgets] = budgets

    return (
        <div className="flex flex-col gap-6">
            {/* Header actions */}
            <div className="flex items-center justify-end">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}></span>
                    {showForm ? "Cancel" : "Add Budget"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="alert-error">
                    {error}
                </div>
            )}

            {/* Total Allocated summary */}
            {!loading && budgets.length > 0 && (
                <div className="glass-card rounded-2xl p-6 luminous-glow">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <p className="label-caps mb-1">Total Allocated</p>
                            <p className="text-on-surface font-bold" style={{ fontSize: "36px", lineHeight: "44px" }}>{fmt(totalAllocated)}</p>
                            <p className="text-on-surface-variant text-sm mt-1">
                                {fmt(totalSpent)} spent · {overallPct.toFixed(0)}% utilization
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-on-surface-variant text-xs mb-1">Active Budgets</p>
                            <p className="text-on-surface text-3xl font-bold">{budgets.length}</p>
                        </div>
                    </div>
                    <div className="progress-track">
                        <div
                            className={`h-2 rounded-full transition-all ${overallPct >= 80 ? "bg-error" : "bg-secondary-fixed-dim"}`}
                            style={{ width: `${Math.min(overallPct, 100)}%` }}
                        />
                    </div>
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
                <div className="grid grid-cols-2 gap-4">
                    {/* Featured budget (first) — full width */}
                    {featuredBudget && (
                        <div className="col-span-2 relative overflow-hidden glass-card rounded-2xl p-6 luminous-glow">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        
                                        <div>
                                            <p className="text-on-surface font-semibold text-lg">{featuredBudget.category}</p>
                                            <p className="text-on-surface-variant text-sm">Monthly budget</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(featuredBudget.id)}
                                        className="text-on-surface-variant hover:text-error transition-colors"
                                        title="Remove budget"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
                                    </button>
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <div>
                                        <p className="text-on-surface-variant text-xs mb-1">Spent</p>
                                        <p className={`font-bold ${textColor(featuredBudget.utilization_pct)}`} style={{ fontSize: "32px" }}>
                                            {fmt(featuredBudget.spent)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-on-surface-variant text-xs mb-1">Limit</p>
                                        <p className="text-on-surface text-2xl font-semibold">{fmt(featuredBudget.limit_amount)}</p>
                                    </div>
                                </div>
                                <div className="progress-track mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${barColor(featuredBudget.utilization_pct)}`}
                                        style={{ width: `${Math.min(featuredBudget.utilization_pct, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-on-surface-variant">
                                    <span>{featuredBudget.utilization_pct.toFixed(0)}% used</span>
                                    <span>
                                        {featuredBudget.remaining >= 0
                                            ? `${fmt(featuredBudget.remaining)} remaining`
                                            : `${fmt(Math.abs(featuredBudget.remaining))} over budget`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rest of budgets */}
                    {restBudgets.map((budget) => (
                        <div key={budget.id} className="card-glass">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    
                                    <div>
                                        <p className="text-on-surface text-sm font-semibold">{budget.category}</p>
                                        <p className="text-on-surface-variant text-xs">Monthly budget</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(budget.id)}
                                    className="text-on-surface-variant hover:text-error transition-colors"
                                    title="Remove budget"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                                </button>
                            </div>
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="text-on-surface-variant text-xs">Spent</p>
                                    <p className={`text-xl font-bold ${textColor(budget.utilization_pct)}`}>
                                        {fmt(budget.spent)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-on-surface-variant text-xs">Limit</p>
                                    <p className="text-on-surface text-sm font-medium">{fmt(budget.limit_amount)}</p>
                                </div>
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-1.5 mb-2">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${barColor(budget.utilization_pct)}`}
                                    style={{ width: `${Math.min(budget.utilization_pct, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-on-surface-variant">
                                <span>{budget.utilization_pct.toFixed(0)}% used</span>
                                <span>
                                    {budget.remaining >= 0
                                        ? `${fmt(budget.remaining)} remaining`
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
                                                
                                                <span className="text-on-surface text-sm">{budget.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-on-surface text-sm font-mono">{fmt(budget.spent)}</td>
                                        <td className="px-6 py-4 text-right text-on-surface-variant text-sm font-mono">{fmt(budget.limit_amount)}</td>
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
        </div>
    )
}
