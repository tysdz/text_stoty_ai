import { logError as _ulogError } from '@/lib/logging/core'
/**
 * API Key localized text/localized text
 * 
 * localized text AES-256-GCM localized text，localized text NEXTAUTH_SECRET localized text
 * localized text API Key localized text
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const KEY_LENGTH = 32
const SALT = 'text_stoty_ai-api-key-salt-v1' // localized text

type ApiKeyObject = Record<string, unknown>

function isApiKeyObject(value: unknown): value is ApiKeyObject {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * localized text
 * localized text API_ENCRYPTION_KEY（localized text）
 * localized text NEXTAUTH_SECRET
 */
function deriveEncryptionKey(): Buffer {
    // localized text（localized text）
    const secret = process.env.API_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET

    if (!secret) {
        throw new Error('API_ENCRYPTION_KEY localized text NEXTAUTH_SECRET localized text，localized text API Key')
    }

    // localized text PBKDF2 localized text 32 localized text
    // 10localized text，localized text
    return crypto.pbkdf2Sync(secret, SALT, 100000, KEY_LENGTH, 'sha256')
}

/**
 * localized text API Key
 * 
 * @param plaintext localized text API Key（localized text）
 * @returns localized text（localized text：iv:authTag:encrypted，all hex localized text）
 * 
 * @example
 * const encrypted = encryptApiKey('sk-or-v1-abc123...')
 * // back: "a1b2c3d4e5f6....:d7e8f9a0b1c2....:1234567890ab...."
 */
export function encryptApiKey(plaintext: string): string {
    if (!plaintext || plaintext.trim() === '') {
        throw new Error('API Key localized text')
    }

    const key = deriveEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
    ])

    const authTag = cipher.getAuthTag()

    // localized text: iv:authTag:encrypted (hex localized text)
    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
    ].join(':')
}

/**
 * localized text API Key
 * 
 * @param ciphertext localized text（encryptApiKey localized text）
 * @returns localized text API Key
 * 
 * @example
 * const decrypted = decryptApiKey('a1b2c3d4e5f6....:d7e8f9a0b1c2....:1234567890ab....')
 * // back: "sk-or-v1-abc123..."
 */
export function decryptApiKey(ciphertext: string): string {
    if (!ciphertext || ciphertext.trim() === '') {
        throw new Error('localized text')
    }

    const parts = ciphertext.split(':')
    if (parts.length !== 3) {
        throw new Error('localized text')
    }

    const [ivHex, authTagHex, encryptedHex] = parts

    const key = deriveEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ])

    return decrypted.toString('utf8')
}

/**
 * localized text API Key localized text
 * 
 * @param apiKeys localized text，key localized text，value localized text（contains apiKey localized text）
 * @returns localized text（JSON localized text）
 * 
 * @example
 * const encrypted = encryptApiKeyObject({
 *   google: { apiKey: 'abc123' },
 *   fal: { apiKey: 'xyz789' }
 * })
 */
export function encryptApiKeyObject(apiKeys: ApiKeyObject): string {
    const encrypted: ApiKeyObject = {}

    for (const [provider, config] of Object.entries(apiKeys)) {
        if (isApiKeyObject(config)) {
            const encryptedConfig: ApiKeyObject = { ...config }

            // localized text 'key' localized text 'secret' localized text
            for (const [key, value] of Object.entries(config)) {
                if (typeof value === 'string' && value.trim() !== '') {
                    const lowerKey = key.toLowerCase()
                    if (lowerKey.includes('key') || lowerKey.includes('secret')) {
                        encryptedConfig[key] = encryptApiKey(value)
                    }
                }
            }
            encrypted[provider] = encryptedConfig
        }
    }

    return JSON.stringify(encrypted)
}

/**
 * localized text API Key localized text
 * 
 * @param encryptedJson localized text JSON localized text
 * @returns localized text
 */
export function decryptApiKeyObject(encryptedJson: string): ApiKeyObject {
    if (!encryptedJson || encryptedJson.trim() === '') {
        return {}
    }

    try {
        const encrypted = JSON.parse(encryptedJson) as unknown
        if (!isApiKeyObject(encrypted)) {
            return {}
        }
        const decrypted: ApiKeyObject = {}

        for (const [provider, config] of Object.entries(encrypted)) {
            if (isApiKeyObject(config)) {
                const decryptedConfig: ApiKeyObject = { ...config }

                // localized text 'key' localized text 'secret' localized text
                for (const [key, value] of Object.entries(config)) {
                    if (typeof value === 'string' && value.trim() !== '') {
                        const lowerKey = key.toLowerCase()
                        if (lowerKey.includes('key') || lowerKey.includes('secret')) {
                            try {
                                decryptedConfig[key] = decryptApiKey(value)
                            } catch (error) {
                                _ulogError(`localized text ${provider}.${key} failed:`, error)
                                // localized text，localized text（localized text）
                                decryptedConfig[key] = value
                            }
                        }
                    }
                }
                decrypted[provider] = decryptedConfig
            }
        }

        return decrypted
    } catch (error) {
        _ulogError('localized text API Key localized text:', error)
        return {}
    }
}
