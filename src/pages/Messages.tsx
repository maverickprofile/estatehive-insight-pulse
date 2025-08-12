import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

interface Conversation {
  id: string;
  name: string;
  phone: string;
  avatar?: string | null;
  last_message?: string | null;
  updated_at?: string | null;
  unread_count?: number | null;
}

interface Message {
  id: string | number;
  conversation_id: string;
  sender: string;
  body: string;
  timestamp: string;
}


export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (data) {
        const convos = data as Conversation[];
        setConversations(convos);
        setSelectedConversation(convos[0] ?? null);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('timestamp', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetchMessages();

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedConversation) return;

    const messageToSend = newMessage;
    const optimisticMsg: Message = {
      id: Date.now(),
      conversation_id: selectedConversation.id,
      sender: 'agent',
      body: messageToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender: 'agent',
      body: messageToSend,
      timestamp: optimisticMsg.timestamp,
    });

    await supabase.functions.invoke('wati-send-message', {
      body: { phone: selectedConversation.phone, message: messageToSend },
    });
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with your clients and leads directly
          </p>
        </div>
      </div>
      <div className="metric-card flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Conversation List */}
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {conversations.map(convo => (
                <div
                  key={convo.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-muted/50",
                    selectedConversation?.id === convo.id && "bg-muted"
                  )}
                  onClick={() => setSelectedConversation(convo)}
                >
                  <Avatar>
                    {/* Use provided avatar or initials */}
                    <AvatarFallback>
                      {convo.avatar || convo.name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm truncate">{convo.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {convo.updated_at && new Date(convo.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex justify-between items-start">
                        <p className="text-xs text-muted-foreground truncate">{convo.last_message}</p>
                        {convo.unread_count > 0 && (
                            <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs">{convo.unread_count}</Badge>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 border-l border-border flex flex-col h-full">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {selectedConversation.avatar ||
                      selectedConversation.name?.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedConversation.name}</h3>
                  <p className="text-xs text-success">Online</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'agent' ? "justify-end" : "justify-start") }>
                            {msg.sender !== 'agent' && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {selectedConversation.name?.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn(
                                "max-w-xs md:max-w-md p-3 rounded-lg",
                                msg.sender === 'agent' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                            )}>
                                <p className="text-sm">{msg.body}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    className="pr-28"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><Smile className="w-4 h-4" /></Button>
                    <Button size="sm" onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
