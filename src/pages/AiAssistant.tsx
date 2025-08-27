import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Evidence } from '../types';
import { Button } from '../components/common/Button';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useEvidence } from '../contexts/EvidenceContext';
import { Spinner } from '../components/common/Spinner';

const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';

const getDefaultMessages = (): ChatMessage[] => [{
    role: 'model',
    content: `Hello! I am your AI Legal Assistant, specializing in Kenyan Environmental Law. I can answer your questions or summarize text-based documents from the Evidence Locker. How can I help you today?`
}];

// --- Modal Component for Evidence Selection ---
const EvidenceSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (evidenceId: string) => void;
}> = ({ isOpen, onClose, onSelect }) => {
    const { evidence, isLoading } = useEvidence();
    const textBasedEvidence = evidence.filter(e => e.file_mime_type && e.file_mime_type.startsWith('text'));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 p-4 border-b">Select Evidence to Summarize</h3>
                <div className="p-4 overflow-y-auto">
                    {isLoading ? <Spinner /> : textBasedEvidence.length > 0 ? (
                        <ul className="space-y-2">
                            {textBasedEvidence.map(item => (
                                <li key={item.id}>
                                    <button onClick={() => onSelect(item.id)} className="w-full text-left p-3 bg-gray-50 hover:bg-brand-green-light/10 border rounded-md">
                                        <p className="font-semibold text-gray-800">{item.title}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.submitted_at).toLocaleDateString()}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 text-center">No text-based evidence (e.g., .txt, .doc) found in the locker.</p>}
                </div>
                <div className="p-2 border-t text-right">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};


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
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const handleSummarize = async (evidenceId: string) => {
        setIsModalOpen(false);
        setIsLoading(true);
        setError(null);
        addMessage({ role: 'user', content: `Please summarize the evidence document with ID: ${evidenceId}` });
        addMessage({ role: 'model', content: '' });

        try {
            const response = await fetch('/api/evidence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'summarize', evidenceId })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to get summary.');

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = data.summary;
                return updated;
            });

        } catch (err: any) {
            setError("Sorry, I couldn't summarize that document. " + err.message);
            setMessages(prev => prev.slice(0, -2)); // Revert optimistic updates
        } finally {
            setIsLoading(false);
        }
    };


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
        const historyBeforeRequest = [...messages];
        
        // Optimistically update UI
        setMessages(prev => [...prev, userInput, { role: 'model', content: '' }]);
        setInput('');
        setIsLoading(true);
        setError(null);
        
        try {
            const historyForApi = historyBeforeRequest.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }));

            const response = await fetch('/api/ai-assistant-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: historyForApi,
                    message: userInput.content
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
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    if(lastMessage) {
                        lastMessage.content += chunkText;
                    }
                    return updatedMessages;
                });
            }

        } catch (err: any) {
            console.error("Error sending message:", err);
            setError("Sorry, I encountered an error. Please try your request again.");
            // Revert optimistic updates on error
            setMessages(historyBeforeRequest);
            setInput(userInput.content);
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
            </div>
            
            {error && <div className="text-red-500 text-center p-2 text-sm">{error}</div>}

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
                     <Button type="button" variant="secondary" onClick={() => setIsModalOpen(true)} disabled={isLoading}>
                        Summarize Evidence
                    </Button>
                    <Button type="submit" isLoading={isLoading} disabled={!input.trim() || isLoading}>
                        Send
                    </Button>
                </form>
            </div>
            
            <EvidenceSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSummarize}
            />
        </div>
    );
};