import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Upload, FileText, Calendar, Shield, Search, CheckCircle, XCircle, Loader2, Eye, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { supabase, getIpfsUrl, getDocumentPreviewUrl } from '@/integrations/supabase/client';
import logo from '@/assets/Logo.png';

interface Document {
  id: string;
  title: string;
  sector: string;
  date: string;
  created_at?: string;
  upload_date?: string;
  description: string;
  fileType: string;
  file_type?: string;
  fileSize: string;
  file_size?: string;
  ipfs_hash?: string;
}

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIpfs, setProcessingIpfs] = useState<string[]>([]);
  const { toast } = useToast();
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [blockchainType, setBlockchainType] = useState<'public' | 'private'>('public');

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('is_classified', false)
          .order('upload_date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        console.log('Fetched documents:', data);
        
        const transformedData = data.map(doc => ({
          id: doc.id,
          title: doc.title,
          sector: doc.sector,
          date: doc.upload_date,
          created_at: doc.upload_date,
          description: doc.description || '',
          fileType: doc.file_type,
          file_type: doc.file_type,
          fileSize: doc.file_size,
          file_size: doc.file_size,
          ipfs_hash: doc.ipfs_hash
        }));
        
        console.log('Transformed documents:', transformedData);
        setDocuments(transformedData);

        const docsWithoutIpfs = transformedData.filter(doc => !doc.ipfs_hash);
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
    
    fetchDocuments();

    const documentsSubscription = supabase
      .channel('documents-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'documents' 
      }, (payload) => {
        console.log('Document updated:', payload);
        fetchDocuments();
      })
      .subscribe();

    return () => {
      documentsSubscription.unsubscribe();
    };
  }, [toast]);

  const processDocumentForIpfs = async (docId: string) => {
    try {
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();
      
      if (docError || !docData) {
        console.error('Error fetching document details:', docError);
        return;
      }

      console.log(`Processing document ${docId} for IPFS`);
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log('Creating anonymous session for IPFS processing');
      }

      setProcessingIpfs(prev => [...prev, docId]);

      const response = await supabase.functions.invoke('ipfs-upload', {
        body: {
          method: 'UPLOAD',
          id: docId,
          fileId: docData.id,
          fileName: docData.title
        }
      });

      console.log('IPFS upload response:', response);

      if (response.error) {
        console.error('Error processing document for IPFS:', response.error);
        toast({
          title: "IPFS Processing Error",
          description: "There was an error processing the document for IPFS.",
          variant: "destructive"
        });
        setProcessingIpfs(prev => prev.filter(id => id !== docId));
      } else {
        const cid = response.data?.cid;
        
        if (cid) {
          console.log(`Received CID from IPFS: ${cid}`);
          
          const { error: updateError } = await supabase
            .from('documents')
            .update({ ipfs_hash: cid })
            .eq('id', docId);
            
          if (updateError) {
            console.error('Error updating document with IPFS hash:', updateError);
          } else {
            console.log(`Successfully updated document ${docId} with IPFS hash ${cid}`);
            
            setDocuments(prev => prev.map(doc => 
              doc.id === docId ? {
                ...doc,
                ipfs_hash: cid
              } : doc
            ));

            toast({
              title: "Document Processed",
              description: "The document has been successfully stored on IPFS.",
            });
          }
        } else {
          console.error('No CID returned from IPFS upload function');
        }
        
        setProcessingIpfs(prev => prev.filter(id => id !== docId));
      }
    } catch (error) {
      console.error('Error in IPFS processing:', error);
      setProcessingIpfs(prev => prev.filter(id => id !== docId));
      toast({
        title: "IPFS Processing Error",
        description: "There was an error processing the document for IPFS.",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'all' || doc.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const sortedByDate = [...filteredDocuments].sort((a, b) => 
    new Date(b.date || b.upload_date || '').getTime() - new Date(a.date || a.upload_date || '').getTime()
  );

  const groupedBySector = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.sector]) {
      acc[doc.sector] = [];
    }
    acc[doc.sector].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const handleViewOnIpfs = async (doc: Document) => {
    console.log('Attempting to view document with IPFS hash:', doc.ipfs_hash);
    
    setPreviewTitle(doc.title);
    setPreviewLoading(true);
    setPreviewDialogOpen(true);
    
    if (doc.ipfs_hash) {
      try {
        const previewUrl = getDocumentPreviewUrl(doc.ipfs_hash);
        console.log('Generated preview URL:', previewUrl);
        setPreviewUrl(previewUrl);
        
        toast({
          title: "Document Loaded",
          description: "The document is being prepared for viewing.",
        });
      } catch (error) {
        console.error('Error generating preview URL:', error);
        toast({
          title: "Failed to load document",
          description: "There was an error accessing the document on IPFS.",
          variant: "destructive"
        });
      } finally {
        setPreviewLoading(false);
      }
    } else {
      toast({
        title: "Processing Document",
        description: "Preparing document for IPFS access. Please wait...",
      });
      
      await processDocumentForIpfs(doc.id);
      
      const { data } = await supabase
        .from('documents')
        .select('ipfs_hash')
        .eq('id', doc.id)
        .single();
        
      if (data?.ipfs_hash) {
        const previewUrl = getDocumentPreviewUrl(data.ipfs_hash);
        setPreviewUrl(previewUrl);
      } else {
        toast({
          title: "Document Processing Failed",
          description: "Unable to process document for viewing. Please try again later.",
          variant: "destructive"
        });
      }
      
      setPreviewLoading(false);
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    if (doc.ipfs_hash) {
      const directUrl = getIpfsUrl(doc.ipfs_hash);
      console.log('Downloading document from URL:', directUrl);
      
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = doc.title || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your document is being downloaded.",
      });
    } else {
      toast({
        title: "Document Not Ready",
        description: "Please wait for the document to be processed before downloading.",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const calculateSHA256 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleVerify = async () => {
    if (!selectedFile) return;
    
    setVerificationResult(null);
    
    toast({
      title: "Verification Started",
      description: "Checking document authenticity against blockchain records...",
    });
    
    try {
      // Get all documents from the database
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (!documents || documents.length === 0) {
        setVerificationResult(false);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "No documents found in our records.",
        });
        return;
      }

      // Read the uploaded file content
      const fileContent = await selectedFile.text();
      console.log('Uploaded file content:', fileContent.substring(0, 100) + '...');

      // Try to fetch and compare content from each document's IPFS hash
      let isVerified = false;
      for (const doc of documents) {
        if (doc.ipfs_hash) {
          try {
            const ipfsUrl = getIpfsUrl(doc.ipfs_hash);
            console.log('Fetching content from IPFS:', ipfsUrl);
            
            const response = await fetch(ipfsUrl);
            const ipfsContent = await response.text();
            console.log('IPFS content:', ipfsContent.substring(0, 100) + '...');

            // Compare the content
            if (fileContent === ipfsContent) {
              isVerified = true;
              console.log('Content match found with document:', doc.title);
              break;
            }
          } catch (error) {
            console.error('Error fetching IPFS content:', error);
          }
        }
      }

      console.log('Verification result:', isVerified);
      setVerificationResult(isVerified);
      
      if (isVerified) {
        toast({
          title: "Document Verified",
          description: "This document is authentic and matches our blockchain records.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "This document does not match our blockchain records or has been modified.",
        });
      }
      
      setVerifyDialogOpen(true);
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "There was an error verifying the document.",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !sector || !date) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields and select a file.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get file extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      
      // Validate file type
      if (!['pdf', 'doc', 'docx', 'txt'].includes(fileExtension)) {
        throw new Error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.');
      }

      // Create a unique file path
      const timestamp = new Date().getTime();
      const filePath = `${sector}/${timestamp}-${selectedFile.name}`;

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Insert document record into the database
      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            title,
            sector,
            date,
            description,
            file_type: fileExtension,
            file_size: formatFileSize(selectedFile.size),
            file_url: publicUrl,
            is_classified: blockchainType === 'private', // Set classified based on blockchain type
            ipfs_hash: null // Will be updated after IPFS processing
          }
        ]);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Upload Successful",
        description: "Your document has been uploaded and will be processed for blockchain storage.",
      });

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setSector('');
      setDate('');
      setDescription('');
      setUploadDialogOpen(false);
      setUploadProgress(100);

      // Refresh documents list
      const { data: newDocuments, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setDocuments(newDocuments || []);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your document.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any stored user data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gov-navy text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NationLedger Logo" className="w-10 h-10" />
            <span className="text-xl font-bold">NationLedger</span>
            <span className="text-sm bg-gov-teal rounded-full px-3 py-1 ml-2">Public Documents</span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      
      <main className="flex-grow">
        <section className="bg-gov-navy py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Public Document Repository</h1>
              <p className="text-lg text-gray-300 mb-8">
                Browse, search, and download declassified government documents. 
                All documents are securely stored on the blockchain for authenticity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search documents..."
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
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
              
              <Button 
                className="bg-white text-gov-navy hover:bg-gray-100"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Verify Document Authenticity
              </Button>
            </div>
          </div>
        </section>
        
        <section className="py-12 bg-gov-gray-light">
          <div className="container mx-auto px-4">
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
                
                <p className="text-sm text-gray-500">
                  Showing {filteredDocuments.length} declassified documents
                </p>
              </div>
              
              <TabsContent value="date" className="space-y-8">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading documents...</p>
                  </div>
                ) : sortedByDate.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedByDate.map(doc => (
                      <DocumentCard 
                        key={doc.id} 
                        document={doc} 
                        onView={() => handleViewOnIpfs(doc)}
                        onDownload={() => handleDownloadDocument(doc)}
                        isProcessing={processingIpfs.includes(doc.id)}
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
                      <h2 className="text-2xl font-bold text-gov-navy mb-6 flex items-center">
                        <Shield className="mr-2 h-5 w-5" />
                        {sector} Sector
                      </h2>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.map(doc => (
                          <DocumentCard 
                            key={doc.id} 
                            document={doc} 
                            onView={() => handleViewOnIpfs(doc)}
                            onDownload={() => handleDownloadDocument(doc)}
                            isProcessing={processingIpfs.includes(doc.id)}
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
        </section>
      </main>
      
      <Footer />
      
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Verify Document Authenticity</DialogTitle>
            <DialogDescription>
              Upload a document to verify its authenticity against our blockchain records.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Label htmlFor="file-upload">Select Document</Label>
            <Input 
              id="file-upload" 
              type="file" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX, TXT
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleVerify} 
              disabled={!selectedFile}
              className="bg-gov-teal hover:bg-gov-teal/90"
            >
              Verify Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Verification Result</DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            {verificationResult === true && (
              <div className="space-y-4">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h3 className="text-xl font-medium">Document Verified</h3>
                <p className="text-gray-600">
                  This document is authentic and matches our blockchain records.
                </p>
              </div>
            )}
            
            {verificationResult === false && (
              <div className="space-y-4">
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <h3 className="text-xl font-medium">Verification Failed</h3>
                <p className="text-gray-600">
                  This document does not match our blockchain records or has been modified.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setVerifyDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview: {previewTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-grow h-full min-h-[400px]">
            {previewLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-gov-teal" />
                  <p className="mt-2 text-gray-600">Loading document...</p>
                </div>
              </div>
            ) : (
              <>
                {previewUrl ? (
                  <iframe 
                    ref={previewIframeRef}
                    src={previewUrl}
                    className="w-full h-full border-0 rounded"
                    onLoad={() => {
                      try {
                        if (previewIframeRef.current?.contentWindow?.document.body.innerText.includes('simulated document file')) {
                          const content = previewIframeRef.current.contentWindow.document.body.innerText;
                          const formattedContent = content.split('\n').map((line, i) => 
                            `<p class="mb-2">${line}</p>`).join('');
                          
                          if (previewIframeRef.current.contentDocument) {
                            previewIframeRef.current.contentDocument.body.innerHTML = `
                              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6;">
                                <h1 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
                                  ${previewTitle}
                                </h1>
                                <div style="background: #f9f9f9; border-left: 4px solid #ccc; padding: 16px;">
                                  ${formattedContent}
                                </div>
                              </div>
                            `;
                          }
                        }
                      } catch (e) {
                        console.log('Iframe cross-origin restrictions in place, cannot check content');
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <XCircle className="h-10 w-10 mx-auto text-red-500" />
                      <p className="mt-2 text-gray-600">Failed to load document preview</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
            {previewUrl && (
              <Button 
                className="bg-gov-teal hover:bg-gov-teal/90"
                onClick={() => {
                  window.open(previewUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface DocumentCardProps {
  document: Document;
  onView: () => void;
  onDownload: () => void;
  isProcessing: boolean;
}

const DocumentCard = ({ document, onView, onDownload, isProcessing }: DocumentCardProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  console.log('Rendering document card with IPFS hash:', document.ipfs_hash);
  
  return (
    <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-gov-navy text-lg">{document.title}</CardTitle>
            <CardDescription className="text-sm">
              {document.sector} • {formatDate(document.date || document.upload_date)}
            </CardDescription>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gov-gray-light">
            <FileText className="h-5 w-5 text-gov-navy" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">{document.description}</p>
        <div className="mt-4 flex items-center">
          <span className="bg-gov-gray-medium/30 rounded-full px-2 py-1 text-xs text-gray-500">{document.fileType || document.file_type}</span>
          <span className="ml-2 text-xs text-gray-500">{document.fileSize || document.file_size}</span>
          {document.ipfs_hash && (
            <span className="ml-auto text-xs bg-gov-teal/10 text-gov-teal px-2 py-1 rounded-full font-medium flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              On Chain
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-gov-teal border-gov-teal/50 hover:bg-gov-teal/10"
          onClick={onView}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              View
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-gov-navy border-gov-navy/50 hover:bg-gov-navy/10"
          onClick={onDownload}
          disabled={isProcessing || !document.ipfs_hash}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Documents;
