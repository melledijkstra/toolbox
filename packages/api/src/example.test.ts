import { BaseClient } from './baseclient'

describe('BaseClient', () => {
  it('should not be able to instantiate', () => {
    expect(() => {
      new BaseClient('http://example.api')
    }).toThrow()
  })
})
