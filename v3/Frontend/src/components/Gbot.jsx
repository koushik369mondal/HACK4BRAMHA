import React, { useState, useEffect, useRef } from 'react';

const Gbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('initial'); // 'initial', 'location', 'description', 'complete'
    const [complaint, setComplaint] = useState({ sector: '', location: '', description: '' });
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to the latest message automatically
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial greeting message on opening chat for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    text: 'Hello! Please select the sector for your complaint.',
                    sender: 'bot',
                    options: ['Municipality', 'Corruption', 'Crime']
                }
            ]);
        }
    }, [isOpen]);

    // Handle Sector Selection
    const handleOptionSelect = (option) => {
        setMessages(prev => [...prev, { text: option, sender: 'user' }]);
        setComplaint(prev => ({ ...prev, sector: option }));
        setStep('location');

        setTimeout(() => {
            setMessages(prev => [...prev, { text: 'Thank you. Fetching your location...', sender: 'bot' }]);
            fetchLocation();
        }, 1000);
    };

    // Fetch Geolocation
    const fetchLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationString = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                setComplaint(prev => ({ ...prev, location: locationString }));

                setTimeout(() => {
                    setMessages(prev => [...prev, { text: 'Location captured! Now please describe your complaint.', sender: 'bot' }]);
                    setStep('description');
                }, 1500);
            },
            (error) => {
                console.error("Geolocation Error:", error);
                setComplaint(prev => ({ ...prev, location: 'Permission Denied' }));

                setTimeout(() => {
                    setMessages(prev => [...prev, { text: 'Location permission denied. Please describe your complaint and mention the location manually.', sender: 'bot' }]);
                    setStep('description');
                }, 1500);
            }
        );
    };

    // Handle Description Submission
    const handleDescriptionSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;

        const description = inputValue.trim();
        setMessages(prev => [...prev, { text: description, sender: 'user' }]);
        const finalComplaint = { ...complaint, description };
        setComplaint(finalComplaint);
        setInputValue('');
        setStep('complete');

        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: 'Thank you! Your complaint has been recorded. Downloading your complaint file...',
                sender: 'bot'
            }]);
            downloadComplaint(finalComplaint);
        }, 1500);
    };

    // Create and download complaint as .txt
    const downloadComplaint = (data) => {
        const content = `Complaint Details
-----------------

Sector: ${data.sector}
Location: ${data.location}
Description: ${data.description}
Timestamp: ${new Date().toLocaleString()}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaint_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* Chatbot Window */}
            <div className={`fixed bottom-24 right-6 w-[370px] h-[550px] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transition-transform duration-400 origin-bottom-right z-50 
        ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'}`}>

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white p-5 font-semibold rounded-t-2xl text-lg shadow-sm">
                    Complaint Assistant
                </div>

                {/* Messages Container */}
                <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-[20px] max-w-10/12 leading-relaxed text-sm 
                animate-fade-in 
                ${msg.sender === 'bot' ? 'bg-gray-200 text-gray-900 self-start rounded-bl-[5px]' : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white self-end rounded-br-[5px]'}`}
                        >
                            {msg.text}
                            {msg.options && (
                                <div className="flex flex-wrap gap-2 mt-3 animate-fade-in-delay">
                                    {msg.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleOptionSelect(opt)}
                                            className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-full cursor-pointer font-medium text-sm hover:bg-blue-600 hover:text-white transform transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {step === 'description' && (
                    <form className="flex px-5 py-4 border-t border-gray-300 bg-white" onSubmit={handleDescriptionSubmit}>
                        <input
                            type="text"
                            className="flex-grow border border-gray-300 rounded-full px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-sans transition duration-300"
                            placeholder="Type your complaint..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-gradient-to-br from-blue-600 to-purple-700 ml-3 rounded-full w-11 h-11 flex justify-center items-center text-white transition-transform duration-300 hover:scale-110 hover:rotate-12 shadow-md"
                            aria-label="Send"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                )}
            </div>

            {/* Chatbot Toggle Icon */}
            <div
                className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex justify-center items-center cursor-pointer shadow-lg transition-transform duration-400 z-50
          ${isOpen ? 'scale-125' : ''
                    } hover:scale-110`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </div>
        </>
    );
};

export default Gbot;
