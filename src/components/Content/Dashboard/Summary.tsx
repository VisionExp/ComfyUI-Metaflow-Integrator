import React, {useEffect, useState} from 'react';
import useAppStore from "@/store/store";
import {mdiDesktopClassic, mdiLanConnect, mdiPoll} from "@mdi/js";
import Icon from "@mdi/react";
import ComfyUIWorker from "@/logic/worker/comfyui-worker";
import {getToday, sanitizeDateTime} from "@/logic/helpers/date";
import {LocalImage} from "@/type/LocalImage";
import {HardwareStatistics} from "@/type/HardwareStats";

const Summary: React.FC = () => {
    const {
        activeInstance,
        isConnected,
        setIsConnected,
        user,
        addLog,
        isComfyRunning,
        setIsComfyRunning
    } = useAppStore();
    const [lastRun, setLastRun] = useState('');
    const [lastConnection, setLastConnection] = useState('');
    const [stats, setStats] = useState<HardwareStatistics | null>(null);
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
        //await window.api.runComfyUI(activeInstance?.pathTo ?? '');
        
        setIsComfyRunning(true);
        const lastDate = sanitizeDateTime(getToday())
        setLastRun(lastDate ?? '');
    }
    const handleStopComfyInstance = async ()=> {
        if (activeInstance){
            setIsComfyRunning(false);
            //await window.api.stopComfyUI(activeInstance.pathTo, activeInstance.port);
        }else {
            addLog({
                message: "There is no active ComfyUI instances",
                timestamp: getToday(),
                type: 'error'

            })
        }
    }


    useEffect(() => {
        const handleStatsUpdate = (_: any, data: HardwareStatistics) => {
            setStats(data);
        };

        // Listen for hardware stats updates
        window.electron.on('hardware-stats-update', handleStatsUpdate);

        return () => {
            window.electron.removeListener('hardware-stats-update', handleStatsUpdate);
        };
    }, []);


    const getPercentColor = (percent: number): string => {
        if (percent > 0 && percent <= 35){
            return 'text-success'
        }else if(percent > 35 && percent <= 85){
            return 'text-secondary-orange'
        }else if(percent > 85){
            return 'text-error'
        }else {
            return 'text-success'
        }
    };
    if (!stats) return null;
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
                            <button onClick={handleRunComfyInstance}
                                    className={'w-full hover:bg-secondary-darker-blue bg-secondary-blue transition-all duration-500'}>Run ComfyUI</button>
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
                                <button onClick={handleConnectToComfy}
                                        className={'w-full hover:bg-secondary-darker-orange bg-secondary-orange transition-all duration-500'}>Connect</button>
                            </>

                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-12 text-white h-72 mt-6 gap-2">
                <div className={"col-span-6 bg-gray-800 bg-opacity-50 rounded-xl relative"}>
                    {lastImage && (
                        <>
                            <div className="z-10 absolute px-4 py-2">
                                <h1 className="text-3xl font-bold ">Welcome, <br/>{user && user.user_metadata.user_name}
                                </h1>

                            </div>
                            <div className="w-full h-full absolute ">
                                <img
                                    src={lastImage.data}
                                    alt={lastImage.name}
                                    className="w-full h-full rounded-xl object-cover opacity-50"
                                />
                            </div>
                        </>


                    )}
                </div>
                <div className={"col-span-3 bg-gray-800 bg-opacity-50 px-2 rounded-xl"}>
                    <h2 className="text-xl text-center font-bold mb-1">System Resources</h2>
                    <div className="space-y-2 my-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-400">CPU</span>
                            <span
                                className={`${getPercentColor(stats.cpu.usage)} text-sm font-bold`}>{stats.cpu.usage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-secondary-darker-purple to-secondary-blue h-2 rounded-full transition-all duration-500"
                                style={{width: `${stats.cpu.usage}%`}}
                            />
                        </div>
                    </div>
                    <div className="space-y-2 my-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-400">RAM</span>
                            <span
                                className={`text-sm ${getPercentColor(stats.ram.usedPercent)} font-bold`}>{stats.ram.usedPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-secondary-darker-orange to-secondary-orange h-2 rounded-full transition-all duration-500"
                                style={{width: `${stats.ram.usedPercent}%`}}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-400">GPU:</span>
                            <span className="text-sm font-bold">{stats.gpu[0]?.name || 'N/A'}</span>
                        </div>
                        <div className="text-xs flex items-center justify-between text-neutral-400">
                            <span>VRAM: </span>
                            <span
                                className={"text-sm text-white font-bold"}>{stats.gpu[0]?.vram ? `${(stats.gpu[0].vram / 1024).toFixed(1)} GB` : 'N/A'}</span>
                        </div>
                        {stats.gpu[1] && (
                            <>
                                <div className="flex justify-between gap-4 items-center">
                                    <span className="text-sm text-neutral-400">GPU:</span>
                                    <span className="text-sm text-right font-bold">{stats.gpu[1]?.name || 'N/A'}</span>
                                </div>
                                <div className="text-xs flex items-center justify-between text-neutral-400">
                                    <span>VRAM: </span>
                                    <span
                                        className={"text-sm text-white text-right font-bold"}>{stats.gpu[1]?.vram ? `${(stats.gpu[1].vram / 1024).toFixed(1)} GB` : 'N/A'}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className={"col-span-3 bg-gray-800 bg-opacity-50 rounded-xl"}>
                    <h2 className="text-xl text-center font-bold">Statistic</h2>
                </div>
            </div>

        </div>
    );
};

export default Summary;