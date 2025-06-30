
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HelpCircle, Info, LogIn, FileText, Shield } from 'lucide-react';
import { LoginDialog } from '../auth/LoginDialog';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  
  React.useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gov-navy rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xl">NL</span>
          </div>
          <span className="text-xl font-bold text-gov-navy">NationLedger</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/help" className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/about" className="flex items-center gap-1">
              <Info className="w-4 h-4" />
              <span>About</span>
            </Link>
          </Button>
          
          {!user ? (
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setLoginOpen(true)}
            >
              <LogIn className="w-4 h-4" />
              <span>Get Started</span>
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              asChild
            >
              <Link to={user.user_metadata?.user_type === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
          )}
          
          <Button variant="default" size="sm" asChild>
            <Link to="/documents" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>View Documents</span>
            </Link>
          </Button>
        </div>
      </div>
      
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  );
};

export default Navbar;
