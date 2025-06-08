import { describe, it, expect, vi, beforeEach } from 'vitest'
import Vue from 'vue'
import ElementUI from 'element-ui'
import elementUI from './element-ui.js'

vi.mock('element-ui', () => {
    const components = {
        Pagination: { install: vi.fn() },
        Dialog: { install: vi.fn() },
        Loading: {
            directive: { install: vi.fn() },
            service: vi.fn()
        },
        MessageBox: {
            install: vi.fn(),
            alert: vi.fn(),
            confirm: vi.fn(),
            prompt: vi.fn()
        },
        Notification: vi.fn(),
        Message: vi.fn()
    }

    const componentNames = [
        'Autocomplete', 'Dropdown', 'DropdownMenu', 'DropdownItem', 'Menu', 'Submenu',
        'MenuItem', 'MenuItemGroup', 'Input', 'InputNumber', 'Radio', 'RadioGroup',
        'RadioButton', 'Checkbox', 'CheckboxButton', 'CheckboxGroup', 'Switch', 'Select',
        'Option', 'OptionGroup', 'Button', 'ButtonGroup', 'Table', 'TableColumn',
        'DatePicker', 'TimeSelect', 'TimePicker', 'Popover', 'Tooltip', 'Breadcrumb',
        'BreadcrumbItem', 'Form', 'FormItem', 'Tabs', 'TabPane', 'Tag', 'Tree', 'Alert',
        'Slider', 'Icon', 'Row', 'Col', 'Upload', 'Progress', 'Spinner', 'Badge', 'Card',
        'Rate', 'Steps', 'Step', 'Carousel', 'CarouselItem', 'Collapse', 'CollapseItem',
        'Cascader', 'ColorPicker', 'Transfer', 'Container', 'Header', 'Aside', 'Main',
        'Footer', 'Timeline', 'TimelineItem', 'Link', 'Divider', 'Image', 'Calendar',
        'Backtop', 'PageHeader', 'CascaderPanel'
    ]

    componentNames.forEach(name => {
        components[name] = { install: vi.fn() }
    })

    return components
})

describe('ElementUI Configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should register all ElementUI components', () => {
        expect(ElementUI.Pagination.install).toHaveBeenCalled()
        expect(ElementUI.Dialog.install).toHaveBeenCalled()
        expect(ElementUI.Autocomplete.install).toHaveBeenCalled()
    })

    it('should register Loading directive', () => {
        expect(ElementUI.Loading.directive.install).toHaveBeenCalled()
    })

    it('should add global methods to Vue prototype', () => {
        expect(Vue.prototype.$loading).toBe(ElementUI.Loading.service)
        expect(Vue.prototype.$msgbox).toBe(ElementUI.MessageBox)
        expect(Vue.prototype.$alert).toBe(ElementUI.MessageBox.alert)
        expect(Vue.prototype.$confirm).toBe(ElementUI.MessageBox.confirm)
        expect(Vue.prototype.$prompt).toBe(ElementUI.MessageBox.prompt)
        expect(Vue.prototype.$notify).toBe(ElementUI.Notification)
        expect(Vue.prototype.$message).toBe(ElementUI.Message)
    })

    it('should have called Vue.use for each component', () => {
        const componentNames = [
            'Pagination', 'Dialog', 'Autocomplete', 'Dropdown', 'DropdownMenu', 'DropdownItem',
            'Menu', 'Submenu', 'MenuItem', 'MenuItemGroup', 'Input', 'InputNumber', 'Radio',
            'RadioGroup', 'RadioButton', 'Checkbox', 'CheckboxButton', 'CheckboxGroup', 'Switch',
            'Select', 'Option', 'OptionGroup', 'Button', 'ButtonGroup', 'Table', 'TableColumn',
            'DatePicker', 'TimeSelect', 'TimePicker', 'Popover', 'Tooltip', 'Breadcrumb',
            'BreadcrumbItem', 'Form', 'FormItem', 'Tabs', 'TabPane', 'Tag', 'Tree', 'Alert',
            'Slider', 'Icon', 'Row', 'Col', 'Upload', 'Progress', 'Spinner', 'Badge', 'Card',
            'Rate', 'Steps', 'Step', 'Carousel', 'CarouselItem', 'Collapse', 'CollapseItem',
            'Cascader', 'ColorPicker', 'Transfer', 'Container', 'Header', 'Aside', 'Main',
            'Footer', 'Timeline', 'TimelineItem', 'Link', 'Divider', 'Image', 'Calendar',
            'Backtop', 'PageHeader', 'CascaderPanel'
        ]

        componentNames.forEach(name => {
            expect(ElementUI[name].install).toHaveBeenCalled()
        })
    })

    it('should have registered Loading directive', () => {
        expect(ElementUI.Loading.directive.install).toHaveBeenCalled()
    })

    it('should have added all global methods', () => {
        const globalMethods = [
            '$loading', '$msgbox', '$alert', '$confirm', '$prompt', '$notify', '$message'
        ]

        globalMethods.forEach(method => {
            expect(Vue.prototype).toHaveProperty(method)
        })
    })
})