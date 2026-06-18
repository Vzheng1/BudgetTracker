"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authApi } from "./api"
import { User } from "@/types"

// Context type for authentication
type AuthContextType = {
    user: User | null
    loading: boolean
    logout: () => void
    refreshUser: () => Promise<void>
    }

// Create the AuthContext - Creates a global store that any component can read from
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => {},
    refreshUser: async () => {},
})

// AuthProvider wraps the entire app - Any component inside it can call useAuth() to get the user
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
            .then((data) => {
                setUser(data)
            })
            .catch(() => {
                localStorage.removeItem("access_token")
            })
            .finally(() => setLoading(false))
    }, [])

    const refreshUser = async () => {
        const data = await authApi.getMe()
        setUser(data)
    }

    const logout = () => {
        localStorage.removeItem("access_token")
        setUser(null)
        window.location.href = "/login"
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
        {children}
        </AuthContext.Provider>
    )
}

// Custom hook - components call useAuth() instead of useContext(AuthContext)
export function useAuth() {
    return useContext(AuthContext)
}