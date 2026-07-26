import * as React from 'react';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { useToasts } from '../hooks/useToasts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useStreamReader } from '../hooks/useStreamReader';
import { streamAIResponse, speakText } from '../services/aiClient';
import type { ChatMode } from '../services/aiClient';
import {
  CHAT_DEFAULT_SYSTEM_INSTRUCTION,
  CHAT_FAST_SYSTEM_INSTRUCTION,
  CHAT_GROUNDED_SYSTEM_INSTRUCTION,
  CHAT_MAPS_SYSTEM_INSTRUCTION,
  withLanguage,
} from '../config/ai';
import { useI18n } from '../config/i18n';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: Record<string, unknown>[];
}

const MAX_MESSAGES = 50;

function getInitialGreeting(): Message {
    return {
        id: 'initial-greeting',
        role: 'model',
        text: "Jambo! I am Mazingira Rafiki. How can I help you discuss environmental and social topics in your community today?",
    };
}

const ThumbsUpIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.438a1 1 0 00.94-1.461l-2.12-4.24a1.5 1.5 0 01.282-1.77l1.395-1.395A1.5 1.5 0 0013.06 8H6.667a1.667 1.667 0 00-1.667 1.667z" /></svg>);
const ThumbsDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.562a1 1 0 00-.94 1.461l2.12 4.24a1.5 1.5 0 01-.282 1.77l-1.395 1.395A1.5 1.5 0 006.94 12h6.393a1.667 1.667 0 001.667-1.667z" /></svg>);
const SpeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>);
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0v-1.5a6 6 0 00-12 0v1.5m12 0v-1.5a6 6 0 00-6-6v1.5m-6 0v-1.5a6 6 0 016-6v1.5m0 0a5.996 5.996 0 016 6v1.5m-6 0a5.996 5.996 0 00-6 6v1.5" /></svg>);
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);

export const CommunityChat: React.FC = () => {
    const [messages, setMessages] = useLocalStorage<Message[]>('chatMessages', [getInitialGreeting()]);
    const [currentMessage, setCurrentMessage] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [chatMode, setChatMode] = useLocalStorage<ChatMode>('chatMode', 'smart');
    const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
    const [locationStatus, setLocationStatus] = React.useState<'idle' | 'requesting' | 'active' | 'denied' | 'manual'>('idle');
    const [showManualLocation, setShowManualLocation] = React.useState(false);
    const [manualLat, setManualLat] = React.useState('');
    const [manualLng, setManualLng] = React.useState('');
    const [recordingStatus, setRecordingStatus] = React.useState<'idle' | 'recording' | 'processing'>('idle');
    const [feedbackMap, setFeedbackMap] = useLocalStorage<Record<string, 'up' | 'down'>>('chatFeedback', {});
    interface SpeechRecognitionAPI {
      stop(): void;
      start(): void;
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    }
    const recognitionRef = React.useRef<SpeechRecognitionAPI | null>(null);
    const { addToast } = useToasts();
    const { t, language } = useI18n();
    const { readStream, abort } = useStreamReader();
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const requestLocation = React.useCallback(() => {
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            addToast({ type: 'error', message: t('chat.maps.noGeolocation') });
            return;
        }
        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                setUserLocation(loc);
                setLocationStatus('active');
                addToast({ type: 'success', message: t('chat.maps.locationAcquired') });
            },
            (err) => {
                setLocationStatus('denied');
                if (err.code === 1) {
                    addToast({ type: 'error', message: t('chat.maps.permissionDenied') });
                } else {
                    addToast({ type: 'error', message: t('chat.maps.locationFailed') });
                }
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    }, [addToast, t]);

    const handleSetManualLocation = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            addToast({ type: 'error', message: t('chat.maps.invalidCoords') });
            return;
        }
        setUserLocation({ latitude: lat, longitude: lng });
        setLocationStatus('manual');
        setShowManualLocation(false);
        addToast({ type: 'success', message: t('chat.maps.locationSet') });
    };

    React.useEffect(() => {
        if (chatMode === 'maps' && locationStatus === 'idle') {
            setTimeout(() => requestLocation(), 0);
        }
    }, [chatMode, locationStatus, requestLocation]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;
        if (messages.length >= MAX_MESSAGES) { addToast({ type: 'error', message: `Maximum ${MAX_MESSAGES} messages reached. Clear the chat to continue.` }); return; }

        const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: currentMessage.trim() };
        const historyForApi = messages.slice(1).map(m => ({ role: m.role as 'user' | 'model', text: m.text }));

        setMessages(prev => [...prev, userMsg]);
        setCurrentMessage('');
        setIsLoading(true);

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        try {
            let baseSystem: string;
            switch (chatMode) {
              case 'fast':
                baseSystem = CHAT_FAST_SYSTEM_INSTRUCTION;
                break;
              case 'grounded':
                baseSystem = CHAT_GROUNDED_SYSTEM_INSTRUCTION;
                break;
              case 'maps':
                baseSystem = CHAT_MAPS_SYSTEM_INSTRUCTION;
                break;
              default:
                baseSystem = CHAT_DEFAULT_SYSTEM_INSTRUCTION;
            }

            let systemMsg = withLanguage(baseSystem, language);

            // Inject location context directly into system instruction for Maps mode
            if (chatMode === 'maps' && userLocation) {
                const latStr = userLocation.latitude.toFixed(4);
                const lngStr = userLocation.longitude.toFixed(4);
                systemMsg += `\n\nLOCATION CONTEXT: The user is located near coordinates ${latStr}, ${lngStr}. Use this location to provide locally relevant environmental information including: local vegetation and ecosystems typical of this area, climate patterns and weather conditions, relevant community conservation projects nearby, indigenous species and biodiversity, soil types and land use, water resources and watershed information, and any known environmental challenges in this region. If the user asks about something not location-specific, still acknowledge their geographic context when relevant.`;
            }

            const contextMessages = [...historyForApi, userMsg];

            const modelMsgId = `model-${Date.now()}`;
            setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

            const stream = await streamAIResponse('chat', {
                messages: contextMessages,
                systemInstruction: systemMsg,
                mode: chatMode,
            });

            let fullText = '';

            await readStream(stream, (chunk) => {
                fullText += chunk;

                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    setMessages(prev => {
                        const next = [...prev];
                        const last = next[next.length - 1];
                        if (last.role === 'model') {
                            next[next.length - 1] = { ...last, text: fullText };
                        }
                        return next;
                    });
                }, 50);
            }, undefined, { streamTimeout: 45000, totalTimeout: 180000 });

            if (timeoutId) clearTimeout(timeoutId);
            setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.role === 'model') {
                    next[next.length - 1] = { ...last, text: fullText };
                }
                return next;
            });
        } catch (error: unknown) {
            if (timeoutId) clearTimeout(timeoutId);
            const errMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
            addToast({ type: 'error', message: `Chat error: ${errMsg}` });
            setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', text: `Sorry, I encountered an error: ${errMsg}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleRecording = () => {
        const W = window as Window & { SpeechRecognition?: new () => SpeechRecognitionAPI; webkitSpeechRecognition?: new () => SpeechRecognitionAPI };
        const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addToast({ type: 'error', message: 'Speech recognition is not supported in this browser.' });
            return;
        }

        if (recordingStatus === 'recording') {
            recognitionRef.current?.stop();
            setRecordingStatus('idle');
        } else {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = language === 'sw' ? 'sw-TZ' : 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setCurrentMessage(prev => prev ? `${prev} ${transcript}` : transcript);
                setRecordingStatus('idle');
            };
            recognition.onerror = () => {
                addToast({ type: 'error', message: 'Speech recognition failed. Please try again.' });
                setRecordingStatus('idle');
            };
            recognition.onend = () => setRecordingStatus('idle');

            recognitionRef.current = recognition;
            recognition.start();
            setRecordingStatus('recording');
        }
    };

    const handlePlayTTS = (text: string) => {
        if (!text) return;
        try { speakText(text); } catch (e: unknown) {
            addToast({ type: 'error', message: `TTS Error: ${e instanceof Error ? e.message : 'Unknown'}` });
        }
    };

    const handleFeedback = (messageId: string, fb: 'up' | 'down') => {
        setFeedbackMap(prev => ({ ...prev, [messageId]: fb }));
        addToast({ type: 'info', message: 'Thank you for your feedback!' });
    };

    const clearChat = () => {
        abort();
        setMessages([getInitialGreeting()]);
        addToast({ type: 'info', message: t('chat.toast.cleared') });
    };

    const locationStatusColor = locationStatus === 'active' || locationStatus === 'manual'
        ? 'text-green-600 bg-green-50'
        : locationStatus === 'requesting'
        ? 'text-yellow-600 bg-yellow-50'
        : locationStatus === 'denied'
        ? 'text-red-600 bg-red-50'
        : 'text-slate-400 bg-slate-50';

    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{t('chat.title')}</h2>
                    <p className="text-sm text-slate-500">{t('chat.subtitle')}</p>
                </div>
                <button onClick={clearChat} disabled={messages.length <= 1}
                    className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-30 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors">
                    {t('chat.clear')}
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-green-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                           <div className="prose prose-sm max-w-none prose-p:my-0 prose-p:text-inherit" style={{color: 'inherit'}}>
                             <ReactMarkdown>{msg.text || (isLoading && index === messages.length - 1 ? '...' : '')}</ReactMarkdown>
                           </div>

                        </div>
                        {msg.role === 'model' && msg.text && index > 0 && (!isLoading || index < messages.length - 1) && (
                            <div className="mt-2 flex items-center gap-1">
                                <button onClick={() => handlePlayTTS(msg.text)} aria-label="Read aloud" className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-green-500"><SpeakerIcon className="h-4 w-4" /></button>
                                <button onClick={() => handleFeedback(msg.id, 'up')} disabled={!!feedbackMap[msg.id]} aria-label="Helpful" className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${feedbackMap[msg.id] === 'up' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:text-slate-300'}`}><ThumbsUpIcon /></button>
                                <button onClick={() => handleFeedback(msg.id, 'down')} disabled={!!feedbackMap[msg.id]} aria-label="Not helpful" className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${feedbackMap[msg.id] === 'down' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:text-slate-300'}`}><ThumbsDownIcon /></button>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.text === '' && (
                    <div className="flex justify-start">
                        <div className="max-w-lg p-3 rounded-2xl bg-white rounded-bl-none shadow-sm">
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
                {/* Mode selector with location indicator */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                        {(['fast', 'smart', 'grounded', 'maps'] as ChatMode[]).map(mode => (
                            <button key={mode} onClick={() => setChatMode(mode)} disabled={isLoading}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-green-500 ${
                                    chatMode === mode ? 'bg-white text-brand-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                                } disabled:opacity-50`}
                                title={t('chat.mode.' + mode + '.title')}
                            >
                                {mode === 'maps' && <span className="inline-block mr-0.5">🗺️</span>}
                                {t('chat.mode.' + mode)}
                            </button>
                        ))}
                    </div>
                    {/* Location status badge */}
                    {chatMode === 'maps' && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${locationStatusColor}`}>
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {locationStatus === 'active' && (
                                <span>{userLocation?.latitude.toFixed(2)}, {userLocation?.longitude.toFixed(2)}</span>
                            )}
                            {locationStatus === 'manual' && (
                                <span>{userLocation?.latitude.toFixed(2)}, {userLocation?.longitude.toFixed(2)} ({t('chat.maps.manual')})</span>
                            )}
                            {locationStatus === 'requesting' && <span>{t('chat.maps.locating')}</span>}
                            {locationStatus === 'denied' && (
                                <button onClick={() => setShowManualLocation(true)} className="underline hover:no-underline">
                                    {t('chat.maps.setManually')}
                                </button>
                            )}
                            {locationStatus === 'idle' && <span>{t('chat.maps.locating')}</span>}
                        </div>
                    )}
                </div>

                {/* Manual location input */}
                {showManualLocation && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <input type="number" step="any" value={manualLat} onChange={e => setManualLat(e.target.value)}
                            placeholder="Latitude (e.g. -1.2921)"
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                        <input type="number" step="any" value={manualLng} onChange={e => setManualLng(e.target.value)}
                            placeholder="Longitude (e.g. 36.8219)"
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                        <button onClick={handleSetManualLocation}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 transition-colors">
                            {t('chat.maps.confirm')}
                        </button>
                        <button onClick={() => setShowManualLocation(false)}
                            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                            {t('passport.cancel')}
                        </button>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={chatMode === 'maps' && !userLocation ? t('chat.maps.promptLocation') : t('chat.placeholder')} className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green-500 disabled:bg-slate-100" disabled={isLoading || recordingStatus !== 'idle'} maxLength={2000} aria-label="Chat message" />
                    <button onClick={handleToggleRecording} disabled={isLoading} aria-label={recordingStatus === 'recording' ? t('chat.recording.stop') : t('chat.recording.start')}
                        className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed ${recordingStatus === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 text-white hover:bg-slate-700'}`}>
                        <MicIcon className="h-6 w-6" />
                    </button>
                    <button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()} aria-label="Send message"
                        className="p-2 rounded-full bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
                <p className={`text-xs text-center ${messages.length - 1 >= MAX_MESSAGES - 10 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {messages.length - 1} {t('chat.messages')} · {MAX_MESSAGES} {t('chat.max')}
                  {messages.length - 1 >= MAX_MESSAGES - 10 && messages.length - 1 < MAX_MESSAGES && (
                    <span> · {MAX_MESSAGES - (messages.length - 1)} {t('chat.messages.remaining')}</span>
                  )}
                </p>
            </div>
        </Card>
    );
};
