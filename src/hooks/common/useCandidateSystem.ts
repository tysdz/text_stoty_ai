'use client'

/**
 * useCandidateSystem - localized text Hook
 * localized text Panel、Character、Location localized text
 * 
 * localized text：
 * - localized text
 * - localized text
 * - localized text
 * - confirm/localized text
 * - localized text（previousUrl）
 */

import { useState, useCallback } from 'react'

export interface CandidateState {
    originalUrl: string | null      // localized text URL
    candidates: string[]            // localized text
    selectedIndex: number           // localized text (-1=localized text, 0-N=localized text)
    previousUrl: string | null      // localized text URL（localized text）
}

export function useCandidateSystem<TId extends string = string>() {
    const [states, setStates] = useState<Map<TId, CandidateState>>(new Map())

    /**
     * localized text
     */
    const initCandidates = useCallback((
        id: TId,
        originalUrl: string | null,
        candidates: string[],
        previousUrl: string | null = null
    ) => {
        setStates(prev => {
            const next = new Map(prev)
            next.set(id, {
                originalUrl,
                candidates: candidates.filter(c => c && !c.startsWith('PENDING:')), // localized text PENDING localized text
                selectedIndex: 0, // localized text
                previousUrl
            })
            return next
        })
    }, [])

    /**
     * localized text（localized text）
     * @param index -1 localized text，0-N localized text
     */
    const selectCandidate = useCallback((id: TId, index: number) => {
        setStates(prev => {
            const current = prev.get(id)
            if (!current) return prev

            const next = new Map(prev)
            next.set(id, { ...current, selectedIndex: index })
            return next
        })
    }, [])

    /**
     * localized text URL
     */
    const getDisplayImage = useCallback((id: TId, fallback: string | null = null): string | null => {
        const state = states.get(id)
        if (!state || state.candidates.length === 0) return fallback

        if (state.selectedIndex === -1) {
            return state.originalUrl || fallback
        }

        return state.candidates[state.selectedIndex] ?? fallback
    }, [states])

    /**
     * localized text（localized text API localized text）
     * @returns localized text URL，localized text null localized text
     */
    const getConfirmData = useCallback((id: TId): { selectedUrl: string } | null => {
        const state = states.get(id)
        if (!state || state.candidates.length === 0) return null

        if (state.selectedIndex === -1) {
            // localized text
            if (!state.originalUrl) return null
            return { selectedUrl: state.originalUrl }
        }

        const selectedUrl = state.candidates[state.selectedIndex]
        if (!selectedUrl) return null
        return { selectedUrl }
    }, [states])

    /**
     * localized text
     */
    const clearCandidates = useCallback((id: TId) => {
        setStates(prev => {
            if (!prev.has(id)) return prev
            const next = new Map(prev)
            next.delete(id)
            return next
        })
    }, [])

    /**
     * localized text
     */
    const hasCandidates = useCallback((id: TId): boolean => {
        const state = states.get(id)
        return !!state && state.candidates.length > 0
    }, [states])

    /**
     * localized text
     */
    const canUndo = useCallback((id: TId): boolean => {
        const state = states.get(id)
        return !!state?.previousUrl
    }, [states])

    /**
     * localized text（localized text UI localized text）
     */
    const getCandidateState = useCallback((id: TId): CandidateState | null => {
        return states.get(id) ?? null
    }, [states])

    return {
        states,
        initCandidates,
        selectCandidate,
        getDisplayImage,
        getConfirmData,
        clearCandidates,
        hasCandidates,
        canUndo,
        getCandidateState
    }
}
