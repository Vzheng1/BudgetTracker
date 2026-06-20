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
    yearly_trend: { month: string; total: number }[]
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

const PRIMARY = "#b5c4ff"
const MONO = "'JetBrains Mono', monospace"
const HANKEN = "'Hanken Grotesk', sans-serif"

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [trendView, setTrendView] = useState<"monthly" | "yearly">("monthly")

    useEffect(() => { fetchDashboard() }, [])

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

    const trendData = data
        ? trendView === "yearly"
            ? data.yearly_trend
            : data.monthly_trend
        : []

    const getBarColor = (p: number): string => {
        if (p >= 100) return "#ef4444"
        if (p >= 80)  return "#eab308"
        return PRIMARY
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 text-base">Loading...</p>
            </div>
        )
    }
    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-base">
                {error}
            </div>
        )
    }
    if (!data) return null

    return (
        <div className="flex flex-col gap-6" style={{ fontFamily: HANKEN }}>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card-slate custom-glow">
                    <p className="text-sm font-medium uppercase tracking-wide" style={{ fontFamily: MONO, color: "rgba(255,255,255,0.55)" }}>Total Spent</p>
                    <p className="text-4xl font-bold text-white mt-2">{fmt(data.total_this_month)}</p>
                    {data.total_last_month > 0 && (
                        <p className={`text-sm mt-1.5 font-medium ${data.mom_change > 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {data.mom_change > 0 ? "↑" : "↓"}{Math.abs(data.mom_pct)}% from last month
                        </p>
                    )}
                </div>

                <div className="card-slate custom-glow">
                    <p className="text-sm font-medium uppercase tracking-wide" style={{ fontFamily: MONO, color: "rgba(255,255,255,0.55)" }}>Transactions</p>
                    <p className="text-4xl font-bold text-white mt-2">{data.transaction_count}</p>
                    <p className="text-slate-500 text-sm mt-1.5">This month</p>
                </div>

                <div className="card-slate custom-glow">
                    <p className="text-sm font-medium uppercase tracking-wide" style={{ fontFamily: MONO, color: "rgba(255,255,255,0.55)" }}>Top Category</p>
                    <p className="text-4xl font-bold text-white mt-2">{data.top_category ?? "—"}</p>
                    <p className="text-slate-500 text-sm mt-1.5">This month</p>
                </div>
            </div>

            {/* Spending trend */}
            <div className="card-slate">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-3xl font-semibold pb-4 text-white">Spending Trend</h2>
                    <div className="flex bg-slate-700/60 rounded-lg p-0.5">
                        {(["monthly", "yearly"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setTrendView(v)}
                                className="px-3 py-1 rounded-md text-base font-medium transition-colors capitalize"
                                style={trendView === v
                                    ? { backgroundColor: PRIMARY, color: "#00174c" }
                                    : { color: "#94a3b8" }
                                }
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={trendData} barSize={28}>
                            <XAxis
                                dataKey="month"
                                tick={{ fill: "#64748b", fontSize: 12, fontFamily: MONO }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#64748b", fontSize: 12, fontFamily: MONO }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip
                                formatter={(value) => [fmt(Number(value)), "Spent"]}
                                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px", fontFamily: MONO }}
                                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                            />
                            <Bar dataKey="total" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-slate-500 text-base text-center py-12">No trend data yet</p>
                )}
            </div>

            {/* Category + Budgets */}
            <div className="grid grid-cols-2 gap-4">

                {/* Pie */}
                <div className="card-slate flex flex-col" style={{ maxHeight: "380px" }}>
                    <h2 className="text-3xl font-semibold text-white mb-4 flex-none">By Category</h2>
                    <div className="overflow-y-auto flex-1">
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
                                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px", fontFamily: MONO }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500 text-base text-center py-12">No data yet</p>
                        )}
                    </div>
                </div>

                {/* Budgets */}
                <div className="card-slate flex flex-col" style={{ maxHeight: "380px" }}>
                    <h2 className="text-3xl font-semibold text-white mb-4 flex-none">Budgets</h2>
                    {data.budgets.length === 0 ? (
                        <p className="text-slate-500 text-base">No budgets set yet</p>
                    ) : (
                        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
                            {data.budgets.map((budget) => (
                                <div key={budget.id}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-300 font-medium">{budget.category}</span>
                                        <span className="text-slate-400">
                                            {fmt(budget.spent)} / {fmt(budget.limit_amount)}
                                        </span>
                                    </div>
                                    <div className="progress-track-sm">
                                        <div
                                            className="h-1.5 rounded-full transition-all"
                                            style={{ width: `${Math.min(budget.utilization_pct, 100)}%`, backgroundColor: getBarColor(budget.utilization_pct) }}
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">
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
                    <h2 className="text-base font-semibold text-white mb-3">Insights</h2>
                    <div className="flex flex-col gap-2">
                        {data.insights.map((insight, i) => (
                            <p key={i} className="text-slate-400 text-base">{insight.message}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent transactions */}
            <div className="card-glass-table">
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-slate-700"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.4)" }}
                >
                    <h2 className="text-3xl font-semibold text-white">Recent Transactions</h2>
                    <Link href="/dashboard/transactions" className="text-sm transition-colors" style={{ color: PRIMARY }}>
                        View all
                    </Link>
                </div>
                {data.recent_transactions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-slate-500 text-base">No transactions yet</p>
                        <p className="text-slate-600 text-sm mt-1">Connect Gmail to import your receipts</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-outline-variant">
                                <th className="text-left label-caps px-6 py-4">Merchant</th>
                                <th className="text-center label-caps px-6 py-4">Category</th>
                                <th className="text-center label-caps px-6 py-4">Date</th>
                                <th className="text-right label-caps px-6 py-4">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recent_transactions.map((t) => {
                                const color = CATEGORY_COLORS[t.category] ?? "#64748b"
                                const icon = CATEGORY_ICONS[t.category] ?? "category"
                                return (
                                    <tr
                                        key={t.id}
                                        className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color }}>{icon}</span>
                                                </div>
                                                <p className="text-on-surface text-sm font-medium">{t.merchant}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className="text-xs px-3 py-1.5 rounded-full font-medium"
                                                style={{ backgroundColor: `${color}20`, color }}
                                            >
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-on-surface-variant text-sm" style={{ fontFamily: HANKEN }}>
                                            {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4 text-right text-on-surface text-sm font-semibold font-mono">
                                            {fmt(t.amount)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    )
}
