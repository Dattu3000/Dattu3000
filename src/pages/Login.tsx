import React, { useState, useRef, useEffect } from 'react';
import { getAIResponse } from '../utils/aiUtils';
import { Bot, LogIn, Mail, Lock, Send, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hi there! I am your AI assistant powered by Gemma. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login logic
    if (email && password) {
      navigate('/');
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isTyping) return;

    const userPrompt = aiQuery.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userPrompt }]);
    setAiQuery('');
    setIsTyping(true);

    // Add empty AI response to be filled
    setChatHistory(prev => [...prev, { role: 'ai', content: '' }]);

    await getAIResponse(userPrompt, (chunk) => {
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        newHistory[lastIndex].content += chunk;
        return newHistory;
      });
    });
    
    setIsTyping(false);
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div className="header" style={{ marginBottom: '2rem', borderRadius: 'var(--border-radius)' }}>
        <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={28} color="var(--accent-color)" />
          Authentication
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>
        
        {/* Login Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <LogIn size={24} color="var(--accent-color)" />
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Sign in to access your cricket dashboards, historical matches, and advanced analytics.
          </p>
          
          <form onSubmit={handleLogin} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
              <LogIn size={20} />
              Sign In
            </button>
          </form>
        </div>

        {/* AI Assistant */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: 'var(--glossy-border)', background: 'rgba(13, 27, 42, 0.4)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.2rem' }}>
              <Bot size={24} color="var(--accent-color)" />
              AI Assistant
            </h2>
          </div>
          
          <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px' }}>
            {chatHistory.map((msg, index) => (
              <div key={index} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'rgba(247, 127, 0, 0.2)' : 'rgba(65, 90, 119, 0.4)',
                border: msg.role === 'user' ? '1px solid rgba(247, 127, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                borderBottomLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                maxWidth: '85%',
                lineHeight: '1.4'
              }}>
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', animation: 'pulse 1s infinite' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', animation: 'pulse 1s infinite 0.2s' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', animation: 'pulse 1s infinite 0.4s' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAiSubmit} style={{ padding: '1rem', borderTop: 'var(--glossy-border)', display: 'flex', gap: '0.5rem', background: 'rgba(13, 27, 42, 0.4)' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '0.75rem' }}
              placeholder="Ask me anything..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="btn" style={{ width: 'auto', padding: '0.75rem', borderRadius: '12px' }} disabled={isTyping}>
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Adjust layout on small screens */
        @media (max-width: 768px) {
          .container {
            max-width: 100% !important;
          }
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
