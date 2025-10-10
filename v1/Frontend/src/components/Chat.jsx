import React, { useState, useEffect, useRef } from 'react';

// Main App Component
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('initial'); // 'initial', 'location', 'description', 'complete'
  const [complaint, setComplaint] = useState({ sector: '', location: '', description: '' });
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Function to automatically scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting message when the chat opens for the first time
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
    // Add user's choice to messages
    setMessages(prev => [...prev, { text: option, sender: 'user' }]);
    // Update complaint state
    setComplaint(prev => ({ ...prev, sector: option }));
    // Move to next step
    setStep('location');

    // Add a bot message and fetch location
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
          setMessages(prev => [...prev, { text: `Location recorded: ${locationString}. Now, please describe your complaint.`, sender: 'bot' }]);
          setStep('description');
        }, 1500);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setComplaint(prev => ({ ...prev, location: 'Permission Denied' }));
        
        setTimeout(() => {
          setMessages(prev => [...prev, { text: 'Could not access location. Please describe your complaint.', sender: 'bot' }]);
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
    // Add user's description to messages
    setMessages(prev => [...prev, { text: description, sender: 'user' }]);
    // Update complaint state
    const finalComplaint = { ...complaint, description };
    setComplaint(finalComplaint);
    setInputValue('');
    setStep('complete');

    // Add final thank you message and trigger download
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: 'Thank you for your submission! Your complaint has been filed. We assure you that your problem will be looked into and resolved promptly.', 
        sender: 'bot' 
      }]);
      downloadComplaint(finalComplaint);
    }, 1500);
  };
  
  // Function to create and download the .txt file
  const downloadComplaint = (data) => {
    const content = `Complaint Details\n-----------------\n\nSector: ${data.sector}\nLocation: ${data.location}\nDescription: ${data.description}`;
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
      <div className={`chat-window ${isOpen ? 'open' : 'closed'}`}>
        <div className="chat-header">Complaint Assistant</div>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
              {msg.options && (
                <div className="options-container">
                  {msg.options.map(opt => (
                    <button key={opt} onClick={() => handleOptionSelect(opt)} className="option-button">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {step === 'description' && (
          <form className="chat-input-container" onSubmit={handleDescriptionSubmit}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type your complaint..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="send-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        )}
      </div>

      {/* Chatbot Toggle Icon */}
      <div className={`chatbot-icon ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {/* Chat Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        {/* Close Icon (X) */}
        <svg className="close-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </>
  );
}