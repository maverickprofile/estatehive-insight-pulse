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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Calendar, Clock, MapPin } from 'lucide-react';

const APPOINTMENT_TYPES = [
    'property_viewing',
    'consultation',
    'follow_up',
    'closing',
    'inspection',
    'maintenance'
];

export default function AddAppointment() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
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
        setLoading(true);

        try {
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

            await appointmentsService.createAppointment(submitData);
            
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

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="metric-card space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="title">Appointment Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={appointmentData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Property viewing at Whitefield"
                            />
                        </div>

                        <div>
                            <Label htmlFor="appointment_type">Type *</Label>
                            <Select
                                value={appointmentData.appointment_type}
                                onValueChange={(value) => handleSelectChange('appointment_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {APPOINTMENT_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={appointmentData.status}
                                onValueChange={(value) => handleSelectChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="no_show">No Show</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="client_id">Client</Label>
                            <Select
                                value={appointmentData.client_id}
                                onValueChange={(value) => handleSelectChange('client_id', value)}
                            >
                                <SelectTrigger>
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
                            <Label htmlFor="agent_id">Agent</Label>
                            <Select
                                value={appointmentData.agent_id}
                                onValueChange={(value) => handleSelectChange('agent_id', value)}
                            >
                                <SelectTrigger>
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
                            <Label htmlFor="property_id">Property (Optional)</Label>
                            <Select
                                value={appointmentData.property_id}
                                onValueChange={(value) => handleSelectChange('property_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a property" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map(property => (
                                        <SelectItem key={property.id} value={property.id.toString()}>
                                            {property.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="location"
                                    name="location"
                                    value={appointmentData.location}
                                    onChange={handleInputChange}
                                    placeholder="Meeting location"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="start_time">Start Date & Time *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="start_time"
                                    name="start_time"
                                    type="datetime-local"
                                    value={appointmentData.start_time}
                                    onChange={handleInputChange}
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="end_time">End Date & Time *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="end_time"
                                    name="end_time"
                                    type="datetime-local"
                                    value={appointmentData.end_time}
                                    onChange={handleInputChange}
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={appointmentData.description}
                                onChange={handleInputChange}
                                placeholder="Additional details about the appointment..."
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/calendar')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Schedule Appointment
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}