"use client"

import { useState, useEffect, use } from "react"
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

    useEffect(() => {
        fetchBudgets()
    }, [])

    const fetchBudgets = async () => {
        try {
            setLoading(true)
            const data = await budgetsApi.list()
            console.log(data)
            setBudgets(data)
        } catch (error) {
            setError("Failed to fetch budgets")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if(!category || !limitAmount) {
            setError("Please fill in all fields")
            return
        }
        if(parseFloat(limitAmount) <= 0) {
            setError("Amount must be greater than 0")
            return
        }

        try {
            setSaving(true)
            setError("")

            const newBudget = await budgetsApi.create({category, limit_amount: parseFloat(limitAmount),})
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
        if(!confirm("Delete this budget?")) return

        try {
            await budgetsApi.delete(id)
            setBudgets(budgets.filter(b => b.id !== id))
        } catch (err: any) {
            setError(err.message || "Failed to delete budget")
        } finally {
            setSaving(false)
        }
    }

    const usedCategories = budgets.map((b) => b.category)
    const availableCategories = CATEGORIES.filter((c) => !usedCategories.includes(c))

    const getUtilizationColor = (p: number) => {
        if (p >= 100) return "bg-red-500"
        if (p >= 80) return "bg-yellow-500"
        return "bg-green-500"
    }
    const getTextColor = (p: number) => {
        if (p >= 100) return "text-red-400"
        if (p >= 80) return "text-yellow-400"
        return "text-green-400"
    }

    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-black">Budgets</h1>
            <p className="text-slate-400 mt-1">Set monthly limits per category</p>
            </div>
            <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                {showForm ? "Cancel" : "Add Budget"}
            </button>
        </div>

        {/* Error message */}
        {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Add budget form */}
        {showForm && (
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">New Budget</h2>

            <div className="grid grid-cols-2 gap-4">
                {/* Category picker — only shows unused categories */}
                <div className="flex flex-col gap-2">
                <label className="text-slate-400 text-sm">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-600"
                >
                    <option value="">Select category</option>
                    {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                </div>

                {/* Monthly limit amount */}
                <div className="flex flex-col gap-2">
                <label className="text-slate-400 text-sm">Monthly Limit ($)</label>
                <input
                    type="number"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                />
                </div>
            </div>

            <button
                onClick={handleCreate}
                disabled={saving}
                className="self-start bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                {saving ? "Saving..." : "Save Budget"}
            </button>
            </div>
        )}

        {/* Loading state */}
        {loading && (
            <div className="text-center py-12 text-slate-400">Loading...</div>
        )}

        {/* Empty state */}
        {!loading && budgets.length === 0 && (
            <div className="bg-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400">No budgets set yet</p>
            <p className="text-slate-500 text-sm mt-1">
                Add a budget to start tracking your spending limits
            </p>
            </div>
        )}

        {/* Budget cards */}
        <div className="grid grid-cols-2 gap-6">
            {budgets.map((budget) => (
            <div key={budget.id} className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">

                {/* Budget header */}
                <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{budget.category}</h3>
                <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                >
                    Remove
                </button>
                </div>

                {/* Spent vs limit */}
                <div className="flex items-end justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Spent this month</p>
                    <p className={`text-2xl font-bold ${getTextColor(budget.utilization_pct)}`}>
                    ${budget.spent.toFixed(2)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-sm">Limit</p>
                    <p className="text-white font-medium">${budget.limit_amount.toFixed(2)}</p>
                </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1">
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                    className={`h-2 rounded-full transition-all ${getUtilizationColor(budget.utilization_pct)}`}
                    // Cap the width at 100% visually even if over budget
                    style={{ width: `${Math.min(budget.utilization_pct, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                    <span>{budget.utilization_pct.toFixed(0)}% used</span>
                    <span>
                    {budget.remaining >= 0
                        ? `$${budget.remaining.toFixed(2)} left`
                        : `$${Math.abs(budget.remaining).toFixed(2)} over`}
                    </span>
                </div>
                </div>

            </div>
            ))}
        </div>

        </div>
    )
}