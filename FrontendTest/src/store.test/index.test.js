import { describe, it, expect, vi, beforeEach } from 'vitest'
import Vue from 'vue'
import Vuex from 'vuex'
import OSS from 'ali-oss'
import router from '@/router'
import { Notification } from 'element-ui'
import store from '../store/index.js'

vi.mock('ali-oss', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            multipartUpload: vi.fn(),
            copy: vi.fn(),
            delete: vi.fn()
        }))
    }
})

vi.mock('@/api/index', () => ({
    fileList: vi.fn(),
    multipartUpload: vi.fn(),
    deleteKey: vi.fn(),
    copy: vi.fn(),
    allList: vi.fn(),
    maxList: vi.fn()
}))

vi.mock('@/tool', () => ({
    uuid: vi.fn().mockReturnValue('mock-uuid')
}))

vi.mock('@/router', () => ({
    push: vi.fn()
}))

describe('Vuex Store', () => {
    beforeEach(() => {
        window.localStorage.clear()
        vi.clearAllMocks()
    })

    describe('State', () => {
        it('should initialize with default state', () => {
            expect(store.state).toEqual({
                bucket: '',
                accessKeyId: '',
                headerVisible: true,
                path: '',
                ossList: [],
                loading: false,
                CodeEditor: {
                    size: '',
                    code: '',
                    path: ''
                },
                language: {},
                editorShow: false,
                uploadList: [],
                transmissionShow: false,
                selections: [],
                copys: [],
                copyPath: '',
                copyNum: 0,
                copyTotal: 0,
                copyVisible: false,
                deleteNum: 0,
                deleteConfirm: false,
                deleteTotal: 0,
                deleteVisible: false,
                state: false,
                shear: null
            })
        })
    })

    describe('Mutations', () => {
        it('stateUpdate should update state property', () => {
            store.commit('stateUpdate', { name: 'path', data: 'test/path' })
            expect(store.state.path).toBe('test/path')
        })

        it('progressCancel should update upload status', () => {
            store.state.uploadList = [{ uploadId: '123', status: '0' }]
            store.commit('progressCancel', { uploadId: '123' })
            expect(store.state.uploadList[0].status).toBe('-1')
            expect(window.localStorage.setItem).toHaveBeenCalled()
        })

        it('progressUpdate should update upload progress', () => {
            store.state.uploadList = [{ uploadId: '123', progress: 0, status: '0', currentSize: 0 }]
            store.commit('progressUpdate', { uploadId: '123', progress: 0.5, checkpoint: { partSize: 100 } })
            expect(store.state.uploadList[0].progress).toBe(0.5)
            expect(store.state.uploadList[0].currentSize).toBe(100)
            expect(window.localStorage.setItem).toHaveBeenCalled()
        })
    })

    describe('Actions', () => {
        describe('sliceUpload', () => {
            it('should handle new upload', async () => {
                const file = new Blob(['test'], { type: 'text/plain' })
                await store.dispatch('sliceUpload', { file, path: 'test/path' })
                expect(store.state.uploadList.length).toBe(1)
                expect(store.state.transmissionShow).toBe(true)
                expect(OSS).toHaveBeenCalled()
            })

            it('should handle existing upload with checkpoint', async () => {
                store.state.uploadList = [{ uploadId: '123', progress: 0 }]
                const file = new Blob(['test'], { type: 'text/plain' })
                await store.dispatch('sliceUpload', {
                    file,
                    checkpoint: {},
                    uploadId: '123',
                    progress: 0.5,
                    currentSize: 100
                })
                expect(store.state.uploadList[0].progress).toBe(0.5)
            })
        })

        describe('fileUpdate', () => {
            it('should redirect to login when session expired', async () => {
                window.localStorage.setItem('ossInfo', JSON.stringify({ overdueDate: 0 }))
                await store.dispatch('fileUpdate')
                expect(router.push).toHaveBeenCalledWith('/login')
            })

            it('should fetch file list', async () => {
                const mockFileList = vi.fn().mockResolvedValue({
                    objects: [{ name: 'file1.txt' }],
                    prefixes: ['folder/'],
                    isTruncated: false
                })
                vi.mocked(require('@/api/index').fileList).mockImplementation(mockFileList)

                await store.dispatch('fileUpdate')
                expect(store.state.ossList.length).toBe(2)
                expect(store.state.loading).toBe(false)
            })

            it('should handle paginated results', async () => {
                const mockFileList = vi.fn()
                    .mockResolvedValueOnce({
                        objects: [{ name: 'file1.txt' }],
                        prefixes: ['folder/'],
                        isTruncated: true,
                        nextMarker: 'marker123'
                    })
                    .mockResolvedValueOnce({
                        objects: [{ name: 'file2.txt' }],
                        isTruncated: false
                    })
                vi.mocked(require('@/api/index').fileList).mockImplementation(mockFileList)

                await store.dispatch('fileUpdate')
                expect(store.state.ossList.length).toBe(3)
            })
        })

        describe('deleteFile', () => {
            it('should delete files', async () => {
                const mockGetFiles = vi.fn().mockResolvedValue([{ name: 'file1.txt' }])
                store.dispatch('getfiles', mockGetFiles)

                const mockDeleteKey = vi.fn().mockResolvedValue({})
                vi.mocked(require('@/api/index').deleteKey).mockImplementation(mockDeleteKey)

                await store.dispatch('deleteFile', [{ name: 'file1.txt' }])
                expect(store.state.deleteVisible).toBe(true)
                expect(mockDeleteKey).toHaveBeenCalledWith('file1.txt')
            })
        })

        describe('pasteClick', () => {
            it('should cancel when source and target paths match', async () => {
                store.state.copyPath = 'same/path'
                store.state.path = 'same/path'
                await store.dispatch('pasteClick')
                expect(Notification).toHaveBeenCalled()
            })

            it('should copy files', async () => {
                store.state.copyPath = 'source/path'
                store.state.path = 'target/path'
                store.state.copys = [{ name: 'source/path/file.txt' }]

                const mockGetFiles = vi.fn().mockResolvedValue([{ name: 'source/path/file.txt' }])
                store.dispatch('getfiles', mockGetFiles)

                const mockCopy = vi.fn().mockResolvedValue({})
                vi.mocked(require('@/api/index').copy).mockImplementation(mockCopy)

                await store.dispatch('pasteClick')
                expect(store.state.copyVisible).toBe(true)
                expect(mockCopy).toHaveBeenCalled()
            })
        })
    })
})