import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Filter, 
  LogOut, 
  Calendar, 
  Shield, 
  AlertCircle, 
  Users, 
  UserPlus, 
  PieChart 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBlockchain } from '@/hooks/useBlockchain';
import logo from '@/assets/Logo.png';

// Import Document Card from EmployeeDashboard
import EmployeeDashboard from './EmployeeDashboard';

// Define document interface for better type checking
interface Document {
  id: string;
  title: string;
  sector: string;
  date?: string;
  created_at?: string;
  upload_date?: string;
  description?: string;
  classification: string;
  fileType?: string;
  file_type?: string;
  fileSize?: string;
  file_size?: string;
  ipfs_hash?: string;
  is_classified: boolean;
}

// Add these interfaces near the top with other interfaces
interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  upload_date?: string;
}

// Mock users
const mockUsers = [
  { id: 1, name: "John Smith", department: "Defense", role: "Document Manager", lastActive: "2024-04-10" },
  { id: 2, name: "Sarah Johnson", department: "Finance", role: "Analyst", lastActive: "2024-04-11" },
  { id: 3, name: "David Williams", department: "Foreign Affairs", role: "Document Manager", lastActive: "2024-04-09" },
  { id: 4, name: "Maria Garcia", department: "Health", role: "Supervisor", lastActive: "2024-04-08" },
];

const AdminDashboard = () => {
  // State hooks
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedClassification, setSelectedClassification] = useState('all');
  const [activeTab, setActiveTab] = useState('documents');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [blockchainType, setBlockchainType] = useState('private');
  const [documentSector, setDocumentSector] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Other hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, walletAddress, isGanache, isLoading: blockchainLoading, connect, disconnect } = useBlockchain('admin');
  
  // Authentication effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          // Try to sign in with default admin credentials
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@gmail.com',
            password: '12345678',
          });
          
          if (signInError) {
            console.error('Authentication error:', signInError);
            setShowLoginForm(true);
            return;
          }
          
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setShowLoginForm(true);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginCredentials.email || 'admin@gmail.com',
        password: loginCredentials.password || '12345678',
      });

      if (error) throw error;

      setIsAuthenticated(true);
      setShowLoginForm(false);
      toast({
        title: "Login Successful",
        description: "Welcome to the Admin Dashboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials",
      });
    }
  };

  // Document fetching effect
  useEffect(() => {
    if (isAuthenticated) {
      const fetchDocuments = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('upload_date', { ascending: false });
            
          if (error) throw error;
          
          setDocuments(data || []);
        } catch (error) {
          console.error('Error fetching documents:', error);
          toast({
            variant: "destructive",
            title: "Failed to Load Documents",
            description: "There was an error loading the documents.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchDocuments();
    }
  }, [isAuthenticated, toast]);

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesSector = selectedSector === 'all' || doc.sector === selectedSector;
    const matchesClassification = selectedClassification === 'all' || 
                                  (selectedClassification === 'Classified' && doc.classification === 'Classified') ||
                                  (selectedClassification === 'Declassified' && doc.classification === 'Declassified');
    return matchesSearch && matchesSector && matchesClassification;
  });

  // Sort documents by date (newest first)
  const sortedByDate = [...filteredDocuments].sort((a, b) => {
    const dateA = a.upload_date ? new Date(a.upload_date).getTime() : 0;
    const dateB = b.upload_date ? new Date(b.upload_date).getTime() : 0;
    return dateB - dateA;
  });

  // Group documents by sector with proper typing
  const groupedBySector: Record<string, Document[]> = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.sector]) {
      acc[doc.sector] = [];
    }
    acc[doc.sector].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  useEffect(() => {
    console.log('Upload Button State:', {
      selectedFile: selectedFile ? 'Selected' : 'Not Selected', 
      documentSector,
      documentTitle,
      isDisabled: !selectedFile || !documentSector || !documentTitle
    });
  }, [selectedFile, documentSector, documentTitle]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event:', e.target.files);
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      console.log('Selected file:', e.target.files[0].name);
    }
  };

  // Only allow upload if authenticated
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upload documents.",
      });
      navigate('/login');
      return;
    }

    if (!selectedFile || !documentTitle || !documentSector) return;

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // Check if PINATA JWT is configured
      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error('Pinata JWT token is not configured. Please check your .env file.');
      }

      // Upload to IPFS
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('Attempting to upload to IPFS...');
      const ipfsResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`
        },
        body: formData
      });
      
      if (!ipfsResponse.ok) {
        const errorData = await ipfsResponse.text();
        console.error('IPFS Upload Error:', {
          status: ipfsResponse.status,
          statusText: ipfsResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to upload to IPFS: ${ipfsResponse.status} ${ipfsResponse.statusText}`);
      }
      
      const ipfsData = await ipfsResponse.json();
      console.log('IPFS Upload Success:', ipfsData);
      const ipfsHash = ipfsData.IpfsHash;

      // Upload to Supabase
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title: documentTitle,
            sector: documentSector,
            description: `Document uploaded by administrator.`,
            file_type: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
            file_size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
            ipfs_hash: ipfsHash,
            uploaded_by: session.user.id,
            is_classified: blockchainType === 'both' ? false : true,
            chain_type: blockchainType,
            upload_date: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      setDocuments([...documents, ...data]);
      setDocumentTitle('');
      setDocumentSector('');
      setSelectedFile(null);
      setBlockchainType('private');
      setUploadDialogOpen(false);
      
      toast({
        title: "Document Uploaded Successfully",
        description: "The document has been added to the blockchain.",
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "There was an error uploading the document.",
      });
    }
  };
  
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address (e.g., name@domain.com)",
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }
    
    try {
      // Create user in auth - the database trigger will handle users table insertion
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            username: newUser.username,
            role: 'employee'
          }
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      toast({
        title: "User Created Successfully",
        description: "Account created for " + newUser.name + ". They can now log in with their email and password.",
      });
      
      setAddUserDialogOpen(false);
      setNewUser({
        name: '',
        username: '',
        email: '',
        password: ''
      });

      // Refresh the users list
      fetchUsers();
      
    } catch (error: any) {
      console.error('User creation error:', error);
      
      // Provide more specific error messages
      let errorMessage = "There was an error creating the user.";
      if (error.message?.includes("duplicate key") || error.message?.includes("already registered")) {
        errorMessage = "A user with this email already exists.";
      } else if (error.message?.includes("invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes("password")) {
        errorMessage = "Password must be at least 6 characters long.";
      }
      
      toast({
        variant: "destructive",
        title: "User Creation Failed",
        description: errorMessage,
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      // Get the current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // First delete from users table
      const { error: deleteProfileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteProfileError) {
        console.error('Error deleting user profile:', deleteProfileError);
        throw deleteProfileError;
      }

      // Then delete the auth user using RPC
      const { error: deleteAuthError } = await supabase
        .rpc('delete_user', { user_id: userId });

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        throw deleteAuthError;
      }

      toast({
        title: "User Deleted",
        description: `User ${userEmail} has been successfully deleted.`,
      });

      // Refresh the users list
      fetchUsers();

    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        variant: "destructive",
        title: "Failed to Delete User",
        description: error.message || "There was an error deleting the user.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear admin-specific data
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear any other stored user data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  // Add this function after the state declarations
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setUsers(users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Failed to Load Users",
        description: "There was an error loading the user list.",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Add this useEffect after other useEffects
  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, activeTab]);

  // Render login form if not authenticated
  if (showLoginForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={loginCredentials.email}
                  onChange={(e) => setLoginCredentials({...loginCredentials, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gov-gray-light">
      {/* Header */}
      <header className="bg-gov-navy text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NationLedger Logo" className="w-10 h-10" />
            <span className="text-xl font-bold">NationLedger</span>
            <span className="text-sm bg-gov-burgundy rounded-full px-3 py-1 ml-2">Admin Portal</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                  <span className="text-xs text-gray-300">
                    {isGanache ? 'Connected to Ganache' : 'Wrong Network'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={disconnect} className="text-white hover:bg-white/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={connect} 
                disabled={blockchainLoading}
                className="text-white hover:bg-white/10"
              >
                {blockchainLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Admin Dashboard</CardTitle>
                <CardDescription>System management portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    className="w-full justify-start bg-gov-teal hover:bg-gov-teal/90"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                  
                  <Button 
                    className="w-full justify-start bg-gov-burgundy hover:bg-gov-burgundy/90"
                    onClick={() => setAddUserDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button 
                    variant={activeTab === 'documents' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('documents')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </Button>
                  
                  <Button 
                    variant={activeTab === 'users' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </Button>
                  
                  <Button 
                    variant={activeTab === 'analytics' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <PieChart className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </div>
                
                {activeTab === 'documents' && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Filters</p>
                      <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="Classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Documents</SelectItem>
                          <SelectItem value="Classified">Classified Only</SelectItem>
                          <SelectItem value="Declassified">Declassified Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="Select Sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sectors</SelectItem>
                          <SelectItem value="Defense">Defense</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Foreign Affairs">Foreign Affairs</SelectItem>
                          <SelectItem value="Health">Health</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder={activeTab === 'users' ? "Search users..." : "Search documents..."}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                  <Link to="/documents">
                    <FileText className="mr-2 h-4 w-4" />
                    Public Document View
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Blockchain Explorer
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  System Logs
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-bold text-gov-navy mb-2">Administration Portal</h1>
              <p className="text-gray-600">
                Welcome to the admin dashboard. Manage documents, users, and system settings.
              </p>
            </div>
            
            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <Tabs defaultValue="date" className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="date" className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>By Date</span>
                    </TabsTrigger>
                    <TabsTrigger value="sector" className="flex items-center gap-1">
                      <Shield size={16} />
                      <span>By Sector</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Showing {filteredDocuments.length} documents
                    </p>
                  </div>
                </div>
                
                <TabsContent value="date" className="space-y-8">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Loading documents...</p>
                    </div>
                  ) : sortedByDate.length > 0 ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {sortedByDate.map(doc => (
                        <DocumentCard key={doc.id} document={doc} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No documents found matching your criteria.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="sector">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Loading documents...</p>
                    </div>
                  ) : Object.keys(groupedBySector).length > 0 ? (
                    <div>
                      {Object.entries(groupedBySector).map(([sector, docs]) => (
                        <div key={sector} className="mb-12">
                          <h2 className="text-xl font-bold text-gov-navy mb-6 flex items-center">
                            <Shield className="mr-2 h-5 w-5" />
                            {sector} Sector
                          </h2>
                          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {docs.map(doc => (
                              <DocumentCard key={doc.id} document={doc} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No documents found matching your criteria.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gov-navy">User Management</h2>
                  <Button 
                    size="sm" 
                    onClick={() => setAddUserDialogOpen(true)}
                    className="bg-gov-burgundy hover:bg-gov-burgundy/90"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New User
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Email</th>
                          <th className="text-left p-4">Role</th>
                          <th className="text-left p-4">Created At</th>
                          <th className="text-left p-4">Last Active</th>
                          <th className="text-right p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingUsers ? (
                          <tr>
                            <td colSpan={5} className="text-center p-4">
                              Loading users...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-4">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">{user.email}</td>
                              <td className="p-4">{user.role}</td>
                              <td className="p-4">{new Date(user.upload_date).toLocaleDateString()}</td>
                              <td className="p-4">
                                {user.last_sign_in_at 
                                  ? new Date(user.last_sign_in_at).toLocaleDateString()
                                  : 'Never'
                                }
                              </td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="sm">Edit</Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this user?')) {
                                      handleDeleteUser(user.id, user.email).then(() => {
                                        fetchUsers(); // Refresh the list after deletion
                                      });
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-bold text-gov-navy mb-6">System Analytics</h2>
                
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  <StatCard 
                    title="Total Documents" 
                    value={documents.length.toString()} 
                    description="Documents on the blockchain" 
                    icon={<FileText className="h-5 w-5" />}
                    color="bg-gov-teal"
                  />
                  <StatCard 
                    title="Classified Documents" 
                    value={documents.filter(d => d.classification === "Classified").length.toString()} 
                    description="Private blockchain only" 
                    icon={<AlertCircle className="h-5 w-5" />}
                    color="bg-gov-burgundy"
                  />
                  <StatCard 
                    title="Active Users" 
                    value={mockUsers.length.toString()} 
                    description="Government employees" 
                    icon={<Users className="h-5 w-5" />}
                    color="bg-gov-navy"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents by Sector</CardTitle>
                      <CardDescription>Distribution across government sectors</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p>Sector distribution chart would render here</p>
                        <p className="text-sm">(In the actual app, this would show a chart)</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Activity</CardTitle>
                      <CardDescription>Weekly document uploads</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p>Activity timeline would render here</p>
                        <p className="text-sm">(In the actual app, this would show a chart)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>
              Add a new document to the blockchain. Select which blockchain to store it on and provide document details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input 
                id="doc-title" 
                placeholder="Enter the document title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Blockchain Storage</Label>
              <RadioGroup value={blockchainType} onValueChange={setBlockchainType}>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="private" className="font-medium">
                      Private Blockchain Only
                    </Label>
                    <p className="text-sm text-gray-500">
                      Document will be classified and only visible to government employees.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 mt-3">
                  <RadioGroupItem value="both" id="both" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="both" className="font-medium">
                      Both Private & Public Blockchains
                    </Label>
                    <p className="text-sm text-gray-500">
                      Document will be declassified and visible to the public.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="doc-sector">Document Sector</Label>
              <Select value={documentSector} onValueChange={setDocumentSector} required>
                <SelectTrigger id="doc-sector">
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Defense">Defense</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Foreign Affairs">Foreign Affairs</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload Document</Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                required
              />
              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, TXT (Max: 10MB)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !documentSector || !documentTitle}
              className="bg-gov-teal hover:bg-gov-teal/90"
            >
              Upload to Blockchain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Government User</DialogTitle>
            <DialogDescription>
              Create credentials for a new government employee to access the private blockchain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input 
                id="user-name" 
                placeholder="Enter full name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Create a username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input 
                id="user-email" 
                type="email"
                placeholder="Enter email address"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input 
                id="user-password" 
                type="password"
                placeholder="Create a password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddUser} 
              disabled={!newUser.name || !newUser.username || !newUser.email || !newUser.password}
              className="bg-gov-burgundy hover:bg-gov-burgundy/90"
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, description, icon, color }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`${color} rounded-full p-3 text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DocumentCardProps {
  document: Document;
}

const DocumentCard = ({ document }: DocumentCardProps) => {
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const getIpfsUrl = (hash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  };
  
  const isClassified = document.is_classified;
  const { toast } = useToast();
  
  const handleViewDocument = () => {
    console.log('View document clicked:', document.id);
    
    if (document.ipfs_hash) {
      const ipfsUrl = getIpfsUrl(document.ipfs_hash);
      window.open(ipfsUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening Document",
        description: "The document will open in a new tab.",
      });
    } else {
      toast({
        title: "Document Not Available",
        description: "This document has not been processed for viewing yet.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow ${isClassified ? 'border-l-4 border-l-gov-burgundy' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-gov-navy text-lg">{document.title}</CardTitle>
            <CardDescription className="text-sm">
              {document.sector} • {formatDate(document.date || document.upload_date)}
            </CardDescription>
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isClassified ? 'bg-gov-burgundy/10' : 'bg-gov-gray-light'}`}>
            {isClassified ? (
              <AlertCircle className="h-5 w-5 text-gov-burgundy" />
            ) : (
              <FileText className="h-5 w-5 text-gov-navy" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">{document.description || 'No description available.'}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="bg-gov-gray-medium/30 rounded-full px-2 py-1 text-xs text-gray-500">{document.fileType || document.file_type}</span>
          <span className="text-xs text-gray-500">{document.fileSize || document.file_size}</span>
          {isClassified ? (
            <span className="ml-auto text-xs bg-gov-burgundy/10 text-gov-burgundy px-2 py-1 rounded-full font-medium">
              Classified
            </span>
          ) : (
            <span className="ml-auto text-xs bg-gov-teal/10 text-gov-teal px-2 py-1 rounded-full font-medium">
              Declassified
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-gov-teal border-gov-teal/50 hover:bg-gov-teal/10"
          onClick={handleViewDocument}
        >
          <FileText className="mr-2 h-4 w-4" />
          View Document
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminDashboard;
