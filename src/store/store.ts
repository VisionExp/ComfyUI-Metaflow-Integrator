import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import electronSync from './middleware'
import {LocalComfyInstance} from "@/type/local-comfy-instance";
import {ConnectionStatus} from "@/type/ConnectionStatus";
import {LogEntry} from "@/type/LogEntry";
import { v4 as uuidv4 } from 'uuid';
import {tmpUserData} from "@/tmpUserData";
import {UserData} from "@/type/UserData";

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
    addLog: (log: LogEntry) => void
    clearLogs: () => void
    user: UserData
    setUser: (user: UserData) => void
    isComfyRunning: boolean,
    setIsComfyRunning: (isComfyRunning: boolean) => void,
}

const MAX_LOGS = 500;

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
          isComfyRunning: false,
          setIsComfyRunning: (isComfyRunning: boolean) =>
              set((state) => ({
                  ...state,
                  isComfyRunning
              })),
          logs: [],
          addLog: (log: LogEntry) =>
              set((state) => {
                  const newLogs = [...state.logs, log];
                  
                  if (newLogs.length > MAX_LOGS) {
                      return {
                          ...state,
                          logs: newLogs.slice(-MAX_LOGS)
                      };
                  }
                  return {
                      ...state,
                      logs: newLogs
                  };
              }),
          clearLogs: () =>
              set((state) => ({
                  ...state,
                  logs: []
              })),  
          user: tmpUserData,
          setUser: (user: UserData) =>
              set((state) => ({
                  ...state,
                  user
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
