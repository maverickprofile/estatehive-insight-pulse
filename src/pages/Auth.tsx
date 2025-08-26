import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, Shield, Mail, Lock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  // Check if this is an invitation acceptance
  useEffect(() => {
    if (inviteToken) {
      // Handle invitation acceptance (will implement later)
      toast({
        title: "Invitation Detected",
        description: "Please login or create an account to accept the invitation.",
      });
    }
  }, [inviteToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Special handling for super admin
      if (email === 'mahesh@simsinfotech.com') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid Credentials",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome Back!",
            description: "Super Admin access granted.",
          });
        }
      } else {
        // Check if user exists in team_members
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, team_members(*)')
          .eq('email', email)
          .single();

        if (!profile) {
          toast({
            title: "Access Denied",
            description: "No account found. Please contact your administrator for an invitation.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Proceed with login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome Back!",
          description: "Successfully logged in.",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Authentication Error",
        description: error.error_description || error.message || "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl mb-4 shadow-lg">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">EstateHive CRM</h1>
          <p className="text-muted-foreground">Secure Property Management Platform</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              {inviteToken 
                ? "Login to accept your team invitation" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {email === 'mahesh@simsinfotech.com' && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary font-medium">Super Admin Account Detected</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          
          <Separator />
          
          <CardFooter className="flex flex-col space-y-2 pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?
            </p>
            <p className="text-sm font-medium text-center">
              Contact your administrator for an invitation
            </p>
            {email && email !== 'mahesh@simsinfotech.com' && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Only invited team members can access this platform
              </p>
            )}
          </CardFooter>
        </Card>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Secured by enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
}
