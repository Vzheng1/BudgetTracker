"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/transactions", label: "Transactions" },
    { href: "/dashboard/budgets", label: "Budgets" },
    { href: "/dashboard/chat", label: "Chat" },
    { href: "/dashboard/settings", label: "Settings" }
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-slate-800 p-6 flex flex-col gap-6">
            <h1 className="text-xl font-bold text-white">Budget Tracker</h1>

            <nav className="flex flex-col gap-2">
                {links.map((link) => {
                const isActive = pathname === link.href

                return (
                    <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                    >
                    {link.label}
                    </Link>
                )
                })}
            </nav>
        </aside>
    )
}