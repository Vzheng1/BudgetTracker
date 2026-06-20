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
        <div className="relative min-h-screen flex flex-col" style={{ backgroundColor: "#0b1326" }}>

            {/* Background chart SVG */}
            <svg
                className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 1200 900"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Left bar chart spikes */}
                {[40,80,120,160,200,240,280,320,360].map((x, i) => {
                    const heights = [180,320,140,420,260,380,200,460,300]
                    return (
                        <rect
                            key={i}
                            x={x}
                            y={900 - heights[i]}
                            width={18}
                            height={heights[i]}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="1.5"
                            opacity={0.6}
                        />
                    )
                })}
                {/* Right wave lines */}
                <polyline
                    points="700,600 750,480 800,540 850,380 900,420 950,300 1000,360 1050,250 1100,310 1150,200 1200,260"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    opacity={0.5}
                />
                <polyline
                    points="700,680 750,580 800,630 850,500 900,540 950,420 1000,470 1050,370 1100,420 1150,320 1200,380"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    opacity={0.35}
                />
                <polyline
                    points="700,750 750,670 800,710 850,610 900,650 950,540 1000,580 1050,480 1100,520 1150,430 1200,470"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1"
                    opacity={0.25}
                />
            </svg>

            {/* Navbar */}
            <header className="relative z-10 flex items-center justify-between px-10 py-5">
                <span className="text-white text-xl font-bold tracking-tight">Midnight Ledger</span>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-sm rounded-2xl p-8 flex flex-col items-center" style={{ backgroundColor: "rgba(22, 30, 50, 0.92)", border: "1px solid rgba(255,255,255,0.08)" }}>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #4f6ef7 0%, #3b5bdb 100%)" }}>
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1zm-1 8H4V9h16v6zm-5-3a1 1 0 11-2 0 1 1 0 012 0z"/>
                        </svg>
                    </div>

                    {/* Brand */}
                    <p className="text-sm font-semibold mb-6" style={{ color: "#6d83f3" }}>Email Budget Tracker</p>

                    {/* Heading */}
                    <h1 className="text-white text-3xl font-bold text-center mb-2">Welcome Back</h1>
                    <p className="text-slate-400 text-sm text-center mb-8">Sign in to manage your finances.</p>

                    {/* Google sign-in button */}
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-white text-sm font-medium transition-colors"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                    >
                        {/* Google G logo */}
                        <svg viewBox="0 0 48 48" className="w-5 h-5">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            <path fill="none" d="M0 0h48v48H0z"/>
                        </svg>
                        Sign in with Google
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 flex items-center justify-between px-10 py-5">
                <span className="text-slate-500 text-xs font-semibold tracking-widest uppercase">Midnight Ledger</span>
                <span className="text-slate-500 text-xs">© 2026 Midnight Ledger.</span>
                <div className="flex items-center gap-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                </div>
            </footer>

        </div>
    )
}
