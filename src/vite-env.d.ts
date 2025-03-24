/// <reference types="vite/client" />

import {LocalImage} from "@/type/LocalImage";

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  api: {
    selectFolder: () => Promise<string>;
    runComfyUI: (path: string) => Promise<void>;
    getLastImage: (path: string) => Promise<LocalImage>;
  }
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
}
