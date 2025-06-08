import { describe, it, expect, vi, beforeEach } from 'vitest'
import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import axios from 'axios'
import '@/element-ui'

vi.mock('vue')
vi.mock('@/App.vue')
vi.mock('@/router')
vi.mock('@/store')
vi.mock('axios')
vi.mock('@/element-ui')

describe('main.js', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        axios.defaults = {
            baseURL: '',
            headers: {
                post: {}
            }
        }
    })

    it('should configure axios correctly', () => {
        require('@/main.js')

        expect(axios.defaults.baseURL).toBe('http://110.42.214.164:9000/')
        expect(axios.defaults.headers.post['Content-Type']).toBe('application/json')
    })

    it('should attach axios to Vue prototype', () => {
        require('@/main.js')

        expect(Vue.prototype.$axios).toBe(axios)
        expect(Vue.prototype.$baseURL).toBe('http://110.42.214.164:9000/')
    })

    it('should create Vue instance with correct options', () => {
        const mockMount = vi.fn()
        Vue.mockImplementation(() => ({
            $mount: mockMount
        }))

        require('@/main.js')

        expect(Vue).toHaveBeenCalledWith({
            router,
            store,
            render: expect.any(Function)
        })
        expect(mockMount).toHaveBeenCalledWith('#app')
    })

    it('should render the App component', () => {
        const mockRender = vi.fn()
        Vue.mockImplementation(() => ({
            $mount: vi.fn(),
            $options: {
                render: mockRender
            }
        }))

        require('@/main.js')

        const renderCall = mockRender.mock.calls[0][0]
        expect(renderCall).toBe(App)
    })

    it('should import element-ui configuration', () => {
        const elementUISpy = vi.spyOn(require('@/element-ui'), 'default')
        require('@/main.js')
        expect(elementUISpy).toHaveBeenCalled()
    })
})