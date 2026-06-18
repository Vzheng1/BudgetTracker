"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { authApi, emailApi } from "@/lib/api"

export default function SettingsPage() {
    const {user, loading, logout} = useAuth()
    const [syncing, setSyncing] = useState(false)
    const [message, setMessage] = useState("")

    const handleConnectGmail = async () => {
        try {
            const {url} = await authApi.getGoogleUrl()
            window.location.href = url
        } catch (err) {
            setMessage("Failed to connect Gmail")
        }
    }

    const handleSync = async () => {
        try {
            setSyncing(true)
            setMessage("")
            await emailApi.sync()
            setMessage("Sync started - check back in a moment")
        } catch (err) {
            setMessage("Failed to start sync")
        } finally {
            setSyncing(false)
        }
    }

    const handleLogout = () => {
        logout()
    }

    if (loading) {
        return (
        <div className="flex items-center justify-center h-64">
            <p className="text-slate-400">Loading...</p>
        </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-black">Settings</h1>
            <p className="text-slate-400 mt-1">Manage your account and connections</p>
        </div>

        {/* Status message */}
        {message && (
            <div className="bg-blue-900/30 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg text-sm">
                {message}
            </div>
        )}

        {/* Account info */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Account</h2>

            <div className="flex items-center gap-4">
                {/* Show Google profile picture or initial */}
                {user?.picture ? (
                    <img
                    src={user.picture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                    {user?.name?.[0] ?? "U"}
                    </div>
                )}
                <div>
                    <p className="text-white font-medium">{user?.name}</p>
                    <p className="text-slate-400 text-sm">{user?.email}</p>
                </div>
            </div>

            <button onClick={handleLogout} className="self-start text-sm text-red-400 hover:text-red-300 transition-colors">
                Sign out
            </button>
        </div>

        {/* Gmail connection */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Gmail Connection</h2>

            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Green dot = connected, red dot = not connected */}
                <div className={`w-3 h-3 rounded-full ${user?.gmail_connected ? "bg-green-400" : "bg-red-400"}`} />
                <div>
                <p className="text-white text-sm font-medium">
                    {user?.gmail_connected ? "Connected" : "Not connected"}
                </p>
                <p className="text-slate-400 text-sm">
                    {user?.gmail_connected
                    ? "Gmail is connected — receipts will be imported automatically"
                    : "Connect Gmail to automatically import receipts"}
                </p>
                </div>
            </div>

            {/* Show connect or disconnect button based on status */}
            {user?.gmail_connected ? (
                <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Disconnect
                </button>
            ) : (
                <button
                onClick={handleConnectGmail}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                Connect Gmail
                </button>
            )}
            </div>
        </div>

        {/* Sync status */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Sync</h2>

            <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className="text-white">
                {user?.gmail_connected ? "Active" : "Not connected"}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Frequency</span>
                <span className="text-white">Every 5 minutes</span>
            </div>
            </div>

            {/* Only show sync button if Gmail is connected */}
            {user?.gmail_connected && (
            <button
                onClick={handleSync}
                disabled={syncing}
                className="self-start bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                {syncing ? "Starting sync..." : "Sync Now"}
            </button>
            )}
        </div>

        </div>
    )
}