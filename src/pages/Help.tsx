
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, HelpCircle, Users, ShieldCheck, Globe } from 'lucide-react';

const Help = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12 bg-gov-gray-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gov-navy mb-2">Help Center</h1>
            <p className="text-gray-600 mb-8">Find answers to common questions about NationLedger</p>
            
            <Tabs defaultValue="faq" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="faq" className="flex items-center gap-1 py-3">
                  <HelpCircle className="h-4 w-4" />
                  <span>FAQs</span>
                </TabsTrigger>
                <TabsTrigger value="public" className="flex items-center gap-1 py-3">
                  <Globe className="h-4 w-4" />
                  <span>Public Users</span>
                </TabsTrigger>
                <TabsTrigger value="employees" className="flex items-center gap-1 py-3">
                  <Users className="h-4 w-4" />
                  <span>Employees</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1 py-3">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="faq">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Common questions about the NationLedger platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>What is NationLedger?</AccordionTrigger>
                        <AccordionContent>
                          NationLedger is a blockchain-based platform that enables transparent sharing of 
                          declassified government documents with the public. It uses a dual blockchain 
                          architecture to maintain security for classified information while providing 
                          transparency for declassified documents.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2">
                        <AccordionTrigger>How does blockchain ensure document authenticity?</AccordionTrigger>
                        <AccordionContent>
                          Blockchain technology creates an immutable record of documents. Each document is 
                          cryptographically secured and every change is recorded in the blockchain. This 
                          allows for verification of document authenticity and prevents tampering.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3">
                        <AccordionTrigger>What's the difference between the public and private blockchain?</AccordionTrigger>
                        <AccordionContent>
                          The private blockchain is accessible only to authorized government employees and contains
                          both classified and declassified documents. The public blockchain contains only 
                          declassified documents and is accessible to the general public for transparency.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-4">
                        <AccordionTrigger>How can I verify a document's authenticity?</AccordionTrigger>
                        <AccordionContent>
                          You can use the "Verify Document" feature in the Public Documents section. 
                          Upload a document you received, and the system will check its cryptographic hash
                          against the records on the blockchain to verify its authenticity.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-5">
                        <AccordionTrigger>Who manages the NationLedger system?</AccordionTrigger>
                        <AccordionContent>
                          NationLedger is administered by authorized government personnel. The main administrator 
                          controls user access and system settings, while government employees can upload and
                          manage documents within the system.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="public">
                <Card>
                  <CardHeader>
                    <CardTitle>Public User Guide</CardTitle>
                    <CardDescription>
                      How to access and verify declassified documents as a member of the public
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gov-teal" />
                        Viewing Declassified Documents
                      </h3>
                      <p className="text-gray-600">
                        Navigate to the "View Documents" section from the main navigation bar. 
                        This will take you to the public document repository where you can browse all 
                        declassified documents.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 pl-4">
                        <li>Use filters to narrow down documents by sector</li>
                        <li>Use the search feature to find specific documents</li>
                        <li>View documents organized by date or sector</li>
                        <li>Download documents for offline viewing</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-gov-teal" />
                        Verifying Document Authenticity
                      </h3>
                      <p className="text-gray-600">
                        If you've received a document and want to verify its authenticity against the 
                        official government records:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-4">
                        <li>Click the "Verify Document Authenticity" button in the Documents page</li>
                        <li>Upload the document you want to verify</li>
                        <li>The system will compare the document's hash with the blockchain record</li>
                        <li>You'll receive verification of whether it matches official records</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gov-gray-light p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">Important Note</h3>
                      <p className="text-gray-600">
                        All documents available to the public have been declassified by authorized 
                        government personnel. The blockchain ensures that these documents cannot be 
                        altered after publication, guaranteeing their authenticity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="employees">
                <Card>
                  <CardHeader>
                    <CardTitle>Government Employee Guide</CardTitle>
                    <CardDescription>
                      How to use NationLedger as an authorized government employee
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Users className="h-5 w-5 text-gov-teal" />
                        Accessing Your Account
                      </h3>
                      <p className="text-gray-600">
                        To access your government employee account:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-4">
                        <li>Click "Get Started" in the navigation bar</li>
                        <li>Select "Government Employee" from the login options</li>
                        <li>Enter your credentials (provided by your administrator)</li>
                        <li>Access your employee dashboard</li>
                      </ol>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gov-teal" />
                        Adding Documents
                      </h3>
                      <p className="text-gray-600">
                        As a government employee, you can add new documents to the blockchain:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-4">
                        <li>From your dashboard, click "Add Document"</li>
                        <li>Select whether to store the document on the private blockchain only (classified) or both private and public blockchains (declassified)</li>
                        <li>Select the appropriate sector for the document</li>
                        <li>Upload the document file</li>
                        <li>Submit to add the document to the blockchain</li>
                      </ol>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-gov-teal" />
                        Security Responsibilities
                      </h3>
                      <p className="text-gray-600">
                        As a government employee with access to sensitive information:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 pl-4">
                        <li>Never share your login credentials with anyone</li>
                        <li>Always verify the classification of documents before uploading</li>
                        <li>Double-check that classified documents are only stored on the private blockchain</li>
                        <li>Report any security concerns to your administrator immediately</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Information</CardTitle>
                    <CardDescription>
                      How NationLedger uses blockchain to ensure document security and authenticity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-gov-teal" />
                        Blockchain Security
                      </h3>
                      <p className="text-gray-600">
                        NationLedger leverages blockchain technology to provide security benefits:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 pl-4">
                        <li><strong>Immutability:</strong> Once a document is added to the blockchain, it cannot be altered or deleted</li>
                        <li><strong>Cryptographic verification:</strong> Each document is secured with cryptographic hashes</li>
                        <li><strong>Distributed ledger:</strong> The blockchain creates a distributed record that prevents single points of failure</li>
                        <li><strong>Transparent audit trail:</strong> All actions are recorded and traceable</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Globe className="h-5 w-5 text-gov-teal" />
                        Dual Blockchain Architecture
                      </h3>
                      <p className="text-gray-600">
                        NationLedger uses a dual blockchain architecture for security:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 pl-4">
                        <li><strong>Private Blockchain:</strong> Permissioned access only for authorized government personnel</li>
                        <li><strong>Public Blockchain:</strong> Contains only declassified documents for public consumption</li>
                        <li><strong>Separation of concerns:</strong> Ensures classified documents remain secure</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Users className="h-5 w-5 text-gov-teal" />
                        Access Controls
                      </h3>
                      <p className="text-gray-600">
                        NationLedger implements strict access controls:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 pl-4">
                        <li><strong>Role-based access:</strong> Different user types have different permissions</li>
                        <li><strong>Centralized credential management:</strong> Only administrators can create employee accounts</li>
                        <li><strong>Secure authentication:</strong> Advanced authentication mechanisms protect access</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gov-gray-light p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">Security Reporting</h3>
                      <p className="text-gray-600">
                        If you discover a security vulnerability or concern, please contact the system 
                        administrator immediately. Security is a shared responsibility for all users 
                        of the NationLedger platform.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Help;
