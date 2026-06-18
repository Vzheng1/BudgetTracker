"use client"

import { useState, useEffect } from "react"
import { dashboardApi } from "@/lib/api"

// Type for the dashboard data returned by the backend
type DashboardData = {
    total_this_month: number
    total_last_month: number
    mom_change: number
    mom_pct: number
    transaction_count: number
    top_category: string | null
    by_category: { category: string; total: number }[]
    recent_transactions: {
        id: string
        merchant: string
        amount: number
        category: string
        date: string
    }[]
    budgets: {
        id: string
        category: string
        limit_amount: number
        spent: number
        remaining: number
        utilization_pct: number
    }[]
    insights: {
        message: string
        insight_type: string
    }[]
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            const result = await dashboardApi.get()
            setData(result)
        } catch (err) {
            setError("Failed to load dashboard")
        } finally {
            setLoading(false)
        }
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }
    const formatDate = (dateStr: string) => {
        new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
    }

    const getMomColor = (change: number) => {
        change > 0 ? "text-red-400" : "text-green-400"
    }
    const getBarColor = (p: number) => {
        if (p >= 100) return "bg-red-500"
        if (p >= 80) return "bg-yellow-500"
        return "bg-green-500"
    }

    if (loading) {
        return (
        <div className="flex items-center justify-center h-64">
            <p className="text-slate-400">Loading...</p>
        </div>
        )
    }
    if (error) {
        return (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {error}
        </div>
        )
    }
    if (!data) return null

    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-black">Dashboard</h1>
            <p className="text-slate-400 mt-1">Your spending overview</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-6">

            {/* Total spent this month */}
            <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Total Spent</p>
            <p className="text-3xl font-bold text-white mt-1">
                {formatAmount(data.total_this_month)}
            </p>
            {/* Show month over month change if we have last month data */}
            {data.total_last_month > 0 && (
                <p className={`text-sm mt-1 ${getMomColor(data.mom_change)}`}>
                {data.mom_change > 0 ? "+" : ""}{data.mom_pct}% vs last month
                </p>
            )}
            </div>

            {/* Transaction count */}
            <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Transactions</p>
            <p className="text-3xl font-bold text-white mt-1">
                {data.transaction_count}
            </p>
            <p className="text-slate-500 text-sm mt-1">This month</p>
            </div>

            {/* Top spending category */}
            <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Top Category</p>
            <p className="text-3xl font-bold text-white mt-1">
                {data.top_category ?? "—"}
            </p>
            <p className="text-slate-500 text-sm mt-1">This month</p>
            </div>

        </div>

        {/* Insights — only show if there are any */}
        {data.insights.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-white">Insights</h2>
            {data.insights.map((insight, i) => (
                <p key={i} className="text-slate-300 text-sm">{insight.message}</p>
            ))}
            </div>
        )}

        {/* Spending by category */}
        {data.by_category.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Spending by Category</h2>
            {data.by_category.map((item) => {
                // Calculate percentage of total spending for this category
                const pct = data.total_this_month > 0
                ? (item.total / data.total_this_month) * 100
                : 0
                return (
                <div key={item.category} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{item.category}</span>
                    <span className="text-white font-medium">{formatAmount(item.total)}</span>
                    </div>
                    {/* Progress bar showing proportion of total */}
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                    />
                    </div>
                </div>
                )
            })}
            </div>
        )}

        {/* Budget progress */}
        {data.budgets.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Budgets</h2>
            {data.budgets.map((budget) => (
                <div key={budget.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{budget.category}</span>
                    <span className="text-white">
                    {formatAmount(budget.spent)} / {formatAmount(budget.limit_amount)}
                    </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                    className={`h-2 rounded-full transition-all ${getBarColor(budget.utilization_pct)}`}
                    style={{ width: `${Math.min(budget.utilization_pct, 100)}%` }}
                    />
                </div>
                </div>
            ))}
            </div>
        )}

        {/* Recent transactions */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>

            {data.recent_transactions.length === 0 ? (
            <div className="text-center py-8">
                <p className="text-slate-400">No transactions yet</p>
                <p className="text-slate-500 text-sm mt-1">
                Connect Gmail to import your receipts
                </p>
            </div>
            ) : (
            <div className="flex flex-col gap-3">
                {data.recent_transactions.map((t) => (
                <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                    <div className="flex items-center gap-3">
                    <div>
                        <p className="text-white text-sm font-medium">{t.merchant}</p>
                        <p className="text-slate-400 text-xs">{t.category}</p>
                    </div>
                    </div>
                    <div className="text-right">
                    <p className="text-white text-sm font-medium">
                        {formatAmount(t.amount)}
                    </p>
                    <p className="text-slate-400 text-xs">
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>

        </div>
    )
}