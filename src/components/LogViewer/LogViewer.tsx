import React, { useEffect, useState, useRef } from 'react';
import { mdiClose, mdiDelete, mdiEye, mdiEyeOff } from '@mdi/js';
import Icon from '@mdi/react';
import AutoScroll from './AutoScroll';
import {LogEntry} from "@/type/LogEntry";
import useAppStore from "@/store/store";

const LogViewer: React.FC = () => {
  const {logs, setLogs} = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logs: LogEntry[] = []
    const handleLog = (_: any, log: LogEntry) => {
      logs.push(log);
      setLogs(logs);
    };

    window.electron.on('log-message', handleLog);

    return () => {
      window.electron.removeListener('log-message', handleLog);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };


  return (
    <div className="w-full h-full max-h-[225px] rounded-lg shadow-lg flex flex-col z-50">
      <div className="px-2 flex justify-between items-center border-b border-white/10">
        <span className="text-white text-sm font-medium">Logs</span>
        <div className="flex gap-1">
          <button
            onClick={clearLogs}
            className="text-white hover:text-gray-300 p-1 rounded"
            title="Clear logs"
          >
            <Icon path={mdiDelete} size={1} />
          </button>

        </div>
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-sm leading-relaxed">
        <AutoScroll>
          {logs.map((log, index) => (
            <div
              key={index}
              className="whitespace-pre-wrap text-neutral-200 break-words"
            >
              <span className="text-gray-400">[{log.timestamp}] </span>
              {log.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </AutoScroll>
      </div>
    </div>
  );
};

export default LogViewer; 