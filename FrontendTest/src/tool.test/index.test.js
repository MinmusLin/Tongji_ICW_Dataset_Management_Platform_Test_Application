import { describe, it, expect, vi } from 'vitest'
import {
    renderSize,
    dateFormat,
    numberTwoDecimal,
    uuid,
    percentage,
    download
} from '../tool/index.js'

describe('Utility Functions', () => {
    describe('renderSize', () => {
        it('should return "0 B" for falsy values', () => {
            expect(renderSize()).toBe('0 B')
            expect(renderSize(0)).toBe('0 B')
            expect(renderSize('')).toBe('0 B')
        })

        it('should format bytes correctly', () => {
            expect(renderSize(1)).toBe('1.00 B')
            expect(renderSize(1024)).toBe('1.00 KB')
            expect(renderSize(1024 * 1024)).toBe('1.00 MB')
            expect(renderSize(1024 * 1024 * 1024)).toBe('1.00 GB')
            expect(renderSize('2048')).toBe('2.00 KB')
            expect(renderSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB')
        })

        it('should handle decimal sizes', () => {
            expect(renderSize(1500)).toBe('1.46 KB')
            expect(renderSize(1024 * 1.5)).toBe('1.50 KB')
        })
    })

    describe('dateFormat', () => {
        it('should format date correctly', () => {
            const date = new Date('2023-01-15T14:30:45')
            expect(dateFormat('YYYY-MM-DD', date)).toBe('2023-01-15')
            expect(dateFormat('YYYY/MM/DD HH:mm:ss', date)).toBe('2023/01/15 14:30:45')
            expect(dateFormat('YYYY年MM月DD日', date)).toBe('2023年01月15日')
            expect(dateFormat('HH时MM分SS秒', date)).toBe('14时30分45秒')
        })

        it('should pad single digit values with zeros', () => {
            const date = new Date('2023-01-05T04:03:02')
            expect(dateFormat('YYYY-MM-DD', date)).toBe('2023-01-05')
            expect(dateFormat('HH:mm:ss', date)).toBe('04:03:02')
        })

        it('should accept date string', () => {
            expect(dateFormat('YYYY-MM-DD', '2023-01-15')).toBe('2023-01-15')
        })
    })

    describe('numberTwoDecimal', () => {
        it('should format number with two decimals', () => {
            expect(numberTwoDecimal(1)).toBe('1.00')
            expect(numberTwoDecimal(1.234)).toBe('1.23')
            expect(numberTwoDecimal(1.235)).toBe('1.24')
            expect(numberTwoDecimal('1.2')).toBe('1.20')
        })

        it('should return "0" for NaN', () => {
            expect(numberTwoDecimal('abc')).toBe('0')
        })
    })

    describe('uuid', () => {
        it('should generate standard UUID when no parameters', () => {
            const id = uuid()
            expect(id.length).toBe(36)
            expect(id[8]).toBe('-')
            expect(id[13]).toBe('-')
            expect(id[18]).toBe('-')
            expect(id[23]).toBe('-')
            expect(id[14]).toBe('4')
        })

        it('should generate custom length UUID', () => {
            const id = uuid(16)
            expect(id.length).toBe(16)
        })

        it('should generate UUID with custom radix', () => {
            const id = uuid(10, 16)
            expect(id.length).toBe(10)
        })
    })

    describe('percentage', () => {
        it('should calculate percentage correctly', () => {
            expect(percentage(50, 100)).toBe(50)
            expect(percentage(25, 200)).toBe(12.5)
            expect(percentage(1, 3)).toBe(33.33)
        })

        it('should return 0 when either num or total is 0', () => {
            expect(percentage(0, 100)).toBe(0)
            expect(percentage(50, 0)).toBe(0)
        })
    })

    describe('download', () => {
        it('should trigger file download', async () => {
            const mockBlob = new Blob(['test'], { type: 'text/plain' })
            const mockResponse = { blob: vi.fn().mockResolvedValue(mockBlob) }
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const createElementSpy = vi.spyOn(document, 'createElement')
            const clickSpy = vi.fn()
            const mockAnchor = { href: '', download: '', click: clickSpy }
            createElementSpy.mockReturnValue(mockAnchor)

            const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')

            await download('http://110.42.214.164/oss/download/file.txt', 'test.txt')

            expect(fetch).toHaveBeenCalledWith('http://110.42.214.164/oss/download/file.txt')
            expect(createElementSpy).toHaveBeenCalledWith('a')
            expect(mockAnchor.href).toMatch(/blob:/)
            expect(mockAnchor.download).toBe('test.txt')
            expect(clickSpy).toHaveBeenCalled()
            expect(revokeSpy).toHaveBeenCalled()
        })
    })
})