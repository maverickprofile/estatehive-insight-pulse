// src/pages/Messages.tsx

import {
  Bird,
  Book,
  Bot,
  Code2,
  CornerDownLeft,
  LifeBuoy,
  Mic,
  Paperclip,
  Rabbit,
  Settings,
  Settings2,
  Share,
  SquareTerminal,
  SquareUser,
  Triangle,
  Turtle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { Link } from "react-router-dom"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import React from "react"
import { cn } from "@/lib/utils"
import { WhatsAppService, WhatsAppConversation, WhatsAppMessage } from "@/lib/whatsappService"
import { TelegramService } from "@/lib/telegramService"
import { getWatiService } from "@/lib/watiRealTimeService"
import { MessageCircle, Send } from "lucide-react"

// Use the database types from WhatsAppService
type Message = WhatsAppMessage;
type Conversation = WhatsAppConversation;


export default function Messages() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  const [selectedMessages, setSelectedMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newMessage, setNewMessage] = React.useState('');

  // Fetch conversations from database
  const fetchConversations = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const conversations = await WhatsAppService.getConversations();
      console.log('Fetched conversations from database:', conversations);
      
      setConversations(conversations);
      
      // Auto-select first conversation if none selected
      if (conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(conversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations from database');
    } finally {
      setIsLoading(false);
    }
  }, [selectedConversation]);

  // Fetch messages for selected conversation
  const fetchMessages = React.useCallback(async (conversationId: number) => {
    try {
      const messages = await WhatsAppService.getMessages(conversationId);
      console.log('Fetched messages for conversation:', conversationId, messages);
      setSelectedMessages(messages);
      
      // Mark messages as read when viewing
      if (selectedConversation?.platform === 'telegram') {
        await TelegramService.markMessagesAsRead(conversationId);
      } else {
        await WhatsAppService.markMessagesAsRead(conversationId);
      }
      
      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  }, [fetchConversations]);

  // Handle conversation selection
  const handleConversationSelect = React.useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Send message handler - supports both WhatsApp and Telegram
  const handleSendMessage = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const messageText = newMessage.trim();
      setNewMessage(''); // Clear input immediately for better UX
      
      // Check platform and send accordingly
      if (selectedConversation.platform === 'telegram') {
        // Send via Telegram
        const result = await TelegramService.sendMessage(selectedConversation.id, messageText);
        
        if (result.success) {
          console.log(`✅ Telegram message sent`);
          setError(null);
        } else {
          console.error('❌ Telegram send failed:', result.error);
          setError(`Failed to send Telegram message: ${result.error}`);
          setNewMessage(messageText); // Restore message for retry
          return;
        }
      } else {
        // Send via WhatsApp (existing logic)
        const clientPhoneNumber = WhatsAppService.phoneNumberFromId(selectedConversation.client_telegram_id);
        const watiService = getWatiService();
        const result = await watiService.sendWhatsAppMessage(clientPhoneNumber, messageText);
        
        if (result.success) {
          console.log(`✅ Real WhatsApp message sent to ${clientPhoneNumber}`);
          setError(null);
        } else {
          console.error('❌ WATI send failed:', result.error);
          setError(`Failed to send WhatsApp message: ${result.error}`);
          setNewMessage(messageText); // Restore message for retry
          return;
        }
      }
      
      // Refresh messages and conversations
      fetchMessages(selectedConversation.id);
      fetchConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      // Restore message in input if there was an error
      setNewMessage(newMessage);
    }
  }, [selectedConversation, newMessage, fetchMessages, fetchConversations]);

  // Initial load
  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-fetch messages when conversation is selected
  React.useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  // Real-time subscription
  React.useEffect(() => {
    const subscription = WhatsAppService.subscribeToConversations(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversation, fetchConversations, fetchMessages]);


  const defaultLayout = [25, 75]

  return (
    <TooltipProvider>
      <div className="flex h-screen max-h-screen">
        {/* Mobile: Hidden sidebar, toggle with button */}
        <div className={cn(
          "md:flex flex-col w-full md:w-1/3 lg:w-1/4 border-r bg-background",
          selectedConversation ? "hidden md:flex" : "flex"
        )}>
          {/* Header with navigation icons */}
          <div className={cn("flex h-12 sm:h-[52px] items-center justify-between px-2 sm:px-4")}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 sm:h-10 sm:w-10">
                    <SquareUser className="h-3 w-3 sm:h-5 sm:w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Accounts
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mx-1 h-4 sm:h-6" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg bg-muted h-8 w-8 sm:h-10 sm:w-10"
                    aria-label="Messages"
                  >
                    <Triangle className="h-3 w-3 sm:h-5 sm:w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Messages
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <Separator />
          
          {/* Inbox header */}
          <div className="flex items-center px-3 sm:px-4 py-2">
            <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white">Inbox</h1>
          </div>
          <Separator />
          
          {/* Search */}
          <div className="bg-background/95 p-3 sm:p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="relative">
                <Input placeholder="Search conversations..." className="text-sm" />
              </div>
            </form>
          </div>
          
          {/* Conversation list */}
          <nav className="flex-1 overflow-auto px-2 text-xs sm:text-sm font-medium">
            {isLoading && <p className="p-3 sm:p-4 text-xs sm:text-sm">Loading conversations...</p>}
            {error && <p className="p-3 sm:p-4 text-red-500 text-xs sm:text-sm">Error: {error}</p>}
            {!isLoading && !error && conversations.map((convo) => (
              <Link
                key={convo.id}
                to="#"
                onClick={() => handleConversationSelect(convo)}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-3 text-muted-foreground transition-all hover:text-primary",
                  selectedConversation?.id === convo.id && "bg-muted text-primary"
                )}
              >
                <div className="flex flex-col w-full min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="font-semibold text-xs sm:text-sm truncate">
                      {convo.platform === 'telegram' && convo.telegram_username 
                        ? `@${convo.telegram_username}` 
                        : convo.client_name || WhatsAppService.phoneNumberFromId(convo.client_telegram_id)}
                    </div>
                    {convo.platform === 'telegram' ? (
                      <Send className="h-2 w-2 sm:h-3 sm:w-3 text-blue-500 flex-shrink-0" />
                    ) : (
                      <MessageCircle className="h-2 w-2 sm:h-3 sm:w-3 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs truncate">{convo.last_message || 'No recent messages'}</div>
                </div>
                {convo.unread_count > 0 && (
                  <Badge className="ml-auto flex h-4 w-4 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-xs">
                    {convo.unread_count > 99 ? '99+' : convo.unread_count}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Chat Area */}
        <div className={cn(
          "flex flex-col flex-1 bg-muted/50",
          !selectedConversation ? "hidden md:flex" : "flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-background">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <CornerDownLeft className="h-4 w-4 rotate-90" />
                  </Button>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base truncate">
                      {selectedConversation.platform === 'telegram' && selectedConversation.telegram_username 
                        ? `@${selectedConversation.telegram_username}` 
                        : selectedConversation.client_name || WhatsAppService.phoneNumberFromId(selectedConversation.client_telegram_id)}
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {selectedConversation.platform === 'telegram' ? (
                        <><Send className="h-2 w-2 text-blue-500" /> Telegram</>
                      ) : (
                        <><MessageCircle className="h-2 w-2 text-green-500" /> WhatsApp</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
                {selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-1 sm:gap-2",
                      message.sender_id ? "justify-end" : "justify-start" // sender_id exists = agent message
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-xs lg:max-w-md rounded-lg p-2 sm:p-3",
                        message.sender_id
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border"
                      )}
                    >
                      <p className="text-xs sm:text-sm break-words">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="p-3 sm:p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
                  <Label htmlFor="message" className="sr-only">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-10 sm:min-h-12 resize-none border-0 p-2 sm:p-3 shadow-none focus-visible:ring-0 text-sm"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <div className="flex items-center p-2 sm:p-3 pt-0">
                    <div className="hidden sm:flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button" className="h-8 w-8">
                            <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Attach file</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Attach File</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button" className="h-8 w-8">
                            <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Use Microphone</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Use Microphone</TooltipContent>
                      </Tooltip>
                    </div>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="ml-auto gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9" 
                      disabled={!newMessage.trim()}
                    >
                      <span className="hidden sm:inline">Send Message</span>
                      <span className="sm:hidden">Send</span>
                      <CornerDownLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-2">Select a conversation to view messages</p>
                <p className="text-xs sm:text-sm text-muted-foreground/70">Choose from your conversations on the left to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
