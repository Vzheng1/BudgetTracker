"use client"

import { useState, useEffect } from "react"
import { dashboardApi } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"

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
    insights: { message: string; insight_type: string }[]
    monthly_trend: { month: string; total: number }[]
}

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

const CATEGORY_BADGE: Record<string, string> = {
    Food: "bg-orange-500/20 text-orange-400",
    Shopping: "bg-purple-500/20 text-purple-400",
    Transportation: "bg-blue-500/20 text-blue-400",
    Entertainment: "bg-pink-500/20 text-pink-400",
    Healthcare: "bg-emerald-500/20 text-emerald-400",
    Utilities: "bg-amber-500/20 text-amber-400",
    Travel: "bg-cyan-500/20 text-cyan-400",
    Subscriptions: "bg-indigo-500/20 text-indigo-400",
    Other: "bg-slate-500/20 text-slate-400",
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
        } catch {
            setError("Failed to load dashboard")
        } finally {
            setLoading(false)
        }
    }

    const fmt = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

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

    const getBarColor = (p: number) => {
        if (p >= 100) return "bg-red-500"
        if (p >= 80) return "bg-yellow-500"
        return "bg-blue-500"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 text-sm">Loading...</p>
            </div>
        )
    }
    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )
    }
    if (!data) return null

    return (
        <div className="flex flex-col gap-6">

            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-0.5">Your spending overview</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card-slate">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Spent</p>
                    <p className="text-2xl font-bold text-white mt-2">{fmt(data.total_this_month)}</p>
                    {data.total_last_month > 0 && (
                        <p className={`text-xs mt-1.5 font-medium ${data.mom_change > 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {data.mom_change > 0 ? "↑" : "↓"}{Math.abs(data.mom_pct)}% from last month
                        </p>
                    )}
                </div>

                <div className="card-slate">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Transactions</p>
                    <p className="text-2xl font-bold text-white mt-2">{data.transaction_count}</p>
                    <p className="text-slate-500 text-xs mt-1.5">This month</p>
                </div>

                <div className="card-slate">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Top Category</p>
                    <p className="text-2xl font-bold text-white mt-2">{data.top_category ?? "—"}</p>
                    <p className="text-slate-500 text-xs mt-1.5">This month</p>
                </div>
            </div>

            {/* Spending trend */}
            <div className="card-slate">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-white">Spending Trend</h2>
                    <div className="flex bg-slate-700/60 rounded-lg p-0.5">
                        {(["monthly", "yearly"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setTrendView(v)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                                    trendView === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={trendData} barSize={28}>
                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                            <Tooltip
                                formatter={(value) => [fmt(Number(value)), "Spent"]}
                                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
                                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                            />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-slate-500 text-sm text-center py-12">No trend data yet</p>
                )}
            </div>

            {/* Category + Budgets */}
            <div className="grid grid-cols-2 gap-4">

                {/* Pie */}
                <div className="card-slate">
                    <h2 className="text-sm font-semibold text-white mb-4">By Category</h2>
                    {data.by_category.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={data.by_category}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={((props: any) =>
                                        `${props.category} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                                    ) as any}
                                    labelLine={false}
                                >
                                    {data.by_category.map((entry) => (
                                        <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#64748b"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [fmt(Number(value)), "Spent"]}
                                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-12">No data yet</p>
                    )}
                </div>

                {/* Budgets */}
                <div className="card-slate">
                    <h2 className="text-sm font-semibold text-white mb-4">Budgets</h2>
                    {data.budgets.length === 0 ? (
                        <p className="text-slate-500 text-sm">No budgets set yet</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {data.budgets.map((budget) => (
                                <div key={budget.id}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-300 font-medium">{budget.category}</span>
                                        <span className="text-slate-400">
                                            {fmt(budget.spent)} / {fmt(budget.limit_amount)}
                                        </span>
                                    </div>
                                    <div className="progress-track-sm">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${getBarColor(budget.utilization_pct)}`}
                                            style={{ width: `${Math.min(budget.utilization_pct, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {budget.utilization_pct.toFixed(0)}% used
                                        {budget.remaining < 0
                                            ? ` · ${fmt(Math.abs(budget.remaining))} over`
                                            : ` · ${fmt(budget.remaining)} left`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Insights */}
            {data.insights.length > 0 && (
                <div className="card-slate">
                    <h2 className="text-sm font-semibold text-white mb-3">Insights</h2>
                    <div className="flex flex-col gap-2">
                        {data.insights.map((insight, i) => (
                            <p key={i} className="text-slate-400 text-sm">{insight.message}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent transactions */}
            <div className="card-slate">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
                    <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        View all
                    </Link>
                </div>
                {data.recent_transactions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-slate-500 text-sm">No transactions yet</p>
                        <p className="text-slate-600 text-xs mt-1">Connect Gmail to import your receipts</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {data.recent_transactions.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="text-white text-sm font-medium">{t.merchant}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${CATEGORY_BADGE[t.category] ?? "bg-slate-500/20 text-slate-400"}`}>
                                            {t.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white text-sm font-medium">{fmt(t.amount)}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">
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
