"use client"

import { authApi } from "@/lib/api"

export default function LoginPage() {
    const handleLogin = async () => {
        try {
            const { url } = await authApi.getGoogleUrl()
            window.location.href = url
        } catch (err) {
            console.error("Failed to get Google URL", err)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800 shadow-xl">

            {/* Logo / Title */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Email Budget Tracker</h1>
                <p className="text-slate-400 mt-2">Connect your email and track your online spending automatically</p>
            </div>

            {/* Login button */}
            <button onClick={handleLogin} className="w-full py-3 px-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors">
                Sign in with Google
            </button>

            <p className="text-center text-slate-500 text-sm mt-6">
                We only read your receipt emails. Nothing else.
            </p>

        </div>
    </div>
    )
}
