import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HomePage from '@/components/HomePage.vue'
import { nextTick } from 'vue'
import { mapState } from 'vuex'

vi.mock('@/components/Editor.vue', () => ({
    default: {
        template: '<div class="editor-mock"></div>'
    }
}))

vi.mock('@/components/Operation.vue', () => ({
    default: {
        template: '<div class="operation-mock"></div>'
    }
}))

vi.mock('@/components/List.vue', () => ({
    default: {
        template: '<div class="list-mock"></div>'
    }
}))

vi.mock('@/components/Transmission.vue', () => ({
    default: {
        template: '<div class="transmission-mock"></div>'
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

describe('HomePage.vue', () => {
    let wrapper
    const mockStore = {
        state: {
            editorShow: false,
            transmissionShow: false,
            uploadList: [
                { status: '1' },
                { status: '0' },
                { status: '1' },
                { status: '-1' }
            ]
        },
        commit: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()

        wrapper = mount(HomePage, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
    })

    it('renders correctly', () => {
        expect(wrapper.find('.home-container').exists()).toBe(true)
        expect(wrapper.find('.operation-mock').exists()).toBe(true)
        expect(wrapper.find('.list-mock').exists()).toBe(true)
        expect(wrapper.find('.copyright').exists()).toBe(true)
        expect(wrapper.find('.transmission-control').exists()).toBe(true)
    })

    it('shows editor when editorShow is true', async () => {
        mockStore.state.editorShow = true
        wrapper = mount(HomePage, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
        await nextTick()
        expect(wrapper.find('.editor-mock').exists()).toBe(true)
    })

    it('shows transmission when transmissionShow is true', async () => {
        mockStore.state.transmissionShow = true
        wrapper = mount(HomePage, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
        await nextTick()
        expect(wrapper.find('.transmission-mock').exists()).toBe(true)
        expect(wrapper.find('.transmission-control').exists()).toBe(false)
    })

    it('calculates disk info correctly', () => {
        const info = wrapper.vm.diskInfo()
        expect(info.current).toBe(2)
        expect(info.all).toBe(4)
    })

    it('displays correct upload count in control', () => {
        const control = wrapper.find('.transmission-control')
        expect(control.text()).toContain('2 / 4')
    })

    it('toggles transmission panel when control clicked', async () => {
        await wrapper.find('.transmission-control').trigger('click')
        expect(mockStore.commit).toHaveBeenCalledWith('stateUpdate', {
            name: 'transmissionShow',
            data: true
        })
    })

    it('displays correct copyright information', () => {
        const copyright = wrapper.find('.copyright')
        expect(copyright.text()).toContain('Intelligent Curtain Wall © 2025 by Tongji University')
        expect(copyright.find('a').attributes('href')).toBe('https://creativecommons.org/licenses/by-nc/4.0')
        expect(copyright.find('a').text()).toBe('Creative Commons Attribution-NonCommercial 4.0 International')
    })

    it('has correct styles', () => {
        const styles = wrapper.vm.$style
        expect(styles['home-container']).toBeDefined()
        expect(styles['copyright']).toBeDefined()
        expect(styles['transmission-control']).toBeDefined()
    })
})