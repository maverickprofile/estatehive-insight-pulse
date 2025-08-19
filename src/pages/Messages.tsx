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
import { getWatiService } from "@/lib/watiRealTimeService"

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
      await WhatsAppService.markMessagesAsRead(conversationId);
      
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

  // Send message handler - REAL WhatsApp via WATI API
  const handleSendMessage = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const messageText = newMessage.trim();
      setNewMessage(''); // Clear input immediately for better UX
      
      // Get the client's phone number
      const clientPhoneNumber = WhatsAppService.phoneNumberFromId(selectedConversation.client_telegram_id);
      
      // Send via REAL WATI API to actual WhatsApp
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
      
      // Refresh messages and conversations (WATI service already saves to database)
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
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`
        }}
        className="h-full max-h-screen items-stretch"
      >
        <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
          <div className={cn("flex h-[52px] items-center justify-center px-2")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <SquareUser className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Accounts
              </TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <nav className="grid gap-1 p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg bg-muted"
                    aria-label="Messages"
                  >
                    <Triangle className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Messages
                </TooltipContent>
              </Tooltip>
            </nav>
          </div>
          <Separator />
          <div className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">Inbox</h1>
          </div>
          <Separator />
          <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="relative">
                <Input placeholder="Search" />
              </div>
            </form>
          </div>
          <nav className="grid gap-1 px-2 text-sm font-medium">
            {isLoading && <p className="p-4">Loading conversations...</p>}
            {error && <p className="p-4 text-red-500">Error: {error}</p>}
            {!isLoading && !error && conversations.map((convo) => (
              <Link
                key={convo.id}
                to="#"
                onClick={() => handleConversationSelect(convo)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  selectedConversation?.id === convo.id && "bg-muted text-primary"
                )}
              >
                <div className="flex flex-col w-full">
                  <div className="font-semibold">
                    {convo.client_name || WhatsAppService.phoneNumberFromId(convo.client_telegram_id)}
                  </div>
                  <div className="text-xs truncate">{convo.last_message || 'No recent messages'}</div>
                </div>
                {convo.unread_count > 0 && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {convo.unread_count}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]}>
        <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-auto pr-4">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end gap-2 my-2",
                        message.sender_id ? "justify-end" : "justify-start" // sender_id exists = agent message
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-xs rounded-lg p-3",
                          message.sender_id
                            ? "bg-primary text-primary-foreground"
                            : "bg-background"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                         <p className="text-xs text-muted-foreground/80 mt-1 text-right">
                            {new Date(message.sent_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <form onSubmit={handleSendMessage} className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
                    <Label htmlFor="message" className="sr-only">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <div className="flex items-center p-3 pt-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <Paperclip className="size-4" />
                            <span className="sr-only">Attach file</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Attach File</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <Mic className="size-4" />
                            <span className="sr-only">Use Microphone</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Use Microphone</TooltipContent>
                      </Tooltip>
                      <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={!newMessage.trim()}>
                        Send Message
                        <CornerDownLeft className="size-3.5" />
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
