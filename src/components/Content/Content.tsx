import React, {useState} from "react";

import ComfyInstances from "@/components/Content/ComfyUI-Instances/ComfyInstances";
import Dashboard from "@/components/Content/Dashboard/Dashboard";
import Sidebar from "@/components/Content/Sidebar/Sidebar";
import useAppStore from "@/store/store";

function Content(){
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const connectionStatus = useAppStore(state => state.connectionStatus);
    const ContentPage = () => {
        switch (currentPage) {
            case 'Dashboard':
                return <Dashboard />
            case 'ComfyUI Instances':
                return <ComfyInstances />;
            default:
                return <></>;
        }
    };
    const StatusIndicator = () => {
        switch (connectionStatus) {
            case "connected":
                return <span className={`h-4 w-4 bg-success block rounded-full`}></span>
            case "disconnected":
                return <span className={`h-4 w-4 bg-secondary-blue block rounded-full`}></span>
            case "error":
                return <span className={`h-4 w-4 bg-error block rounded-full`}></span>

        }
    }
    return (
        <div className={"w-full h-full grid grid-cols-12"}>
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage}/>
            <div className={'bg-neutral-800 col-span-9 relative'}>
                <div className={'w-full flex justify-between bg-neutral-950 h-12 absolute'}>
                    <div className={'px-4 flex items-center py-2 gap-2'}>
                        {StatusIndicator()}
                        <span className={'font-mono'}>{connectionStatus}</span>
                    </div>
                    <div className={'px-4 py-2'}>userName</div>
                </div>
                <ContentPage />
            </div>
        </div>
    )
}

export default Content;