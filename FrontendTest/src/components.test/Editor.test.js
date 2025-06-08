import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Editor from '@/components/Editor.vue'
import { editorInit } from '@/tool/ace'
import { mapState } from 'vuex'

vi.mock('@/tool/ace', () => ({
    editorInit: vi.fn().mockReturnValue({
        editor: { setValue: vi.fn() },
        language: { caption: 'JavaScript' }
    })
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

describe('Editor.vue', () => {
    let wrapper
    const mockStore = {
        state: {
            path: '/test/path',
            CodeEditor: {
                code: 'console.log("test");',
                path: '/test/path/file.js',
                size: '1.23 KB',
                suffix: '.js'
            }
        },
        commit: vi.fn()
    }

    beforeEach(() => {
        wrapper = mount(Editor, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })
    })

    it('renders correctly', () => {
        expect(wrapper.find('.ace-mask').exists()).toBe(true)
        expect(wrapper.find('.ace-main').exists()).toBe(true)
        expect(wrapper.find('.ace-header').exists()).toBe(true)
        expect(wrapper.find('#editor').exists()).toBe(true)
    })

    it('displays the correct file name in title', () => {
        expect(wrapper.find('.ace-title span').text()).toContain('file.js')
    })

    it('displays the correct file size in title', () => {
        expect(wrapper.find('.ace-title span').text()).toContain('(1.23 KB)')
    })

    it('initializes the editor with correct parameters', () => {
        expect(editorInit).toHaveBeenCalledWith(
            'console.log("test");',
            '.js'
        )
        expect(wrapper.vm.editor).toBeDefined()
        expect(wrapper.vm.codeType).toBe('JavaScript')
    })

    it('computes displayAcePath correctly', () => {
        expect(wrapper.vm.displayAcePath).toBe('file.js')
        wrapper.vm.acePath = 'singlefile'
        expect(wrapper.vm.displayAcePath).toBe('singlefile')
    })

    it('closes editor when close button is clicked', async () => {
        await wrapper.find('.close').trigger('click')
        expect(mockStore.commit).toHaveBeenCalledWith(
            'stateUpdate',
            { name: 'editorShow', data: false }
        )
    })

    it('maps store state correctly', () => {
        expect(wrapper.vm.path).toBe('/test/path')
        expect(wrapper.vm.CodeEditor).toEqual({
            code: 'console.log("test");',
            path: '/test/path/file.js',
            size: '1.23 KB',
            suffix: '.js'
        })
    })

    it('has correct styles', () => {
        const styles = wrapper.vm.$style
        expect(styles['ace-mask']).toBeDefined()
        expect(styles['ace-main']).toBeDefined()
        expect(styles['ace-header']).toBeDefined()
        expect(styles['ace-title']).toBeDefined()
    })
})