import * as browser from 'webextension-polyfill'
import { IStorage } from '@melledijkstra/storage'

export class ExtensionStorage implements IStorage {
  storageArea: browser.Storage.StorageArea

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.storageArea.get(key)
    return result[key] as T
  }

  set<T>(key: string, value: T): Promise<void> {
    return this.storageArea.set({ [key]: value })
  }

  delete(key: string): Promise<void> {
    return this.storageArea.remove(key)
  }

  clear(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async has(key: string): Promise<boolean> {
    const keys = await this.storageArea.getKeys()
    return keys.includes(key)
  }

  keys(): Promise<string[]> {
    return this.storageArea.getKeys()
  }

  async size(): Promise<number> {
    const keys = await this.storageArea.getKeys()
    return keys.length
  }

  constructor(storageType = browser.storage.local) {
    this.storageArea = storageType
  }
}
