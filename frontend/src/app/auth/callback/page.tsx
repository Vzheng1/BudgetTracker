"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function CallbackHandler() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const token = searchParams.get("token")
        if (token) {
            localStorage.setItem("access_token", token)
            window.location.href = "/dashboard"
        } else {
            router.push("/")
        }
    }, [searchParams, router])

    return null
}

export default function AuthCallbackPage() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-slate-400">Signing you in...</p>
            <Suspense>
                <CallbackHandler />
            </Suspense>
        </div>
    )
}
