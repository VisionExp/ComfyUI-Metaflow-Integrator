import logoMetaflow from "@/assets/logoMFT.svg";
import React from "react";
import Icon from "@mdi/react";
import {mdiGrain, mdiViewDashboard} from "@mdi/js";
interface SidebarProps {
    currentPage: string
    setCurrentPage: (currentPage: string) => void
}
function Sidebar(props: SidebarProps){
    const {currentPage, setCurrentPage} = props
    const menuItems = [
        {
            name: 'Dashboard',
            icon: <Icon path={mdiViewDashboard}  size={1} />,
        },
        {
            name: 'Instances',
            icon: <Icon path={mdiGrain}  size={1} />,
        },
        {
            name: 'Settings',
            icon:<Icon path={mdiViewDashboard}  size={1} />,
        },

    ];
    return (
        <div className={'col-span-3 p-4  bg-neutral-900'}>
            <div className="flex items-center gap-3 mb-6">
                <img src={logoMetaflow} className="w-10 h-auto" alt='logo'/>
                <div>
                    <div className="font-semibold">Metaflow OrchesMeister</div>
                </div>
            </div>
            <div className="w-full flex justify-between flex-col">
                <nav className="space-y-2 mb-auto">
                    {menuItems.map((item, index) => (
                        <div
                            key={item.name + index}
                            onClick={() => setCurrentPage(item.name)}
                            className={`bg-gray-800 bg-opacity-50 p-2 rounded-md flex items-center gap-3 cursor-pointer ${
                                currentPage === item.name
                                    ? 'border-b border-blue-500 text-blue-500'
                                    : ''
                            }`}>
                            {item.icon}
                            <span className="ms-3">{item.name}</span>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    )
}

export default Sidebar;