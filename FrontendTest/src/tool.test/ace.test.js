import { describe, it, expect, vi, beforeEach } from 'vitest'
import { editorInit } from '../tool/ace.js'

const mockAce = {
    edit: vi.fn().mockReturnValue({
        setTheme: vi.fn(),
        getSession: vi.fn().mockReturnValue({
            setMode: vi.fn(),
            setUseWrapMode: vi.fn()
        }),
        setOptions: vi.fn(),
        setReadOnly: vi.fn(),
        setShowPrintMargin: vi.fn(),
        setValue: vi.fn()
    }),
    require: vi.fn()
}

global.ace = mockAce

vi.mock('./modes', () => ({
    modes: [
        {
            caption: 'JavaScript',
            extensions: 'js',
            extRe: '\\.js$',
            mode: 'ace/mode/javascript',
            name: 'javascript'
        },
        {
            caption: 'HTML',
            extensions: 'html',
            extRe: '\\.html$',
            mode: 'ace/mode/html',
            name: 'html'
        }
    ]
}))

describe('editorInit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize editor with JavaScript mode for .js files', () => {
        const codeVal = 'console.log("test");'
        const suffix = '.js'
        const result = editorInit(codeVal, suffix)

        expect(ace.require).toHaveBeenCalledWith('ace/ext/language_tools')
        expect(ace.edit).toHaveBeenCalledWith('editor')

        const editorInstance = ace.edit('editor')
        expect(editorInstance.setTheme).toHaveBeenCalledWith('ace/theme/textmate')
        expect(editorInstance.getSession().setMode).toHaveBeenCalledWith('ace/mode/javascript')
        expect(editorInstance.setOptions).toHaveBeenCalledWith({
            enableBasicAutoCompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            selectionStyle: 'line',
            fontSize: 14
        })
        expect(editorInstance.setReadOnly).toHaveBeenCalledWith(true)
        expect(editorInstance.setShowPrintMargin).toHaveBeenCalledWith(false)
        expect(editorInstance.getSession().setUseWrapMode).toHaveBeenCalledWith(true)
        expect(editorInstance.setValue).toHaveBeenCalledWith(codeVal, 1)

        expect(result.language).toEqual({
            caption: 'JavaScript',
            extensions: 'js',
            extRe: '\\.js$',
            mode: 'ace/mode/javascript',
            name: 'javascript'
        })
    })

    it('should initialize editor with HTML mode for .html files', () => {
        const codeVal = '<html></html>'
        const suffix = '.html'
        const result = editorInit(codeVal, suffix)

        expect(editorInstance.getSession().setMode).toHaveBeenCalledWith('ace/mode/html')
        expect(result.language.name).toBe('html')
    })

    it('should fall back to text mode for unsupported file types', () => {
        const codeVal = 'some content'
        const suffix = '.xyz'
        const result = editorInit(codeVal, suffix)

        expect(editorInstance.getSession().setMode).toHaveBeenCalledWith('ace/mode/text')
        expect(editorInstance.setValue).toHaveBeenCalledWith('本文件不支持在线预览。', 1)
        expect(result.language).toEqual({
            caption: 'Text',
            extensions: 'txt',
            mode: 'ace/mode/text',
            name: 'text'
        })
    })

    it('should use default .txt suffix when none provided', () => {
        const codeVal = 'plain text'
        const result = editorInit(codeVal)

        expect(editorInstance.getSession().setMode).toHaveBeenCalledWith('ace/mode/text')
        expect(result.language.name).toBe('text')
    })
})