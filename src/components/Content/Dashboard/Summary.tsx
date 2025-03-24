import React, {useEffect, useState} from 'react';
import useAppStore from "@/store/store";
import {mdiDesktopClassic, mdiLanConnect, mdiPoll} from "@mdi/js";
import Icon from "@mdi/react";
import ComfyUIWorker from "@/logic/worker/comfyui-worker";
import {getToday, sanitizeDateTime} from "@/logic/helpers/date";
import {LocalImage} from "@/type/LocalImage";


const Summary: React.FC = () => {
    const activeInstance = useAppStore(state => state.activeInstance);
    const isConnected = useAppStore(state => state.isConnected);
    const setIsConnected = useAppStore(state => state.setIsConnected);

    const [isComfyRunning, setIsComfyRunning] = useState(false);
    const [lastRun, setLastRun] = useState('');
    const [lastConnection, setLastConnection] = useState('');
    const [lastImage, setLastImage] = useState<LocalImage | undefined>(undefined);
    const worker = ComfyUIWorker.instance;
    useEffect(() => {
        worker.findLastImage().then(r => {
            setLastImage(r);
        })
    }, []);
    const handleConnectToComfy = () => {
        try {
            if (worker) {
                worker.connect().then(()=>{
                    const lastDate = sanitizeDateTime(getToday())
                    setLastConnection(lastDate ?? '')
                });
            } else {
                setIsConnected(false)
                throw new Error("Worker was not initialized properly");
            }
        } catch (error) {
            setIsConnected(false)
            console.error('Error connecting worker:', error instanceof Error ? error.message : String(error));
        }
    }
    const handleDisconnect = ()=> {
        if (worker){
            worker.disconnect()
        }
    }
    const handleRunComfyInstance = async () => {
        await window.api.runComfyUI(activeInstance?.pathTo ?? '');
        
        setIsComfyRunning(true);
        const lastDate = sanitizeDateTime(getToday())
        setLastRun(lastDate ?? '');
    }
    const handleStopComfyInstance = ()=> {
        setIsComfyRunning(false);
    }
    return (
        <div className="bg-gray-900 text-white mt-12 p-3 w-auto h-full overflow-hidden">
            <div className="flex h-24 items-center justify-evenly gap-3 mb-3">
                <div className="bg-gray-800 bg-opacity-50 rounded-lg h-full p-3 flex flex-1 justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-xs">Active ComfyUI</p>
                        <h3 className="text-xl font-bold">
                            {activeInstance && activeInstance.name}
                        </h3>
            
                    </div>
                    <Icon className={`${isComfyRunning ? 'text-success' : 'text-white'}`} path={mdiDesktopClassic} size={2} />
                </div>


                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 h-full flex flex-1 justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-xs">Active Port</p>
                        <h3 className="text-xl font-bold">
                            {activeInstance && activeInstance.port}
                        </h3>
                       
                    </div>
                    <Icon className={`${isComfyRunning ? 'text-success' : 'text-white'}`} path={mdiLanConnect} size={2} />
                </div>

                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 h-full flex flex-1 justify-between items-center">
                    <div className={'w-full'}>
                        {isComfyRunning ? (
                            <>
                                <p className="text-gray-400 text-xs">Running On: {activeInstance?.port}</p>
                                <button onClick={handleStopComfyInstance} className={'w-full bg-error'}>Stop</button>
                            </>

                        ) : (
                            <>
                            <p className="text-gray-400 text-xs">Last Run: {lastRun}</p>
                                <button onClick={handleRunComfyInstance} className={'w-full bg-secondary-blue'}>Run ComfyUI
                                </button>
                            </>

                        )}
                    </div>

                </div>

                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 h-full flex flex-1 justify-between items-center">
                    <div className={'w-full'}>

                        {isConnected ? (
                            <>
                                <p className="text-gray-400 text-xs">Connected To: {activeInstance?.port}</p>
                                <button onClick={handleDisconnect} className={'w-full bg-error'}>Disconnect</button>
                            </>

                        ) : (
                            <>
                                <p className="text-gray-400 text-xs">Last Connect: {lastConnection}</p>
                                <button onClick={handleConnectToComfy} className={'w-full bg-secondary-orange'}>Connect</button>
                            </>

                        )}
                    </div>
                </div>
            </div>
            <div className={'w-full h-64 flex p-2 mt-8'}>
                {lastImage && (
                    <div className="w-64 h-64 bg-neutral-900 cursor-pointer relative group">
                        <span className="absolute top-0 left-0 w-full py-1 text-center font-bold bg-neutral-900 opacity-0 group-hover:opacity-75 transition-opacity duration-500">
                            Last Generated Image
                        </span>
                        <img className="w-full h-full rounded-xl" src={lastImage.data} alt={lastImage.name}/>
                        <span className="absolute bottom-0 w-full text-center py-2 left-0 bg-neutral-900 opacity-0 group-hover:opacity-75 transition-opacity duration-500">
                            {lastImage.name}
                        </span>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Summary;