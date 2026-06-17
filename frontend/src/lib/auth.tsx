"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authApi } from "./api"
import { User } from "@/types"

type AuthContextType = {
    user: User | null
    loading: boolean
    logout: () => void
    }

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (!token) {
        setLoading(false)
        return
        }

        authApi.getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem("access_token"))
        .finally(() => setLoading(false))
    }, [])

    const logout = () => {
        localStorage.removeItem("access_token")
        setUser(null)
        window.location.href = "/login"
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
        {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}