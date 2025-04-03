import Modal from "@/components/Modal/Modal";
import React, {useState, useEffect} from "react";
import useAppStore from "@/store/store";
import { LocalInstance } from "@/type/local-instance";
import { v4 as uuidv4 } from 'uuid';


interface AddNewInstanceProps {
    isOpen: boolean;
    onClose: () => void;
}

function AddNewInstance(props: AddNewInstanceProps) {
    const { isOpen, onClose } = props;
    const [instanceName, setInstanceName] = useState<string>('');
  
    const [port, setPort] = useState<string>('8188');
    const [jupyterPort, setJupyterPort] = useState<string>('8888');
    const [networkName, setNetworkName] = useState<string>('metaflow_network');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPortError, setIsPortError] = useState<boolean>(false);
    const [portErrorMessage, setPortErrorMessage] = useState<string>('');
    
    const setLocalInstances = useAppStore(state => state.setLocalInstances);
    const localInstances = useAppStore(state => state.localInstances);
    const isPortUsed = useAppStore(state => state.isPortUsed);
    
    useEffect(() => {
        // Validate port when it changes
        validatePort(port); 
        validatePort(jupyterPort);
    }, [port, jupyterPort]);
    
    const validatePort = (portValue: string) => {
        // Clear previous errors
        setIsPortError(false);
        setPortErrorMessage('');
        
        // Check if port is a valid number
        const portNumber = parseInt(portValue, 10);
        if (isNaN(portNumber) || portNumber < 1024 || portNumber > 65535) {
            setIsPortError(true);
            setPortErrorMessage('Port must be a number between 1024 and 65535');
            return false;
        }
        
        // Check if port is already in use
        if (isPortUsed(portNumber)) {
            setIsPortError(true);
            setPortErrorMessage('This port is already in use by another instance');
            return false;
        }
        
        return true;
    };
    
    const handleAddNewInstance = async () => {
        if (!instanceName) {
            alert('Please provide both a name for the instance');
            return;
        }
        
        // Validate port before adding
        if (!validatePort(port)) {
            return;
        }
        
        // Create a new instance object
        const newInstance: LocalInstance = {
            id: uuidv4(),
            name: instanceName,
            port: port
        };
        await window.api.createContainerAndFoldersStructure(newInstance.name, parseInt(port, 10), parseInt(jupyterPort, 10), networkName);
        // Add to the store
        const updatedInstances = [...(Array.isArray(localInstances) ? localInstances : []), newInstance];
        setLocalInstances(updatedInstances);
        
        // Register the port as used
        const addUsedPort = useAppStore.getState().addUsedPort;
        addUsedPort(parseInt(port, 10));
        
        // Close the modal and reset form
        onClose();
        setInstanceName('');    
        setPort('8188');
        setJupyterPort('8888');
        setNetworkName('metaflow_network');
        setIsPortError(false);
        setPortErrorMessage('');
    }
    
    
    return (
        <Modal width={'max-w-96 w-96'} isOpen={isOpen} onClose={onClose}>
            <Modal.Header>Add New Container Instance</Modal.Header>
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
                            placeholder={'My Container Instance'}
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
                            className={`bg-neutral-600 border ${isPortError ? 'border-red-500' : 'border-neutral-500'} my-2 text-white text-sm rounded-lg block h-8 w-auto px-2`}
                        />
                        {isPortError && (
                            <span className="text-red-500 text-xs mt-1">{portErrorMessage}</span>
                        )}
                    </label>
                    <label
                        className="flex flex-col mb-2 w-full text-sm text-white"
                        htmlFor={'instance_jupyter_port'}
                    >
                        Jupyter Port
                        <input
                            type="text"
                            id="instance_jupyter_port"
                            name="instance_jupyter_port"
                            required
                            value={jupyterPort}
                            placeholder={'8888'}
                            onChange={(e) => setJupyterPort(e.target.value)}
                            className={`bg-neutral-600 border ${isPortError ? 'border-red-500' : 'border-neutral-500'} my-2 text-white text-sm rounded-lg block h-8 w-auto px-2`}
                        />
                    </label>        
                    <label
                        className="flex flex-col mb-2 w-full text-sm text-white"
                        htmlFor={'instance_network_name'}
                    >
                        Network Name
                        <input
                            type="text"
                            id="instance_network_name"
                            name="instance_network_name"
                            required
                            value={networkName}
                            placeholder={'metaflow_network'}
                            onChange={(e) => setNetworkName(e.target.value)}
                            className={`bg-neutral-600 border ${isPortError ? 'border-red-500' : 'border-neutral-500'} my-2 text-white text-sm rounded-lg block h-8 w-auto px-2`}
                        />
                    </label>        
                    <button 
                        onClick={handleAddNewInstance} 
                        disabled={!instanceName || isLoading || isPortError}
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