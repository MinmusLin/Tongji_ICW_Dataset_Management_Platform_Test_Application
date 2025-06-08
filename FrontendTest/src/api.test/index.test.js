import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getClient, fileList, allList, maxList, copy, signatureUrl, multipartUpload, simplePut, deleteMulti, deleteKey } from '../app/index.js'

vi.mock('ali-oss', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            list: vi.fn(),
            copy: vi.fn(),
            signatureUrl: vi.fn(),
            multipartUpload: vi.fn(),
            put: vi.fn(),
            deleteMulti: vi.fn(),
            delete: vi.fn()
        }))
    }
})

describe('OSS Utility Functions', () => {
    beforeEach(() => {
        window.localStorage.clear()
        vi.clearAllMocks()
    })

    describe('getClient', () => {
        it('should create client with localStorage config', () => {
            const config = { accessKeyId: 'test', accessKeySecret: 'secret' }
            window.localStorage.setItem('client', JSON.stringify(config))
            getClient()
            expect(OSS).toHaveBeenCalledWith(config)
        })

        it('should create client with empty object when no localStorage config', () => {
            getClient()
            expect(OSS).toHaveBeenCalledWith({})
        })
    })

    describe('fileList', () => {
        it('should call list with correct parameters', () => {
            const prefix = 'test/'
            const marker = 'marker123'
            const client = getClient()
            fileList(prefix, marker)
            expect(client.list).toHaveBeenCalledWith({
                prefix,
                delimiter: '/',
                'max-keys': 1000,
                marker
            })
        })
    })

    describe('allList', () => {
        it('should call list with correct parameters', () => {
            const prefix = 'test/'
            const client = getClient()
            allList(prefix)
            expect(client.list).toHaveBeenCalledWith({
                prefix,
                'max-keys': 1000
            })
        })
    })

    describe('maxList', () => {
        it('should call list with correct parameters', () => {
            const marker = 'marker123'
            const client = getClient()
            maxList(marker)
            expect(client.list).toHaveBeenCalledWith({
                marker,
                'max-keys': 1000
            })
        })
    })

    describe('copy', () => {
        it('should call copy with correct parameters', () => {
            const key = 'dest.txt'
            const file = 'source.txt'
            const client = getClient()
            copy(key, file)
            expect(client.copy).toHaveBeenCalledWith(key, file)
        })
    })

    describe('signatureUrl', () => {
        it('should call signatureUrl with correct parameters', () => {
            const key = 'file.txt'
            const response = { 'content-type': 'text/plain' }
            const client = getClient()
            signatureUrl(key, response)
            expect(client.signatureUrl).toHaveBeenCalledWith(key, { response })
        })
    })

    describe('multipartUpload', () => {
        it('should call multipartUpload with correct parameters', async () => {
            const key = 'upload.txt'
            const file = new Blob(['test'])
            const options = { partSize: 1024 }
            const client = getClient()
            await multipartUpload(key, file, options, client)
            expect(client.multipartUpload).toHaveBeenCalledWith(key, file, options)
        })
    })

    describe('simplePut', () => {
        it('should call put with correct parameters', () => {
            const key = 'simple.txt'
            const file = new Blob(['test'])
            const client = getClient()
            simplePut(key, file)
            expect(client.put).toHaveBeenCalledWith(key, file)
        })
    })

    describe('deleteMulti', () => {
        it('should call deleteMulti with correct parameters', () => {
            const keys = ['file1.txt', 'file2.txt']
            const client = getClient()
            deleteMulti(keys)
            expect(client.deleteMulti).toHaveBeenCalledWith(keys, { quiet: true })
        })
    })

    describe('deleteKey', () => {
        it('should call delete with correct parameters', () => {
            const key = 'file.txt'
            const client = getClient()
            deleteKey(key)
            expect(client.delete).toHaveBeenCalledWith(key, { quiet: true })
        })
    })
})