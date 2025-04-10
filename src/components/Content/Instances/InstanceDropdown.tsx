import React, {useEffect, useRef, useState, memo} from "react";
import Icon from "@mdi/react";
import {mdiDotsVertical, mdiPencil, mdiDelete, mdiPlay, mdiStop, mdiCheck, mdiClose} from "@mdi/js";
import {LocalInstance} from "@/type/local-instance";

interface InstanceDropdownProps {
    instance: LocalInstance;
    onEdit: (instance: LocalInstance) => void;
    onDelete: (instance: LocalInstance) => void;
    onToggleEnabled: (instance: LocalInstance) => void;
    onRun: (instance: LocalInstance) => void;
}

const InstanceDropdown = memo(({ 
    instance, 
    onEdit, 
    onDelete, 
    onToggleEnabled, 
    onRun 
}: InstanceDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent instance click event
        setIsOpen(!isOpen);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(instance);
        setIsOpen(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(instance);
        setIsOpen(false);
    };

    const handleToggleEnabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleEnabled(instance);
        setIsOpen(false);
    };

    const handleRun = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRun(instance);
        setIsOpen(false);
    };

    return (
        <div className="ml-auto relative" ref={dropdownRef}>
            <span 
                className="text-gray-400 cursor-pointer"
                onClick={handleToggle}
            >
                <Icon path={mdiDotsVertical} size={1.2} />
            </span>
            
            {isOpen && (
                <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-neutral-900 rounded-md shadow-lg z-10 border border-neutral-800">
                    <div className="py-1">
                        <button 
                            className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-neutral-800"
                            onClick={handleEdit}
                        >
                            <Icon path={mdiPencil} size={0.8} className="mr-2" />
                            Edit
                        </button>
                        <button 
                            className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-neutral-800"
                            onClick={handleDelete}
                        >
                            <Icon path={mdiDelete} size={0.8} className="mr-2" />
                            Delete
                        </button>
                        <button 
                            className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-neutral-800"
                            onClick={handleToggleEnabled}
                        >
                            <Icon path={instance.isEnabled ? mdiClose : mdiCheck} size={0.8} className="mr-2" />
                            {instance.isEnabled ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                            className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-neutral-800"
                            onClick={handleRun}
                        >
                            <Icon path={instance.isRunning ? mdiStop : mdiPlay} size={0.8} className="mr-2" />
                            {instance.isRunning ? 'Stop' : 'Run'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default InstanceDropdown; 