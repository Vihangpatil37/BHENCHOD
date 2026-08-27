import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  MessageSquare,
  Send,
  RefreshCw,
  ThumbsUp,
  Plus,
  Sparkles,
  User,
  Bot,
  X,
  Paperclip,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMarkdown } from '../components/ChatMarkdown';
import { fadeUp } from '../lib/motion';
import { formatDateOnly, formatTimeOnly } from '../lib/formatDate';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

interface Message {
  role: 'user' | 'assistant' | 'student' | 'counselor';
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
  last_message_at?: string;
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
      const rawMsgs = Array.isArray(res) ? res : res.messages || [];
      const mapped = rawMsgs.map((m: any) => ({
        ...m,
        timestamp: m.created_at || m.timestamp || new Date().toISOString(),
      }));
      setMessages(mapped);
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
        setActiveConvId(res.conversation_id);
        fetchConversations();
      } else {
        const resConv: any = await client.get(`/counselor/conversations/${activeConvId}`);
        const rawMsgs = Array.isArray(resConv) ? resConv : resConv.messages || [];
        const mapped = rawMsgs.map((m: any) => ({
          ...m,
          timestamp: m.created_at || m.timestamp || new Date().toISOString(),
        }));
        setMessages(mapped);
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

      await fetchMessages(activeConvId);
      setFeedbackMsgIndex(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex-grow flex flex-col md:flex-row min-w-0 h-full p-4 md:p-8">
      {/* Left Column: Conversations List */}
      <section className="w-full md:w-64 border-b md:border-b-0 md:border-r border-solid border-white/[0.08] p-4 flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-4 flex-grow flex flex-col overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Conversations</h2>
            <button
              onClick={handleStartNewChat}
              className="p-1.5 rounded-xl bg-brand hover:bg-brand/90 text-white shadow-md shadow-brand/10 transition-all cursor-pointer focus:outline-none"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {loadingList ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 max-h-[45dvh] md:max-h-none">
              {conversations.length === 0 ? (
                <p className="text-xs text-text-secondary/60 text-center py-8">No previous chats. Start a new thread!</p>
              ) : (
                conversations.map((c) => {
                  const isActive = c._id === activeConvId;
                  return (
                    <button
                      key={c._id}
                      onClick={() => setActiveConvId(c._id)}
                      className={`w-full p-4 rounded-[18px] border border-solid text-left transition-all cursor-pointer focus:outline-none ${
                        isActive
                          ? 'bg-brand/10 border-brand text-brand shadow-[0_4px_12px_rgba(91,124,250,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-text-primary line-clamp-1">
                          {c.summary || 'AI Career Counseling'}
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-text-secondary">
                          <span>{c.messages_count} messages</span>
                          <span>{formatDateOnly(c.last_message_at || c.updated_at)}</span>
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
      <section className="flex-grow flex flex-col h-[calc(100dvh-128px)] md:h-full relative overflow-hidden p-4 md:p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Centered Chat Layout */}
        <div className="flex-grow flex flex-col w-full max-w-5xl mx-auto overflow-hidden relative z-10">
          
          {/* Active Thread Header */}
          <div className="shrink-0 flex justify-between items-center border-b border-solid border-white/[0.08] pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand to-[#70E1FF] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">AI Career Counselor</h3>
                <span className="text-[10px] text-text-secondary">Trained on your top recommendation matches</span>
              </div>
            </div>

            {activeConvId && messages.length > 0 && (
              <Button
                onClick={handleRegenerate}
                disabled={regenerating}
                loading={regenerating}
                variant="secondary"
                size="sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Regenerate Last</span>
              </Button>
            )}
          </div>

          {/* Messages Flow */}
          <div className="flex-grow overflow-y-auto py-6 space-y-6 pr-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
                <div className="h-12 w-12 rounded-[18px] bg-brand/10 flex items-center justify-center text-brand border border-solid border-brand/20">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Ask your AI Counselor anything</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Discuss colleges, certifications, exam preparation, or ask why a specific career matches your traits list.
                </p>
                <div className="w-full space-y-2 pt-4">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-solid border-white/[0.06] hover:border-brand/35 rounded-[18px] text-left text-[11px] text-text-secondary hover:text-brand transition-all cursor-pointer focus:outline-none"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
              const isUser = m.role === 'user' || m.role === 'student';
                return (
                  <div key={idx} className="flex items-start space-x-4 py-4 border-b border-solid border-white/[0.03] last:border-b-0">
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-solid ${
                      isUser 
                        ? 'bg-white/[0.05] border-white/[0.1] text-text-primary' 
                        : 'bg-brand/10 border-brand/20 text-brand'
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0 space-y-1">
                      <div className="flex items-center space-x-2 text-[10px] text-text-secondary">
                        <span className="font-bold text-text-primary">
                          {isUser ? 'You' : 'AI Counselor'}
                        </span>
                        <span>•</span>
                        <span>{formatTimeOnly(m.timestamp)}</span>
                        
                        {!isUser && m.feedback && (
                          <span className="text-brand font-bold bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded text-[8px]">
                            Rated {m.feedback.rating}★
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-text-primary leading-relaxed font-medium mt-1">
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <ChatMarkdown content={m.content} />
                        )}
                      </div>

                      {!isUser && !m.feedback && (
                        <div className="flex items-center space-x-3 text-[10px] text-text-secondary pt-2">
                          <button
                            onClick={() => handleOpenFeedback(idx)}
                            className="flex items-center space-x-1 hover:text-brand transition-colors cursor-pointer focus:outline-none"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>Helpful?</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-start space-x-4 py-4">
                <div className="h-8 w-8 rounded-full bg-brand/10 border border-solid border-brand/20 text-brand flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-grow min-w-0 space-y-1">
                  <div className="text-[10px] text-text-secondary font-bold">AI Counselor is typing...</div>
                  <div className="flex items-center space-x-1 py-2">
                    <div className="h-1.5 w-1.5 bg-brand rounded-full animate-bounce" />
                    <div className="h-1.5 w-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length > 0 && (
            <div className="shrink-0 flex gap-2 overflow-x-auto pb-3 border-b border-solid border-white/[0.08] select-none">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-solid border-white/[0.06] rounded-full text-[10px] text-text-secondary hover:text-brand transition-all font-semibold cursor-pointer focus:outline-none"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Claude-style Input Block with Textarea */}
          <div className="shrink-0 pt-4">
            <div className="flex flex-col bg-white/[0.02] border border-solid border-white/[0.08] rounded-[20px] focus-within:border-brand/50 transition-all duration-180 p-3">
              <textarea
                placeholder="Type your question about colleges, roadmaps, or matching scores..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending}
                rows={2}
                className="w-full bg-transparent border-0 p-1 text-xs text-text-primary focus:outline-none placeholder-white/30 resize-none h-16"
              />
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.04]">
                {/* Bottom Left controls (paperclip) */}
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none"
                  title="Attach file (Representational)"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                
                {/* Bottom Right Send button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !inputText.trim()}
                  className={`p-2 rounded-xl transition-all cursor-pointer focus:outline-none flex items-center justify-center ${
                    inputText.trim() 
                      ? 'bg-brand hover:bg-brand/90 text-white' 
                      : 'bg-white/[0.03] text-text-muted cursor-not-allowed'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Modal Overlay (GlassCard Elevation 4) */}
      <AnimatePresence>
        {feedbackMsgIndex !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px] flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm outline-none"
            >
              <GlassCard elevation={4} className="p-6 border border-solid border-white/[0.08] rounded-[28px] space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-text-primary">Share your feedback</h3>
                  <button
                    onClick={() => setFeedbackMsgIndex(null)}
                    className="p-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-text-secondary hover:text-text-primary cursor-pointer focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-text-secondary font-bold block">Rating (1 to 5 Stars)</label>
                  <div className="flex space-x-2 justify-center py-2.5 bg-white/[0.02] rounded-[18px] border border-solid border-white/[0.06]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      >
                        <Sparkles className={`h-6 w-6 ${star <= feedbackRating ? 'fill-brand text-brand' : 'text-text-disabled'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-text-secondary font-bold block">Comments (Optional)</label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="e.g. This is very helpful, details matched my expectations."
                    rows={3}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] p-3 text-xs text-text-primary focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 placeholder-white/30 transition-all"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    onClick={() => setFeedbackMsgIndex(null)}
                    variant="secondary"
                    className="text-xs px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitFeedback}
                    loading={submittingFeedback}
                    className="text-xs px-5"
                  >
                    Submit Feedback
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
