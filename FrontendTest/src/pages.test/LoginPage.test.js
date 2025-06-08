import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginPage from '@/components/LoginPage.vue'
import { nextTick } from 'vue'
import OSS from 'ali-oss'
import ElementUI from 'element-ui'

vi.mock('ali-oss', () => ({
    default: vi.fn().mockImplementation(() => ({
        list: vi.fn().mockResolvedValue({ res: { status: 200 } })
    }))
}))

vi.mock('element-ui', () => ({
    Notification: vi.fn(),
    Message: vi.fn()
}))

describe('LoginPage.vue', () => {
    let wrapper
    const mockStore = {
        commit: vi.fn()
    }
    const mockRouter = {
        push: vi.fn()
    }
    const mockAxios = {
        post: vi.fn()
    }

    beforeEach(() => {
        window.localStorage.clear()
        vi.clearAllMocks()

        wrapper = mount(LoginPage, {
            global: {
                mocks: {
                    $store: mockStore,
                    $router: mockRouter,
                    $axios: mockAxios,
                    $notify: ElementUI.Notification,
                    $message: ElementUI.Message
                }
            }
        })
    })

    it('renders correctly', () => {
        expect(wrapper.find('.page-container').exists()).toBe(true)
        expect(wrapper.find('.login-container').exists()).toBe(true)
        expect(wrapper.find('.favicon').exists()).toBe(true)
        expect(wrapper.find('h1').text()).toBe('欢迎登录系统')
        expect(wrapper.find('h4').text()).toBe('智慧幕墙数据集管理平台')
        expect(wrapper.find('el-select').exists()).toBe(true)
        expect(wrapper.find('el-input').exists()).toBe(true)
        expect(wrapper.find('el-button').exists()).toBe(true)
        expect(wrapper.find('.illustration').exists()).toBe(true)
    })

    it('displays all account options', () => {
        const options = wrapper.findAll('el-option')
        expect(options.length).toBe(10)
        expect(options[0].attributes('label')).toBe('金属幕墙锈蚀污损检测系统')
        expect(options[9].attributes('label')).toBe('智慧幕墙数据集管理平台管理员')
    })

    it('shows validation messages', async () => {
        await wrapper.vm.login()
        expect(ElementUI.Message).toHaveBeenCalledWith({
            message: '请选择账号并输入密码',
            type: 'warning',
            duration: 3000,
            showClose: true
        })

        wrapper.vm.user = 'test-user'
        await wrapper.vm.login()
        expect(ElementUI.Message).toHaveBeenCalledWith({
            message: '请输入密码',
            type: 'warning',
            duration: 3000,
            showClose: true
        })

        wrapper.vm.user = ''
        wrapper.vm.password = 'test-password'
        await wrapper.vm.login()
        expect(ElementUI.Message).toHaveBeenCalledWith({
            message: '请选择账号',
            type: 'warning',
            duration: 3000,
            showClose: true
        })
    })

    it('handles successful authentication', async () => {
        mockAxios.post.mockResolvedValue({
            data: {
                accessKeyId: 'test-access-key-id',
                accessKeySecret: 'test-access-key-secret'
            }
        })

        wrapper.vm.user = 'oss-management'
        wrapper.vm.password = 'test-password'
        await wrapper.vm.login()

        expect(wrapper.vm.loading).toBe(true)
        expect(mockAxios.post).toHaveBeenCalledWith('authenticate', {
            userName: 'oss-management',
            password: 'test-password'
        })

        await nextTick()

        expect(OSS).toHaveBeenCalledWith({
            accessKeyId: 'test-access-key-id',
            accessKeySecret: 'test-access-key-secret',
            bucket: 'tongji-icw',
            region: 'oss-cn-shanghai'
        })

        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'bucket',
            data: 'tongji-icw'
        })
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'accessKeyId',
            data: 'test-access-key-id'
        })

        expect(window.localStorage.getItem('ossUserName')).toBe('oss-management')
        expect(window.localStorage.getItem('ossSubsystem')).toBe('智慧幕墙数据集管理平台管理员')
        expect(window.localStorage.getItem('client')).toBeTruthy()

        expect(mockRouter.push).toHaveBeenCalledWith('home')
        expect(wrapper.vm.loading).toBe(false)
    })

    it('shows error notification on authentication failure', async () => {
        mockAxios.post.mockResolvedValue({
            data: {
                accessKeyId: '',
                accessKeySecret: ''
            }
        })

        wrapper.vm.user = 'test-user'
        wrapper.vm.password = 'wrong-password'
        await wrapper.vm.login()

        expect(ElementUI.Notification).toHaveBeenCalledWith({
            title: '登录失败',
            message: '请检查网络连接情况或确认账号和密码是否正确',
            type: 'error',
            position: 'top-left',
            duration: 3000
        })
        expect(wrapper.vm.loading).toBe(false)
    })

    it('shows error notification on OSS list failure', async () => {
        OSS.mockImplementationOnce(() => ({
            list: vi.fn().mockRejectedValue(new Error('OSS error'))
        }))

        mockAxios.post.mockResolvedValue({
            data: {
                accessKeyId: 'test-access-key-id',
                accessKeySecret: 'test-access-key-secret'
            }
        })

        wrapper.vm.user = 'test-user'
        wrapper.vm.password = 'test-password'
        await wrapper.vm.login()

        expect(ElementUI.Notification).toHaveBeenCalledWith({
            title: '登录失败',
            message: '请检查网络连接情况或确认账号和密码是否正确',
            type: 'error',
            position: 'top-left',
            duration: 3000
        })
        expect(wrapper.vm.loading).toBe(false)
    })

    it('triggers login on enter key press', async () => {
        const loginSpy = vi.spyOn(wrapper.vm, 'login')
        await wrapper.find('.page-container').trigger('keydown.enter')
        expect(loginSpy).toHaveBeenCalled()
    })

    it('has correct styles', () => {
        const styles = wrapper.vm.$style
        expect(styles['page-container']).toBeDefined()
        expect(styles['login-container']).toBeDefined()
    })
})