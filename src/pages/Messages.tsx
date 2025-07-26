import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const conversations = [
  { id: 1, name: 'Rajesh Kumar', lastMessage: 'Sure, 11 AM works for me. See you then.', time: '10:45 AM', unread: 0, avatar: 'RK' },
  { id: 2, name: 'Priya Patel', lastMessage: 'Thanks for the property details!', time: '9:30 AM', unread: 2, avatar: 'PP' },
  { id: 3, name: 'Amit Sharma', lastMessage: 'Can we reschedule the site visit?', time: 'Yesterday', unread: 0, avatar: 'AS' },
  { id: 4, name: 'Sunita Agarwal', lastMessage: 'The offer looks good. Let\'s proceed.', time: 'Yesterday', unread: 0, avatar: 'SA' },
  { id: 5, name: 'Vikram Singh', lastMessage: 'Payment has been made.', time: '2 days ago', unread: 0, avatar: 'VS' },
];

const initialMessages = [
    { id: 1, sender: 'Rajesh Kumar', text: 'Hi Rahul, I\'m interested in the Bandra property. Is it still available for a site visit this week?', time: '10:30 AM', sent: false },
    { id: 2, sender: 'You', text: 'Hello Rajesh, yes it is. I have a slot available tomorrow at 11 AM. Would that work for you?', time: '10:32 AM', sent: true },
    { id: 3, sender: 'Rajesh Kumar', text: 'Sure, 11 AM works for me. See you then.', time: '10:45 AM', sent: false },
];


export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const newMsg = {
      id: messages.length + 1,
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sent: true,
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
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
                    <AvatarFallback>{convo.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm truncate">{convo.name}</h4>
                      <p className="text-xs text-muted-foreground">{convo.time}</p>
                    </div>
                    <div className="flex justify-between items-start">
                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                        {convo.unread > 0 && (
                            <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs">{convo.unread}</Badge>
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
                  <AvatarFallback>{selectedConversation.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedConversation.name}</h3>
                  <p className="text-xs text-success">Online</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-3", msg.sent ? "justify-end" : "justify-start")}>
                            {!msg.sent && <Avatar className="h-8 w-8"><AvatarFallback>{selectedConversation.avatar}</AvatarFallback></Avatar>}
                            <div className={cn(
                                "max-w-xs md:max-w-md p-3 rounded-lg",
                                msg.sent ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                            )}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{msg.time}</p>
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
