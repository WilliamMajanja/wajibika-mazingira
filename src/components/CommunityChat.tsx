import * as React from 'react';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { useToasts } from '../hooks/useToasts';
import { streamGeminiResponse, generateGeminiResponse, generateTextToSpeech } from '../services/geminiApiClient';
import { playTtsAudio } from '../utils/audioUtils';
import { MODELS, CHAT_DEFAULT_SYSTEM_INSTRUCTION } from '../config/ai';

type ChatMode = 'fast' | 'smart' | 'grounded' | 'maps';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    feedback?: 'up' | 'down';
    sources?: any[];
}

// Icons (self-contained for brevity)
const ThumbsUpIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.438a1 1 0 00.94-1.461l-2.12-4.24a1.5 1.5 0 01.282-1.77l1.395-1.395A1.5 1.5 0 0013.06 8H6.667a1.667 1.667 0 00-1.667 1.667z" /></svg>);
const ThumbsDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.562a1 1 0 00-.94 1.461l2.12 4.24a1.5 1.5 0 01-.282 1.77l-1.395 1.395A1.5 1.5 0 006.94 12h6.393a1.667 1.667 0 001.667-1.667z" /></svg>);
const SpeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>);
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0v-1.5a6 6 0 00-12 0v1.5m12 0v-1.5a6 6 0 00-6-6v1.5m-6 0v-1.5a6 6 0 016-6v1.5m0 0a5.996 5.996 0 016 6v1.5m-6 0a5.996 5.996 0 00-6 6v1.5" /></svg>);

export const CommunityChat: React.FC = () => {
    const [messages, setMessages] = React.useState<Message[]>([
        { id: 'initial-greeting', role: 'model', text: "Jambo! I am Mazingira Rafiki. How can I help you discuss the environmental and social topics in your community today?" }
    ]);
    const [currentMessage, setCurrentMessage] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [chatMode, setChatMode] = React.useState<ChatMode>('smart');
    const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
    const [recordingStatus, setRecordingStatus] = React.useState<'idle' | 'recording' | 'processing'>('idle');
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const { addToast } = useToasts();
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const requestLocation = React.useCallback(() => {
        if (!navigator.geolocation) {
            addToast({ type: 'error', message: 'Geolocation is not supported by your browser.' });
            return;
        }
        addToast({ type: 'info', message: 'Requesting your location for Maps search...' });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                addToast({ type: 'success', message: 'Location acquired.' });
            },
            () => {
                addToast({ type: 'error', message: 'Unable to retrieve location. Maps search may be less accurate.' });
            }
        );
    }, [addToast]);

    React.useEffect(() => {
        if (chatMode === 'maps' && !userLocation) {
            requestLocation();
        }
    }, [chatMode, userLocation, requestLocation]);


    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;
        setIsLoading(true);
        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: currentMessage };
        const historyForApi = messages.slice(1).map(m => ({ role: m.role, text: m.text }));
        
        setMessages(prev => [...prev, userMessage]);
        setCurrentMessage('');

        const modelConfig = {
            'fast': { model: MODELS.flash_lite, stream: true, task: 'chat' },
            'smart': { model: MODELS.flash, stream: true, task: 'chat' },
            'grounded': { model: MODELS.flash, stream: false, task: 'groundedSearch' },
            'maps': { model: MODELS.flash, stream: false, task: 'groundedMaps' },
        }[chatMode];

        try {
            if (modelConfig.stream) {
                const modelMessageId = `model-${Date.now()}`;
                setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

                const stream = await streamGeminiResponse(modelConfig.task, {
                    messages: [...historyForApi, { role: userMessage.role, text: userMessage.text }],
                    model: modelConfig.model,
                    systemInstruction: CHAT_DEFAULT_SYSTEM_INSTRUCTION
                });

                const reader = stream.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.role === 'model') lastMsg.text += chunk;
                        return newMessages;
                    });
                }
            } else { // Non-streaming for grounded search/maps
                const result = await generateGeminiResponse(modelConfig.task, {
                    messages: [...historyForApi, { role: userMessage.role, text: userMessage.text }],
                    model: modelConfig.model,
                    systemInstruction: CHAT_DEFAULT_SYSTEM_INSTRUCTION,
                    ...(chatMode === 'maps' && userLocation ? { latLng: userLocation } : {}),
                });
                const modelMessage: Message = {
                    id: `model-${Date.now()}`,
                    role: 'model',
                    text: result.text || 'I could not find any information on that topic.',
                    sources: result.sources || []
                };
                setMessages(prev => [...prev, modelMessage]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast({ type: 'error', message: `Chat error: ${errorMessage}` });
            setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleRecording = async () => {
        if (recordingStatus === 'recording') {
            mediaRecorderRef.current?.stop();
            setRecordingStatus('processing');
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        try {
                            const responseStream = await streamGeminiResponse('transcribeAudio', {
                                audio: base64Audio,
                                mimeType: 'audio/webm',
                                model: MODELS.flash
                            });
                            const streamReader = responseStream.getReader();
                            const decoder = new TextDecoder();
                            let transcription = '';
                            while (true) {
                                const { done, value } = await streamReader.read();
                                if (done) break;
                                transcription += decoder.decode(value, { stream: true });
                            }
                            setCurrentMessage(transcription.trim());
                        } catch (e) {
                            addToast({ type: 'error', message: 'Failed to transcribe audio.' });
                        } finally {
                            setRecordingStatus('idle');
                        }
                    };
                    // Clean up stream tracks
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorderRef.current.start();
                setRecordingStatus('recording');
            } catch (error) {
                addToast({ type: 'error', message: 'Microphone access denied or not available.' });
                console.error("Microphone error:", error);
            }
        }
    };
    
    const handlePlayTTS = async (text: string) => {
        if (!text) return;
        addToast({ type: 'info', message: 'Generating audio...' });
        try {
            const { audioContent } = await generateTextToSpeech(text);
            if (audioContent) {
                playTtsAudio(audioContent);
            } else {
                 addToast({ type: 'error', message: 'Failed to generate audio.' });
            }
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
             addToast({ type: 'error', message: `TTS Error: ${errorMessage}` });
        }
    };

    const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, feedback } : msg));
        addToast({ type: 'info', message: 'Thank you for your feedback!' });
    };

    const ChatModeSelector = () => (
        <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-lg">
            {(['fast', 'smart', 'grounded', 'maps'] as ChatMode[]).map(mode => (
                <button
                    key={mode}
                    onClick={() => setChatMode(mode)}
                    disabled={isLoading}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        chatMode === mode ? 'bg-white text-brand-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                    } disabled:opacity-50`}
                >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
            ))}
        </div>
    );

    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">AI Community Assistant</h2>
                <p className="text-sm text-slate-500">Chat with Mazingira Rafiki about local projects.</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-green-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                           <div className="prose prose-sm max-w-none prose-p:my-0 prose-p:text-inherit" style={{color: 'inherit'}}>
                             <ReactMarkdown>{msg.text || (isLoading ? '...' : '')}</ReactMarkdown>
                           </div>
                           {msg.sources && msg.sources.length > 0 && (
                               <div className="mt-3 pt-2 border-t border-slate-200/50">
                                   <h4 className="text-xs font-bold text-slate-500 mb-1">Sources:</h4>
                                   <ol className="text-xs text-slate-500 list-decimal list-inside space-y-1">
                                       {msg.sources.map((source, i) => {
                                          const link = source.web || source.maps;
                                          if (!link || !link.uri) return null;
                                          return (
                                            <li key={i}>
                                              <a href={link.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">
                                                {link.title || 'Source link'}
                                              </a>
                                            </li>
                                          );
                                       })}
                                   </ol>
                               </div>
                           )}
                        </div>
                        {msg.role === 'model' && msg.text && index > 0 && (!isLoading || index < messages.length - 1) && (
                            <div className="mt-2 flex items-center gap-1">
                                <button onClick={() => handlePlayTTS(msg.text)} aria-label="Read aloud" className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><SpeakerIcon className="h-4 w-4" /></button>
                                <button onClick={() => handleFeedback(msg.id, 'up')} disabled={!!msg.feedback} aria-label="Helpful" className={`p-1 rounded-full transition-colors ${msg.feedback === 'up' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:text-slate-300'}`}><ThumbsUpIcon /></button>
                                <button onClick={() => handleFeedback(msg.id, 'down')} disabled={!!msg.feedback} aria-label="Not helpful" className={`p-1 rounded-full transition-colors ${msg.feedback === 'down' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:text-slate-300'}`}><ThumbsDownIcon /></button>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (messages[messages.length-1]?.role === 'user' || messages[messages.length - 1]?.text === '') && (
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
            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                <ChatModeSelector />
                <div className="flex items-center space-x-2">
                    <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask a question or share a concern..." className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green-500 disabled:bg-slate-100" disabled={isLoading || recordingStatus !== 'idle'}/>
                    <button onClick={handleToggleRecording} disabled={isLoading} className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed ${recordingStatus === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 text-white hover:bg-slate-700'}`}>
                        <MicIcon className="h-6 w-6" />
                    </button>
                    <button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()} className="p-2 rounded-full bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </Card>
    );
};