// Location: e.g., src/components/ChatInterface.tsx

import React, { useState } from 'react';

// Define a type for the chatbot response
interface ChatbotResponse {
  reply: string;
  // Add any other properties your API returns
}

function ChatInterface() {
    const [inputValue, setInputValue] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot' | 'system', content: string }[]>([]);
    const [isBotThinking, setIsBotThinking] = useState(false);

    const handleSendMessage = async () => {
        const messageText = inputValue.trim();
        if (!messageText) return; // Don't send empty

        // Add user message to UI immediately
        setChatMessages(prev => [...prev, { role: 'user', content: messageText }]);
        setInputValue(''); // Clear input
        setIsBotThinking(true);

        // Make HTTP Request to Python Backend without authentication
        const pythonChatbotApiUrl = '/api/chatbot'; // Your Python service endpoint

        try {
            const response = await fetch(pythonChatbotApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userMessage: messageText
                })
            });

            if (!response.ok) {
                // Handle HTTP errors from the Python service
                const errorData = await response.text();
                throw new Error(`Chatbot service error: ${response.status} ${response.statusText} - ${errorData}`);
            }

            // Handle Response with proper typing
            const result = await response.json() as ChatbotResponse;
            setChatMessages(prev => [...prev, { role: 'bot', content: result.reply || '...' }]);

        } catch (error) {
            console.error("Failed to send message to chatbot service:", error);
            setChatMessages(prev => [...prev, { role: 'system', content: `Error: Failed to communicate with the chatbot. ${error instanceof Error ? error.message : ''}` }]);
        } finally {
            setIsBotThinking(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="message-list">
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`message message-${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isBotThinking && <div className="message message-system">Bot is thinking...</div>}
            </div>
            <div className="input-area">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} // Trigger on Enter
                    disabled={isBotThinking}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage} disabled={isBotThinking || !inputValue.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatInterface;