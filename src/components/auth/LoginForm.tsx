import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  userType: 'employee' | 'admin';
  onLogin: () => void;
}

export function LoginForm({ userType, onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let authResponse;

      // Admin login with Supabase
      if (userType === 'admin') {
        if (username !== 'admin' || password !== '12345678') {
          throw new Error("Invalid administrator credentials");
        }

        // Use the correct admin email for Supabase authentication
        authResponse = await supabase.auth.signInWithPassword({
          email: 'admin@gmail.com',
          password: '12345678'
        });

        if (authResponse.error) {
          console.error("Supabase auth error:", authResponse.error);
          throw authResponse.error;
        }

        // Verify session exists
        const session = authResponse.data.session;
        if (!session) {
          throw new Error("Failed to create authentication session");
        }

        // Store admin status and session
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('supabase.auth.token', session.access_token);
        
        // Set auth header for future requests
        supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        toast({
          title: "Authentication successful",
          description: "Welcome to NationLedger, Administrator.",
        });
        
        onLogin();
        navigate('/admin/dashboard');
      } 
      // Employee login - use Supabase with employee email
      else {
        console.log("Attempting employee login with email:", username);
        authResponse = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });

        if (authResponse.error) {
          console.error("Supabase auth error:", authResponse.error);
          throw authResponse.error;
        }

        // Verify session exists
        const session = authResponse.data.session;
        if (!session) {
          throw new Error("Failed to create authentication session");
        }

        // Store session
        localStorage.setItem('supabase.auth.token', session.access_token);
        
        // Set auth header for future requests
        supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        toast({
          title: "Authentication successful",
          description: "Welcome to NationLedger, Employee.",
        });
        
        onLogin();
        navigate('/employee/dashboard');
      }

      // Verify the session was created successfully
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Session verification failed:", sessionError);
        throw new Error("Failed to verify authentication session");
      }

    } catch (error: any) {
      console.error('Authentication error:', error);
      let errorMessage = "Please check your credentials and try again.";
      
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        errorMessage = "Login failed. Please ensure your email is verified and your credentials are correct.";
      } else if (error.message?.toLowerCase().includes('email not confirmed')) {
        errorMessage = "Your email address has not been verified. Please check your email for the verification link.";
      }
      
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="flex justify-center mb-6">
        {userType === 'admin' ? (
          <Shield className="h-12 w-12 text-gov-burgundy" />
        ) : (
          <User className="h-12 w-12 text-gov-teal" />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">{userType === 'employee' ? 'Email' : 'Username'}</Label>
        <Input
          id="username"
          type={userType === 'employee' ? 'email' : 'text'}
          placeholder={userType === 'employee' ? "Enter your email address" : "Enter your username"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Authenticating..." : "Login"}
      </Button>
      
      {userType === 'employee' && (
        <div className="space-y-2 text-center mt-4">
          <p className="text-xs text-gray-500">
            Please use your email address to log in.
          </p>
          <p className="text-xs text-gray-500">
            New users must verify their email before logging in.
          </p>
        </div>
      )}
      
      {userType === 'admin' && (
        <p className="text-xs text-center text-gray-500 mt-4">
          Default admin: username 'admin', password '12345678'
        </p>
      )}
    </form>
  );
}
