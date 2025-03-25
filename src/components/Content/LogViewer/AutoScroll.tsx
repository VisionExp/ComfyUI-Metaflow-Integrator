import React, { useEffect, useRef } from 'react';

interface AutoScrollProps {
  children: React.ReactNode;
}

const AutoScroll: React.FC<AutoScrollProps> = ({ children }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [children]);

  return (
    <div style={{ height: '100%' }}>
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default AutoScroll; 