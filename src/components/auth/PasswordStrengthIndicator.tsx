'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

interface PasswordStrengthIndicatorProps {
    password: string
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

interface StrengthResult {
    /** 0-4 localized text */
    score: number
    level: StrengthLevel
}

/**
 * localized text。
 *
 * localized text：
 * - localized text（localized text、localized text、localized text、localized text）
 * - localized text
 * - localized text / localized text
 *
 * localized text：
 * - localized text 1 localized text（localized text、localized text）→ weak
 * - 2 localized text + localized text ≥ 8 → fair
 * - 3 localized text + localized text ≥ 8 → good
 * - 4 localized text + localized text ≥ 10 → strong
 */
function evaluateStrength(password: string): StrengthResult {
    if (!password) return { score: 0, level: 'weak' }

    // localized text
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[^a-zA-Z0-9]/.test(password)
    const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length

    // localized text（localized text aaaaaa、111111）
    const isAllSame = new Set(password).size === 1

    // localized text localized text localized text → localized text
    if (charTypes <= 1 || isAllSame) {
        return { score: 1, level: 'weak' }
    }

    // localized text → localized text
    if (password.length < 8) {
        return { score: 1, level: 'weak' }
    }

    // 2 localized text + localized text ≥ 8 → localized text
    if (charTypes === 2) {
        return { score: 2, level: 'fair' }
    }

    // 3 localized text + localized text ≥ 8 → localized text
    if (charTypes === 3) {
        return { score: 3, level: 'good' }
    }

    // 4 localized text + localized text ≥ 10 → localized text
    if (charTypes >= 4 && password.length >= 10) {
        return { score: 4, level: 'strong' }
    }

    // 4 localized text 10 → localized text
    return { score: 3, level: 'good' }
}

const LEVEL_STYLES: Record<StrengthLevel, { color: string; bgActive: string }> = {
    weak: {
        color: 'var(--glass-tone-danger-fg)',
        bgActive: 'var(--glass-tone-danger-fg)',
    },
    fair: {
        color: 'var(--glass-tone-warning-fg)',
        bgActive: 'var(--glass-tone-warning-fg)',
    },
    good: {
        color: 'var(--glass-tone-info-fg)',
        bgActive: 'var(--glass-tone-info-fg)',
    },
    strong: {
        color: 'var(--glass-tone-success-fg)',
        bgActive: 'var(--glass-tone-success-fg)',
    },
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const t = useTranslations('auth')

    const { score, level } = useMemo(() => evaluateStrength(password), [password])
    const styles = LEVEL_STYLES[level]

    if (!password) return null

    return (
        <div className="mt-2 space-y-1.5">
            {/* localized text */}
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((segment) => (
                    <div
                        key={segment}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                            backgroundColor: segment <= score
                                ? styles.bgActive
                                : 'color-mix(in srgb, var(--glass-text-tertiary) 30%, transparent)',
                        }}
                    />
                ))}
            </div>

            {/* localized text */}
            <p
                className="text-xs transition-colors duration-300"
                style={{ color: styles.color }}
            >
                {t(`passwordStrength.${level}`)}
            </p>
        </div>
    )
}
