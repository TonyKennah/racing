import React, { useState, useEffect, useRef } from 'react';
import '../../css/Chatter.css';

const Chatter = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const socket = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    if (isJoined) {
      socket.current = new WebSocket(`wss://www.pluckier.co.uk/utils/chatservice/racing/${username}`);

      socket.current.onopen = () => {
        // Send join notification
        const joinMsg = JSON.stringify({ type: 'SYSTEM', text: `${username} joined the chat` });
        socket.current.send(joinMsg);
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      };

      return () => socket.current.close();
    }
  }, [isJoined]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socket.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ type: 'CHAT', user: username, text: input });
      socket.current.send(payload);
      setInput('');
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <div 
      className={`chat-modal ${isMinimized ? 'minimized' : ''}`}
    >
      {/* Header - Stays visible when minimized */}
      <div className="chat-header">
        <span>💬 Chat</span>
        <div className="controls">
          <button onClick={() => setIsMinimized(!isMinimized)}>{isMinimized ? '▲' : '−'}</button>
        </div>
      </div>

      {!isMinimized && (
        <div className="chat-body">
          {!isJoined ? (
            <form className="join-form" onSubmit={(e) => { e.preventDefault(); setIsJoined(true); }}>
              <p>Pick a chat nickname:</p>
              <input 
                autoFocus
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Anonymous name..." 
                required 
              />
              <button type="submit">Join</button>
            </form>
          ) : (
            <>
              <div className="messages-container" ref={scrollRef}>
                {messages.map((msg, i) => (
                  <div key={i} className={`msg-row ${msg.type === 'SYSTEM' ? 'system' : ''}`}>
                    {msg.type === 'CHAT' && <strong>{msg.user}: </strong>}
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
              <form className="input-area" onSubmit={sendMessage}>
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Type message..." 
                />
                <button type="submit">Send</button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatter;
