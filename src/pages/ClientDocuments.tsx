import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  FileArchive,
  Folder,
  MoreVertical,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Share2,
  Copy,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Users,
  Shield,
  CloudUpload,
  HardDrive,
  Loader2,
  Grid,
  List,
  SortAsc,
  SortDesc,
  FolderOpen,
  FileSignature,
  FileCheck,
  FilePlus,
  FileX,
  Paperclip,
  Link,
  ExternalLink,
  Info,
  Star,
  Archive
} from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/database.service";
import { Client } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Document type configurations
const documentTypes = {
  identity: { 
    icon: FileSignature, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    label: 'Identity Documents',
    extensions: ['pdf', 'jpg', 'png'],
    required: true
  },
  financial: { 
    icon: FileSpreadsheet, 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: 'Financial Documents',
    extensions: ['pdf', 'xls', 'xlsx'],
    required: true
  },
  property: { 
    icon: FileCheck, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    label: 'Property Documents',
    extensions: ['pdf', 'doc', 'docx'],
    required: false
  },
  agreement: { 
    icon: FileSignature, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    label: 'Agreements & Contracts',
    extensions: ['pdf', 'doc', 'docx'],
    required: false
  },
  other: { 
    icon: File, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    label: 'Other Documents',
    extensions: ['*'],
    required: false
  }
};

// Mock document data
const mockDocuments = [
  {
    id: 1,
    name: 'Aadhaar Card.pdf',
    type: 'identity',
    size: '2.5 MB',
    uploadedBy: 'John Smith',
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'verified',
    shared: true,
    starred: true
  },
  {
    id: 2,
    name: 'PAN Card.pdf',
    type: 'identity',
    size: '1.8 MB',
    uploadedBy: 'John Smith',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'verified',
    shared: true,
    starred: false
  },
  {
    id: 3,
    name: 'Bank Statement - March 2024.pdf',
    type: 'financial',
    size: '4.2 MB',
    uploadedBy: 'Client',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'pending',
    shared: false,
    starred: false
  },
  {
    id: 4,
    name: 'Sale Agreement - Sunset Villa.pdf',
    type: 'agreement',
    size: '8.5 MB',
    uploadedBy: 'Sarah Johnson',
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'verified',
    shared: true,
    starred: true
  },
  {
    id: 5,
    name: 'Property Registration.pdf',
    type: 'property',
    size: '6.3 MB',
    uploadedBy: 'Legal Team',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'verified',
    shared: true,
    starred: false
  }
];

export default function ClientDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState("identity");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
      setUploadDialog(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    setTimeout(() => {
      toast({
        title: "Success",
        description: `${files.length} document(s) uploaded successfully`
      });
      setFiles([]);
      setUploadDialog(false);
      setUploading(false);
      setUploadProgress(0);
    }, 2000);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      // Delete document logic here
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
      setDeleteId(null);
      setDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'download':
        toast({
          title: "Downloading",
          description: `Downloading ${selectedDocuments.length} documents...`
        });
        break;
      case 'delete':
        toast({
          title: "Deleting",
          description: `Deleting ${selectedDocuments.length} documents...`
        });
        setSelectedDocuments([]);
        break;
      case 'share':
        toast({
          title: "Sharing",
          description: `Sharing ${selectedDocuments.length} documents...`
        });
        break;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return Image;
      case 'xls':
      case 'xlsx': return FileSpreadsheet;
      case 'zip':
      case 'rar': return FileArchive;
      default: return File;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;
    if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeTab === 'starred' && !doc.starred) return false;
    if (activeTab === 'shared' && !doc.shared) return false;
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

  // Calculate document completion
  const requiredDocs = Object.entries(documentTypes).filter(([_, config]) => config.required);
  const uploadedRequiredDocs = requiredDocs.filter(([type]) => 
    mockDocuments.some(doc => doc.type === type && doc.status === 'verified')
  );
  const completionPercentage = (uploadedRequiredDocs.length / requiredDocs.length) * 100;

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
              <h1 className="text-2xl font-bold">Documents</h1>
              <p className="text-muted-foreground">{client.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedDocuments.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({selectedDocuments.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('download')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('share')}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={() => setUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Document Completion Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Document Verification Status</CardTitle>
              <CardDescription>
                {uploadedRequiredDocs.length} of {requiredDocs.length} required documents verified
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(completionPercentage)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-2 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {requiredDocs.map(([type, config]) => {
              const isUploaded = mockDocuments.some(doc => doc.type === type);
              const isVerified = mockDocuments.some(doc => doc.type === type && doc.status === 'verified');
              const Icon = config.icon;
              
              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border",
                    isVerified && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                    isUploaded && !isVerified && "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
                    !isUploaded && "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isVerified && "text-green-600",
                    isUploaded && !isVerified && "text-yellow-600",
                    !isUploaded && "text-gray-400"
                  )} />
                  <span className="text-xs font-medium capitalize">{type}</span>
                  {isVerified && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
                  {isUploaded && !isVerified && <Clock className="h-3 w-3 text-yellow-600 ml-auto" />}
                  {!isUploaded && <XCircle className="h-3 w-3 text-gray-400 ml-auto" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(documentTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List/Grid */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CloudUpload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here, or click to browse
            </p>
            <Button variant="outline" size="sm" onClick={() => setUploadDialog(true)}>
              Choose Files
            </Button>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                Upload documents to get started
              </p>
              <Button onClick={() => setUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDocuments.length === filteredDocuments.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDocuments(filteredDocuments.map(d => d.id));
                        } else {
                          setSelectedDocuments([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.name);
                  const typeConfig = documentTypes[doc.type as keyof typeof documentTypes];
                  
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocuments([...selectedDocuments, doc.id]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            typeConfig.bgColor
                          )}>
                            <FileIcon className={cn("h-5 w-5", typeConfig.color)} />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {doc.name}
                              {doc.starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            {doc.shared && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                Shared
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.size}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{doc.uploadedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(doc.uploadedAt, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Star className="mr-2 h-4 w-4" />
                              {doc.starred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setDeleteId(doc.id);
                                setDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.name);
                const typeConfig = documentTypes[doc.type as keyof typeof documentTypes];
                
                return (
                  <Card 
                    key={doc.id}
                    className="group hover:shadow-lg transition-all cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn(
                          "h-12 w-12 rounded-lg flex items-center justify-center",
                          typeConfig.bgColor
                        )}>
                          <FileIcon className={cn("h-6 w-6", typeConfig.color)} />
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
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
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1 truncate">
                        {doc.name}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{doc.size}</span>
                          <span>{format(doc.uploadedAt, 'MMM d')}</span>
                        </div>
                        
                        {getStatusBadge(doc.status)}
                        
                        {doc.shared && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            Shared with team
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Add new documents for {client.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypes).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Files</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </Button>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({files.length})</Label>
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {files.map((file, index) => {
                      const FileIcon = getFileIcon(file.name);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}