'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Send, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myEmpId, setMyEmpId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';

  useEffect(() => {
    Promise.all([api.messages.list(token), api.profile.get(token)]).then(([convs, prof]: any) => {
      setConversations(convs.data || []);
      setMyEmpId(prof.data?.id || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.messages.get(token, selected.id).then((data: any) => {
      setMessages(data.data || []);
    }).catch(console.error);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    setSending(true);
    try {
      const data = await api.messages.send(token, selected.id, input.trim()) as any;
      setMessages(prev => [...prev, data.data]);
      setInput('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  function getOther(conv: any) {
    return conv.participant_a?.id === myEmpId ? conv.participant_b : conv.participant_a;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-sm">
            Accept a connection request to start chatting with matched employees.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Conversations</CardTitle></CardHeader>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {conversations.map(conv => {
                const other = getOther(conv);
                const lastMsg = conv.messages?.[conv.messages.length - 1];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${
                      selected?.id === conv.id ? 'bg-accent/40' : ''
                    }`}
                  >
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarFallback className="gradient-saffron text-white text-xs">
                        {other?.full_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{other?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMsg?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="gradient-saffron text-white text-xs">
                        {getOther(selected)?.full_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm">{getOther(selected)?.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {getOther(selected)?.designation?.name}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No messages yet. Say hello! 👋
                    </p>
                  )}
                  {messages.map((msg: any) => {
                    const isMe = msg.sender_id === myEmpId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'gradient-saffron text-white rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          {msg.content}
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      id="msg-input"
                      placeholder="Type a message..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      autoComplete="off"
                    />
                    <Button type="submit" disabled={sending || !input.trim()}
                      className="gradient-saffron text-white border-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
