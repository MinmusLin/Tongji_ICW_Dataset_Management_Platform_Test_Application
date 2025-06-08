import { describe, it, expect } from 'vitest'
import VueRouter from 'vue-router'
import Vue from 'vue'
import router from '../router/index.js'

describe('Router Configuration', () => {
    it('should use VueRouter plugin', () => {
        expect(Vue.use).toHaveBeenCalledWith(VueRouter)
    })

    it('should have correct routes configuration', () => {
        expect(router.options.routes).toEqual([
            {
                path: '/',
                redirect: '/login'
            },
            {
                path: '/login',
                component: expect.any(Function)
            },
            {
                path: '/home',
                component: expect.any(Function)
            },
            {
                path: '*',
                redirect: '/login'
            }
        ])
    })

    it('should use history mode', () => {
        expect(router.options.mode).toBe('history')
    })

    it('should redirect root path to login', () => {
        const route = router.resolve('/')
        expect(route.route.redirect).toBe('/login')
    })

    it('should redirect unknown paths to login', () => {
        const route = router.resolve('/unknown-path')
        expect(route.route.redirect).toBe('/login')
    })

    it('should lazy load LoginPage component', async () => {
        const loginRoute = router.options.routes.find(r => r.path === '/login')
        const component = await loginRoute.component()
        expect(component.default.name).toBe('LoginPage')
    })

    it('should lazy load HomePage component', async () => {
        const homeRoute = router.options.routes.find(r => r.path === '/home')
        const component = await homeRoute.component()
        expect(component.default.name).toBe('HomePage')
    })
})