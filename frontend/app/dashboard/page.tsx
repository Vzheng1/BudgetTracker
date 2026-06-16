export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-black">Dashboard</h1>
            <p className="text-slate-400 mt-1">Your spending overview</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-6">
            <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Total Spent</p>
            <p className="text-3xl font-bold text-white mt-1">$0.00</p>
            <p className="text-slate-500 text-sm mt-1">This month</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Transactions</p>
            <p className="text-3xl font-bold text-white mt-1">0</p>
            <p className="text-slate-500 text-sm mt-1">This month</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Top Category</p>
            <p className="text-3xl font-bold text-white mt-1">—</p>
            <p className="text-slate-500 text-sm mt-1">This month</p>
            </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>

            {/* Empty state */}
            <div className="text-center py-12">
            <p className="text-slate-400">No transactions yet</p>
            <p className="text-slate-500 text-sm mt-1">Connect Gmail to import your receipts</p>
            </div>
        </div>

        </div>
    )
}