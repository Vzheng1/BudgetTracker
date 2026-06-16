export default function TransactionsPage() {
    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-black">Transactions</h1>
            <p className="text-slate-400 mt-1">Based on your imported receipts</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Sync Gmail
            </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
            <select className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm border border-slate-700">
            <option value="">All Categories</option>
            <option>Food</option>
            <option>Shopping</option>
            <option>Transportation</option>
            <option>Entertainment</option>
            <option>Healthcare</option>
            <option>Utilities</option>
            <option>Travel</option>
            <option>Subscriptions</option>
            <option>Other</option>
            </select>

            <select className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm border border-slate-700">
            <option value="">All Time</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
            </select>
        </div>

        {/* Table */}
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
                {/* Empty state */}
                <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400">
                    No transactions yet — sync your Gmail to get started
                </td>
                </tr>
            </tbody>
            </table>
        </div>

        </div>
    )
}