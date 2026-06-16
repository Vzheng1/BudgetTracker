export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-8">

        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-black">Settings</h1>
            <p className="text-slate-400 mt-1">Manage your account and connections</p>
        </div>

        {/* Account info */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Account</h2>

            <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                U
            </div>
            <div>
                <p className="text-white font-medium">User Name</p>
                <p className="text-slate-400 text-sm">user@gmail.com</p>
            </div>
            </div>

            <button className="self-start text-sm text-red-400 hover:text-red-300 transition-colors">
            Sign out
            </button>
        </div>

        {/* Gmail connection */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Gmail Connection</h2>

            {/* Not connected state */}
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div>
                <p className="text-white text-sm font-medium">Not connected</p>
                <p className="text-slate-400 text-sm">Connect Gmail to automatically import receipts</p>
                </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Connect Gmail
            </button>
            </div>

            {/* Connected state — hidden for now, will show when connected */}
            {/* 
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div>
                <p className="text-white text-sm font-medium">Connected</p>
                <p className="text-slate-400 text-sm">Last synced: 5 minutes ago</p>
                </div>
            </div>
            <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Disconnect
            </button>
            </div>
            */}
        </div>

        {/* Sync info */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Sync Status</h2>

            <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last synced</span>
                <span className="text-white">Never</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Emails processed</span>
                <span className="text-white">0</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Receipts found</span>
                <span className="text-white">0</span>
            </div>
            </div>

            <button className="self-start bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Sync Now
            </button>
        </div>

        </div>
    )
}