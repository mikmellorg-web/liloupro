import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Trash2, MessageSquare, Shield, Smile, Clock, Users, ArrowDown, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: any; // Timestamp or local fallback Date
  isSystem?: boolean;
}

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-surface border border-border rounded-3xl p-4 md:p-6 shadow-sm transition-all relative overflow-hidden ${className || ''}`}>
    {children}
  </div>
);

export function ChatView() {
  const { user, memberData, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [typingLength, setTypingLength] = useState(0);
  const [onlineMembers, setOnlineMembers] = useState<{ id: string; name: string; lastActive: Date }[]>([]);

  // Presence logic: update own presence
  useEffect(() => {
    if (!user) return;

    const myPresenceRef = doc(db, 'presence', user.uid);
    const name = memberData?.name || user.displayName || 'Membro';

    const updatePresence = async () => {
      try {
        await setDoc(myPresenceRef, {
          name,
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Gracefully skipped presence update heartbeat:', e instanceof Error ? e.message : e);
      }
    };

    // Update immediately on mount
    updatePresence();

    // Heartbeat update every 15 seconds
    const interval = setInterval(updatePresence, 15000);

    // Clean up on unmount: delete presence document so user displays offline instantly
    return () => {
      clearInterval(interval);
      // Only delete if user is still active in state
      if (user?.uid) {
        deleteDoc(myPresenceRef).catch(e => {
          console.warn('Gracefully skipped presence cleanup on unmount:', e instanceof Error ? e.message : e);
        });
      }
    };
  }, [user, memberData]);

  // Presence logic: listen to all online users
  useEffect(() => {
    if (!user) return;

    const presenceCollection = collection(db, 'presence');
    
    // Subscribe to snapshot of all online states
    const unsubscribe = onSnapshot(presenceCollection, (snapshot) => {
      const list: { id: string; name: string; lastActive: Date }[] = [];
      const now = new Date().getTime();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let lastActiveDate = new Date();
        
        if (data.lastActive instanceof Timestamp) {
          lastActiveDate = data.lastActive.toDate();
        } else if (data.lastActive) {
          lastActiveDate = new Date(data.lastActive);
        }

        // Filter out records that are older than 45 seconds (e.g., if window was closed abruptly)
        const timeDiffMs = now - lastActiveDate.getTime();
        if (timeDiffMs < 45000) {
          list.push({
            id: docSnap.id,
            name: data.name || 'Membro',
            lastActive: lastActiveDate
          });
        }
      });

      // Sort with current user first, then alphabetical
      const sorted = list.sort((a, b) => {
        if (a.id === user.uid) return -1;
        if (b.id === user.uid) return 1;
        return a.name.localeCompare(b.name);
      });

      setOnlineMembers(sorted);
    }, (error) => {
      console.warn('Presence subscription read error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const listRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Load messages in real-time
  useEffect(() => {
    if (!user) return;

    const chatCollection = collection(db, 'chat');
    // Query last 300 messages sorted by date descending to allow local filtering by church without complexity
    const q = query(chatCollection, orderBy('createdAt', 'desc'), limit(300));
    const userChurchId = memberData?.churchId || 'semente';

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const msgChurchId = data.churchId || 'semente';
        
        // Isolate by churchId
        if (msgChurchId !== userChurchId) {
          return;
        }

        let originalDate: Date | null = null;
        if (data.createdAt instanceof Timestamp) {
          originalDate = data.createdAt.toDate();
        } else if (data.createdAt) {
          originalDate = new Date(data.createdAt);
        }

        msgs.push({
          id: docSnap.id,
          text: data.text || '',
          authorId: data.authorId || '',
          authorName: data.authorName || 'Desconhecido',
          authorRole: data.authorRole || 'Voluntário',
          createdAt: originalDate || new Date(), // Fallback for optimistic or null values
        });
      });

      // Reverse in-memory to show chronologically ascending list (oldest to newest)
      const sortedMsgs = msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setMessages(sortedMsgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat');
    });

    return () => unsubscribe();
  }, [user, memberData]);

  // Handle scrolling and scroll buttons
  const isAtBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    const threshold = 150; // pixels from bottom
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  const handleScroll = () => {
    const atBottom = isAtBottom();
    setAutoScroll(atBottom);
    setShowScrollBottomBtn(!atBottom && messages.length > 3);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    endOfMessagesRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom('smooth');
    }
  }, [messages, autoScroll]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessageText.trim() || isSending) return;

    setIsSending(true);
    const content = newMessageText.substring(0, 1000).trim();
    
    // Determine the role string
    let roleStr = 'Membro';
    if (isAdmin) {
      roleStr = 'Administrador';
    } else if (memberData?.roles && memberData.roles.length > 0) {
      roleStr = memberData.roles.join(', ');
    }

    const userChurchId = memberData?.churchId || 'semente';

    try {
      await addDoc(collection(db, 'chat'), {
        text: content,
        authorId: user.uid,
        authorName: memberData?.name || user.displayName || 'Membro',
        authorRole: roleStr,
        createdAt: serverTimestamp(),
        churchId: userChurchId
      });
      setNewMessageText('');
      setTypingLength(0);
      setAutoScroll(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chat');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta mensagem?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'chat', messageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chat/${messageId}`);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessageText(val);
    setTypingLength(val.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format date grouping helper
  const formatDateHeading = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
      });
    }
  };

  // Get Avatar visual initials and background colors
  const getAvatarStyle = (name: string, isMe: boolean) => {
    const char = name.charAt(0).toUpperCase();
    const colors = [
      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      'bg-violet-500/20 text-violet-400 border border-violet-500/30',
      'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    ];
    
    if (isMe) {
      return { char, colorClass: 'bg-brand text-white border border-brand/40 shadow-sm shadow-brand/20' };
    }
    
    // Simple hashing based on string code
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return { char, colorClass: colors[index] };
  };

  // Quick Emoji Click Handler
  const insertEmoji = (emoji: string) => {
    setNewMessageText(prev => (prev + emoji).substring(0, 1000));
    setTypingLength(prev => Math.min(prev + emoji.length, 1000));
  };

  return (
    <div className="space-y-6" id="team-chat-view">
      <div>
        <h2 className="text-xl font-bold text-text-main tracking-tight">Mural de Conversas</h2>
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-black mt-1">
          Espaço de comunicação oficial e real-time para a equipe de louvor e liturgia
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Chat window - spanning 3 columns */}
        <div className="xl:col-span-3 h-[600px] flex flex-col bg-surface border border-border rounded-3xl overflow-hidden relative shadow-lg">
          
          {/* Header */}
          <div className="p-4 md:px-6 md:py-4 bg-muted/30 border-b border-border/60 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 text-brand rounded-xl">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-text-main leading-tight">Canal Geral</h3>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider">
                  {messages.length} mensagens enviadas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {onlineMembers.length} {onlineMembers.length === 1 ? 'Membro' : 'Membros'} Online
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
                Sincronizado
              </div>
            </div>
          </div>

          {/* Messages Scroll Panel */}
          <div 
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 custom-scrollbar relative bg-black/5"
          >
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const isMe = msg.authorId === user?.uid;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                
                // Determine if we should render a date separator
                const showDateHeader = !prevMsg || 
                  prevMsg.createdAt.toDateString() !== msg.createdAt.toDateString();

                const { char, colorClass } = getAvatarStyle(msg.authorName, isMe);

                return (
                  <div key={msg.id} className="space-y-4">
                    {showDateHeader && (
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-surface border border-border text-text-muted">
                          {formatDateHeading(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold leading-none shrink-0 uppercase select-none ${colorClass}`}>
                        {char}
                      </div>

                      {/* Content Box */}
                      <div className={`max-w-[75%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {/* Meta info */}
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted flex-wrap">
                          <span className="font-bold text-text-main">{msg.authorName}</span>
                          <span className="opacity-40">•</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-black/15 dark:bg-white/5 border border-border px-1.5 py-0.2 rounded">
                            {msg.authorRole}
                          </span>
                          <span className="opacity-40">•</span>
                          <span className="font-mono text-[9px]">
                            {msg.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div className="group relative flex items-center">
                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-all inline-block ${
                            isMe 
                              ? 'bg-brand text-white text-left' 
                              : 'bg-surface border border-border text-text-main text-left'
                          }`}>
                            {msg.text}
                          </div>

                          {/* Action Hover utilities */}
                          {(isAdmin || isMe) && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Excluir mensagem"
                              className={`p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg border border-rose-500/20 absolute transition-all opacity-0 group-hover:opacity-100 shadow-lg ${
                                isMe ? 'right-full mr-2' : 'left-full ml-2'
                              }`}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="p-4 bg-muted/40 text-text-muted/30 rounded-full border-2 border-dashed border-border">
                  <MessageSquare size={36} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Equipe Conectada</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Nenhuma mensagem registrada. Envie a primeira mensagem!</p>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Float Bottom Button */}
          <AnimatePresence>
            {showScrollBottomBtn && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                onClick={() => scrollToBottom()}
                className="absolute bottom-20 right-6 p-2 rounded-full bg-brand text-white shadow-xl hover:brightness-110 active:scale-95 transition-all z-20"
              >
                <ArrowDown size={14} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Quick Emoji bar */}
          <div className="px-4 py-2 bg-muted/10 border-t border-border/50 flex gap-1.5 shrink-0 select-none overflow-x-auto custom-scrollbar">
            {['🙌', '🙏', '❤️', '🔥', '🎤', '🎸', '🎹', '👍', '👏', '🎵'].map(emoji => (
              <button 
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="p-1 px-2.5 rounded-lg text-sm bg-surface hover:bg-brand hover:text-white border border-border/60 transition-all active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input text bar */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-muted/20 border-t border-border shrink-0 flex items-center gap-3 relative"
          >
            <div className="flex-1 relative">
              <textarea
                value={newMessageText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Escreva sua mensagem aqui... (Enter envia, Shift+Enter pula linha)"
                maxLength={1000}
                className="w-full pl-4 pr-16 py-3.5 pr-20 bg-surface border border-border rounded-xl text-xs text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none min-h-[46px] max-h-[120px] custom-scrollbar leading-relaxed"
                style={{ height: 'auto' }}
              />
              <span className={`absolute right-4 bottom-3 text-[9px] font-mono ${
                typingLength >= 900 ? 'text-red-400 font-bold' : 'text-text-muted'
              }`}>
                {typingLength}/1000
              </span>
            </div>
            
            <button
              type="submit"
              disabled={!newMessageText.trim() || isSending}
              className="p-3.5 bg-brand text-white rounded-xl active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 shadow-md shadow-brand/10"
            >
              <Send size={16} />
            </button>
          </form>

        </div>

        {/* Sidebar info - 1 column */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Users size={16} className="text-brand" />
                <h4 className="text-[10px] font-black uppercase text-text-main tracking-widest leading-none">Minhas Credenciais</h4>
              </div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Como você aparece no mural de bate-papo</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-black uppercase select-none">
                {memberData?.name?.charAt(0) || user?.displayName?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-text-main truncate">{memberData?.name || user?.displayName || 'Membro'}</p>
                <p className="text-[9px] font-bold text-brand uppercase mt-0.5 max-w-full truncate">
                  {isAdmin ? 'Administrador' : memberData?.roles?.join(', ') || 'Voluntário'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-border/50 text-[10px] leading-relaxed text-text-muted">
              <div className="flex items-start gap-2.5">
                <Clock size={14} className="text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-text-main uppercase text-[9px] tracking-wider mb-0.5">Sincronização Ativa</p>
                  <p>Mensagens aparecem instantaneamente para todos os voluntários logados.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield size={14} className="text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-text-main uppercase text-[9px] tracking-wider mb-0.5 font-sans">Boas Práticas</p>
                  <p>Comporte-se de maneira respeitável. Mensagens podem ser deletadas por administradores do ministério.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h4 className="text-[10px] font-black uppercase text-text-main tracking-widest leading-none">
                  Membros Online ({onlineMembers.length})
                </h4>
              </div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">
                Quem está ativo no chat neste momento
              </p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {onlineMembers.length > 0 ? (
                onlineMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/10 dark:bg-white/5 border border-border/40 transition-all hover:bg-black/15 dark:hover:bg-white/10"
                  >
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-brand/20 text-brand border border-brand/35 text-[9px] font-bold flex items-center justify-center uppercase select-none shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-surface"></span>
                    </div>
                    <span className="text-[11px] font-black text-text-main truncate max-w-[130px]" title={member.name}>
                      {member.name}
                    </span>
                    {member.id === user?.uid && (
                      <span className="text-[7px] font-black text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.2 rounded uppercase ml-auto tracking-wider leading-none">
                        Você
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-text-muted italic text-center py-4">Nenhum voluntário online</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
