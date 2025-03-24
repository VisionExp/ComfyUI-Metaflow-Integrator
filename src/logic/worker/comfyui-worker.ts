import useAppStore from "@/store/store";
import {ac} from "vitest/dist/chunks/reporters.nr4dxCkA";

interface ComfyUIConfig {
    wsURL: string;
    imageExtensions: string[];
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
    static #instance: ComfyUIWorker;

    constructor(config: Partial<ComfyUIConfig> = {}) {
        this.ws = null;
        this.config = {
            wsURL: config.wsURL || 'ws://127.0.0.1:8188/ws',
            imageExtensions: config.imageExtensions || ['.png', '.jpg', '.jpeg', '.webp'],
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
        console.log('Generation completed', data)
    }

    onError(error: unknown) {
        const {setIsConnected, setConnectionStatus} = useAppStore.getState();
        setIsConnected(false)
        setConnectionStatus('error')
        console.error('Connection error, Check is your ComfyUI running.')
    }

    onConnect() {
        const {setIsConnected, setConnectionStatus} = useAppStore.getState();
        setIsConnected(true)
        setConnectionStatus('connected')
        console.log('Connected to ComfyUI')
    }

    onDisconnect() {
        const {setIsConnected, setConnectionStatus} = useAppStore.getState();
        setIsConnected(false)
        setConnectionStatus('disconnected')
        console.log('Disconnected from ComfyUI')
    }

    onImageFound(imagePath: string) {
        try {
            console.log('New generated image found and uploaded:', imagePath);
        } catch (error) {
            console.error('Error uploading image:', error instanceof Error ? error.message : String(error));
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

     async findLastImage() {
         const {activeInstance} = useAppStore.getState();
         if (activeInstance?.pathTo) {
            return await window.api.getLastImage(activeInstance?.pathTo);
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
                console.log('Generation started');
            } else if (queueRemaining === 0 && this.isProcessing) {
                this.isProcessing = false;
                console.log('Generation completed');
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