import { InlineWidget } from "react-calendly";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

export default function CalendarPage() {
  const [userProfile, setUserProfile] = useState<{ full_name: string | null, email: string | null }>({ full_name: null, email: null });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          full_name: user.user_metadata.full_name || user.email,
          email: user.email
        });
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule a Meeting</h1>
          <p className="text-muted-foreground">
            Book a site visit or a consultation call directly in our calendar.
          </p>
        </div>
      </div>

      {/* Calendly Embed */}
      <div className="metric-card p-0 overflow-hidden">
        {/* The InlineWidget will render Calendly directly on the page */}
        {/* Make sure to replace the URL with your actual Calendly link */}
        <InlineWidget
          url="https://calendly.com/shamique-estatehive/30min"
          styles={{
            height: '800px',
            width: '100%',
          }}
          prefill={{
            name: userProfile.full_name || '',
            email: userProfile.email || '',
          }}
          pageSettings={{
            backgroundColor: 'ffffff',
            hideEventTypeDetails: false,
            hideLandingPageDetails: false,
            primaryColor: '00a2ff',
            textColor: '4d5055'
          }}
        />
      </div>
    </div>
  );
}
