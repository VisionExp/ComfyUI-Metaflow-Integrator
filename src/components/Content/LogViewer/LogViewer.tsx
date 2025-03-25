import React, {useEffect, useRef} from 'react';
import {mdiDelete} from '@mdi/js';
import Icon from '@mdi/react';
import AutoScroll from './AutoScroll';
import {LogEntry} from "@/type/LogEntry";
import useAppStore from "@/store/store";

const LogViewer: React.FC = () => {
  const {logs, addLog, clearLogs} = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    const handleLog = (_: any, log: LogEntry) => {
        addLog(log);
    };

    window.electron.on('log-message', handleLog);

    return () => {
      window.electron.removeListener('log-message', handleLog);
    };
  }, [logs]);

  const handleClearLogs = () => {
    clearLogs();
  };
  const getLogColor = (log: LogEntry) => {
    switch (log.type) {
      case 'success':
        return 'text-success';
      case 'error':
          return 'text-error';
      case 'info':
        return 'text-secondary-blue';
      default:
        return 'text-neutral-200';
    }
  }
  return (
    <div className="w-full h-full max-h-[225px] bg-neutral-900 rounded-lg flex flex-col z-50">
      <div className="flex-1 relative overflow-auto p-2 font-mono text-sm leading-relaxed">
        <AutoScroll>
          {logs.map((log, index) => (
              <div
                  key={index}
                  className={`whitespace-pre-wrap ${getLogColor(log)} break-words`}
              >
                <span>[{log.timestamp}] </span>
                {log.message}
              </div>
          ))}
          <div ref={messagesEndRef}/>
        </AutoScroll>
        <button
            onClick={handleClearLogs}
            className="text-white absolute bottom-1 right-1 hover:text-gray-300 p-1 rounded"
            title="Clear logs"
        >
          <Icon path={mdiDelete} size={1}/>
        </button>
      </div>
    </div>
  );
};

export default LogViewer; 