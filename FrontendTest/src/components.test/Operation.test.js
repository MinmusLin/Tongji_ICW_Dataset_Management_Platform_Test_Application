import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Operation from '@/components/Operation.vue'
import { nextTick } from 'vue'
import ElementUI from 'element-ui'
import { simplePut } from '@/api'

vi.mock('element-ui', () => ({
    MessageBox: {
        confirm: vi.fn().mockResolvedValue()
    },
    Notification: vi.fn(),
    Message: vi.fn()
}))

vi.mock('@/api', () => ({
    simplePut: vi.fn().mockResolvedValue()
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

describe('Operation.vue', () => {
    let wrapper
    const mockStore = {
        state: {
            path: '/test/path/',
            selections: [],
            copys: [],
            copyPath: '',
            copyNum: 0,
            copyTotal: 0,
            copyVisible: false,
            deleteNum: 0,
            deleteTotal: 0,
            deleteVisible: false,
            deleteConfirm: false,
            shear: null,
            bucket: 'test-bucket'
        },
        commit: vi.fn(),
        dispatch: vi.fn().mockResolvedValue()
    }

    beforeEach(() => {
        window.localStorage.clear()
        window.localStorage.setItem('ossUserName', 'test-user')
        vi.clearAllMocks()

        wrapper = mount(Operation, {
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

    it('renders correctly', () => {
        expect(wrapper.find('.file-header').exists()).toBe(true)
        expect(wrapper.find('.top').exists()).toBe(true)
        expect(wrapper.find('.bottom').exists()).toBe(true)
        expect(wrapper.find('.ace-path').text()).toContain('oss://test-bucket//test/path/')
    })

    it('shows welcome message when no path', async () => {
        mockStore.state.path = ''
        wrapper = mount(Operation, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
        await nextTick()
        expect(wrapper.find('.bottom').text()).toContain('欢迎使用智慧幕墙数据集管理平台！')
    })

    it('hides operation buttons for common folder without permission', async () => {
        mockStore.state.path = 'common/subfolder/'
        window.localStorage.setItem('ossUserName', 'regular-user')
        wrapper = mount(Operation, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
        await nextTick()
        expect(wrapper.find('.ace-btns').isVisible()).toBe(false)
        expect(wrapper.find('.bottom').text()).toContain('您正在访问智慧幕墙数据集通用文件。')
    })

    it('navigates to home when home button clicked', async () => {
        await wrapper.find('.icon-home').trigger('click')
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'path',
            data: ''
        })
    })

    it('refreshes file list when refresh button clicked', async () => {
        await wrapper.find('.icon-shuaxin').trigger('click')
        expect(mockStore.dispatch).toHaveBeenCalledWith('fileUpdate')
    })

    it('navigates up one level when back button clicked', async () => {
        await wrapper.find('.icon-arrowLeft-fill').trigger('click')
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'path',
            data: '/test/'
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith('fileUpdate')
    })

    it('opens create directory dialog', async () => {
        await wrapper.vm.mkdirFileClick()
        expect(wrapper.vm.mkdirVisible).toBe(true)
        expect(wrapper.vm.mkdirName).toBe('')
    })

    it('creates directory with valid name', async () => {
        wrapper.vm.mkdirName = 'new-folder'
        await wrapper.vm.mkdirClick()
        expect(simplePut).toHaveBeenCalledWith('/test/path/new-folder/', expect.any(Blob))
        expect(mockStore.dispatch).toHaveBeenCalledWith('fileUpdate')
        expect(wrapper.vm.mkdirVisible).toBe(false)
    })

    it('rejects invalid directory names', async () => {
        wrapper.vm.mkdirName = 'invalid@name'
        await wrapper.vm.mkdirClick()
        expect(ElementUI.Message).toHaveBeenCalledWith({
            message: '目录名称只能包含以下字符：A-Z, a-z, 0-9, -',
            type: 'warning',
            duration: 3000,
            showClose: true
        })
        expect(simplePut).not.toHaveBeenCalled()
    })

    it('handles file upload with valid names', async () => {
        const mockEvent = {
            target: {
                files: [
                    new File(['content'], 'valid.txt', { type: 'text/plain' }),
                    new File(['content'], 'valid2.txt', { type: 'text/plain' })
                ],
                value: ''
            }
        }
        await wrapper.vm.dirUpload(mockEvent)
        expect(mockStore.dispatch).toHaveBeenCalledTimes(2)
    })

    it('rejects file upload with invalid names', async () => {
        const mockEvent = {
            target: {
                files: [
                    new File(['content'], 'invalid@name.txt', { type: 'text/plain' })
                ],
                value: ''
            }
        }
        await wrapper.vm.dirUpload(mockEvent)
        expect(ElementUI.Message).toHaveBeenCalledWith({
            message: '已取消上传文件，文件名称只能包含以下字符：A-Z, a-z, 0-9, -, .',
            type: 'warning',
            duration: 3000,
            showClose: true
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
    })

    it('copies selected files', async () => {
        mockStore.state.selections = [{ name: 'file1.txt' }, { name: 'file2.txt' }]
        await wrapper.vm.copyClick(false)
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'shear',
            data: false
        })
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'copys',
            data: mockStore.state.selections
        })
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'copyPath',
            data: '/test/path/'
        })
    })

    it('cuts selected files', async () => {
        mockStore.state.selections = [{ name: 'file1.txt' }, { name: 'file2.txt' }]
        await wrapper.vm.copyClick(true)
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'shear',
            data: true
        })
    })

    it('shows delete confirmation dialog', async () => {
        mockStore.state.selections = [{ name: 'file1.txt' }]
        await wrapper.vm.operationClick('delete', false)
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'deleteVisible',
            data: true
        })
    })

    it('prevents delete during paste operation', async () => {
        mockStore.state.copys = [{ name: 'file1.txt' }]
        await wrapper.vm.operationClick('delete', true)
        expect(ElementUI.Notification).toHaveBeenCalledWith({
            title: '删除操作取消',
            message: '请完成或取消粘贴操作后再进行删除操作',
            type: 'warning',
            position: 'top-left',
            duration: 3000
        })
        expect(mockStore.commit).not.toHaveBeenCalled()
    })

    it('pastes copied files', async () => {
        mockStore.state.copys = [{ name: 'file1.txt' }]
        await wrapper.vm.pasteClick()
        expect(mockStore.dispatch).toHaveBeenCalledWith('pasteClick', {
            emptys: mockStore.state.copys
        })
    })

    it('cancels paste operation', async () => {
        mockStore.state.copys = [{ name: 'file1.txt' }]
        await wrapper.vm.cancelPasteClick()
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'copys',
            data: []
        })
    })

    it('downloads file list', async () => {
        mockStore.state.selections = [{ name: 'file1.txt' }]
        const mockDispatch = vi.fn().mockResolvedValue([{ name: 'file1.txt' }])
        wrapper.vm.$store.dispatch = mockDispatch

        await wrapper.vm.downloadAddressClick()
        expect(mockDispatch).toHaveBeenCalledWith('getfiles', mockStore.state.selections)
    })

    it('returns correct icons for file types', () => {
        expect(wrapper.vm.suffixIconTool({ name: 'file.pdf', dir: false })).toBe('#icon-pdf')
        expect(wrapper.vm.suffixIconTool({ name: 'folder/', dir: true })).toBe('#icon-wenjianjia')
    })
})