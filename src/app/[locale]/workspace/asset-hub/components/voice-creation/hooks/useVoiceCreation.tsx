'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
    useDesignAssetHubVoice,
    useSaveDesignedAssetHubVoice,
    useUploadAssetHubVoice,
} from '@/lib/query/hooks'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import {
    DEFAULT_VOICE_SCHEME_COUNT,
    generateVoiceDesignOptions,
    type GeneratedVoice,
} from '@/components/voice/voice-design-shared'

export interface VoiceCreationModalShellProps {
    isOpen: boolean
    folderId: string | null
    onClose: () => void
    onSuccess: () => void
    /** localized text（localized text） */
    initialVoiceName?: string
}

type CreationMode = 'design' | 'upload'

export function useVoiceCreation({ isOpen, folderId, onClose, onSuccess, initialVoiceName }: VoiceCreationModalShellProps) {
    const t = useTranslations('common')
    const tHub = useTranslations('assetHub')
    const tv = useTranslations('voice.voiceDesign')
    const tvCreate = useTranslations('voice.voiceCreate')

    // localized text：localized text or upload
    const [mode, setMode] = useState<CreationMode>('design')

    // localized text
    const [voiceName, setVoiceName] = useState(initialVoiceName ?? '')
    const [voicePrompt, setVoicePrompt] = useState('')
    const [previewText, setPreviewText] = useState(tv('defaultPreviewText'))
    const [schemeCount, setSchemeCount] = useState(String(DEFAULT_VOICE_SCHEME_COUNT))
    const [isVoiceCreationSubmitting, setIsVoiceCreationSubmitting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatedVoices, setGeneratedVoices] = useState<GeneratedVoice[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [playingIndex, setPlayingIndex] = useState<number | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const voiceCreationSubmittingState = isVoiceCreationSubmitting
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'audio',
            hasOutput: false,
        })
        : null

    // localized text
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const uploadSubmittingState = isUploading
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'audio',
            hasOutput: false,
        })
        : null
    const designVoiceMutation = useDesignAssetHubVoice()
    const saveDesignedMutation = useSaveDesignedAssetHubVoice()
    const uploadVoiceMutation = useUploadAssetHubVoice()

    // localized text
    const handleGenerate = async () => {
        if (!voicePrompt.trim()) {
            setError(tv('pleaseSelectStyle'))
            return
        }

        setIsVoiceCreationSubmitting(true)
        setError(null)
        setGeneratedVoices([])
        setSelectedIndex(null)

        try {
            const voices = await generateVoiceDesignOptions({
                count: schemeCount,
                voicePrompt,
                previewText,
                defaultPreviewText: tv('defaultPreviewText'),
                onDesignVoice: (payload) => designVoiceMutation.mutateAsync(payload),
            })
            setGeneratedVoices(voices)
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error'
            const status = (err as Error & { status?: number }).status
            if (status === 402) {
                alert(t('insufficientBalance') + '\n\n' + t('insufficientBalanceDetail'))
            } else if (errMsg === 'VOICE_DESIGN_EMPTY_RESULT') {
                setError(tv('noVoiceGenerated'))
            } else if (errMsg !== 'INSUFFICIENT_BALANCE') {
                setError(errMsg || tv('generationError'))
            }
        } finally {
            setIsVoiceCreationSubmitting(false)
        }
    }

    // localized text（localized text）
    const handlePlayVoice = (index: number) => {
        // localized text → localized text
        if (playingIndex === index && audioRef.current) {
            audioRef.current.pause()
            setPlayingIndex(null)
            return
        }
        // localized text
        if (audioRef.current) {
            audioRef.current.pause()
        }
        setPlayingIndex(index)
        const audio = new Audio(generatedVoices[index].audioUrl)
        audioRef.current = audio
        audio.onended = () => setPlayingIndex(null)
        audio.onerror = () => setPlayingIndex(null)
        void audio.play()
    }

    // localized text（localized text）
    const handleSaveDesigned = async () => {
        if (selectedIndex === null || !generatedVoices[selectedIndex]) return
        if (!voiceName.trim()) {
            setError(tHub('voiceNameRequired'))
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const voice = generatedVoices[selectedIndex]

            await saveDesignedMutation.mutateAsync({
                voiceId: voice.voiceId,
                voiceBase64: voice.audioBase64,
                voiceName: voiceName.trim(),
                folderId,
                voicePrompt: voicePrompt.trim()
            })

            onSuccess()
            handleClose()
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : tHub('saveVoiceFailed')
            setError(errMsg)
        } finally {
            setIsSaving(false)
        }
    }

    // localized text
    const handleFileSelect = useCallback((file: File) => {
        // localized text（localized text）
        const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac']
        const isValid = audioTypes.includes(file.type) || file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)

        if (!isValid) {
            setError(tvCreate('invalidFileType'))
            return
        }

        // localized text（localized text 50MB）
        if (file.size > 50 * 1024 * 1024) {
            setError(tvCreate('fileTooLarge'))
            return
        }

        setUploadFile(file)
        setError(null)

        // localized text URL
        const url = URL.createObjectURL(file)
        setUploadPreviewUrl(url)

        // localized text（localized text）
        if (!voiceName.trim()) {
            const baseName = file.name.replace(/\.[^/.]+$/, '') // localized text
            setVoiceName(baseName)
        }
    }, [voiceName, tvCreate])

    // localized text
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) {
            handleFileSelect(file)
        }
    }, [handleFileSelect])

    // localized text
    const handlePlayUpload = () => {
        if (!uploadPreviewUrl) return
        if (audioRef.current) {
            audioRef.current.pause()
        }
        const audio = new Audio(uploadPreviewUrl)
        audioRef.current = audio
        audio.play()
    }

    // localized text
    const handleSaveUploaded = async () => {
        if (!uploadFile) return
        if (!voiceName.trim()) {
            setError(tHub('voiceNameRequired'))
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            await uploadVoiceMutation.mutateAsync({
                uploadFile,
                voiceName: voiceName.trim(),
                folderId
            })

            onSuccess()
            handleClose()
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : tvCreate('uploadFailed')
            setError(errMsg)
        } finally {
            setIsUploading(false)
        }
    }

    // localized text
    const handleClose = () => {
        setMode('design')
        setVoiceName(initialVoiceName ?? '')
        setVoicePrompt('')
        setPreviewText(tv('defaultPreviewText'))
        setSchemeCount(String(DEFAULT_VOICE_SCHEME_COUNT))
        setError(null)
        setGeneratedVoices([])
        setSelectedIndex(null)
        setPlayingIndex(null)
        setUploadFile(null)
        if (uploadPreviewUrl) {
            URL.revokeObjectURL(uploadPreviewUrl)
        }
        setUploadPreviewUrl(null)
        setIsUploading(false)
        if (audioRef.current) {
            audioRef.current.pause()
        }
        onClose()
    }

    // localized text
    const handleModeChange = (newMode: CreationMode) => {
        setMode(newMode)
        setError(null)
        // localized text
        setGeneratedVoices([])
        setSelectedIndex(null)
        setUploadFile(null)
        if (uploadPreviewUrl) {
            URL.revokeObjectURL(uploadPreviewUrl)
        }
        setUploadPreviewUrl(null)
    }

    return {
        isOpen,
        mode,
        voiceName,
        voicePrompt,
        previewText,
        schemeCount,
        isVoiceCreationSubmitting,
        isSaving,
        error,
        generatedVoices,
        selectedIndex,
        playingIndex,
        uploadFile,
        uploadPreviewUrl,
        isUploading,
        isDragging,
        fileInputRef,
        voiceCreationSubmittingState,
        uploadSubmittingState,
        t,
        tHub,
        tvCreate,
        setMode,
        setVoiceName,
        setVoicePrompt,
        setPreviewText,
        setSchemeCount,
        setError,
        setGeneratedVoices,
        setSelectedIndex,
        setUploadFile,
        setUploadPreviewUrl,
        setIsDragging,
        handleGenerate,
        handlePlayVoice,
        handleSaveDesigned,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handlePlayUpload,
        handleSaveUploaded,
        handleClose,
        handleModeChange,
    }
}

export type VoiceCreationRuntime = ReturnType<typeof useVoiceCreation>
