import React, {useEffect, useState, memo} from "react";
import Icon from "@mdi/react";
import {mdiInformationSlabCircleOutline} from "@mdi/js";

const DockerStatusBar = memo(() => {
    const [dockerStatus, setDockerStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
    const [isDockerInstalled, setIsDockerInstalled] = useState(false);
    
    useEffect(() => {
        const handleDockerStatusUpdate = (_: any, status: {isInstalled: boolean, status: 'running' | 'stopped' | 'error'}) => {
            setIsDockerInstalled(status.isInstalled);
            setDockerStatus(status.status);
        };
        
        // Register the event listener
        window.electron.on('docker-status-update', handleDockerStatusUpdate);
        
        // Clean up the event listener when the component unmounts
        return () => {
            window.electron.removeListener('docker-status-update', handleDockerStatusUpdate);
        };
    }, []);
    
    const DockerStatusIndicator = () => {
        switch (dockerStatus) {
            case "running":
                return <span className={`h-4 w-4 bg-success block rounded-full`}></span>
            case "stopped":
                return <span className={`h-4 w-4 bg-neutral-500 block rounded-full`}></span>
            case "error":
                return <span className={`h-4 w-4 bg-error block rounded-full`}></span>
        }
    }
    
    return (
        <div className={"flex items-center justify-between h-12 bg-neutral-950 absolute bottom-0 w-full"}>
            {isDockerInstalled ? (
                <>
                    <div className={"px-4"}>Docker status</div>
                    <div className={"flex items-center px-4 gap-2"}>
                        <Icon className={"cursor-pointer"} path={mdiInformationSlabCircleOutline} size={0.85}/>
                        {DockerStatusIndicator()}
                        <span className={'font-mono'}>{dockerStatus}</span>
                    </div>
                </>
            ) : (
                <div className={'text-xs text-error px-4'}>Docker not installed. Please check your Docker Desktop App</div>
            )}
        </div>
    );
});

export default DockerStatusBar; 