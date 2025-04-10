// Location: e.g., src/components/ChatInterface.tsx

import React, { useState } from 'react';
// You'll likely need a library to easily read cookies in the browser
import Cookies from 'js-cookie';

function ChatInterface() {
    const [inputValue, setInputValue] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot' | 'system', content: string }[]>([]);
    const [isBotThinking, setIsBotThinking] = useState(false);

    // --- THIS IS THE CORE FUNCTION WHERE CHANGES ARE NEEDED ---
    const handleSendMessage = async () => {
        const messageText = inputValue.trim();
        if (!messageText) return; // Don't send empty

        // Add user message to UI immediately
        setChatMessages(prev => [...prev, { role: 'user', content: messageText }]);
        setInputValue(''); // Clear input
        setIsBotThinking(true);

        // --- Step 1 & 2: Get Session Token ---
        const sessionCookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'next-auth.session-token'; // Use env var if possible!
        const userSessionToken = Cookies.get(sessionCookieName);

        // --- Step 3: Check if Token Exists ---
        if (!userSessionToken) {
            console.error("User session token not found. User might be logged out.");
            setChatMessages(prev => [...prev, { role: 'system', content: "Error: Cannot send message. Please ensure you are logged in." }]);
            setIsBotThinking(false);
            return; // Stop processing
        }

        // --- Step 4: Make HTTP Request to Python Backend ---
        const pythonChatbotApiUrl = '/api/chatbot'; // Your Python service endpoint

        try {
            const response = await fetch(pythonChatbotApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // --- Step 5: Include Custom Header ---
                    'X-User-Session-Token': userSessionToken
                },
                // --- Step 6: Send User Message ---
                body: JSON.stringify({
                    userMessage: messageText
                    // You could include other context here if needed
                })
            });

            if (!response.ok) {
                // Handle HTTP errors from the Python service
                const errorData = await response.text();
                throw new Error(`Chatbot service error: ${response.status} ${response.statusText} - ${errorData}`);
            }

            // --- Step 7: Handle Response ---
            const result = await response.json(); // Assuming Python returns JSON { reply: "..." }
            setChatMessages(prev => [...prev, { role: 'bot', content: result.reply || '...' }]);

        } catch (error) {
            console.error("Failed to send message to chatbot service:", error);
            setChatMessages(prev => [...prev, { role: 'system', content: `Error: Failed to communicate with the chatbot. ${error instanceof Error ? error.message : ''}` }]);
        } finally {
            setIsBotThinking(false);
        }
    };
    // --- END OF CORE FUNCTION ---

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
                {/* This button's onClick triggers the handleSendMessage function */}
                <button onClick={handleSendMessage} disabled={isBotThinking || !inputValue.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatInterface;