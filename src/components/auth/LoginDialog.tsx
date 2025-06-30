import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './LoginForm';
import { useNavigate } from 'react-router-dom';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('employee');

  const handleLogin = () => {
    onOpenChange(false);
    
    if (activeTab === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/employee/dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Access NationLedger</DialogTitle>
          <DialogDescription>
            Please select your role and enter your credentials to access the platform.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="employee" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employee">Government Employee</TabsTrigger>
            <TabsTrigger value="admin">System Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employee">
            <LoginForm userType="employee" onLogin={handleLogin} />
          </TabsContent>
          
          <TabsContent value="admin">
            <LoginForm userType="admin" onLogin={handleLogin} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
