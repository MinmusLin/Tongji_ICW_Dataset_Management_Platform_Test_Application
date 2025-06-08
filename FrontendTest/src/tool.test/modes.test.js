import { describe, it, expect } from 'vitest'
import { modes } from '../tool/modes.js'

describe('Language Modes', () => {
    it('should contain all supported languages', () => {
        expect(modes.length).toBeGreaterThan(50) // Basic check for substantial number of modes
        expect(modes.some(m => m.name === 'javascript')).toBe(true)
        expect(modes.some(m => m.name === 'python')).toBe(true)
        expect(modes.some(m => m.name === 'java')).toBe(true)
    })

    it('should have correct Mode class implementation', () => {
        const mode = modes.find(m => m.name === 'javascript')
        expect(mode).toBeDefined()
        expect(mode.caption).toBe('JavaScript')
        expect(mode.mode).toBe('ace/mode/javascript')
        expect(mode.extensions).toBe('js|jsm|jsx')
        expect(mode.supportsFile('test.js')).toBeTruthy()
        expect(mode.supportsFile('file.jsx')).toBeTruthy()
        expect(mode.supportsFile('file.txt')).toBeFalsy()
    })

    it('should apply name overrides correctly', () => {
        const csharp = modes.find(m => m.name === 'csharp')
        expect(csharp.caption).toBe('C#')

        const golang = modes.find(m => m.name === 'golang')
        expect(golang.caption).toBe('Go')

        const objectivec = modes.find(m => m.name === 'objectivec')
        expect(objectivec.caption).toBe('Objective-C')
    })

    it('should handle special extension patterns', () => {
        const gitignore = modes.find(m => m.name === 'gitignore')
        expect(gitignore.supportsFile('.gitignore')).toBeTruthy()
        expect(gitignore.supportsFile('gitignore')).toBeFalsy()

        const makefile = modes.find(m => m.name === 'makefile')
        expect(makefile.supportsFile('Makefile')).toBeTruthy()
        expect(makefile.supportsFile('makefile')).toBeTruthy()
    })

    it('should support multiple extensions', () => {
        const html = modes.find(m => m.name === 'html')
        expect(html.supportsFile('index.html')).toBeTruthy()
        expect(html.supportsFile('page.htm')).toBeTruthy()
        expect(html.supportsFile('template.xhtml')).toBeTruthy()
        expect(html.supportsFile('component.vue')).toBeTruthy()
    })

    it('should have correct mode paths', () => {
        modes.forEach(mode => {
            expect(mode.mode).toBe(`ace/mode/${mode.name}`)
        })
    })

    it('should handle complex extension patterns', () => {
        const apacheConf = modes.find(m => m.name === 'apache_conf')
        expect(apacheConf.supportsFile('.htaccess')).toBeTruthy()
        expect(apacheConf.supportsFile('htpasswd')).toBeTruthy()
        expect(apacheConf.supportsFile('config.conf')).toBeTruthy()

        const php = modes.find(m => m.name === 'php')
        expect(php.supportsFile('script.php')).toBeTruthy()
        expect(php.supportsFile('include.inc')).toBeTruthy()
        expect(php.supportsFile('template.phtml')).toBeTruthy()
    })

    it('should have display names without underscores', () => {
        modes.forEach(mode => {
            expect(mode.caption).not.toContain('_')
        })
    })
})