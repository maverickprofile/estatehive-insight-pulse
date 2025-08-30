import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Send,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MoreVertical,
  Search,
  Filter,
  Download,
  Upload,
  Paperclip,
  Image,
  FileText,
  Mic,
  Video,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  Star,
  Archive,
  Trash2,
  Edit,
  Reply,
  Forward,
  Copy,
  ExternalLink,
  Loader2,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageCircle,
  Bot,
  User,
  Users,
  Zap
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/database.service";
import { Client } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";

// Mock communication data
const mockCommunications = [
  {
    id: 1,
    type: 'whatsapp',
    direction: 'incoming',
    content: 'Hi, I am interested in the Sunset Villa property. Can you share more details?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'read',
    attachments: []
  },
  {
    id: 2,
    type: 'whatsapp',
    direction: 'outgoing',
    content: 'Hello! Thank you for your interest in Sunset Villa. It\'s a beautiful 3 BHK property with modern amenities. Let me share the brochure with you.',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    status: 'delivered',
    attachments: [
      { type: 'pdf', name: 'Sunset_Villa_Brochure.pdf', size: '2.5 MB' }
    ]
  },
  {
    id: 3,
    type: 'email',
    direction: 'outgoing',
    subject: 'Property Details - Sunset Villa',
    content: 'Dear Client,\n\nAs discussed, please find attached the detailed brochure and floor plans for Sunset Villa. The property features:\n\n- 3 Bedrooms with attached bathrooms\n- Modern modular kitchen\n- 24/7 Security\n- Swimming pool and gym\n- Covered parking for 2 cars\n\nThe current price is ₹1.2 Cr with flexible payment options available.\n\nBest regards,\nJohn Smith',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'sent',
    attachments: [
      { type: 'pdf', name: 'Floor_Plans.pdf', size: '1.8 MB' },
      { type: 'image', name: 'Villa_Photos.zip', size: '15 MB' }
    ]
  },
  {
    id: 4,
    type: 'call',
    direction: 'incoming',
    duration: '15:32',
    content: 'Discussed property features, pricing, and scheduled a site visit for tomorrow.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'completed'
  },
  {
    id: 5,
    type: 'sms',
    direction: 'outgoing',
    content: 'Reminder: Site visit scheduled for tomorrow at 3 PM. Location: Sunset Villa, South Delhi.',
    timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
    status: 'delivered'
  }
];

const communicationTypes = {
  whatsapp: { icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
  email: { icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900' },
  call: { icon: Phone, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900' },
  sms: { icon: MessageCircle, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900' },
  meeting: { icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900' }
};

export default function ClientCommunicationsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [composeDialog, setComposeDialog] = useState(false);
  const [composeType, setComposeType] = useState("whatsapp");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [activeTab]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClientById(parseInt(id!));
      setClient(data);
    } catch (error) {
      console.error("Error loading client:", error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive"
      });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    
    setSending(true);
    try {
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Message Sent",
        description: `${composeType === 'email' ? 'Email' : 'Message'} sent successfully`
      });
      
      setMessage("");
      setSubject("");
      setAttachments([]);
      setComposeDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getCallIcon = (direction: string) => {
    switch (direction) {
      case 'incoming': return PhoneIncoming;
      case 'outgoing': return PhoneOutgoing;
      case 'missed': return PhoneMissed;
      default: return Phone;
    }
  };

  const filteredCommunications = mockCommunications.filter(comm => {
    if (selectedType !== 'all' && comm.type !== selectedType) return false;
    if (searchTerm && !comm.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
          <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/clients')}>
            Back to Clients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={client.avatar_url || undefined} />
              <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Communication History</h1>
              <p className="text-muted-foreground">{client.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setComposeDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            New Message
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export History
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Archive All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communication Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Messages</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <Badge className="bg-green-100 text-green-800">92%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="font-semibold">2.5 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Contact</span>
                <span className="text-sm">2 hours ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Phone Calls</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="meeting">Meetings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="border-b">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="calls">Calls</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {filteredCommunications.map((comm) => {
                    const TypeInfo = communicationTypes[comm.type as keyof typeof communicationTypes];
                    const TypeIcon = TypeInfo.icon;
                    const CallIcon = comm.type === 'call' ? getCallIcon(comm.direction) : null;
                    
                    return (
                      <div
                        key={comm.id}
                        className={cn(
                          "flex gap-4 group hover:bg-muted/50 p-4 rounded-lg transition-colors cursor-pointer",
                          comm.direction === 'outgoing' && "flex-row-reverse"
                        )}
                        onClick={() => setSelectedMessage(comm)}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          TypeInfo.bgColor
                        )}>
                          {comm.type === 'call' && CallIcon ? (
                            <CallIcon className={cn("h-5 w-5", TypeInfo.color)} />
                          ) : (
                            <TypeIcon className={cn("h-5 w-5", TypeInfo.color)} />
                          )}
                        </div>
                        
                        <div className={cn(
                          "flex-1 space-y-1",
                          comm.direction === 'outgoing' && "text-right"
                        )}>
                          <div className={cn(
                            "flex items-center gap-2",
                            comm.direction === 'outgoing' && "justify-end"
                          )}>
                            <span className="font-medium text-sm">
                              {comm.direction === 'incoming' ? client.name : 'You'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comm.timestamp)}
                            </span>
                            {comm.status === 'delivered' && (
                              <CheckCheck className="h-3 w-3 text-blue-600" />
                            )}
                            {comm.status === 'read' && (
                              <CheckCheck className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          
                          {comm.type === 'email' && comm.subject && (
                            <p className="font-medium text-sm">{comm.subject}</p>
                          )}
                          
                          {comm.type === 'call' ? (
                            <div className={cn(
                              "flex items-center gap-2 text-sm text-muted-foreground",
                              comm.direction === 'outgoing' && "justify-end"
                            )}>
                              <Clock className="h-3 w-3" />
                              <span>Duration: {comm.duration}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {comm.content}
                            </p>
                          )}
                          
                          {comm.attachments && comm.attachments.length > 0 && (
                            <div className={cn(
                              "flex gap-2 mt-2",
                              comm.direction === 'outgoing' && "justify-end"
                            )}>
                              {comm.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                                >
                                  {attachment.type === 'image' ? (
                                    <Image className="h-3 w-3" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span>{attachment.name}</span>
                                  <span className="text-muted-foreground">({attachment.size})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={comm.direction === 'outgoing' ? 'start' : 'end'}>
                            <DropdownMenuItem>
                              <Reply className="mr-2 h-4 w-4" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Forward className="mr-2 h-4 w-4" />
                              Forward
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="mr-2 h-4 w-4" />
                              Star
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeDialog} onOpenChange={setComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Send a message to {client.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={composeType} onValueChange={setComposeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {composeType === 'email' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Enter subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Files
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </Button>
                <Button variant="outline" size="sm">
                  <Image className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {composeType === 'whatsapp' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
                <Button variant="outline" size="sm">
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assist
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}