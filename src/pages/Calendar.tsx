import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  ExternalLink,
  Video,
  Clock,
  Users,
  MessageSquare,
  RefreshCw
} from "lucide-react";

export default function CalendarPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    window.location.reload();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Schedule Appointments</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Book discovery calls and property viewings</p>
        </div>
        <Button 
          onClick={() => window.open('https://cal.com/estatehive/discovery-call', '_blank')}
          className="w-full sm:w-auto"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold">30 min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meeting Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold">Video Call</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold">Mon-Fri</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold">24 hrs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Cal.com Booking Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Schedule Your Discovery Call
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://cal.com/estatehive/discovery-call', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-3">What to Expect in Your Discovery Call:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Property Requirements</p>
                    <p className="text-xs text-muted-foreground">Discuss your ideal property specifications and preferences</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Budget & Timeline</p>
                    <p className="text-xs text-muted-foreground">Understand your investment range and purchase timeline</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Market Insights</p>
                    <p className="text-xs text-muted-foreground">Get expert advice on current market trends and opportunities</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Next Steps</p>
                    <p className="text-xs text-muted-foreground">Create a personalized action plan for your property journey</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cal.com Iframe */}
          <div className="relative w-full overflow-hidden rounded-lg border bg-background" style={{ minHeight: '700px' }}>
            <iframe
              src="https://cal.com/estatehive/discovery-call"
              className="w-full h-full absolute top-0 left-0"
              style={{ minHeight: '700px', border: 'none', background: 'white' }}
              frameBorder="0"
              allowFullScreen
              loading="lazy"
              title="Schedule a Discovery Call with EstateHive"
            />
          </div>
          
          {/* Help Section */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Need Help Scheduling?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  If you're having trouble with the booking calendar, you can also reach out to us directly.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://cal.com/estatehive/discovery-call', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Open Cal.com Directly
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = 'mailto:contact@estatehive.com'}
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Email Us
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}