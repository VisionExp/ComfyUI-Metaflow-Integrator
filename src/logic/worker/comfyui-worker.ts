import useAppStore from "@/store/store";
import {ac} from "vitest/dist/chunks/reporters.nr4dxCkA";
import {getToday} from "@/logic/helpers/date";

interface ComfyUIConfig {
    wsURL: string;
    reconnectInterval: number;
}

interface ComfyUIStatus {
    type: string;
    data?: {
        status?: {
            exec_info?: {
                queue_remaining: number;
            }
        }
    }
}

class ComfyUIWorker {
    private ws: WebSocket | null = null;
    private config: ComfyUIConfig;
    private isConnected = false;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isProcessing = false;
    private knownFiles = new Set<string>();
    private globalState: Record<string, any> = useAppStore.getState();
    static #instance: ComfyUIWorker;

    constructor(config: Partial<ComfyUIConfig> = {}) {
        this.ws = null;
        this.config = {
            wsURL: config.wsURL || 'ws://127.0.0.1:8188/ws',
            reconnectInterval: config.reconnectInterval || 5000,

        };
    }

    public static get instance(): ComfyUIWorker {
        if (!ComfyUIWorker.#instance) {
            ComfyUIWorker.#instance = new ComfyUIWorker();
        }

        return ComfyUIWorker.#instance;
    }

    onComplete(data: any) {
        this.globalState.addLog({
            timestamp: getToday(),
            message: `Generation completed, ${data}`,
            type: 'success'
        })
    }

    onError(error: unknown) {
        const {setIsConnected, setConnectionStatus} = this.globalState
        setIsConnected(false)
        setConnectionStatus('error')

        this.globalState.addLog({
            timestamp: getToday(),
            message: 'Connection error, Check is your ComfyUI running.',
            type: 'error'
        })
    }

    onConnect() {
        const {setIsConnected, setConnectionStatus} = this.globalState
        setIsConnected(true)
        setConnectionStatus('connected')

        this.globalState.addLog({
            timestamp: getToday(),
            message: 'Connected to ComfyUI',
            type: 'success'
        })
    }

    onDisconnect() {
        const {setIsConnected, setConnectionStatus} = this.globalState
        setIsConnected(false)
        setConnectionStatus('disconnected')

        this.globalState.addLog({
            timestamp: getToday(),
            message: 'Disconnected from ComfyUI',
            type: 'info'
        })
    }

    onImageFound(imagePath: string) {
        try {
            this.globalState.addLog({
                timestamp: getToday(),
                message: `New generated image found and uploaded:, ${imagePath}`,
                type: 'success'
            })
        } catch (error) {
            this.globalState.addLog({
                timestamp: getToday(),
                message: `Error uploading image:, ${error instanceof Error ? error.message : String(error)}`,
                type: 'success'
            })
        }
    }

    async connect() {
        try {
            this.ws = new WebSocket(this.config.wsURL);
            this.setupWebSocketHandlers();
        } catch (error) {
            this.onError(error);
        }
    }

     async findGeneratedImage() {
         const {activeInstance} = this.globalState
         if (activeInstance?.pathTo) {
            return await window.api.getGeneratedImages(activeInstance?.pathTo);
         }
     }

    setupWebSocketHandlers(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            this.isConnected = true;
            this.onConnect();
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.onDisconnect();
        };

        this.ws.onerror = (error) => {
            this.onError(error);
        };

        this.ws.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                this.handleMessage(parsedData);
            } catch (error) {
                this.onError(error);
            }
        };
    }

    handleMessage(data: ComfyUIStatus): void {
        if (data.type === 'status' && data.data?.status?.exec_info) {
            const queueRemaining = data.data.status.exec_info.queue_remaining;

            if (queueRemaining === 1 && !this.isProcessing) {
                this.isProcessing = true;
                this.globalState.addLog({
                    timestamp: getToday(),
                    message: 'Generation started',
                    type: 'info'
                })
            } else if (queueRemaining === 0 && this.isProcessing) {
                this.isProcessing = false;

                this.globalState.addLog({
                    timestamp: getToday(),
                    message: 'Generation completed',
                    type: 'success'
                })
                setTimeout(() => {
                    //this.findNewImages();
                    this.onComplete(data);
                }, 1000);
            }
        }
    }

    async disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

export default ComfyUIWorker;