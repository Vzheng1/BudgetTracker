"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"

const links = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="-8 0 34 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        href: "/dashboard/transactions",
        label: "Transactions",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="-8 0 34 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        href: "/dashboard/budgets",
        label: "Budgets",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="-8 0 34 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
        ),
    },
    {
        href: "/dashboard/settings",
        label: "Settings",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="-8 0 34 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { logout } = useAuth()

    return (
        <aside className="w-50 bg-background border-r border-slate-700/50 flex flex-col h-screen">
            {/* Logo */}
            <div className="flex items-center justify-center pt-8 pb-5">
                <div className="flex flex-col items-center text-center">
                    <span className="text-on-surface font-bold text-4xl leading-tight">Budget</span>
                    <span className="text-on-surface font-bold text-4xl leading-tight">Tracker</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-col items-center gap-5 flex-1">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`w-38 flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                                isActive
                                    ? "bg-primary-fixed-dim text-active-text"
                                    : "text-on-surface-variant hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="items-center py-3 border-t border-slate-800 flex flex-col gap-1">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 pt-2 pb-1 rounded-lg text-lg font-medium text-on-surface-variant hover:text-red-400 transition-colors text-left"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="-10 0 34 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    )
}
