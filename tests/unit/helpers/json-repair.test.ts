import { describe, expect, it } from 'vitest'
import { safeParseJson, safeParseJsonObject, safeParseJsonArray } from '@/lib/json-repair'

// ─── safeParseJson ───────────────────────────────────────────────────

describe('safeParseJson', () => {
    it('localized text JSON localized text -> localized text', () => {
        const result = safeParseJson('{"name":"Sun Wukong","age":500}')
        expect(result).toEqual({ name: 'Sun Wukong', age: 500 })
    })

    it('contains markdown localized text -> localized text', () => {
        const input = '```json\n{"key":"value"}\n```'
        const result = safeParseJson(input)
        expect(result).toEqual({ key: 'value' })
    })

    it('localized text JSON localized text markdown localized text -> localized text', () => {
        const input = '```JSON\n{"key":"value"}\n```'
        const result = safeParseJson(input)
        expect(result).toEqual({ key: 'value' })
    })

    it('localized text -> jsonrepair localized text', () => {
        const input = '{"a":1,"b":2,}'
        const result = safeParseJson(input)
        expect(result).toEqual({ a: 1, b: 2 })
    })

    it('localized text -> jsonrepair localized text', () => {
        const input = "{'name':'Zhang San','age':25}"
        const result = safeParseJson(input)
        expect(result).toEqual({ name: 'Zhang San', age: 25 })
    })

    it('JSON localized text -> jsonrepair localized text', () => {
        const input = 'here is the analysis result：\n{"result":"success"}\nlocalized text。'
        const result = safeParseJson(input)
        expect(result).toEqual({ result: 'success' })
    })

    it('localized text（localized text JSON localized text）-> jsonrepair localized text', () => {
        // jsonrepair localized text JSON localized text
        const result = safeParseJson('localized textJSON')
        expect(result).toBe('localized textJSON')
    })
})

// ─── safeParseJsonObject ─────────────────────────────────────────────

describe('safeParseJsonObject', () => {
    it('localized text JSON localized text -> localized text', () => {
        const result = safeParseJsonObject('{"characters":[],"locations":[]}')
        expect(result).toEqual({ characters: [], locations: [] })
    })

    it('markdown localized text JSON localized text -> localized text', () => {
        const input = '```json\n{"episodes":[{"number":1}]}\n```'
        const result = safeParseJsonObject(input)
        expect(result).toHaveProperty('episodes')
        expect((result.episodes as unknown[])[0]).toEqual({ number: 1 })
    })

    it('containsVietnameselocalized text「」localized text -> localized text', () => {
        const input = '{"lines":"localized text，「localized text，localized text！」"}'
        const result = safeParseJsonObject(input)
        expect(result.lines).toBe('localized text，「localized text，localized text！」')
    })

    it('LLM localized text -> localized text Expected JSON object error', () => {
        expect(() => safeParseJsonObject('[1,2,3]')).toThrow('Expected JSON object')
    })

    it('localized text + markdown localized text -> localized text', () => {
        const input = '```json\n{"a":1,"b":"hello",}\n```'
        const result = safeParseJsonObject(input)
        expect(result).toEqual({ a: 1, b: 'hello' })
    })
})

// ─── safeParseJsonArray ──────────────────────────────────────────────

describe('safeParseJsonArray', () => {
    it('localized text JSON localized text -> localized text', () => {
        const input = '[{"id":1,"name":"CharacterA"},{"id":2,"name":"CharacterB"}]'
        const result = safeParseJsonArray(input)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ id: 1, name: 'CharacterA' })
        expect(result[1]).toEqual({ id: 2, name: 'CharacterB' })
    })

    it('localized text + fallbackKey -> localized text', () => {
        const input = '{"clips":[{"id":1},{"id":2}]}'
        const result = safeParseJsonArray(input, 'clips')
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ id: 1 })
    })

    it('localized text + none fallbackKey -> localized text', () => {
        const input = '{"episodes":[{"number":1},{"number":2}]}'
        const result = safeParseJsonArray(input)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ number: 1 })
    })

    it('markdown localized text + localized text -> localized text', () => {
        const input = '```json\n[{"a":1},{"b":2},]\n```'
        const result = safeParseJsonArray(input)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ a: 1 })
        expect(result[1]).toEqual({ b: 2 })
    })

    it('localized text（localized text、localized text）-> localized text', () => {
        const input = '[{"valid":true}, 42, "string", null, {"also":true}]'
        const result = safeParseJsonArray(input)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ valid: true })
        expect(result[1]).toEqual({ also: true })
    })

    it('localized text -> localized text', () => {
        const result = safeParseJsonArray('[]')
        expect(result).toHaveLength(0)
    })

    it('localized text -> localized text', () => {
        expect(() => safeParseJsonArray('"just a string"')).toThrow('Expected JSON array')
    })

    it('localized text -> localized text', () => {
        expect(() => safeParseJsonArray('{"key":"value"}')).toThrow('Expected JSON array')
    })
})

// ─── localized text LLM localized text ───────────────────────────────────────

describe('LLM localized text JSON localized text', () => {
    it('Vietnameselocalized text JSON localized text -> jsonrepair localized text', () => {
        // localized text "Invalid clip JSON format" localized text
        const llmOutput = '```json\n[{"description":"localized text，\\u201clocalized text！\\u201d"}]\n```'
        const result = safeParseJsonArray(llmOutput)
        expect(result).toHaveLength(1)
        expect(result[0].description).toContain('Sun Wukong')
    })

    it('LLM localized text -> localized text JSON', () => {
        const llmOutput = `OK，here is the analysis result：

{"locations":[{"name":"living room_daytime","summary":"localized text"}]}

that is all location analysis。`
        const result = safeParseJsonObject(llmOutput)
        expect(result.locations).toBeDefined()
        const locations = result.locations as unknown[]
        expect(locations).toHaveLength(1)
    })

    it('localized text「」localized text -> localized text JSON', () => {
        // localized text LLM localized text「」localized text
        const llmOutput = '[{"speaker":"Sun Wukong","content":"「localized text！」","emotionStrength":0.4}]'
        const result = safeParseJsonArray(llmOutput)
        expect(result).toHaveLength(1)
        expect(result[0].speaker).toBe('Sun Wukong')
        expect(result[0].content).toBe('「localized text！」')
        expect(result[0].emotionStrength).toBe(0.4)
    })

    it('localized text JSON -> jsonrepair localized text', () => {
        // LLM localized text
        const llmOutput = '{"text":"first line\\nsecond line","count":2}'
        const result = safeParseJsonObject(llmOutput)
        expect(result.text).toBe('first line\nsecond line')
        expect(result.count).toBe(2)
    })

    it('clips localized text -> localized text', () => {
        // clips-build localized text LLM localized text
        const llmOutput = '{"clips":[{"id":"clip_1","startText":"before"},{"id":"clip_2","startText":"after"}]}'
        const result = safeParseJsonArray(llmOutput, 'clips')
        expect(result).toHaveLength(2)
        expect(result[0].id).toBe('clip_1')
        expect(result[1].startText).toBe('after')
    })
})
