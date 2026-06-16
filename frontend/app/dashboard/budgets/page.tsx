export default function BudgetsPage() {
    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-black">Budgets</h1>
            <p className="text-slate-400 mt-1">Set monthly limits per category</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Add Budget
            </button>
        </div>

        {/* Budget cards */}
        <div className="grid grid-cols-2 gap-6">

            {/* Empty state */}
            <div className="col-span-2 bg-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400">No budgets set yet</p>
            <p className="text-slate-500 text-sm mt-1">Add a budget to start tracking your spending limits</p>
            </div>

        </div>

        </div>
    )
}