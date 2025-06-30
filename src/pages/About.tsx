
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Shield, Users, Globe, LockKeyhole, Check } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gov-navy text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">About NationLedger</h1>
              <p className="text-xl text-gray-300">
                Revolutionizing government transparency with blockchain technology
              </p>
            </div>
          </div>
        </section>
        
        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gov-navy mb-6 text-center">Our Mission</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                NationLedger was established with a fundamental commitment to enhance government transparency 
                while maintaining the necessary security for sensitive information. Our mission is to leverage 
                blockchain technology to create an immutable, verifiable record of government documents that 
                builds public trust through transparency.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mt-4">
                We believe that citizens have a right to access declassified government information in a 
                trustworthy format, while government agencies need secure systems to manage both classified 
                and declassified documents. NationLedger bridges this gap with our innovative dual blockchain 
                architecture.
              </p>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 bg-gov-gray-light">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gov-navy mb-8 text-center">How NationLedger Works</h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gov-navy mb-4">Dual Blockchain Architecture</h3>
                  <p className="text-gray-700">
                    NationLedger operates on a hybrid blockchain model that balances security with transparency:
                  </p>
                  <ul className="mt-4 space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-gov-navy rounded-full p-1 text-white">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gov-navy">Private Blockchain</h4>
                        <p className="text-gray-600 text-sm">
                          A permissioned blockchain accessible only to authorized government employees, 
                          containing both classified and declassified documents.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-gov-teal rounded-full p-1 text-white">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gov-navy">Public Blockchain</h4>
                        <p className="text-gray-600 text-sm">
                          A transparent blockchain containing only declassified documents, 
                          accessible to the general public.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <Card className="shadow-md border-0">
                  <CardContent className="p-0">
                    <div className="bg-gov-navy text-white p-6 rounded-t-lg">
                      <h3 className="text-xl font-semibold mb-2">Document Flow</h3>
                      <p className="text-gray-300 text-sm">
                        How documents move through the NationLedger system
                      </p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-gov-navy font-bold">
                          1
                        </div>
                        <p className="text-gray-700">Government employee creates or uploads document</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-gov-navy font-bold">
                          2
                        </div>
                        <p className="text-gray-700">Document is assigned to appropriate sector</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-gov-navy font-bold">
                          3
                        </div>
                        <p className="text-gray-700">Document classification is determined (classified/declassified)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-gov-navy font-bold">
                          4
                        </div>
                        <p className="text-gray-700">Document is added to private blockchain</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-gov-navy font-bold">
                          5
                        </div>
                        <p className="text-gray-700">If declassified, also added to public blockchain</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-gov-navy font-bold">
                          6
                        </div>
                        <p className="text-gray-700">Available for authorized access and verification</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Key Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gov-navy mb-12 text-center">Key Features</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-gov-navy/10 text-gov-navy">
                    <LockKeyhole className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Immutable Records</h3>
                  <p className="text-gray-600">
                    Documents stored on the blockchain cannot be altered or deleted, 
                    ensuring a permanent record for future reference.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-gov-teal/10 text-gov-teal">
                    <Check className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Verification System</h3>
                  <p className="text-gray-600">
                    Public users can verify the authenticity of any document by comparing 
                    its cryptographic hash with blockchain records.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-gov-burgundy/10 text-gov-burgundy">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
                  <p className="text-gray-600">
                    Different user roles have tailored access and capabilities, 
                    ensuring the right people have the right permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Commitment Section */}
        <section className="py-16 bg-gov-navy text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">Our Commitment</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                NationLedger is committed to balancing government transparency with national security. 
                We believe that an informed citizenry is essential to a functioning democracy, while also 
                recognizing the legitimate need for confidentiality in certain government operations.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mt-4">
                Through our innovative approach to blockchain technology, we strive to build trust between 
                citizens and their government by providing verifiable, tamper-proof access to declassified 
                information while maintaining robust security for sensitive documents.
              </p>
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gov-navy mb-8 text-center">Leadership Team</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Dr. Alexandra Chen",
                    position: "Chief Executive Officer",
                    bio: "Former cybersecurity advisor with 15 years of experience in government information systems."
                  },
                  {
                    name: "Michael Washington",
                    position: "Chief Technology Officer",
                    bio: "Blockchain expert who previously led digital transformation initiatives for federal agencies."
                  },
                  {
                    name: "Sarah Nakamura",
                    position: "Director of Public Relations",
                    bio: "Specialist in government transparency initiatives with background in public policy and communications."
                  }
                ].map((person, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <div className="w-24 h-24 bg-gov-gray-light rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-10 w-10 text-gov-navy" />
                      </div>
                      <h3 className="text-lg font-semibold text-gov-navy">{person.name}</h3>
                      <p className="text-gov-teal font-medium text-sm mb-2">{person.position}</p>
                      <p className="text-gray-600 text-sm">{person.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section className="py-16 bg-gov-gray-light">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gov-navy mb-6">Contact Us</h2>
              <p className="text-lg text-gray-700 mb-8">
                For inquiries about NationLedger, please reach out through our official channels:
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-gov-navy mb-2">Email</h3>
                  <p className="text-gray-600">contact@nationledger.gov</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gov-navy mb-2">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gov-navy mb-2">Address</h3>
                  <p className="text-gray-600">1234 Government Way<br/>Washington, DC 20500</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
