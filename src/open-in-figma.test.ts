import mock from 'mock-require'
import { createStubSourcegraphAPI, createStubExtensionContext } from '@sourcegraph/extension-api-stubs'
const sourcegraph = createStubSourcegraphAPI()
mock('sourcegraph', sourcegraph)

import { activate } from './open-in-figma'

describe('open-in-figma', () => {
    it('should activate successfully', async () => {
        const context = createStubExtensionContext()
        await activate(context)
    })
})