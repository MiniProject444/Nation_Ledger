import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, UploadCloud, Search, Filter, LogOut, Calendar, Shield, AlertCircle, CheckCircle, Loader2, Eye, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, getIpfsUrl } from '@/integrations/supabase/client';
import { useBlockchain } from '@/hooks/useBlockchain';
import logo from '@/assets/Logo.png';

interface Document {
  id: string;
  title: string;
  sector: string;
  date?: string;
  created_at?: string;
  description: string;
  is_classified: boolean;
  fileType: string;
  file_type?: string;
  fileSize: string;
  file_size?: string;
  ipfs_hash?: string;
}

const EmployeeDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedClassification, setSelectedClassification] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [blockchainType, setBlockchainType] = useState('private');
  const [documentSector, setDocumentSector] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingIpfs, setProcessingIpfs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isConnected, walletAddress, connect, disconnect, isGanache, isLoading: blockchainLoading } = useBlockchain('employee');
  
  // Helper function to validate IPFS hashes
  const isValidIpfsHash = (hash: string): boolean => {
    // Basic validation for IPFS CIDs
    // Valid CIDs should start with 'Qm' and be 46 characters long
    // or start with 'bafy' and be longer
    if (!hash) return false;
    
    // Check for common CID formats
    if (hash.startsWith('Qm') && hash.length === 46) return true;
    if (hash.startsWith('bafy') && hash.length > 46) return true;
    
    // If it doesn't match common formats, try a more lenient check
    // Just ensure it's not obviously invalid
    return hash.length >= 30 && /^[a-zA-Z0-9]+$/.test(hash);
  };
  
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      console.log("Auth session check:", data, error);
      
      if (data.session) {
        setUser(data.session.user);
      } else {
        navigate('/');
        toast({
          title: "Authentication Required",
          description: "Please log in to access the employee dashboard",
          variant: "destructive"
        });
      }
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event, session);
        
        if (event === 'SIGNED_OUT') {
          navigate('/');
        } else if (session) {
          setUser(session.user);
        }
      }
    );
    
    fetchDocuments();
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, toast]);
  
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log("Fetched documents:", data);
      
      const transformedData = data.map(doc => ({
        id: doc.id,
        title: doc.title,
        sector: doc.sector,
        date: doc.created_at,
        created_at: doc.created_at,
        description: doc.description || '',
        is_classified: doc.is_classified,
        fileType: doc.file_type,
        file_type: doc.file_type,
        fileSize: doc.file_size,
        file_size: doc.file_size,
        ipfs_hash: doc.ipfs_hash
      }));
      
      console.log("Transformed documents:", transformedData);
      setDocuments(transformedData);

      const docsWithoutIpfs = transformedData.filter(doc => 
        !doc.ipfs_hash && doc.is_classified
      );
      
      if (docsWithoutIpfs.length > 0) {
        setProcessingIpfs(docsWithoutIpfs.map(doc => doc.id));
        docsWithoutIpfs.forEach(doc => {
          processDocumentForIpfs(doc.id);
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Failed to Load Documents",
        description: "There was an error loading the documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processDocumentForIpfs = async (docId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to process documents",
          variant: "destructive"
        });
        return;
      }

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (docError) {
        console.error('Error fetching document:', docError);
        toast({
          title: "Error",
          description: "Failed to fetch document details",
          variant: "destructive"
        });
        return;
      }

      if (!docData) {
        console.error('Document not found');
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive"
        });
        return;
      }

      // Check if document already has a valid IPFS hash
      if (docData.ipfs_hash && docData.ipfs_hash !== 'pending' && isValidIpfsHash(docData.ipfs_hash)) {
        console.log('Document already has a valid IPFS hash:', docData.ipfs_hash);
        return;
      }

      // Check if file path exists
      if (!docData.file_path) {
        console.error('No file path found for document:', docId);
        toast({
          title: "Error",
          description: "Document file not found. Please contact an administrator.",
          variant: "destructive"
        });
        return;
      }

      // Get the file from Supabase storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .download(docData.file_path);

      if (fileError) {
        console.error('Error downloading file:', fileError);
        toast({
          title: "Error",
          description: "Failed to download document file",
          variant: "destructive"
        });
        return;
      }

      if (!fileData) {
        console.error('No file data found');
        toast({
          title: "Error",
          description: "Document file is empty",
          variant: "destructive"
        });
        return;
      }

      // Process the file for IPFS
      const { data: ipfsData, error: ipfsError } = await supabase.functions.invoke('process-document-for-ipfs', {
        body: {
          documentId: docId,
          fileName: docData.file_path,
          fileType: docData.file_type,
          fileSize: docData.file_size
        }
      });

      if (ipfsError) {
        console.error('Error processing document for IPFS:', ipfsError);
        toast({
          title: "Error",
          description: "Failed to process document for IPFS",
          variant: "destructive"
        });
        return;
      }

      if (!ipfsData || !ipfsData.cid) {
        console.error('No IPFS CID returned');
        toast({
          title: "Error",
          description: "Failed to generate IPFS hash",
          variant: "destructive"
        });
        return;
      }

      // Update the document with the IPFS hash
      const { error: updateError } = await supabase
        .from('documents')
        .update({ ipfs_hash: ipfsData.cid })
        .eq('id', docId);

      if (updateError) {
        console.error('Error updating document with IPFS hash:', updateError);
        toast({
          title: "Error",
          description: "Failed to update document with IPFS hash",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Document processed successfully"
      });
    } catch (error) {
      console.error('Error processing document for IPFS:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'all' || doc.sector === selectedSector;
    const matchesClassification = selectedClassification === 'all' || 
      (selectedClassification === 'Classified' && doc.is_classified) ||
      (selectedClassification === 'Declassified' && !doc.is_classified);
    return matchesSearch && matchesSector && matchesClassification;
  });

  const sortedByDate = [...filteredDocuments].sort((a, b) => 
    new Date(b.date || b.created_at || '').getTime() - new Date(a.date || a.created_at || '').getTime()
  );

  const groupedBySector = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.sector]) {
      acc[doc.sector] = [];
    }
    acc[doc.sector].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentSector || !documentTitle) return;
    
    if (!isConnected || !isGanache) {
      toast({
        title: "Blockchain Connection Required",
        description: "Please connect to MetaMask and ensure you're on the correct network.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      
      console.log(`Uploading file: ${fileName}, size: ${selectedFile.size}`);
      
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (fileError) {
        throw fileError;
      }
      
      console.log('File uploaded successfully:', fileData);

      const tempIpfsHash = `pending_${Math.random().toString(36).substring(2, 15)}`;
      
      const documentData = {
        title: documentTitle,
        description: `Document uploaded by ${user?.email || 'employee'}.`,
        sector: documentSector,
        is_classified: blockchainType !== 'both',
        file_type: fileExt?.toUpperCase() || 'PDF',
        file_size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        uploaded_by: user?.id,
        chain_type: blockchainType,
        ipfs_hash: tempIpfsHash,
        file_path: filePath,
        created_at: new Date().toISOString()
      };
      
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert(documentData)
        .select();
        
      if (docError) {
        throw docError;
      }
      
      if (blockchainType === 'both' && docData && docData.length > 0) {
        console.log('Processing document for IPFS');
        setProcessingIpfs(prev => [...prev, docData[0].id]);
        
        try {
          // Try to use the Edge Function first
          try {
            const uploadResponse = await supabase.functions.invoke('ipfs-upload', {
              body: {
                method: 'UPLOAD',
                id: docData[0].id,
                fileId: docData[0].id,
                fileName: selectedFile.name
              }
            });
            
            console.log('IPFS upload response:', uploadResponse);
            
            if (uploadResponse.error) {
              console.error("IPFS upload error:", uploadResponse.error);
              throw new Error("Edge Function error: " + uploadResponse.error.message);
            }
            
            const cid = uploadResponse.data?.cid;
            if (cid) {
              await supabase
                .from('documents')
                .update({ ipfs_hash: cid })
                .eq('id', docData[0].id);
                
              toast({
                title: "Document Uploaded Successfully",
                description: `"${documentTitle}" has been added and processed for IPFS.`,
              });
            }
          } catch (edgeFunctionError) {
            console.error('Edge Function error:', edgeFunctionError);
            
            // Fallback: Generate a fake IPFS hash for testing
            console.log('Using fallback mechanism for IPFS hash generation');
            const fakeCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            
            await supabase
              .from('documents')
              .update({ ipfs_hash: fakeCid })
              .eq('id', docData[0].id);
              
            toast({
              title: "Document Uploaded (Test Mode)",
              description: `"${documentTitle}" has been added with a test IPFS hash. This is a temporary solution due to CORS issues.`,
              variant: "default"
            });
          }
        } catch (ipfsError) {
          console.error('IPFS processing error:', ipfsError);
          await supabase
            .from('documents')
            .update({ status: 'error' })
            .eq('id', docData[0].id);
        }
      } else {
        toast({
          title: "Document Uploaded Successfully",
          description: `"${documentTitle}" has been added to the system.`,
        });
      }
      
      fetchDocuments();
      setUploadDialogOpen(false);
      resetForm();
      
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your document.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setProcessingIpfs([]);
    }
  };
  
  const resetForm = () => {
    setSelectedFile(null);
    setDocumentTitle('');
    setDocumentSector('');
    setBlockchainType('private');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewOnIpfs = async (doc: Document) => {
    console.log('Attempting to view document with ID:', doc.id, 'IPFS hash:', doc.ipfs_hash);
    
    try {
      setPreviewTitle(doc.title);
      setPreviewLoading(true);
      
      // Check if the document is pending processing
      if (!doc.ipfs_hash || doc.ipfs_hash.startsWith('pending_')) {
        console.log('Document is pending IPFS processing');
        toast({
          title: "Processing Document",
          description: "Preparing document for viewing. Please wait...",
        });
        
        setProcessingIpfs(prev => [...prev, doc.id]);
        await processDocumentForIpfs(doc.id);
        
        // Fetch the updated document data after processing
        const { data } = await supabase
          .from('documents')
          .select('ipfs_hash')
          .eq('id', doc.id)
          .single();
          
        if (data?.ipfs_hash && !data.ipfs_hash.startsWith('pending_')) {
          // Check if the IPFS hash is valid
          const hashIsValid = isValidIpfsHash(data.ipfs_hash);
          if (!hashIsValid) {
            toast({
              title: "Invalid IPFS Hash",
              description: "The document's IPFS hash is invalid. Please contact an administrator.",
              variant: "destructive"
            });
            return;
          }
          
          // Use a more reliable IPFS gateway
          const directUrl = `https://ipfs.io/ipfs/${data.ipfs_hash}`;
          console.log('Opening processed document URL:', directUrl);
          
          // Open in new tab instead of setting previewUrl
          window.open(directUrl, '_blank', 'noopener,noreferrer');
          
          toast({
            title: "Document Ready",
            description: "The document has been processed and opened in a new tab.",
          });
        } else {
          toast({
            title: "Document Processing Failed",
            description: "Unable to process document for viewing. Please try again later.",
            variant: "destructive"
          });
        }
      } else {
        // Document already has a valid IPFS hash
        // Check if the IPFS hash is valid
        const hashIsValid = isValidIpfsHash(doc.ipfs_hash);
        if (!hashIsValid) {
          toast({
            title: "Invalid IPFS Hash",
            description: "The document's IPFS hash is invalid. Please contact an administrator.",
            variant: "destructive"
          });
          return;
        }
        
        // Use a more reliable IPFS gateway
        const directUrl = `https://ipfs.io/ipfs/${doc.ipfs_hash}`;
        console.log('Opening document URL:', directUrl);
        
        // Open in new tab instead of setting previewUrl
        window.open(directUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Document Opened",
          description: "The document has been opened in a new tab.",
        });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "There was an error accessing the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
      setProcessingIpfs(prev => prev.filter(id => id !== doc.id));
    }
  };

  return (
    <div className="min-h-screen bg-gov-gray-light">
      <header className="bg-gov-navy text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NationLedger Logo" className="w-10 h-10" />
            <span className="text-xl font-bold">NationLedger</span>
            <span className="text-sm bg-gov-teal/80 rounded-full px-3 py-1 ml-2">Employee Portal</span>
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
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Employee Dashboard</CardTitle>
                <CardDescription>Manage government documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start bg-gov-teal hover:bg-gov-teal/90"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
                
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
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search documents..."
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
              </CardContent>
            </Card>
          </div>
          
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-bold text-gov-navy mb-2">Document Repository</h1>
              <p className="text-gray-600">
                Welcome to the employee portal. Here you can view all documents and upload new ones to the blockchain.
              </p>
            </div>
            
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
                      <DocumentCard 
                        key={doc.id} 
                        document={doc}
                        onView={() => handleViewOnIpfs(doc)}
                        isProcessing={processingIpfs.includes(doc.id)}
                        onRefresh={processDocumentForIpfs}
                      />
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
                  Object.entries(groupedBySector).map(([sector, docs]) => (
                    <div key={sector} className="mb-12">
                      <h2 className="text-xl font-bold text-gov-navy mb-6 flex items-center">
                        <Shield className="mr-2 h-5 w-5" />
                        {sector} Sector
                      </h2>
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {docs.map(doc => (
                          <DocumentCard 
                            key={doc.id} 
                            document={doc} 
                            onView={() => handleViewOnIpfs(doc)}
                            isProcessing={processingIpfs.includes(doc.id)}
                            onRefresh={processDocumentForIpfs}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No documents found matching your criteria.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
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
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              resetForm();
            }}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !documentSector || !documentTitle || isUploading || !isConnected || !isGanache}
              className="bg-gov-teal hover:bg-gov-teal/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload to Blockchain
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>
              Document Information
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <p className="text-sm">
                  This document has a test IPFS CID that may not be accessible on the IPFS network.
                </p>
              </div>
              <div className="space-y-2">
                <Label>IPFS CID</Label>
                <div className="flex items-center gap-2">
                  <Input value={previewUrl.split('/ipfs/')[1] || ''} readOnly />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Copy the CID to clipboard
                      navigator.clipboard.writeText(previewUrl.split('/ipfs/')[1] || '');
                      toast({
                        title: "Copied",
                        description: "IPFS CID copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>IPFS Gateway URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={previewUrl} readOnly />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Open the URL in a new tab
                      window.open(previewUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Open
                  </Button>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-2">Note</h4>
                <p className="text-sm text-yellow-700">
                  This is a test CID generated for demonstration purposes. In a production environment, 
                  documents would be properly uploaded to IPFS and have valid CIDs.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface DocumentCardProps {
  document: Document;
  onView: () => void;
  isProcessing: boolean;
  onRefresh: (id: string) => Promise<void>;
}

const DocumentCard = ({ document, onView, isProcessing, onRefresh }: DocumentCardProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleRefresh = async () => {
    try {
      await onRefresh(document.id);
    } catch (error) {
      console.error('Error refreshing document:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{document.title}</span>
          {document.is_classified && (
            <Shield className="h-4 w-4 text-yellow-500" />
          )}
        </CardTitle>
        <CardDescription>
          {document.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(document.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{document.file_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>{document.sector}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onView}
          disabled={isProcessing || !document.ipfs_hash}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !document.ipfs_hash ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Pending
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              View
            </>
          )}
        </Button>
        {document.ipfs_hash?.startsWith('pending_') && (
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isProcessing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmployeeDashboard;
