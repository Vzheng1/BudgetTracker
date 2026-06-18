"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Extract JWT token from URL
        const token = searchParams.get("token")

        // If valid token, store token in localStorage and send user to dashbaordd
        if (token) {
            localStorage.setItem("access_token", token)
            router.push("/dashboard")
        // If not valid, redirect to login to try again
        } else {
            router.push("/login")
        }
    }, [searchParams, router])

    // Show simple loading message while redirect happens
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-slate-400">Signing you in...</p>
        </div>
    )
}