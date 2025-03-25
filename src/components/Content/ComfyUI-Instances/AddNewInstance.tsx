import Modal from "@/components/Modal/Modal";
import React, {useState} from "react";
import useAppStore from "@/store/store";
import { LocalComfyInstance } from "@/type/local-comfy-instance";
import { v4 as uuidv4 } from 'uuid';


interface AddNewInstanceProps {
    isOpen: boolean;
    onClose: () => void;
}

function AddNewInstance(props: AddNewInstanceProps) {
    const { isOpen, onClose } = props;
    const [instanceName, setInstanceName] = useState<string>('');
    const [selectedPath, setSelectedPath] = useState<string>('');
    const [port, setPort] = useState<string>('8188'); // Default ComfyUI port
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const setLocalComfyInstances = useAppStore(state => state.setLocalComfyInstances);
    const localComfyInstances = useAppStore(state => state.localComfyInstances);
    
    const handleAddNewInstance = () => {
        if (!instanceName || !selectedPath) {
            alert('Please provide both a name and path for the ComfyUI instance');
            return;
        }
        
        // Create a new instance object
        const newInstance: LocalComfyInstance = {
            id: uuidv4(),
            name: instanceName,
            pathTo: selectedPath,
            port: port
        };
        
        // Add to the store
        const updatedInstances = [...(Array.isArray(localComfyInstances) ? localComfyInstances : []), newInstance];
        setLocalComfyInstances(updatedInstances);
        
        // Close the modal and reset form
        onClose();
        setInstanceName('');
        setSelectedPath('');
        setPort('8188'); // Reset to default port
    }
    
    const handleSelectFolder = async () => {
        try {
            setIsLoading(true);
            const result = await window.api.selectFolder();
            if (result) {
                setSelectedPath(result);
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <Modal width={'max-w-96 w-96'} isOpen={isOpen} onClose={onClose}>
            <Modal.Header>Add New ComfyUI Instance</Modal.Header>
            <Modal.Body>
                <div className={"px-4 py-2"}>
                    <label
                        className="flex flex-col mb-2 w-full text-sm text-white"
                        htmlFor={'instance_name'}
                    >
                        Machine Name
                        <input
                            type="text"
                            id="instance_name"
                            name="instance_name"
                            required
                            value={instanceName}
                            placeholder={'My ComfyUI Instance'}
                            onChange={(e) => setInstanceName(e.target.value)}
                            className="bg-neutral-600 border border-neutral-500 my-2 text-white text-sm rounded-lg block h-8 w-auto px-2"
                        />
                    </label>
                    <label
                        className="flex flex-col mb-2 w-full text-sm text-white"
                        htmlFor={'instance_port'}
                    >
                        Port
                        <input
                            type="text"
                            id="instance_port"
                            name="instance_port"
                            required
                            value={port}
                            placeholder={'8188'}
                            onChange={(e) => setPort(e.target.value)}
                            className="bg-neutral-600 border border-neutral-500 my-2 text-white text-sm rounded-lg block h-8 w-auto px-2"
                        />
                    </label>
                    <div className={'flex items-center gap-2 mb-4'}>
                        <div className={'flex-1 bg-neutral-600 rounded-lg px-2 py-1 truncate'} title={selectedPath}>
                            {selectedPath || 'No path selected'}
                        </div>
                        <button 
                            onClick={handleSelectFolder} 
                            disabled={isLoading}
                            className={'px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors'}
                        >
                            {isLoading ? 'Selecting...' : 'Select Path'}
                        </button>
                    </div>
                    <button 
                        onClick={handleAddNewInstance} 
                        disabled={!instanceName || !selectedPath || isLoading}
                        className={'bg-secondary-orange w-full mt-4 py-2 rounded text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
                    >
                        Add Instance
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default AddNewInstance;