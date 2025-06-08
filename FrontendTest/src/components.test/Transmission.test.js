import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Transmission from '@/components/Transmission.vue'
import { nextTick } from 'vue'
import { mapState } from 'vuex'
import { renderSize, numberTwoDecimal } from '@/tool'

vi.mock('vuex', () => ({
    mapState: vi.fn().mockImplementation((mapping) => {
        const mapped = {}
        Object.keys(mapping).forEach(key => {
            mapped[key] = function () { return mapping[key](this.$store.state) }
        })
        return mapped
    })
}))

vi.mock('@/tool', () => ({
    renderSize: vi.fn().mockImplementation((size) => `${size} KB`),
    numberTwoDecimal: vi.fn().mockImplementation((num) => num.toFixed(2))
}))

describe('Transmission.vue', () => {
    let wrapper
    const mockStore = {
        state: {
            uploadList: [
                {
                    title: 'file1.txt',
                    progress: 0.5,
                    status: '0',
                    currentSize: 512,
                    size: 1024,
                    uploadId: 'upload-1',
                    client: { cancel: vi.fn() }
                },
                {
                    title: 'file2.txt',
                    progress: 1,
                    status: '1',
                    currentSize: 1024,
                    size: 1024,
                    uploadId: 'upload-2',
                    client: { cancel: vi.fn() }
                },
                {
                    title: 'file3.txt',
                    progress: 0.3,
                    status: '-1',
                    currentSize: 300,
                    size: 1000,
                    uploadId: 'upload-3',
                    client: { cancel: vi.fn() }
                }
            ],
            transmissionShow: true
        },
        commit: vi.fn(),
        dispatch: vi.fn().mockResolvedValue()
    }

    beforeEach(() => {
        window.localStorage.clear()
        window.localStorage.setItem('uploadList', JSON.stringify(mockStore.state.uploadList))
        vi.clearAllMocks()

        wrapper = mount(Transmission, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
    })

    it('renders correctly', () => {
        expect(wrapper.find('.data-pass').exists()).toBe(true)
        expect(wrapper.find('el-tabs').exists()).toBe(true)
        expect(wrapper.find('el-tab-pane').exists()).toBe(true)
        expect(wrapper.findAll('.upload-item').length).toBe(3)
    })

    it('displays upload items correctly', () => {
        const items = wrapper.findAll('.upload-item')
        expect(items[0].find('.upload-info span').text()).toBe('file1.txt')
        expect(items[0].find('.upload-status').text()).toBe('上传中')
        expect(items[1].find('.upload-status').text()).toBe('完成')
        expect(items[2].find('.upload-status').text()).toBe('暂停')
    })

    it('shows correct progress bars', () => {
        const progressBars = wrapper.findAll('.progress-child')
        expect(progressBars[0].attributes('style')).toContain('width: 50.00%')
        expect(progressBars[0].attributes('style')).toContain('background-color: #1E90FF')
        expect(progressBars[1].attributes('style')).toContain('width: 100.00%')
        expect(progressBars[2].attributes('style')).toContain('width: 30.00%')
        expect(progressBars[2].attributes('style')).toContain('background-color: #FFD700')
    })

    it('shows correct file sizes', () => {
        const sizeSpans = wrapper.findAll('.upload-size')
        expect(sizeSpans[0].text()).toBe('512 KB / 1024 KB')
        expect(sizeSpans[1].text()).toBe('1024 KB / 1024 KB')
        expect(sizeSpans[2].text()).toBe('300 KB / 1000 KB')
    })

    it('handles pause/resume for individual files', async () => {
        const buttons = wrapper.findAll('.upload-btns .btn-child')

        await buttons[0].trigger('click')
        expect(mockStore.state.uploadList[0].client.cancel).toHaveBeenCalled()

        await buttons[2].trigger('click')
        expect(mockStore.dispatch).toHaveBeenCalledWith('sliceUpload', mockStore.state.uploadList[2])
    })

    it('handles start all button', async () => {
        await wrapper.vm.fileControl('start')
        expect(mockStore.dispatch).toHaveBeenCalledWith('sliceUpload', mockStore.state.uploadList[2])
    })

    it('handles pause all button', async () => {
        await wrapper.vm.fileControl('stop')
        expect(mockStore.state.uploadList[0].client.cancel).toHaveBeenCalled()
    })

    it('clears completed files', async () => {
        await wrapper.vm.emptyFile('not')
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'uploadList',
            JSON.stringify([mockStore.state.uploadList[0], mockStore.state.uploadList[2]])
        )
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'uploadList',
            data: [mockStore.state.uploadList[0], mockStore.state.uploadList[2]]
        })
    })

    it('clears incomplete files', async () => {
        await wrapper.vm.emptyFile('has')
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'uploadList',
            JSON.stringify([mockStore.state.uploadList[1]])
        )
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'uploadList',
            data: [mockStore.state.uploadList[1]]
        })
    })

    it('clears all files', async () => {
        await wrapper.vm.emptyFile('all')
        expect(window.localStorage.setItem).toHaveBeenCalledWith('uploadList', '[]')
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'uploadList',
            data: []
        })
    })

    it('removes specific file by uploadId', async () => {
        await wrapper.vm.emptyFile('key', 'upload-1')
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'uploadList',
            JSON.stringify([mockStore.state.uploadList[1], mockStore.state.uploadList[2]])
        )
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'uploadList',
            data: [mockStore.state.uploadList[1], mockStore.state.uploadList[2]]
        })
    })

    it('closes the transmission panel', async () => {
        await wrapper.find('.icon-dashujukeshihuaico-').trigger('click')
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'transmissionShow',
            data: false
        })
    })

    it('initializes with completed files from localStorage', () => {
        expect(wrapper.vm.uploadList.length).toBe(3)
    })
})