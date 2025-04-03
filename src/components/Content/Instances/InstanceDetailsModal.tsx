import Modal from "@/components/Modal/Modal";
import React, { useState } from "react";
import { LocalInstance } from "@/type/local-instance";
import useAppStore from "@/store/store";
import Icon from "@mdi/react";
import { mdiPencil, mdiCheck, mdiClose } from "@mdi/js";

interface InstanceDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    instance: LocalInstance | null;
}

function InstanceDetailsModal(props: InstanceDetailsModalProps) {
    const { isOpen, onClose, instance } = props;
    const [newName, setNewName] = useState<string>("");
    const [newPort, setNewPort] = useState<string>("");
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [isEditingPort, setIsEditingPort] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    
    const localComfyInstances = useAppStore(state => state.localInstances);
    const setLocalComfyInstances = useAppStore(state => state.setLocalInstances);
    const setActiveInstance = useAppStore(state => state.setActiveInstance);
    const activeInstance = useAppStore(state => state.activeInstance);
    
    // Initialize the values when the instance changes
    React.useEffect(() => {
        if (instance) {
            setNewName(instance.name);
            setNewPort(instance.port || "8188"); // Default to 8188 if not set
        }
    }, [instance]);
    
    // Reset states when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsEditingName(false);
            setIsEditingPort(false);
            setIsDeleting(false);
        }
    }, [isOpen]);
    
    if (!instance) return null;
    
    const handleSaveName = () => {
        if (newName.trim() === "") {
            alert("Instance name cannot be empty");
            return;
        }
        
        const updatedInstances = localComfyInstances.map(item => 
            item.id === instance.id ? { ...item, name: newName } : item
        );
        
        setLocalComfyInstances(updatedInstances);
        setIsEditingName(false);
    };
    
    const handleSavePort = () => {
        if (newPort.trim() === "") {
            alert("Port cannot be empty");
            return;
        }
        
        // Check if port is a valid number
        const portNumber = parseInt(newPort, 10);
        if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
            alert("Please enter a valid port number (1-65535)");
            return;
        }
        
        const updatedInstances = localComfyInstances.map(item => 
            item.id === instance.id ? { ...item, port: newPort } : item
        );
        
        setLocalComfyInstances(updatedInstances);
        setIsEditingPort(false);
    };
    
    const handleUse = () => {
        // Set this instance as the active instance
        setActiveInstance(instance);
        console.log(`Using instance: ${instance.name}`);
        
        // Close the modal after selecting
        onClose();
    };
    
    const handleDelete = async() => {
        if (isDeleting) {
            // Confirm deletion
            const updatedInstances = localComfyInstances.filter(item => 
                item.id !== instance.id
            );
            await window.api.removeContainer(instance.name);
            setLocalComfyInstances(updatedInstances);
            onClose();
        } else {
            // Show delete confirmation
            setIsDeleting(true);
        }
    };
    
    const cancelNameEdit = () => {
        setIsEditingName(false);
        setNewName(instance.name);
    };
    
    const cancelPortEdit = () => {
        setIsEditingPort(false);
        setNewPort(instance.port || "8188");
    };
    
    const cancelAction = () => {
        setIsDeleting(false);
    };
    
    return (
        <Modal width={'max-w-96 w-96'} isOpen={isOpen} onClose={onClose}>
            <Modal.Header>
                {isDeleting ? "Delete Instance" : "Instance Details"}
            </Modal.Header>
            <Modal.Body>
                <div className="px-4 py-2">
                    {isDeleting ? (
                        <div className="mb-4">
                            <p className="text-white mb-4">
                                Are you sure you want to delete the instance "{instance.name}"?
                            </p>
                            <div className="flex justify-between">
                                <button 
                                    onClick={cancelAction}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm text-white mb-1">
                                    Name
                                </label>
                                <div className="flex items-center gap-2">
                                    {isEditingName ? (
                                        <>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="bg-neutral-600 border border-neutral-500 text-white text-sm rounded-lg flex-1 px-2 py-1"
                                            />
                                            <button 
                                                onClick={handleSaveName}
                                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                title="Save"
                                            >
                                                <Icon path={mdiCheck} size={1} />
                                            </button>
                                            <button 
                                                onClick={cancelNameEdit}
                                                className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                                title="Cancel"
                                            >
                                                <Icon path={mdiClose} size={1} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-neutral-600 rounded-lg px-2 py-1 text-white flex-1">
                                                {instance.name}
                                            </div>
                                            <button 
                                                onClick={() => setIsEditingName(true)}
                                                className="p-1 bg-transparent text-white rounded hover:bg-secondary-blue transition-colors"
                                                title="Edit Name"
                                            >
                                                <Icon path={mdiPencil} size={0.8} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm text-white mb-1">
                                    Port
                                </label>
                                <div className="flex items-center gap-2">
                                    {isEditingPort ? (
                                        <>
                                            <input
                                                type="text"
                                                value={newPort}
                                                onChange={(e) => setNewPort(e.target.value)}
                                                className="bg-neutral-600 border border-neutral-500 text-white text-sm rounded-lg flex-1 px-2 py-1"
                                            />
                                            <button 
                                                onClick={handleSavePort}
                                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                title="Save"
                                            >
                                                <Icon path={mdiCheck} size={1} />
                                            </button>
                                            <button 
                                                onClick={cancelPortEdit}
                                                className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                                title="Cancel"
                                            >
                                                <Icon path={mdiClose} size={1} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-neutral-600 rounded-lg px-2 py-1 text-white flex-1">
                                                {instance.port || "8188"}
                                            </div>
                                            <button 
                                                onClick={() => setIsEditingPort(true)}
                                                className="p-1 bg-transparent text-white rounded hover:bg-secondary-blue transition-colors"
                                                title="Edit Port"
                                            >
                                                <Icon path={mdiPencil} size={0.8} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={handleUse}
                                    className="px-2 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                >
                                    Use
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default InstanceDetailsModal; 