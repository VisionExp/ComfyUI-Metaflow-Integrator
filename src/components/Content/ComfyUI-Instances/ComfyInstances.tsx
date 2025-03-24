import Icon from "@mdi/react";
import {mdiDesktopClassic, mdiPlus} from "@mdi/js";
import useAppStore from "@/store/store";
import { LocalComfyInstance } from "@/type/local-comfy-instance";
import {useCallback, useState} from "react";
import AddNewInstance from "@/components/Content/ComfyUI-Instances/AddNewInstance";
import InstanceDetailsModal from "@/components/Content/ComfyUI-Instances/InstanceDetailsModal";

function ComfyInstances(){
    const [isAddNewInstance, setIsAddNewInstance] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<LocalComfyInstance | null>(null);
    const [isInstanceDetailsOpen, setIsInstanceDetailsOpen] = useState(false);
    
    const localComfyInstances = useAppStore(state => state.localComfyInstances);
    const setLocalComfyInstances = useAppStore(state => state.setLocalComfyInstances);
    const activeInstance = useAppStore(state => state.activeInstance);

    const instances = Array.isArray(localComfyInstances) ? localComfyInstances : [];
    
    const handleAddNew = useCallback(() => {
        setIsAddNewInstance(true);
    }, []);
    
    const handleInstanceClick = useCallback((instance: LocalComfyInstance) => {
        setSelectedInstance(instance);
        setIsInstanceDetailsOpen(true);
    }, []);
    
    const handleCloseInstanceDetails = useCallback(() => {
        setIsInstanceDetailsOpen(false);
        // Clear the selected instance after a short delay to prevent UI flicker
        setTimeout(() => {
            setSelectedInstance(null);
        }, 200);
    }, []);
    
    return (
        <div className={"w-full"}>
            <div className={'h-12 w-auto mt-12 px-4'}>
                <span className={'block font-semibold'}>ComfyUI Instances</span>
                <span className={'block text-sm text-neutral-400'}>Here you can choose or add to list ComfyUI that installed on your machine</span>
            </div>
            <div className={'w-auto flex justify-start items-center gap-2 mt-4 px-4 py-2'}>
                <div className={"mr-4 flex flex-col items-center"}>
                    <div 
                        className={`w-16 h-16 rounded-xl cursor-pointer text-white hover:text-blue-500 hover:border-blue-500
                        transition-all duration-500 flex border border-dashed border-white`}
                        onClick={() => setIsAddNewInstance(true)}
                    >
                        <Icon path={mdiPlus} className={'m-auto '} size={1.5}/>
                    </div>
                    <span className={'text-sm mt-2'}>Add New</span>
                </div>
                {instances.length > 0 && instances.map((instance: LocalComfyInstance, index: number) => {
                    const isActive = activeInstance && activeInstance.id === instance.id;
                    return (
                        <div 
                            key={instance.id}
                            className={"flex flex-col items-center cursor-pointer"}
                            onClick={() => handleInstanceClick(instance)}
                        >
                            <div className={`w-16 h-16 rounded-xl flex border text-white
                                ${isActive 
                                    ? 'border-secondary-orange text-secondary-orange border-solid' 
                                    : 'border-dashed border-white hover:text-secondary-orange hover:border-secondary-orange'} 
                                transition-all duration-500`}>
                                <Icon path={mdiDesktopClassic} className={'m-auto'} size={1.5}/>
                            </div>
                            <div className="flex flex-col items-center">
                               <span className={`text-sm mt-2 ${isActive ? 'text-secondary-orange font-semibold' : ''}`}>
                                {instance.name}
                                {isActive && ' (Active)'}
                               </span>
                               <span className="text-xs text-gray-400">
                                   Port: {instance.port || "8188"}
                               </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Add New Instance Modal */}
            <AddNewInstance
                isOpen={isAddNewInstance}
                onClose={() => setIsAddNewInstance(false)}
            />
            
            {/* Instance Details Modal */}
            <InstanceDetailsModal
                isOpen={isInstanceDetailsOpen}
                onClose={handleCloseInstanceDetails}
                instance={selectedInstance}
            />
        </div>
    )
}

export default ComfyInstances;