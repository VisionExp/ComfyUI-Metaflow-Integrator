import { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { receiveStateFromMain, sendStateToMain, sendStateToRenderer } from './helpers'

// Define State type locally since it's no longer exported from zustand
type State = Record<string | number | symbol, any>

declare module 'zustand' {
  interface StoreApi<T extends State> {
    key: string
  }

  // @ts-ignore
  interface StoreMutators<S, A> {
    setKey: Write<Cast<S, object>, { key: string }>
  }
}

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

type Cast<T, U> = T extends U ? T : U

type UnionOfObjectKeysWithoutFunctions<T> = T extends object
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
  : never

type ElectronSyncInputOptions<T extends State> = {
  key: string
  excludes?: UnionOfObjectKeysWithoutFunctions<T>[]
}
type ElectronSyncWithExcludes = <
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  options: ElectronSyncInputOptions<T>
) => StateCreator<T, Mps, Mcs>

export type ElectronSyncOptions = {
  key: string
  excludes?: string[]
}
type ElectronSyncImpl = <T extends State>(
  f: StateCreator<T, [], []>,
  options: ElectronSyncOptions
) => StateCreator<T, [], []>

const electronSyncImpl: ElectronSyncImpl = (f, options) => (set, get, _store) => {
  const store = _store as any
  const { key, excludes = [] } = options
  if (!store.key) store.key = key

  if (typeof window !== 'undefined') {
    if (store.key === key) {
      receiveStateFromMain(store, options)
    }
  }

  const electronSyncSet: typeof set = (...a) => {
    set(...(a as [any, any]))
    if (store.key === key) {
      if (typeof window !== 'undefined') {
        sendStateToMain(excludes, get, key)
      } else {
        sendStateToRenderer(excludes, get, key)
      }
    }
  }

  return f(electronSyncSet, get, store)
}

const electronSync = electronSyncImpl as unknown as ElectronSyncWithExcludes

export default electronSync
