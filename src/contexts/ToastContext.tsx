'use client'

/**
 * 🔔 localized text Toast localized text
 * 
 * localized text：
 * 1. localized text Toast localized text
 * 2. localized text/error/warning/localized text
 * 3. localized text
 * 
 * localized text：
 * ```typescript
 * const { showToast, showError } = useToast()
 * 
 * // localized text
 * showToast('localized text', 'success')
 * 
 * // localized text（localized text）
 * showError('RATE_LIMIT', { retryAfter: 55 })
 * // localized text: "localized text，localized text 55 localized text"
 * ```
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'

// ============================================================
// localized text
// ============================================================

export interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration: number
}

interface ToastContextValue {
    toasts: Toast[]
    showToast: (message: string, type?: Toast['type'], duration?: number) => void
    showError: (code: string, details?: Record<string, unknown>) => void
    dismissToast: (id: string) => void
}

// ============================================================
// Context
// ============================================================

const ToastContext = createContext<ToastContextValue | null>(null)

// ============================================================
// Provider localized text
// ============================================================

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const t = useTranslations('errors')

    /**
     * localized text Toast localized text
     */
    const showToast = useCallback((
        message: string,
        type: Toast['type'] = 'info',
        duration = 5000
    ) => {
        const id = Math.random().toString(36).slice(2, 9)

        setToasts(prev => [...prev, { id, message, type, duration }])

        // localized text
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id))
            }, duration)
        }
    }, [])

    /**
     * localized text（localized text）
     */
    const showError = useCallback((code: string, details?: Record<string, unknown>) => {
        let message: string

        // localized text
        try {
            const translationValues = Object.fromEntries(
                Object.entries(details || {}).map(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        return [key, value]
                    }
                    if (value instanceof Date) {
                        return [key, value]
                    }
                    return [key, String(value)]
                })
            )
            message = t(code, translationValues)
        } catch {
            message = code
        }

        showToast(message, 'error', 8000)
    }, [t, showToast])

    /**
     * close Toast
     */
    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, showToast, showError, dismissToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )
}

// ============================================================
// Hook
// ============================================================

/**
 * localized text Toast localized text
 * 
 * @example
 * const { showToast, showError } = useToast()
 */
export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

// ============================================================
// Toast localized text
// ============================================================

function ToastContainer({
    toasts,
    onDismiss
}: {
    toasts: Toast[]
    onDismiss: (id: string) => void
}) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 md:bottom-6 left-4 md:left-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-center gap-3 
                        px-4 py-3 
                        rounded-xl
                        animate-in slide-in-from-right-full duration-300
                        max-w-md
                        border
                        ${getToastStyle(toast.type)}
                    `}
                >
                    {/* localized text */}
                    <span className="w-5 h-5 flex items-center justify-center">{getToastIcon(toast.type)}</span>

                    {/* localized text */}
                    <span className="text-sm font-medium flex-1">{toast.message}</span>

                    {/* localized text */}
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="glass-btn-base glass-btn-ghost w-6 h-6 rounded-md p-0 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <AppIcon name="close" className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}

// ============================================================
// localized text
// ============================================================

function getToastStyle(type: Toast['type']): string {
    switch (type) {
        case 'success':
            return 'bg-[var(--glass-tone-success-bg)] text-[var(--glass-tone-success-fg)] border-[color:color-mix(in_srgb,var(--glass-tone-success-fg)_22%,transparent)]'
        case 'error':
            return 'bg-[var(--glass-tone-danger-bg)] text-[var(--glass-tone-danger-fg)] border-[color:color-mix(in_srgb,var(--glass-tone-danger-fg)_22%,transparent)]'
        case 'warning':
            return 'bg-[var(--glass-tone-warning-bg)] text-[var(--glass-tone-warning-fg)] border-[color:color-mix(in_srgb,var(--glass-tone-warning-fg)_22%,transparent)]'
        case 'info':
        default:
            return 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] border-[color:color-mix(in_srgb,var(--glass-tone-info-fg)_22%,transparent)]'
    }
}

function getToastIcon(type: Toast['type']) {
    switch (type) {
        case 'success':
            return (
                <AppIcon name="check" className="w-4 h-4" />
            )
        case 'error':
            return (
                <AppIcon name="close" className="w-4 h-4" />
            )
        case 'warning':
            return (
                <AppIcon name="alertOutline" className="w-4 h-4" />
            )
        case 'info':
        default:
            return (
                <AppIcon name="infoCircle" className="w-4 h-4" />
            )
    }
}
