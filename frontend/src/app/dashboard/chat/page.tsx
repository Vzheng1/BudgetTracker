export default function ChatPage() {
    return (
        <div className="flex flex-col h-full gap-0" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* Header */}
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Chat</h1>
            <p className="text-slate-400 mt-1">Ask questions about your spending</p>
        </div>

        {/* Chat container */}
        <div className="flex flex-col flex-1 bg-slate-800 rounded-xl overflow-hidden">

            {/* Messages area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">

            {/* Welcome message */}
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                B
                </div>
                <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-lg">
                <p className="text-slate-200 text-sm">
                    Hi! Ask me anything about your spending. Try:
                </p>
                <ul className="text-slate-400 text-sm mt-2 space-y-1">
                    <li>• How much did I spend this month?</li>
                    <li>• What are my top categories?</li>
                    <li>• How's my food budget looking?</li>
                    <li>• Compare this month to last month</li>
                </ul>
                </div>
            </div>

            </div>

            {/* Input area */}
            <div className="border-t border-slate-700 p-4 flex gap-3">
            <input
                type="text"
                placeholder="Ask about your spending..."
                className="flex-1 bg-slate-700 text-white placeholder-slate-400 px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors">
                Send
            </button>
            </div>

        </div>

        </div>
    )
}