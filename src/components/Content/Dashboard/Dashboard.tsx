import ConsoleEmulator from "@/components/Content/Dashboard/Console";
import Summary from "@/components/Content/Dashboard/Summary";
import { mdiConsole, mdiTextBox } from '@mdi/js';
import Icon from '@mdi/react';
import { useState } from 'react';
import LogViewer from "@/components/Content/LogViewer/LogViewer";

function Dashboard(){
    const [activeTab, setActiveTab] = useState<'console' | 'logs'>('logs');

    return (
        <div className={'flex flex-col justify-between h-full'}>
            <div className={'h-2/3'}>
                <Summary />
            </div>
            <div className={'h-1/3 flex p-4 bg-neutral-950'}>
                <div className="flex h-full w-full">
                    <div className={"flex h-full w-24 flex-col gap-2"}>
                        <div onClick={() => setActiveTab('logs')}
                             className={`cursor-pointer flex items-center gap-2 ${activeTab === 'logs' ? 'text-secondary-blue' : ''}`}>
                            <Icon path={mdiTextBox} size={1}></Icon>
                            <span className={"text-sm"}>Logs</span>
                        </div>
                        <div onClick={() => setActiveTab('console')}
                             className={`cursor-pointer flex items-center gap-2 ${activeTab === 'console' ? 'text-secondary-blue' : ''}`}>
                            <Icon path={mdiConsole} size={1}></Icon>
                            <span className={"text-sm"}>Console</span>
                        </div>
                    </div>
                    <div className="flex-1 h-full">
                        {activeTab === 'console' && (
                            <ConsoleEmulator/>
                        )}
                        {activeTab === 'logs' && (
                                <LogViewer/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Dashboard;