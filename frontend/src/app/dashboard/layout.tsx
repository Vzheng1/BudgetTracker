"use client"

import Sidebar from "@/components/Sidebar"
import { emailApi } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { usePathname } from "next/navigation"

const PAGE_META: Record<string, { title: string }> = {
    "/dashboard": { title: "Dashboard" },
    "/dashboard/transactions": { title: "Transactions" },
    "/dashboard/budgets": { title: "Budgets" },
    "/dashboard/settings": { title: "Settings" },
}

function TopBar() {
    const [syncing, setSyncing] = useState(false)
    const { user } = useAuth()
    const pathname = usePathname()
    const meta = PAGE_META[pathname] ?? { title: "Dashboard" }

    const handleSync = async () => {
        try {
            setSyncing(true)
            await emailApi.sync()
        } finally {
            setSyncing(false)
        }
    }

    const initials = user?.name
        ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
        : "?"

    return (
        <header className="flex items-center justify-between px-8 py-4 border-b border-outline-variant bg-[#0F172A]">
            <div>
                <h1 className="text-on-surface font-bold" style={{ fontSize: "20px", lineHeight: "28px" }}>{meta.title}</h1>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-primary disabled:opacity-60 "
                >
                    <span
                        className={`material-symbols-outlined ${syncing ? "animate-spin" : ""}`}
                        style={{ fontSize: "16px" }}
                    ></span>
                    {syncing ? "Syncing..." : "Sync Data"}
                </button>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold select-none">
                    {initials}
                </div>
            </div>
        </header>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0F172A]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar />
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
