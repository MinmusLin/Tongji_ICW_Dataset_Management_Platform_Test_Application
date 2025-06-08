import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import List from '@/components/List.vue'
import { nextTick } from 'vue'
import ElementUI from 'element-ui'
import axios from 'axios'
import { renderSize, dateFormat } from '@/tool'
import { copy, deleteKey, signatureUrl } from '@/api'

vi.mock('element-ui', () => ({
    MessageBox: {
        confirm: vi.fn().mockResolvedValue()
    },
    Notification: vi.fn(),
    Message: vi.fn()
}))

vi.mock('axios', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: 'test data' })
    }
}))

vi.mock('@/api', () => ({
    copy: vi.fn().mockResolvedValue(),
    deleteKey: vi.fn().mockResolvedValue(),
    signatureUrl: vi.fn().mockReturnValue('http://mock.url')
}))

vi.mock('@/tool', () => ({
    renderSize: vi.fn().mockReturnValue('1.23 KB'),
    dateFormat: vi.fn().mockReturnValue('2023-01-01 12:00')
}))

vi.mock('vuex', () => ({
    mapState: vi.fn().mockImplementation((mapping) => {
        const mapped = {}
        Object.keys(mapping).forEach(key => {
            mapped[key] = function () { return mapping[key](this.$store.state) }
        })
        return mapped
    })
}))

describe('List.vue', () => {
    let wrapper
    const mockStore = {
        state: {
            path: '/test/path/',
            loading: false,
            ossList: [
                { name: '/test/path/file1.txt', size: 1024, lastModified: '2023-01-01', dir: false },
                { name: '/test/path/folder/', size: 0, lastModified: null, dir: true },
                { name: 'corrosion-detection/', size: 0, lastModified: null, dir: true }
            ],
            CodeEditor: {
                code: '',
                size: '',
                path: '',
                suffix: ''
            },
            selections: [],
            deleteVisible: false,
            copyPath: '',
            copys: [],
            shear: null,
            editorShow: false
        },
        commit: vi.fn(),
        dispatch: vi.fn().mockResolvedValue()
    }

    beforeEach(() => {
        window.localStorage.clear()
        window.localStorage.setItem('ossUserName', 'test-user')
        vi.clearAllMocks()

        wrapper = mount(List, {
            global: {
                mocks: {
                    $store: mockStore,
                    $confirm: ElementUI.MessageBox.confirm,
                    $notify: ElementUI.Notification,
                    $message: ElementUI.Message,
                    $baseURL: 'http://test.url/'
                }
            }
        })
    })

    it('renders correctly with path', () => {
        expect(wrapper.find('.file-list').exists()).toBe(true)
        expect(wrapper.find('el-table').exists()).toBe(true)
        expect(wrapper.findAll('el-table-column').length).toBe(4)
    })

    it('renders correctly without path', async () => {
        mockStore.state.path = ''
        wrapper = mount(List, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
        await nextTick()
        expect(wrapper.findAll('el-table-column').length).toBe(2)
    })

    it('displays file information correctly', () => {
        const rows = wrapper.findAll('el-table-column')
        expect(rows[1].text()).toContain('file1.txt')
        expect(rows[2].text()).toContain('1.23 KB')
        expect(rows[3].text()).toContain('2023-01-01 12:00')
    })

    it('displays folder information correctly', () => {
        const rows = wrapper.findAll('el-table-column')
        expect(rows[1].text()).toContain('folder')
        expect(rows[2].text()).toContain('目录')
    })

    it('handles file download', async () => {
        await wrapper.vm.downloadClick(mockStore.state.ossList[0])
        expect(signatureUrl).toHaveBeenCalledWith(mockStore.state.ossList[0].name, {})
    })

    it('copies file URL to clipboard', async () => {
        document.execCommand = vi.fn().mockReturnValue(true)
        await wrapper.vm.getUrl('test-file.txt')
        expect(signatureUrl).toHaveBeenCalled()
        expect(ElementUI.Notification).toHaveBeenCalledWith({
            title: '剪贴板',
            message: '文件地址已复制到剪贴板',
            type: 'success',
            position: 'top-left',
            duration: 3000
        })
    })

    it('handles file deletion', async () => {
        await wrapper.vm.deleteKeyTool(mockStore.state.ossList[0])
        expect(ElementUI.MessageBox.confirm).toHaveBeenCalled()
        expect(deleteKey).toHaveBeenCalled()
        expect(mockStore.dispatch).toHaveBeenCalledWith('fileUpdate')
    })

    it('handles folder deletion', async () => {
        await wrapper.vm.deleteKeyTool(mockStore.state.ossList[1])
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'selections',
            data: [{ dir: true, name: mockStore.state.ossList[1].name }]
        })
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'deleteVisible',
            data: true
        })
    })

    it('handles file renaming', async () => {
        await wrapper.vm.renameClick(mockStore.state.ossList[0])
        expect(wrapper.vm.renameVisible).toBe(true)
        expect(wrapper.vm.rename).toEqual({
            to: 'file1.txt',
            from: 'file1.txt',
            dir: false
        })
    })

    it('handles folder renaming', async () => {
        await wrapper.vm.renameClick(mockStore.state.ossList[1])
        expect(wrapper.vm.rename).toEqual({
            to: 'folder',
            from: 'folder',
            dir: true
        })
    })

    it('validates rename input', async () => {
        wrapper.vm.rename = { to: 'invalid@name', from: 'file.txt', dir: false }
        await wrapper.vm.renameConfirm()
        expect(ElementUI.Message).toHaveBeenCalledWith({
            message: '文件名称只能包含以下字符：A-Z, a-z, 0-9, -, .',
            type: 'warning',
            duration: 3000,
            showClose: true
        })
    })

    it('handles file click for non-image files', async () => {
        await wrapper.vm.fileNameClick(mockStore.state.ossList[0])
        expect(axios.get).toHaveBeenCalled()
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'CodeEditor',
            data: expect.objectContaining({
                code: 'test data',
                path: mockStore.state.ossList[0].name
            })
        })
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'editorShow',
            data: true
        })
    })

    it('handles dataset click with permission', async () => {
        window.localStorage.setItem('ossUserName', 'corrosion-detection')
        await wrapper.vm.datasetClick(mockStore.state.ossList[2])
        expect(axios.get).toHaveBeenCalled()
    })

    it('handles dataset click without permission', async () => {
        window.localStorage.setItem('ossUserName', 'other-user')
        await wrapper.vm.datasetClick(mockStore.state.ossList[2])
        expect(ElementUI.Notification).toHaveBeenCalledWith({
            title: '权限禁止',
            message: '您没有权限查看此数据集',
            type: 'error',
            position: 'top-left',
            duration: 3000
        })
    })

    it('returns correct subsystem name', () => {
        expect(wrapper.vm.getSubsystemByName('corrosion-detection')).toBe('金属幕墙锈蚀污损检测系统')
        expect(wrapper.vm.getSubsystemByName('unknown')).toBe('unknown')
    })

    it('returns correct icon for file types', () => {
        expect(wrapper.vm.suffixIconTool({ name: 'file.pdf', dir: false })).toBe('#icon-pdf')
        expect(wrapper.vm.suffixIconTool({ name: 'folder/', dir: true })).toBe('#icon-wenjianjia')
    })

    it('calculates table height on resize', () => {
        document.querySelector = vi.fn().mockReturnValue({
            getBoundingClientRect: () => ({ height: 500 })
        })
        wrapper.vm.getHeight(wrapper.vm)
        expect(wrapper.vm.tableHeight).toBe(340)
    })

    it('handles drop event for file upload', () => {
        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: { files: ['file1', 'file2'] }
        }
        wrapper.vm.dropFile(mockEvent)
        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.stopPropagation).toHaveBeenCalled()
        expect(mockStore.dispatch).toHaveBeenCalledTimes(2)
    })
})