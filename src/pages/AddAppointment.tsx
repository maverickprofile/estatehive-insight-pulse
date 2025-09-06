import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsService } from '@/services/appointments.service';
import { clientsService } from '@/services/database.service';
import { agentsService } from '@/services/agents.service';
import { propertiesService } from '@/services/database.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Building2,
  User,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
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

const APPOINTMENT_TYPES = [
    'property_viewing',
    'consultation',
    'follow_up',
    'closing',
    'inspection',
    'maintenance'
];

// Appointment type configurations with icons and colors
const appointmentTypeConfig = {
  property_viewing: { icon: Building2, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  consultation: { icon: Users, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  follow_up: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-200' },
  closing: { icon: CheckCircle, color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  inspection: { icon: AlertCircle, color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  maintenance: { icon: AlertCircle, color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
};

export default function AddAppointment() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [appointmentToSubmit, setAppointmentToSubmit] = useState<any>(null);
    
    const [appointmentData, setAppointmentData] = useState({
        title: '',
        description: '',
        appointment_type: 'property_viewing',
        property_id: '',
        client_id: '',
        agent_id: '',
        start_time: '',
        end_time: '',
        location: '',
        status: 'scheduled'
    });

    // Fetch data for dropdowns
    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientsService.getAllClients()
    });

    const { data: agents = [] } = useQuery({
        queryKey: ['agents'], 
        queryFn: () => agentsService.getAllAgents()
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => propertiesService.getAllProperties()
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAppointmentData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setAppointmentData(prev => ({ ...prev, [name]: value }));
        
        // Auto-populate location when property is selected
        if (name === 'property_id' && value) {
            const property = properties.find(p => p.id.toString() === value);
            if (property && property.address) {
                setAppointmentData(prev => ({ ...prev, location: property.address }));
            }
        }
    };

    // Auto-calculate end time when start time changes
    useEffect(() => {
        if (appointmentData.start_time) {
            const startTime = new Date(appointmentData.start_time);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
            setAppointmentData(prev => ({
                ...prev,
                end_time: endTime.toISOString().slice(0, 16)
            }));
        }
    }, [appointmentData.start_time]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const submitData = {
            title: appointmentData.title,
            description: appointmentData.description || null,
            appointment_type: appointmentData.appointment_type,
            property_id: appointmentData.property_id ? parseInt(appointmentData.property_id) : null,
            client_id: appointmentData.client_id ? parseInt(appointmentData.client_id) : null,
            agent_id: appointmentData.agent_id || null,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time,
            location: appointmentData.location || null,
            status: appointmentData.status
        };
        
        setAppointmentToSubmit(submitData);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        if (!appointmentToSubmit) return;
        
        setLoading(true);
        setShowConfirmation(false);

        try {
            await appointmentsService.createAppointment(appointmentToSubmit);
            
            toast({
                title: "Success",
                description: "Appointment created successfully",
            });
            
            navigate('/calendar');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create appointment",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Format date for display with timezone indicator
    const formatDateTimeForDisplay = (dateTime: string) => {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };
        return date.toLocaleString('en-US', options);
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/calendar')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Schedule New Appointment</h1>
                    <p className="text-sm text-muted-foreground">Create a new property viewing or consultation</p>
                </div>
            </div>

            {/* Stats Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">5</div>
                        <p className="text-xs text-muted-foreground">3 viewings, 2 consultations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">18</div>
                        <p className="text-xs text-muted-foreground">12 confirmed, 6 pending</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">88%</div>
                        <p className="text-xs text-success">↑ 5% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Next Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tomorrow</div>
                        <p className="text-xs text-muted-foreground">10:00 AM - 11:00 AM</p>
                    </CardContent>
                </Card>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Appointment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="title">Appointment Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={appointmentData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Property viewing at Whitefield"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="appointment_type">Type *</Label>
                                <Select
                                    value={appointmentData.appointment_type}
                                    onValueChange={(value) => handleSelectChange('appointment_type', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {APPOINTMENT_TYPES.map(type => {
                                            const config = appointmentTypeConfig[type as keyof typeof appointmentTypeConfig];
                                            const Icon = config?.icon || Building2;
                                            return (
                                                <SelectItem key={type} value={type}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={appointmentData.status}
                                    onValueChange={(value) => handleSelectChange('status', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">
                                            <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                                        </SelectItem>
                                        <SelectItem value="confirmed">
                                            <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                                        </SelectItem>
                                        <SelectItem value="no_show">
                                            <Badge className="bg-orange-100 text-orange-800">No Show</Badge>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="client_id">
                                    <User className="inline h-3 w-3 mr-1" />
                                    Client
                                </Label>
                                <Select
                                    value={appointmentData.client_id}
                                    onValueChange={(value) => handleSelectChange('client_id', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id.toString()}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="agent_id">
                                    <Users className="inline h-3 w-3 mr-1" />
                                    Agent
                                </Label>
                                <Select
                                    value={appointmentData.agent_id}
                                    onValueChange={(value) => handleSelectChange('agent_id', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select an agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                {agent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="property_id">
                                    <Building2 className="inline h-3 w-3 mr-1" />
                                    Property
                                </Label>
                                <Select
                                    value={appointmentData.property_id}
                                    onValueChange={(value) => handleSelectChange('property_id', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a property" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map(property => (
                                            <SelectItem key={property.id} value={property.id.toString()}>
                                                {property.title} - {property.address}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start_time">
                                    <Clock className="inline h-3 w-3 mr-1" />
                                    Start Time *
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="start_time"
                                        name="start_time"
                                        type="datetime-local"
                                        value={appointmentData.start_time}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {appointmentData.start_time && (
                                        <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground flex items-center gap-1">
                                            <Globe className="h-3 w-3" />
                                            {new Date(appointmentData.start_time).toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="end_time">
                                    <Clock className="inline h-3 w-3 mr-1" />
                                    End Time *
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="end_time"
                                        name="end_time"
                                        type="datetime-local"
                                        value={appointmentData.end_time}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {appointmentData.end_time && (
                                        <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
                                            Duration: {
                                                appointmentData.start_time && appointmentData.end_time ? 
                                                Math.round((new Date(appointmentData.end_time).getTime() - new Date(appointmentData.start_time).getTime()) / 60000) + ' minutes'
                                                : ''
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Label htmlFor="location">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                Location
                            </Label>
                            <Input
                                id="location"
                                name="location"
                                value={appointmentData.location}
                                onChange={handleInputChange}
                                placeholder="e.g., 123 Main St, Whitefield, Bangalore"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description / Notes</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={appointmentData.description}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Add any special instructions or notes for this appointment..."
                                className="mt-1"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/calendar')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Appointment
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Appointment Details</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2 pt-4">
                            {appointmentToSubmit && (
                                <>
                                    <div>
                                        <strong>Title:</strong> {appointmentToSubmit.title}
                                    </div>
                                    <div>
                                        <strong>Type:</strong> {appointmentToSubmit.appointment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </div>
                                    <div>
                                        <strong>Date & Time:</strong> {formatDateTimeForDisplay(appointmentToSubmit.start_time)}
                                    </div>
                                    {appointmentToSubmit.location && (
                                        <div>
                                            <strong>Location:</strong> {appointmentToSubmit.location}
                                        </div>
                                    )}
                                    <div className="pt-2 text-sm">
                                        Please confirm that the appointment details are correct.
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Go Back</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit}>
                            Confirm & Create
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}