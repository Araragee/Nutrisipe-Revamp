import { describe, expect, it } from 'vitest'
import { useConfirm } from './useConfirm'

describe('useConfirm', () => {
  it('resolves with the user choice and clears the dialog', async () => {
    const { confirm, settle, options } = useConfirm()

    const yes = confirm({ title: 'Delete?' })
    expect(options.value?.title).toBe('Delete?')
    settle(true)
    await expect(yes).resolves.toBe(true)
    expect(options.value).toBeNull()

    const no = confirm({ title: 'Again?' })
    settle(false)
    await expect(no).resolves.toBe(false)
  })

  it('cancels a pending dialog when a new one opens', async () => {
    const { confirm, settle, options } = useConfirm()

    const first = confirm({ title: 'First' })
    const second = confirm({ title: 'Second' })
    await expect(first).resolves.toBe(false)
    expect(options.value?.title).toBe('Second')
    settle(true)
    await expect(second).resolves.toBe(true)
  })
})
