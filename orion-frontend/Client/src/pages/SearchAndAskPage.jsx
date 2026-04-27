
import { useState, useEffect, useRef } from 'react';
import { FiSend, FiCpu, FiFileText, FiExternalLink, FiLogOut, FiUpload } from 'react-icons/fi';
import { logoutUser } from '../services/UserService';
import { sendSearchQuery } from '../services/SearchAndAskPage';
import { useNavigate } from 'react-router-dom';

export default function SearchAndAskPage() {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [messages, setMessages] = useState([
        { id: 1, text: "System initialized. I have analyzed your document. What would you like to know?", sender: 'ORION' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const [messagesLeft, setMessagesLeft] = useState(() => {
        const saved = localStorage.getItem('orion_messages_left');
        return saved !== null ? parseInt(saved, 10) : 10;
    });

    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
        const lastResetTime = localStorage.getItem('orion_last_reset_time');
        const now = Date.now();

        if (!lastResetTime || (now - parseInt(lastResetTime, 10)) >= TEN_HOURS_MS) {
            localStorage.setItem('orion_messages_left', 10);
            localStorage.setItem('orion_last_reset_time', now);
            setMessagesLeft(10);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('orion_messages_left', messagesLeft);
    }, [messagesLeft]);

    useEffect(() => {
        const savedFile = localStorage.getItem('orion_pdf_meta');
        if (savedFile) {
            const parsed = JSON.parse(savedFile);
            setPdfUrl(parsed.url);
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || messagesLeft <= 0 || isThinking) return;

        const currentQuery = input;
        const newMsg = { id: Date.now(), text: currentQuery, sender: 'user' };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const { status, result } = await sendSearchQuery(currentQuery);

            if (status === 'limit_reached') {
                setMessagesLeft(0);
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "Daily limit reached. You have exhausted your messages for this 12 hours.",
                    sender: 'bot'
                }]);
            } else if (status === 'unauthorized') {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "Your session was expired. Please log in again!",
                    sender: 'bot'
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: result,
                    sender: 'bot'
                }]);
                setMessagesLeft(prev => prev - 1);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I encountered an error connecting to the neural link. Please check your connection.",
                sender: 'bot'
            }]);
        } finally {
            setIsThinking(false);
        }

    };

    const handleOpenPDF = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        } else {
            alert("No PDF document is currently loaded.");
        }
    };

    return (
        <>
            <div className="flex flex-col h-screen text-white font-sans relative overflow-hidden">
                <div className="flex flex-col h-full w-full max-w-3xl mx-auto border-x border-white/10 bg-black/40 relative z-10 shadow-2xl">
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 bg-black/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">

                        {/* Left Side: Logo & Status */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center justify-center p-2.5 bg-lime-500/10 rounded-xl border border-lime-500/20 text-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.1)]">
                                <button onClick={()=>(navigate('/'))}><FiCpu size={20} className="sm:w-5.5 sm:h-5.5" /></button>
                            </div>

                            <div className="flex flex-col justify-center">
                                <h2 className="font-bold text-xs sm:text-sm tracking-widest text-white">
                                    ORION <span className="font-light text-lime-400/90">INTELLIGENCE</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-lime-500"></span>
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                                        System Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Actions Group */}
                        <div className="flex items-center gap-2 sm:gap-3">

                            {/* Primary Action: Upload */}
                            <button
                                onClick={() => navigate('/upload')}
                                className="group flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-lime-400/90 bg-lime-500/10 hover:bg-lime-500/20 rounded-xl border border-lime-500/20 hover:border-lime-500/40 transition-all duration-300 ease-out hover:shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                            >
                                {/* Added an icon here for visual consistency with Logout. Remove if you prefer text-only. */}
                                <FiUpload size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                                <span className="hidden sm:inline transition-colors duration-300 group-hover:text-lime-300">
                                    Upload
                                </span>
                            </button>

                            {/* Secondary Action: Logout */}
                            <button
                                onClick={() => {
                                    logoutUser();
                                    navigate('/');
                                }}
                                className="group flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 ease-out"
                            >
                                <FiLogOut size={16} className="transition-colors duration-300 group-hover:text-red-400" />
                                <span className="hidden sm:inline transition-colors duration-300 group-hover:text-white">
                                    Logout
                                </span>
                            </button>

                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[60%] sm:max-w-[50%] w-full p-4 rounded-2xl text-sm leading-relaxed shadow-lg whitespace-pre-wrap
                                    ${msg.sender === 'user'
                                            ? 'bg-linear-to-br from-lime-600 to-lime-800 text-white font-medium rounded-tr-sm'
                                            : 'bg-white/10 border border-white/10 text-gray-100 rounded-tl-sm backdrop-blur-md'
                                        }
                                        `}
                                    style={{
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere'
                                    }}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Thinking Indicator */}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-[#030303] pb-6 sm:pb-4">
                        <form
                            onSubmit={handleSend}
                            className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-3xl p-2 focus-within:border-lime-500/50 focus-within:bg-white/10 transition-all duration-300"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={messagesLeft > 0 ? "Ask about the document..." : "Daily limit reached"}
                                disabled={messagesLeft <= 0}
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-3 py-2 text-sm w-full disabled:cursor-not-allowed"
                            />

                            {/* Message Counter */}
                            <div className="flex flex-col items-center px-2 border-l border-white/10">
                                <span className={`text-[10px] font-mono font-bold ${messagesLeft < 5 ? 'text-red-400' : 'text-lime-500'}`}>
                                    {messagesLeft}/10
                                </span>
                                <span className="text-[8px] text-gray-500 uppercase tracking-tighter">Quota</span>
                            </div>

                            <button
                                type="submit"
                                disabled={!input.trim() || isThinking || messagesLeft <= 0}
                                className="p-4 bg-lime-500 text-black rounded-2xl hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                <FiSend size={18} />
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-gray-600 mt-2">
                            Orion can make mistakes. Verify important information.
                        </p>
                    </div>
                </div>

                {pdfUrl && (
                    <button
                        onClick={handleOpenPDF}
                        className="fixed bottom-40 right-2 sm:right-[calc(48.5%-672px/2+0px)] bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-lg text-lime-400 p-4 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 group z-50 hover:scale-105"
                        title="Open PDF Document"
                    >
                        <FiFileText size={24} />
                        <span className="hidden sm:inline-block max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-medium text-sm text-white pl-0 group-hover:pl-2">
                            View Document
                        </span>
                        <FiExternalLink size={14} className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1" />
                    </button>
                )}
            </div>
        </>
    );
}