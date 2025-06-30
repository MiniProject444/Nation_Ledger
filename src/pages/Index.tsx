import React from 'react';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  FileText, 
  Lock, 
  Search, 
  UserPlus, 
  FileCheck, 
  Download,
  Upload,
  LogIn
} from 'lucide-react';
import { LoginDialog } from '@/components/auth/LoginDialog';
import logo from '@/assets/Logo.png';
import { Link } from 'react-router-dom';

const Index = () => {
  const [loginOpen, setLoginOpen] = React.useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gov-navy text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NationLedger Logo" className="w-10 h-10" />
            <span className="text-xl font-bold">NationLedger</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10">
              <Link to="/documents">
                <FileText className="mr-2 h-4 w-4" />
                View Documents
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10">
              <Link to="/help">Help</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10">
              <Link to="/about">About</Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setLoginOpen(true)}>
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gov-navy text-white py-20">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Transparent Government Through Blockchain Technology
              </h1>
              <p className="text-lg text-gray-300">
                NationLedger provides secure, immutable, and transparent access to government documents,
                ensuring accountability and building public trust.
              </p>
              <div className="pt-4">
                <Button 
                  onClick={() => setLoginOpen(true)} 
                  size="lg" 
                  className="bg-white text-gov-navy hover:bg-gray-100"
                >
                  Get Started
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center animate-fade-in animate-delay-300">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-gov-teal rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-10 bg-gov-burgundy rounded-full opacity-20 animate-pulse delay-700"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-32 h-32 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 bg-gov-gray-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gov-navy mb-4">How NationLedger Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our dual blockchain architecture ensures security for classified documents while providing
                transparency for declassified information.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="h-10 w-10 text-gov-navy" />,
                  title: "Private Blockchain",
                  description: "Secure storage of all government documents with controlled access for authorized personnel."
                },
                {
                  icon: <FileText className="h-10 w-10 text-gov-teal" />,
                  title: "Public Blockchain",
                  description: "Transparent access to declassified documents for citizens to view and verify."
                },
                {
                  icon: <Lock className="h-10 w-10 text-gov-burgundy" />,
                  title: "Document Authentication",
                  description: "Cryptographic verification ensures document integrity and prevents tampering."
                }
              ].map((feature, index) => (
                <Card key={index} className="border border-gray-200 animate-fade-in animate-delay-300">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gov-navy">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* User Roles Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gov-navy mb-4">User Roles & Capabilities</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                NationLedger serves different stakeholders with tailored access and capabilities.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Search className="h-10 w-10 text-gray-600" />,
                  title: "Public Users",
                  description: "View and download declassified documents. Verify document authenticity.",
                  actions: ["View declassified documents", "Download files", "Verify document authenticity"]
                },
                {
                  icon: <FileCheck className="h-10 w-10 text-gov-teal" />,
                  title: "Government Employees",
                  description: "Upload and manage documents on the blockchain with secure access credentials.",
                  actions: ["Access all documents", "Upload new documents", "Choose document classification"]
                },
                {
                  icon: <UserPlus className="h-10 w-10 text-gov-burgundy" />,
                  title: "System Administrators",
                  description: "Manage user access and overall system governance.",
                  actions: ["Create employee credentials", "Upload documents", "Manage the entire system"]
                }
              ].map((role, index) => (
                <Card key={index} className="border border-gray-200 animate-fade-in animate-delay-400">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gov-gray-light shadow-sm">
                      {role.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gov-navy">{role.title}</h3>
                    <p className="text-gray-600 mb-4">{role.description}</p>
                    <ul className="space-y-2">
                      {role.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="mt-1 min-w-4">
                            <div className="w-1 h-1 bg-gov-teal rounded-full"></div>
                          </div>
                          <span className="text-sm text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gov-teal text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to explore government documents?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Access declassified documents or log in as an authorized user to manage the system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-gov-teal"
                onClick={() => setLoginOpen(true)}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Button>
              <Button 
                variant="default" 
                size="lg"
                className="bg-white text-gov-teal hover:bg-gray-100"
                asChild
              >
                <a href="/documents">
                  <Download className="mr-2 h-4 w-4" />
                  View Public Documents
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
};

export default Index;
