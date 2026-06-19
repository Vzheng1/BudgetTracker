"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { authApi, emailApi } from "@/lib/api"

export default function SettingsPage() {
    const { user, loading, logout, refreshUser } = useAuth()
    const [syncing, setSyncing] = useState(false)
    const [message, setMessage] = useState("")

    const handleConnectGmail = async () => {
        try {
            const { url } = await authApi.getGoogleUrl()
            window.location.href = url
        } catch {
            setMessage("Failed to connect Gmail")
        }
    }

    const handleSync = async () => {
        try {
            setSyncing(true)
            setMessage("")
            await emailApi.sync()
            await refreshUser()
            setMessage("Sync started — check back in a moment")
        } catch {
            setMessage("Failed to start sync")
        } finally {
            setSyncing(false)
        }
    }

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "numeric", minute: "2-digit",
        })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 text-sm">Loading...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Status message */}
            {message && (
                <div className="bg-blue-900/20 border border-blue-800 text-blue-400 px-4 py-3 rounded-lg text-sm">
                    {message}
                </div>
            )}

            {/* Profile */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold text-white">
                                {user?.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}
                        <div>
                            <p className="text-white font-semibold text-sm">{user?.name}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={logout}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Gmail + Sync row */}
            <div className="grid grid-cols-2 gap-4">

                {/* Gmail Connection */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {/* Gmail icon */}
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">Gmail Connection</p>
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                                    user?.gmail_connected
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-slate-600/50 text-slate-400"
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user?.gmail_connected ? "bg-emerald-400" : "bg-slate-400"}`} />
                                    {user?.gmail_connected ? "Connected" : "Not connected"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs mb-4">
                        {user?.gmail_connected
                            ? "Your Gmail is securely connected. We automatically scan your receipts and import them as transactions in real-time."
                            : "Connect Gmail to automatically import receipts and track your spending."}
                    </p>
                    {user?.gmail_connected ? (
                        <button className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium border border-red-400/30 hover:border-red-400/60 px-3 py-1.5 rounded-lg">
                            Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={handleConnectGmail}
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                            Connect Gmail
                        </button>
                    )}
                </div>

                {/* Sync Data */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <p className="text-white text-sm font-semibold">Sync Data</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 mb-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Last Successful Sync</span>
                            <span className="text-slate-300">
                                {user?.last_synced_at ? fmtDate(user.last_synced_at) : "Never"}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Status</span>
                            <span className={`font-medium ${user?.gmail_connected ? "text-emerald-400" : "text-slate-400"}`}>
                                {user?.gmail_connected ? "Active" : "Not connected"}
                            </span>
                        </div>
                    </div>

                    {user?.gmail_connected && (
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {syncing ? "Starting..." : "Sync Now"}
                        </button>
                    )}
                </div>
            </div>

        </div>
    )
}
