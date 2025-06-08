import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Header from '@/components/Header.vue'
import { nextTick } from 'vue'
import ElementUI from 'element-ui'

vi.mock('element-ui', () => ({
    MessageBox: {
        confirm: vi.fn().mockResolvedValue()
    }
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

describe('Header.vue', () => {
    let wrapper
    const mockRouter = {
        push: vi.fn()
    }
    const mockStore = {
        state: {
            headerVisible: true
        }
    }

    beforeEach(() => {
        window.localStorage.clear()
        vi.clearAllMocks()

        wrapper = mount(Header, {
            global: {
                mocks: {
                    $store: mockStore,
                    $router: mockRouter,
                    $confirm: ElementUI.MessageBox.confirm
                }
            }
        })
    })

    it('renders correctly when headerVisible is true', () => {
        expect(wrapper.find('.header').exists()).toBe(true)
        expect(wrapper.find('.title span').text()).toBe('智慧幕墙数据集管理平台')
        expect(wrapper.find('.operation').exists()).toBe(true)
    })

    it('does not render when headerVisible is false', async () => {
        mockStore.state.headerVisible = false
        wrapper = mount(Header, {
            global: {
                mocks: {
                    $store: mockStore,
                    $router: mockRouter
                }
            }
        })
        await nextTick()
        expect(wrapper.find('.header').exists()).toBe(false)
    })

    it('displays ossSubsystem from localStorage', async () => {
        window.localStorage.setItem('ossSubsystem', 'Test System')
        wrapper = mount(Header, {
            global: {
                mocks: {
                    $store: mockStore,
                    $router: mockRouter
                }
            }
        })
        await nextTick()
        expect(wrapper.vm.ossSubsystem).toBe('Test System')
        expect(wrapper.find('.operation-child span:nth-child(2)').text()).toBe('Test System')
    })

    it('updates ossSubsystem when route changes', async () => {
        const mockRoute = { path: '/new-route' }
        window.localStorage.setItem('ossSubsystem', 'Updated System')
        wrapper.vm.$options.watch.$route.call(wrapper.vm, mockRoute)
        await nextTick()
        expect(wrapper.vm.ossSubsystem).toBe('Updated System')
    })

    it('handles logout confirmation', async () => {
        await wrapper.find('.operation-child:nth-last-child(1)').trigger('click')
        expect(ElementUI.MessageBox.confirm).toHaveBeenCalledWith(
            '是否退出当前账号？',
            '注销',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )
    })

    it('clears localStorage and redirects on logout', async () => {
        window.localStorage.setItem('client', 'test-client')
        ElementUI.MessageBox.confirm.mockResolvedValue()
        await wrapper.vm.exit()
        expect(window.localStorage.getItem('client')).toBeNull()
        expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })

    it('has correct styles', () => {
        const styles = wrapper.vm.$style
        expect(styles['header']).toBeDefined()
        expect(styles['title']).toBeDefined()
        expect(styles['operation']).toBeDefined()
        expect(styles['operation-child']).toBeDefined()
    })

    it('maps store state correctly', () => {
        expect(wrapper.vm.headerVisible).toBe(true)
        mockStore.state.headerVisible = false
        wrapper = mount(Header, {
            global: {
                mocks: {
                    $store: mockStore,
                    $router: mockRouter
                }
            }
        })
        expect(wrapper.vm.headerVisible).toBe(false)
    })
})