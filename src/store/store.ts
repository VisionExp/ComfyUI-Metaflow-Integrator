import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import electronSync from './middleware'
import {LocalInstance} from "@/type/local-instance";
import {ConnectionStatus} from "@/type/ConnectionStatus";
import {LogEntry} from "@/type/LogEntry";
import { v4 as uuidv4 } from 'uuid';
import {tmpUserData} from "@/tmpUserData";
import {UserData} from "@/type/UserData";

// Get initial instances from localStorage
const getInitialInstances = () => {
  try {
    const storedData = localStorage.getItem('app-data');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      return parsed.state?.localInstances || [];
    }
  } catch (e) {
    // Silent error handling
  }
  return [];
};

const initialInstances = getInitialInstances();

type AppState = {
    localInstances: LocalInstance[]
    activeInstance: LocalInstance | null
    setLocalInstances: (localInstances: LocalInstance[]) => void
    setActiveInstance: (instance: LocalInstance | null) => void
    isConnected: boolean
    setIsConnected: (isConnected: boolean) => void
    connectionStatus: ConnectionStatus
    setConnectionStatus: (connectionStatus: ConnectionStatus) => void
    logs: LogEntry[]
    addLog: (log: LogEntry) => void
    clearLogs: () => void
    user: UserData
    setUser: (user: UserData) => void
    isInstanceRunning: boolean,
    setIsInstanceRunning: (isInstanceRunning: boolean) => void,
    usedPortsArray: number[] // Store as array for serialization
    usedPorts: Set<number> // Computed Set for operations
    addUsedPort: (port: number) => void,
    isPortUsed: (port: number) => boolean,
    removeUsedPort: (port: number) => void,
}

const MAX_LOGS = 500;

const useAppStore = create<AppState, [['zustand/persist', NonNullable<unknown>]]>(
  electronSync(
    persist(
      (set, get) => ({
          localInstances: initialInstances, // Initialize with data from localStorage
          activeInstance: null,
          setLocalInstances: (instances: LocalInstance[]) => {
              // Ensure all instances have IDs
              const instancesWithIds = instances.map(instance => ({
                  ...instance,
                  id: instance.id || uuidv4() // Keep existing ID or generate new one
              }));
              
              set((state) => ({
                  ...state,
                  localInstances: instancesWithIds
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
          isInstanceRunning: false,
          setIsInstanceRunning: (isInstanceRunning: boolean) =>
              set((state) => ({
                  ...state,
                  isInstanceRunning: isInstanceRunning
              })),
          logs: [],
          addLog: (log: LogEntry) =>
              set((state) => {
                  // Check if the last log has the same message
                  const lastLog = state.logs[state.logs.length - 1];
                  if (lastLog && lastLog.message === log.message) {
                      return state; // Return unchanged state if duplicate
                  }

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
              })),
          // Store used ports as array for proper serialization
          usedPortsArray: [],
          // Create a computed Set from the array
          get usedPorts() {
              return new Set(get().usedPortsArray);
          },
          // Add a port to the used ports
          addUsedPort: (port: number) =>
              set((state) => {
                  // Only add if it doesn't already exist
                  if (!state.usedPortsArray.includes(port)) {
                      return {
                          ...state,
                          usedPortsArray: [...state.usedPortsArray, port]
                      };
                  }
                  return state;
              }),
          // Check if a port is already used
          isPortUsed: (port: number) => {
              return get().usedPortsArray.includes(port);
          },
          // Remove a port from used ports
          removeUsedPort: (port: number) =>
              set((state) => ({
                  ...state,
                  usedPortsArray: state.usedPortsArray.filter(p => p !== port)
              }))
      }),
      {
        name: 'app-data',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            localInstances: state.localInstances,
            activeInstance: state.activeInstance,
            usedPortsArray: state.usedPortsArray,
        }),
        // Add rehydration callback to ensure proper loading
        onRehydrateStorage: () => (state) => {
          // State was rehydrated
        }
      }
    ),
    { key: 'store', excludes: [] }
  )
)

export default useAppStore
