import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Button } from '../components/common/Button';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';

const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';

const getDefaultMessages = (): ChatMessage[] => [{
    role: 'model',
    content: `Hello! I am your AI Legal Assistant, specializing in Kenyan Environmental Law. How can I help you today?`
}];

export const AiAssistant: React.FC = () => {
    const { user } = useAuth();
    const { setTitle } = useLayout();
    
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
            return savedHistory ? JSON.parse(savedHistory) : getDefaultMessages();
        } catch (error) {
            console.error("Failed to parse chat history from localStorage", error);
            return getDefaultMessages();
        }
    });

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTitle('AI Legal Assistant');
    }, [setTitle]);

    useEffect(() => {
        try {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error("Failed to save chat history to localStorage", error);
        }
    }, [messages]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleClearChat = () => {
        setMessages(getDefaultMessages());
        try {
             localStorage.removeItem(CHAT_HISTORY_KEY);
        } catch (error) {
             console.error("Failed to clear chat history from localStorage", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userInput];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);
        
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        try {
            const historyForApi = newMessages.slice(0, -1).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }));

            const response = await fetch('/api/ai-assistant-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: historyForApi,
                    message: input
                })
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json().catch(() => ({error: `Request failed with status ${response.status}`}));
                throw new Error(errorData.error || `Request failed`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunkText = decoder.decode(value, { stream: true });
                
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    updatedMessages[updatedMessages.length - 1].content += chunkText;
                    return updatedMessages;
                });
            }

        } catch (err: any) {
            console.error("Error sending message:", err);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if(lastMessage && lastMessage.role === 'model' && lastMessage.content === '') {
                     lastMessage.content = errorMessage;
                }
                return updatedMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isUser = message.role === 'user';
        const userAvatar = user?.picture;
        const bubbleClasses = isUser 
            ? 'bg-brand-green-light text-white self-end'
            : 'bg-white text-gray-800 self-start';
        const Avatar = isUser 
            ? (userAvatar ? <img src={userAvatar} alt="user" className="h-8 w-8 rounded-full"/> : <UserCircleIcon className="h-8 w-8 text-gray-400"/>)
            : <div className="h-8 w-8 rounded-full bg-brand-dark flex items-center justify-center"><SparklesIcon className="h-5 w-5 text-white" /></div>;

        return (
            <div className={`flex items-start gap-3 my-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0">{Avatar}</div>
                <div className={`rounded-lg p-3 max-w-xl shadow-sm ${bubbleClasses}`}>
                    <div className="prose prose-sm max-w-none text-inherit" style={{whiteSpace: 'pre-wrap'}}>{message.content || '...'}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center">
                    <SparklesIcon className="h-8 w-8 text-brand-green-light" />
                    <h2 className="text-3xl font-bold text-gray-800 ml-3">AI Legal Assistant</h2>
                </div>
                <Button variant="secondary" onClick={handleClearChat}>
                    Clear Chat
                </Button>
            </div>


            <div ref={chatContainerRef} className="flex-grow bg-gray-50/50 rounded-lg p-4 overflow-y-auto border">
                <div className="flex flex-col">
                    {messages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
                </div>
                {error && !isLoading && <div className="text-red-500 text-center p-2">An error occurred. Please try your request again.</div>}
            </div>

            <div className="mt-4">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about Kenyan environmental law..."
                        className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light disabled:bg-gray-100"
                        disabled={isLoading}
                    />
                    <Button type="submit" isLoading={isLoading} disabled={!input.trim() || isLoading}>
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
};