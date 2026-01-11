import { Mock } from 'vitest'
import { Logger } from './logger'

describe('Logger', () => {
  let logger: Logger
  let consoleLogSpy: Mock
  let consoleErrorSpy: Mock
  let consoleWarnSpy: Mock
  let consoleTimeSpy: Mock
  let consoleTimeEndSpy: Mock

  beforeEach(() => {
    logger = new Logger('TestLogger')
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    consoleTimeSpy = vi.spyOn(console, 'time').mockImplementation(() => { })
    consoleTimeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => { })
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleTimeSpy.mockRestore()
    consoleTimeEndSpy.mockRestore()
  })

  it('should create a logger instance with a given name', () => {
    expect(logger.name).toBe('TestLogger')
    expect(logger.disabled).toBe(false)
  })

  it('should create a disabled logger instance', () => {
    const disabledLogger = new Logger('DisabledLogger', true)
    expect(disabledLogger.disabled).toBe(true)
  })

  describe('log method', () => {
    it('should log messages with the logger name prefix', () => {
      logger.log('Hello', 'World')
      expect(consoleLogSpy).toHaveBeenCalledWith('[TestLogger]', 'Hello', 'World')
    })

    it('should not log if the logger is disabled', () => {
      logger.disabled = true
      logger.log('Hello', 'World')
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })
})
