// src/components/chatbot/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { API_BASE_URL } from '../../apiConfig';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: "Hello! I'm GrantBot. How can I help you find a grant today? You can ask me about grants for specific fields like 'pendidikan' or 'alam sekitar'." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMessage = { from: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chatbot/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input, history: messages }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'AI error');
            
            const botMessage = { from: 'bot', text: data.text };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            const errorMessage = { from: 'bot', text: "I'm sorry, I encountered an error. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed bottom-5 right-5 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <button onClick={() => setIsOpen(true)} className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <MessageSquare size={24} />
                </button>
            </div>

            <div className={`fixed bottom-5 right-5 w-full max-w-sm h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Bot size={24} />
                        <h3 className="font-bold text-lg">GrantBot Assistant</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-indigo-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.from === 'bot' && <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><Bot size={20} className="text-gray-600"/></div>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-xs p-3 rounded-2xl ${msg.from === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                <p className="text-sm break-words">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="flex justify-start"><div className="p-3 bg-gray-200 rounded-2xl rounded-bl-none text-sm">Typing...</div></div>}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about grants..."
                        className="flex-1 w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleSend} disabled={loading} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300">
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </>
    );
};
