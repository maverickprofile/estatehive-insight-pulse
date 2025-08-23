import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Home, 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Bell,
  MessageSquare
} from 'lucide-react'
import { SalesChart } from '@/components/SalesChart'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { dashboardService, propertiesService, leadsService, appointmentsService } from '@/services/database.service'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardContent() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [recentLeads, setRecentLeads] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load dashboard statistics
      const dashboardStats = await dashboardService.getDashboardStats()
      setStats(dashboardStats)
      
      // Load featured properties
      const propertiesData = await propertiesService.getAllProperties({ 
        status: 'active' 
      })
      setProperties(propertiesData?.slice(0, 3) || [])
      
      // Load upcoming appointments
      const appointmentsData = await appointmentsService.getUpcomingAppointments()
      setUpcomingAppointments(appointmentsData || [])
      
      // Load recent leads
      const leadsData = await leadsService.getAllLeads()
      setRecentLeads(leadsData?.slice(0, 5) || [])
      
    } catch (error: any) {
      console.error('Dashboard load error:', error)
      toast({
        title: 'Error loading dashboard',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getMetricCards = () => {
    if (!stats) return []
    
    return [
      {
        title: 'Total Properties',
        value: stats.properties?.length || 0,
        change: '+12%',
        icon: Home,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Leads',
        value: stats.leads?.[0]?.total_leads || 0,
        change: `${stats.leads?.[0]?.conversion_rate?.toFixed(1) || 0}% conversion`,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Total Clients',
        value: stats.clients?.[0]?.total_clients || 0,
        change: `${stats.clients?.[0]?.active_clients || 0} active`,
        icon: UserCheck,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Appointments Today',
        value: upcomingAppointments.filter(a => 
          new Date(a.start_time).toDateString() === new Date().toDateString()
        ).length,
        change: `${upcomingAppointments.length} this week`,
        icon: Calendar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      },
      {
        title: 'Revenue This Month',
        value: `₹${(stats.invoices?.[0]?.total_amount || 0).toLocaleString()}`,
        change: `${stats.invoices?.[0]?.paid_count || 0} paid`,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Pending Invoices',
        value: stats.invoices?.[0]?.pending_count || 0,
        change: `₹${(stats.invoices?.[0]?.pending_amount || 0).toLocaleString()}`,
        icon: TrendingUp,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      }
    ]
  }

  const getSalesChartData = () => {
    // Generate sample data - replace with real data from your analytics
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map(month => ({
      name: month,
      sales: Math.floor(Math.random() * 50) + 20,
      rentals: Math.floor(Math.random() * 30) + 10
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {getMetricCards().map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`${metric.bgColor} p-1.5 sm:p-2 rounded-full`}>
                <metric.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{metric.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Activities */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={getSalesChartData()} />
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Recent Leads</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/leads')}
              className="text-xs sm:text-sm"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-accent">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      lead.priority === 'high' ? 'bg-red-500' :
                      lead.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium truncate">{lead.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {lead.interest_type} • {lead.stage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-medium">
                      ₹{(lead.budget_max || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Score: {lead.score}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Upcoming Appointments</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/calendar')}
              className="text-xs sm:text-sm"
            >
              View Calendar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full ${
                      appointment.appointment_type === 'property_viewing' ? 'bg-blue-100 text-blue-700' :
                      appointment.appointment_type === 'consultation' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {appointment.appointment_type.replace('_', ' ')}
                    </span>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm sm:text-base font-medium mb-1 truncate">{appointment.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">
                    {appointment.client_name || 'No client assigned'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span>{new Date(appointment.start_time).toLocaleDateString()}</span>
                    <span>{new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Properties */}
      {properties.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Featured Properties</h2>
            <Button 
              onClick={() => navigate('/properties')}
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              View All Properties
            </Button>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                location={`${property.city}, ${property.state}`}
                price={property.price}
                image={property.image_urls?.[0] || '/placeholder.svg'}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={property.area_sqft}
                status={property.status}
                onClick={() => navigate(`/properties/${property.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start text-xs sm:text-sm p-2 sm:p-4"
              onClick={() => navigate('/properties/add')}
            >
              <Home className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Property</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-xs sm:text-sm p-2 sm:p-4"
              onClick={() => navigate('/leads/create')}
            >
              <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Lead</span>
              <span className="sm:hidden">Lead</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-xs sm:text-sm p-2 sm:p-4"
              onClick={() => navigate('/appointments/create')}
            >
              <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Schedule Viewing</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-xs sm:text-sm p-2 sm:p-4"
              onClick={() => navigate('/invoices/create')}
            >
              <DollarSign className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}