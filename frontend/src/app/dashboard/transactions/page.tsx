"use client"

import { useState, useEffect } from "react"
import { transactionsApi } from "@/lib/api"
import { Transaction, CATEGORIES } from "@/types"

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categoryFilter, setCategoryFilter] = useState("")
    const [loading, setLoading] = useState(true)
    const [error , setError] = useState("")

    // Fetch transactions whenever the category filter changes -> change = rerun
    useEffect(() => {
        fetchTransactions()
    }, [categoryFilter])

    const fetchTransactions = async () => {
        try {
            // Start loading before making any changes
            setLoading(true)
            // If a new category is selected, the category must be passed
            const data = await transactionsApi.list(categoryFilter ? { category: categoryFilter } : undefined)
            setTransactions(data)

            } catch (err) {
                setError("Failed to load transactions")

            } finally {
            // Always stop loading whether it succeeded or failed
                setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this transaction?")) return

        try {
            await transactionsApi.delete(id)
            setTransactions(transactions.filter((t) => t.id !== id))
        } catch (err) {
            setError("Failed to delete transaction")
        }
    }

    const handleCorrect = async (id: string, currentCategory: string) => {
        const newCategory = prompt( `Change category from "${currentCategory}" to:`, currentCategory)
        if (!newCategory || newCategory === currentCategory) return

        try {
            await transactionsApi.correct(id, newCategory)
            setTransactions(transactions.map((t) => (t.id === id ? { ...t, category: newCategory as any } : t)))
        } catch (err) {
            setError("Failed to update category")
        }
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-black">Transactions</h1>
            <p className="text-slate-400 mt-1">Based on your imported receipts</p>
            </div>

            <button onClick={fetchTransactions} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Refresh
            </button>
        </div>

        {/* Error message */}
        {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Category Filters */}
        <div className="flex gap-3">
            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm border border-slate-700"
            >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
            <thead>
                <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Merchant</th>
                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Category</th>
                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Date</th>
                <th className="text-right text-slate-400 text-sm font-medium px-6 py-4">Amount</th>
                </tr>
            </thead>
            <tbody>
                {/* Loading state */}
                {loading && (
                <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                    Loading...
                    </td>
                </tr>
                )}

                {/* Empty state */}
                {!loading && transactions.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                    No transactions found
                    </td>
                </tr>
                )}

                {/* Transaction rows */}
                {!loading && transactions.map((t) => (
                <tr
                    key={t.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                    <td className="px-6 py-4">
                        <div className="text-white text-sm font-medium">{t.merchant}</div>
                        {/* Show description if available */}
                        {t.description && (
                            <div className="text-slate-400 text-xs mt-0.5">{t.description}</div>
                        )}
                    </td>

                    <td className="px-6 py-4">
                        {/* Clicking the category lets the user correct it */}
                        <button
                            onClick={() => handleCorrect(t.id, t.category)}
                            className="text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
                        >
                            {t.category}
                        </button>
                        {/* Flag if transaction needs manual review */}
                        {t.needs_review && (
                            <span className="ml-2 text-xs text-yellow-400">Review</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-slate-400 text-sm">
                        {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                        {formatAmount(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button
                            onClick={() => handleDelete(t.id)}
                            className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                            Delete
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        </div>
    )
}