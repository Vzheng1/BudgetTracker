"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const token = searchParams.get("token")

        if (token) {
            localStorage.setItem("access_token", token)
            router.push("/dashboard")
        } else {
            router.push("/login")
        }
    }, [searchParams, router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-slate-400">Signing you in...</p>
        </div>
    )
}