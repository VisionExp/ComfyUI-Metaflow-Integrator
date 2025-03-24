import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import electronSync from './middleware'
import {LocalComfyInstance} from "@/type/local-comfy-instance";
import {ConnectionStatus} from "@/type/ConnectionStatus";
import {LogEntry} from "@/type/LogEntry";
import { v4 as uuidv4 } from 'uuid';

type AppState = {
    localComfyInstances: LocalComfyInstance[]
    activeInstance: LocalComfyInstance | null
    setLocalComfyInstances: (localComfyInstances: LocalComfyInstance[]) => void
    setActiveInstance: (instance: LocalComfyInstance | null) => void
    isConnected: boolean
    setIsConnected: (isConnected: boolean) => void
    connectionStatus: ConnectionStatus
    setConnectionStatus: (connectionStatus: ConnectionStatus) => void
    logs: LogEntry[]
    setLogs: (logs: LogEntry[]) => void
}

const useAppStore = create<AppState, [['zustand/persist', NonNullable<unknown>]]>(
  electronSync(
    persist(
      (set) => ({
          localComfyInstances: [],
          activeInstance: null,
          setLocalComfyInstances: (instances: LocalComfyInstance[]) => {
              // Ensure all instances have IDs
              const instancesWithIds = instances.map(instance => ({
                  ...instance,
                  id: instance.id || uuidv4() // Keep existing ID or generate new one
              }));
              set((state) => ({
                  ...state,
                  localComfyInstances: instancesWithIds
              }));
          },
          setActiveInstance: (instance) =>
              set((state) => ({
                  ...state,
                  activeInstance: instance
              })),
          isConnected: false,
          setIsConnected: (isConnected) =>
              set((state) => ({
                  ...state,
                  isConnected,
              })),
          connectionStatus: 'disconnected',
          setConnectionStatus: (connectionStatus: ConnectionStatus) =>
              set((state) => ({
                  ...state,
                  connectionStatus
              })),
          logs: [],
          setLogs: (logs: LogEntry[]) =>
              set((state) => ({
                  ...state,
                  logs
              }))
      }),
      {
        name: 'app-data',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            localComfyInstances: state.localComfyInstances,
            activeInstance: state.activeInstance
        })
      }
    ),
    { key: 'store', excludes: [] }
  )
)

export default useAppStore
