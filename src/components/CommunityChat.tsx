import React, { useState, useRef, useEffect } from 'react';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { useToasts } from '../hooks/useToasts';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const CommunityChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Jambo! I am Mazingira Rafiki. How can I help you discuss the environmental and social topics in your community today?" }
    ]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToasts();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: currentMessage };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setCurrentMessage('');
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chat',
                    messages: newMessages // Send the whole history for context
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Chat API error: ${response.statusText}` }));
                throw new Error(errorData.error || `Chat API error: ${response.statusText}`);
            }
            
            const data = await response.json();
            const modelMessage: Message = { role: 'model', text: data.text };
            
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast({ type: 'error', message: `Chat error: ${errorMessage}` });
            setMessages(prev => [...prev, {role: 'model', text: `Sorry, I encountered an error. Please try again. ${errorMessage}`}]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">AI Community Assistant</h2>
                <p className="text-sm text-slate-500">Chat with Mazingira Rafiki about local projects.</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-green-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                           <div className="prose prose-sm max-w-none" style={{color: 'inherit'}}>
                             <ReactMarkdown>{msg.text}</ReactMarkdown>
                           </div>
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length-1]?.role === 'user' && (
                    <div className="flex justify-start">
                        <div className="max-w-lg p-3 rounded-2xl bg-white text-slate-800 rounded-bl-none shadow-sm">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={"Ask a question or share a concern..."}
                        className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green-500 disabled:bg-slate-100"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()} className="p-2 rounded-full bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </Card>
    );
};