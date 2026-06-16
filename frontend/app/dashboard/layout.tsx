export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 p-6 flex flex-col gap-6">
            <h1 className="text-xl font-bold text-white">Budget Tracker</h1>

            <nav className="flex flex-col gap-2">
            <a href="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700">
                Dashboard
            </a>
            <a href="/dashboard/transactions" className="text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700">
                Transactions
            </a>
            <a href="/dashboard/budgets" className="text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700">
                Budgets
            </a>
            <a href="/dashboard/chat" className="text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700">
                Chat
            </a>
            </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
            {children}
        </main>

        </div>
    )
}