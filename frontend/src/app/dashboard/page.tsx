"use client"

import { useState, useEffect } from "react"
import { dashboardApi } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from "recharts"

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
    insights: {message: string; insight_type: string}[]
    monthly_trend: { month: string; total: number }[]
}

// Colors for pie chart slices
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

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [trendView, setTrendView] = useState<"monthly" | "yearly">("monthly")

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
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
    }

    const getMomColor = (change: number) => {
        return change > 0 ? "text-red-400" : "text-green-400"
    }
    const getBarColor = (p: number) => {
        if (p >= 100) return "bg-red-500"
        if (p >= 80) return "bg-yellow-500"
        return "bg-green-500"
    }

    // Group monthly trend data by year for yearly view
    const getYearlyData = (monthly: { month: string; total: number }[]) => {
        const byYear: Record<string, number> = {}
        monthly.forEach(({ month, total }) => {
            const year = month.split("-")[0]
            byYear[year] = (byYear[year] || 0) + total
        })
        return Object.entries(byYear).map(([year, total]) => ({ month: year, total }))
    }

    const trendData = data?.monthly_trend
        ? trendView === "yearly"
            ? getYearlyData(data.monthly_trend)
            : data.monthly_trend
        : []

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

        {/* Spending trend chart */}
        <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Spending Trend</h2>
            {/* Toggle between monthly and yearly view */}
            <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                onClick={() => setTrendView("monthly")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    trendView === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                >
                Monthly
                </button>
                <button
                onClick={() => setTrendView("yearly")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    trendView === "yearly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                >
                Yearly
                </button>
            </div>
            </div>

            {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                    formatter={(value) => [formatAmount(Number(value)), "Spent"]}
                    contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            ) : (
            <p className="text-slate-400 text-center py-12">No trend data yet</p>
            )}
        </div>

        {/* Category breakdown + budget progress side by side */}
        <div className="grid grid-cols-2 gap-6">

            {/* Pie chart — spending by category */}
            <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">By Category</h2>
            {data.by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                    data={data.by_category}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={((props: any) =>
                        `${props.category} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                    ) as any}
                    labelLine={false}
                    >
                    {data.by_category.map((entry) => (
                        <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] ?? "#64748b"}
                        />
                    ))}
                    </Pie>
                    <Tooltip
                    formatter={(value) => [formatAmount(Number(value)), "Spent"]}
                    contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                    }}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-slate-400 text-center py-12">No data yet</p>
            )}
            </div>

            {/* Budget progress */}
            <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Budgets</h2>
            {data.budgets.length === 0 ? (
                <p className="text-slate-400 text-sm">No budgets set yet</p>
            ) : (
                <div className="flex flex-col gap-4">
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
                    <p className="text-xs text-slate-500">
                        {budget.utilization_pct.toFixed(0)}% used
                        {budget.remaining < 0
                        ? ` — ${formatAmount(Math.abs(budget.remaining))} over`
                        : ` — ${formatAmount(budget.remaining)} left`}
                    </p>
                    </div>
                ))}
                </div>
            )}
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

        {/* Recent transactions */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            {data.recent_transactions.length === 0 ? (
            <div className="text-center py-8">
                <p className="text-slate-400">No transactions yet</p>
                <p className="text-slate-500 text-sm mt-1">Connect Gmail to import your receipts</p>
            </div>
            ) : (
            <div className="flex flex-col gap-3">
                {data.recent_transactions.map((t) => (
                <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                    <div>
                    <p className="text-white text-sm font-medium">{t.merchant}</p>
                    <p className="text-slate-400 text-xs">{t.category}</p>
                    </div>
                    <div className="text-right">
                    <p className="text-white text-sm font-medium">{formatAmount(t.amount)}</p>
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