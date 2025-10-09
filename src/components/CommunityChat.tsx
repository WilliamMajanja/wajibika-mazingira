/// <reference types="react" />
import * as React from 'react';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { useToasts } from '../hooks/useToasts';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const CommunityChat: React.FC = () => {
    const [messages, setMessages] = React.useState<Message[]>([
        { role: 'model', text: "Jambo! I am Mazingira Rafiki. How can I help you discuss the environmental and social topics in your community today?" }
    ]);
    const [currentMessage, setCurrentMessage] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const { addToast } = useToasts();
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);


    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: currentMessage };
        
        // Construct the full history for the API, excluding the initial greeting
        const historyForApi = [...messages.slice(1), userMessage];

        // Optimistically update UI with user message and model placeholder
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);
        setCurrentMessage('');
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chat',
                    messages: historyForApi
                })
            });

            if (!response.ok || !response.body) {
                let errorMessage = `Chat API error: ${response.statusText}`;
                 try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                     const textError = await response.text();
                     errorMessage = textError || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let done = false;
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const latestMessages = [...prev];
                    const lastMessage = latestMessages[latestMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.text += chunk;
                    }
                    return latestMessages;
                });
            }

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast({ type: 'error', message: `Chat error: ${errorMessage}` });
            
            // Revert optimistic updates and show an error message in the chat
            setMessages(prev => {
                // Remove the user's message and the model's placeholder
                const revertedMessages = prev.slice(0, -2);
                return [...revertedMessages, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">AI Community Assistant</h2>
                <p className="text-sm text-slate-500">Chat with Mazingira Rafiki about local projects.</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-green-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                           <div className="prose prose-sm max-w-none prose-p:my-0 prose-p:text-inherit" style={{color: 'inherit'}}>
                             <ReactMarkdown>{msg.text || '...'}</ReactMarkdown>
                           </div>
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length-1]?.role === 'model' && messages[messages.length - 1]?.text === '' && (
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