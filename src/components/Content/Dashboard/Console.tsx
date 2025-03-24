import React, { useState, useEffect, useRef } from 'react';

interface ConsoleItem {
    type: 'command' | 'output';
    text: string;
}

const ConsoleEmulator: React.FC = () => {
    const [history, setHistory] = useState<ConsoleItem[]>([]);
    const [input, setInput] = useState<string>('');
    const [cursorVisible, setCursorVisible] = useState<boolean>(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const consoleEndRef = useRef<HTMLDivElement>(null);
    const consoleRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);


    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setCursorVisible(prev => !prev);
        }, 500);

        return () => clearInterval(blinkInterval);
    }, []);


    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processCommand();
        }
    };

    const processCommand = (): void => {
        if (!input.trim()) return;

        const newHistory: ConsoleItem[] = [...history, { type: 'command' as const, text: input }];

        let response: string;
        const command = input.trim().toLowerCase();

        if (command === 'clear' || command === 'cls') {
            setHistory([{ type: 'output' as const, text: 'Console cleared.' }]);
            setInput('');
            return;
        } else if (command.startsWith('echo ')) {
            response = command.substring(5);
        } else if (command === 'help') {
            response = 'Available commands:\n- echo [text]: Display text\n- clear/cls: Clear console\n- date: Display current date\n- help: Show this help';
        } else if (command === 'date') {
            response = new Date().toString();
        } else {
            response = `Command not found: ${command}`;
        }

        newHistory.push({ type: 'output' as const, text: response });
        setHistory(newHistory);
        setInput('');
    };

    const handleConsoleClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div 
            ref={consoleRef}
            className="w-auto h-full mx-auto bg-neutral-950 text-green-400 rounded-md shadow-lg font-mono text-sm flex flex-col relative"
            onClick={handleConsoleClick}
        >
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-800 scrollbar-track-black">
                {history.map((item, index) => (
                    <div key={index} className="mb-1">
                        {item.type === 'command' && (
                            <div className="flex">
                                <span className="text-blue-400 mr-2">user@localhost:~$</span>
                                <span>{item.text}</span>
                            </div>
                        )}
                        {item.type === 'output' && (
                            <div className="whitespace-pre-wrap">{item.text}</div>
                        )}
                    </div>
                ))}
                <div className="flex items-center">
                    <span className="text-blue-400 mr-2">user@localhost:~$</span>
                    <span>{input}</span>
                    <span className={`w-2 h-5 ml-0.5 ${cursorVisible ? 'bg-green-400' : 'bg-transparent'}`}></span>
                </div>
                <div ref={consoleEndRef}></div>
            </div>

            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="opacity-0 absolute left-0 top-0 w-px h-px"
                autoFocus
            />
        </div>
    );
};

export default ConsoleEmulator;