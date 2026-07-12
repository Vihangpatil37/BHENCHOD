import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  ThumbsUp,
  Plus,
  Sparkles,
  User,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: {
    rating: number;
    explanation?: string;
  };
}

interface Conversation {
  _id: string;
  user_id: string;
  summary?: string;
  updated_at: string;
  messages_count: number;
}

const SUGGESTED_QUESTIONS = [
  'How do I become a Software Engineer according to my recommendations?',
  'What is the growth rate of a Product Manager compared to a UX Designer?',
  'Can you suggest the best certifications to build a career in AI and Data Science?',
  'Does my onboarding profile show a good fit for research roles?'
];

export const CounselingChat: React.FC = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Loading states
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Feedback Modal state
  const [feedbackMsgIndex, setFeedbackMsgIndex] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setLoadingList(true);
    try {
      const res: any = await client.get('/counselor/conversations');
      setConversations(res);
      if (res.length > 0) {
        setActiveConvId(res[0]._id);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoadingList(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res: any = await client.get(`/counselor/conversations/${convId}`);
      // The response is a Conversation object, which contains messages array
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleStartNewChat = async () => {
    setActiveConvId('');
    setMessages([]);
    setInputText('');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText('');
    setSending(true);

    // Optimistic local add
    const tempUserMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const payload: any = { message: text };
      if (activeConvId) {
        payload.conversation_id = activeConvId;
      }
      
      const res: any = await client.post('/counselor/chat', payload);
      
      if (!activeConvId && res.conversation_id) {
        // First message in a new thread
        setActiveConvId(res.conversation_id);
        fetchConversations(); // refresh sidebar list
      } else {
        // Thread already exists, fetch updated list to show counts/summary
        const resConv: any = await client.get(`/counselor/conversations/${activeConvId}`);
        setMessages(resConv.messages || []);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeConvId) return;
    setRegenerating(true);
    try {
      await client.post('/counselor/regenerate', { conversation_id: activeConvId });
      // Reload messages
      await fetchMessages(activeConvId);
    } catch (err: any) {
      alert(err.message || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  const handleOpenFeedback = (msgIdx: number) => {
    setFeedbackMsgIndex(msgIdx);
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  const handleSubmitFeedback = async () => {
    if (feedbackMsgIndex === null || !activeConvId) return;
    setSubmittingFeedback(true);
    try {
      await client.post('/counselor/feedback', {
        conversation_id: activeConvId,
        message_index: feedbackMsgIndex,
        rating: feedbackRating,
        explanation: feedbackComment
      });

      // Reload messages to update local UI feedback indicators
      await fetchMessages(activeConvId);
      setFeedbackMsgIndex(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex-grow flex flex-col md:flex-row min-w-0">
        
        {/* Left Column: Conversations List */}
        <section className="w-full md:w-80 border-r border-white/5 p-6 flex flex-col justify-between shrink-0 space-y-6">
          <div className="space-y-4 flex-grow flex flex-col overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Conversations</h2>
              <button
                onClick={handleStartNewChat}
                className="p-1.5 rounded-xl bg-accent hover:brightness-110 text-white shadow-md shadow-accent/20 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {loadingList ? (
              <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-text-muted/40 animate-spin" />
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {conversations.length === 0 ? (
                  <p className="text-xs text-text-muted/60 text-center py-8">No previous chats. Start a new thread!</p>
                ) : (
                  conversations.map((c) => {
                    const isActive = c._id === activeConvId;
                    return (
                      <button
                        key={c._id}
                        onClick={() => setActiveConvId(c._id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all ${
                          isActive
                            ? 'bg-accent/10 border-accent text-accent/80'
                            : 'bg-white/[0.02] border-white/5 text-text-muted hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-text/80 line-clamp-1">
                            {c.summary || 'AI Career Counseling'}
                          </p>
                          <div className="flex justify-between items-center text-[10px] text-text-muted/60">
                            <span>{c.messages_count} messages</span>
                            <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Chat Box */}
        <section className="flex-grow flex flex-col h-[calc(100vh-120px)] md:h-screen relative overflow-hidden bg-bg p-6 md:p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Active Thread Header */}
          <div className="shrink-0 flex justify-between items-center border-b border-white/5 pb-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-accent to-accent-2 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Career Counselor</h3>
                <span className="text-[10px] text-text-muted/60">Trained on your top recommendation matches</span>
              </div>
            </div>

            {activeConvId && messages.length > 0 && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 text-text-muted hover:text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              >
                {regenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>Regenerate Last</span>
              </button>
            )}
          </div>

          {/* Messages Flow */}
          <div className="flex-grow overflow-y-auto py-6 space-y-4 pr-2 relative z-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Ask your AI Counselor anything</h3>
                <p className="text-xs text-text-muted/60 leading-relaxed">
                  Discuss colleges, certifications, exam preparation, or ask why a specific career matches your traits list.
                </p>
                <div className="w-full space-y-2 pt-4">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="w-full p-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/20 rounded-xl text-left text-[11px] text-text-muted hover:text-accent/80 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start space-x-2.5 max-w-[85%]">
                      {!isUser && (
                        <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 text-accent shrink-0 mt-1">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-accent text-white font-medium rounded-tr-none'
                            : 'bg-white/[0.05] border border-white/5 text-text/80 rounded-tl-none font-medium'
                        }`}>
                          {m.content}
                        </div>

                        {!isUser && (
                          <div className="flex items-center space-x-3 text-[10px] text-text-muted/60 px-1.5">
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            
                            {/* Feedback Rating view */}
                            {m.feedback ? (
                              <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded">
                                Rated {m.feedback.rating}★
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenFeedback(idx)}
                                className="flex items-center space-x-1 hover:text-white transition-colors"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                <span>Feedback</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-white shrink-0 mt-1">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2.5">
                  <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 text-accent shrink-0 mt-1 animate-pulse">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-4 bg-white/[0.05] border border-white/5 rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                    <div className="h-1.5 w-1.5 bg-text-muted/30 rounded-full animate-bounce" />
                    <div className="h-1.5 w-1.5 bg-text-muted/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 bg-text-muted/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Action Input bar */}
          {messages.length > 0 && (
            <div className="shrink-0 flex gap-2 overflow-x-auto pb-3 border-b border-white/5 relative z-10 select-none">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.03]/80 border border-white/5 rounded-lg text-[10px] text-text-muted hover:text-accent transition-all font-semibold"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="shrink-0 pt-4 relative z-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Type your question about colleges, roadmaps, or matching scores..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sending}
                className="w-full bg-white/[0.05] border border-white/10/80 rounded-2xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-accent placeholder-text-muted/60"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={sending}
                className="absolute right-3 top-2.5 p-1.5 bg-accent hover:brightness-110 text-white rounded-xl shadow-md shadow-accent/20 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

      {/* Feedback Modal Overlay */}
      {feedbackMsgIndex !== null && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-sm bg-white/[0.03] border border-white/[0.06] p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white">Share your feedback</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-text-muted font-bold block">Rating (1 to 5 Stars)</label>
              <div className="flex space-x-2 justify-center py-2 bg-bg rounded-xl border border-white/[0.06]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Sparkles className={`h-6 w-6 ${star <= feedbackRating ? 'fill-accent text-accent' : 'text-text-muted/30'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted font-bold block">Comments (Optional)</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="e.g. This is very helpful, details matched my expectations."
                rows={3}
                className="w-full bg-bg border border-white/[0.06] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent placeholder-text-muted/40"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setFeedbackMsgIndex(null)}
                className="px-4 py-2.5 bg-bg border border-white/[0.06] text-text-muted hover:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="px-5 py-2.5 bg-accent hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-accent/20 disabled:opacity-50"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};
