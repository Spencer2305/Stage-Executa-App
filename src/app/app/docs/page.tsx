"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Upload, 
  Zap, 
  Globe, 
  Shield, 
  BarChart3,
  ArrowRight,
  Code,
  Settings,
  CreditCard,
  HelpCircle,
  FileText,
  MessageSquare,
  Key,
  Users,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", title: "Getting Started", icon: Zap },
    { id: "creating-assistants", title: "Creating AI Assistants", icon: Bot },
    { id: "knowledge-base", title: "Knowledge Base", icon: Upload },
    { id: "deployment", title: "Deployment Options", icon: Globe },
    { id: "api-reference", title: "API Reference", icon: Code },
    { id: "analytics", title: "Analytics & Monitoring", icon: BarChart3 },
    { id: "account-management", title: "Account Management", icon: Settings },
    { id: "pricing", title: "Pricing & Plans", icon: CreditCard },
    { id: "troubleshooting", title: "Troubleshooting", icon: HelpCircle },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Executa Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to build, deploy, and manage AI assistants
            </p>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <nav className="space-y-1">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              activeSection === section.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {section.title}
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              <div className="bg-white rounded-lg shadow-sm border p-8 space-y-12">
                
                {/* Getting Started */}
                <section id="getting-started" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <Zap className="mr-3 h-8 w-8 text-primary" />
                    Getting Started
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Welcome to Executa</h3>
                      <p className="text-muted-foreground mb-4">
                        Executa is an AI-powered platform that helps you build intelligent chatbots from your knowledge base. 
                        Transform your documents, FAQs, and expertise into conversational AI assistants in minutes.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <Upload className="h-8 w-8 text-blue-600 mb-3" />
                        <h4 className="font-semibold mb-2">1. Upload Knowledge</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload documents, PDFs, or connect data sources to build your knowledge base.
                        </p>
                      </Card>
                      <Card className="p-4">
                        <Bot className="h-8 w-8 text-green-600 mb-3" />
                        <h4 className="font-semibold mb-2">2. Train AI Assistant</h4>
                        <p className="text-sm text-muted-foreground">
                          Our AI automatically processes and learns from your content to create intelligent responses.
                        </p>
                      </Card>
                      <Card className="p-4">
                        <Globe className="h-8 w-8 text-purple-600 mb-3" />
                        <h4 className="font-semibold mb-2">3. Deploy & Scale</h4>
                        <p className="text-sm text-muted-foreground">
                          Get embed codes, API keys, and deploy your assistant across multiple channels.
                        </p>
                      </Card>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Quick Start</h4>
                          <p className="text-blue-800 text-sm">
                            New to Executa? Start with our free plan and create your first AI assistant in under 5 minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Creating AI Assistants */}
                <section id="creating-assistants" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <Bot className="mr-3 h-8 w-8 text-primary" />
                    Creating AI Assistants
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Step-by-Step Process</h3>
                      <p className="text-muted-foreground mb-4">
                        Creating an AI assistant involves three main steps: basic configuration, knowledge upload, and deployment setup.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold mb-2">Step 1: Basic Information</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Choose a descriptive name for your assistant</li>
                          <li>• Add a clear description of its purpose</li>
                          <li>• Define the assistant's role and expertise area</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold mb-2">Step 2: Upload Knowledge Base</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Supported formats: PDF, DOC, DOCX, TXT, MD</li>
                          <li>• Maximum file size: 10MB per file (Pro), 50MB (Enterprise)</li>
                          <li>• Drag & drop or browse to upload multiple files</li>
                          <li>• Content is automatically processed and indexed</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold mb-2">Step 3: Configure & Deploy</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Review assistant summary and settings</li>
                          <li>• Choose deployment method (embed, API, iframe)</li>
                          <li>• Customize appearance and behavior</li>
                          <li>• Generate deployment codes</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900 mb-1">Best Practices</h4>
                          <ul className="text-green-800 text-sm space-y-1">
                            <li>• Use clear, well-structured documents for better AI understanding</li>
                            <li>• Include FAQs and common questions in your knowledge base</li>
                            <li>• Test your assistant with various questions before deployment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Knowledge Base Management */}
                <section id="knowledge-base" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <Upload className="mr-3 h-8 w-8 text-primary" />
                    Knowledge Base Management
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Supported File Types</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="p-4">
                          <FileText className="h-6 w-6 text-blue-600 mb-2" />
                          <h4 className="font-semibold mb-2">Documents</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• PDF files</li>
                            <li>• Microsoft Word (.doc, .docx)</li>
                            <li>• Plain text (.txt)</li>
                            <li>• Markdown (.md)</li>
                          </ul>
                        </Card>
                        <Card className="p-4">
                          <Globe className="h-6 w-6 text-green-600 mb-2" />
                          <h4 className="font-semibold mb-2">Data Sources</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Website scraping</li>
                            <li>• Knowledge base APIs</li>
                            <li>• Database connections</li>
                            <li>• Email integration</li>
                          </ul>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Content Processing</h3>
                      <p className="text-muted-foreground mb-4">
                        Executa's AI automatically processes your content to create a searchable, intelligent knowledge base.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline" className="mt-1">OCR</Badge>
                          <div>
                            <p className="font-medium">Optical Character Recognition</p>
                            <p className="text-sm text-muted-foreground">Extracts text from images and scanned documents</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline" className="mt-1">NLP</Badge>
                          <div>
                            <p className="font-medium">Natural Language Processing</p>
                            <p className="text-sm text-muted-foreground">Understands context and meaning of your content</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline" className="mt-1">Indexing</Badge>
                          <div>
                            <p className="font-medium">Intelligent Indexing</p>
                            <p className="text-sm text-muted-foreground">Creates searchable vectors for fast, relevant responses</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Storage Limits</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Free Plan</span>
                          <Badge>5MB total</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Professional Plan</span>
                          <Badge>1GB total</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Enterprise Plan</span>
                          <Badge>Unlimited</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Deployment Options */}
                <section id="deployment" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <Globe className="mr-3 h-8 w-8 text-primary" />
                    Deployment Options
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <Code className="h-8 w-8 text-blue-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-3">Web Embed</h3>
                        <p className="text-muted-foreground mb-4">
                          Add a chat widget to your website with a simple JavaScript snippet.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                          {'<script src="https://cdn.executa.ai/widget.js"></script>'}
                        </div>
                      </Card>

                      <Card className="p-6">
                        <Key className="h-8 w-8 text-green-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-3">API Integration</h3>
                        <p className="text-muted-foreground mb-4">
                          Integrate directly with your applications using our RESTful API.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                          POST /api/v1/chat
                        </div>
                      </Card>

                      <Card className="p-6">
                        <MessageSquare className="h-8 w-8 text-purple-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-3">iframe Widget</h3>
                        <p className="text-muted-foreground mb-4">
                          Embed a full chat interface as an iframe on any webpage.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                          {'<iframe src="https://chat.executa.ai/..."></iframe>'}
                        </div>
                      </Card>

                      <Card className="p-6">
                        <Users className="h-8 w-8 text-orange-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-3">Team Integration</h3>
                        <p className="text-muted-foreground mb-4">
                          Connect with Slack, Teams, or other collaboration platforms.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                          Webhook URL
                        </div>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Customization Options</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Custom branding and colors</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Personalized welcome messages</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Custom CSS styling</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> White-label solutions (Enterprise)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* API Reference */}
                <section id="api-reference" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <Code className="mr-3 h-8 w-8 text-primary" />
                    API Reference
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Authentication</h3>
                      <p className="text-muted-foreground mb-4">
                        All API requests require an API key. Include it in the Authorization header.
                      </p>
                      <div className="bg-gray-100 p-4 rounded">
                        <code className="text-sm">
                          Authorization: Bearer YOUR_API_KEY
                        </code>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Send Message</h3>
                      <div className="space-y-4">
                        <div>
                          <Badge variant="outline" className="mb-2">POST</Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded ml-2">/api/v1/chat</code>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Request Body:</h4>
                          <div className="bg-gray-100 p-4 rounded text-sm font-mono">
{`{
  "message": "How do I reset my password?",
  "assistant_id": "your-assistant-id",
  "session_id": "optional-session-id"
}`}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Response:</h4>
                          <div className="bg-gray-100 p-4 rounded text-sm font-mono">
{`{
  "response": "To reset your password, click on...",
  "confidence": 0.95,
  "session_id": "session-12345",
  "sources": ["document1.pdf", "faq.txt"]
}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Rate Limits</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Free Plan</span>
                          <Badge>100 requests/hour</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Professional Plan</span>
                          <Badge>1,000 requests/hour</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Enterprise Plan</span>
                          <Badge>Unlimited</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Analytics & Monitoring */}
                <section id="analytics" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <BarChart3 className="mr-3 h-8 w-8 text-primary" />
                    Analytics & Monitoring
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Key Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="p-4">
                          <h4 className="font-semibold mb-2">Conversation Volume</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Total conversations</li>
                            <li>• Daily/weekly/monthly trends</li>
                            <li>• Peak usage times</li>
                          </ul>
                        </Card>
                        <Card className="p-4">
                          <h4 className="font-semibold mb-2">Response Quality</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Success rate</li>
                            <li>• User satisfaction scores</li>
                            <li>• Confidence levels</li>
                          </ul>
                        </Card>
                        <Card className="p-4">
                          <h4 className="font-semibold mb-2">Popular Queries</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Most asked questions</li>
                            <li>• Unanswered queries</li>
                            <li>• Knowledge gaps</li>
                          </ul>
                        </Card>
                        <Card className="p-4">
                          <h4 className="font-semibold mb-2">Performance</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Response time</li>
                            <li>• Uptime monitoring</li>
                            <li>• Error rates</li>
                          </ul>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Dashboard Features</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Real-time conversation monitoring</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Export data to CSV/PDF</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Custom date range filtering</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Automated reports (Pro+)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Account Management */}
                <section id="account-management" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <Settings className="mr-3 h-8 w-8 text-primary" />
                    Account Management
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Profile Settings</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Update personal information</li>
                        <li>• Change password and security settings</li>
                        <li>• Manage notification preferences</li>
                        <li>• Two-factor authentication setup</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Team Management</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Invite team members</li>
                        <li>• Assign roles and permissions</li>
                        <li>• Manage assistant access</li>
                        <li>• Usage monitoring per user</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">API Key Management</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Generate new API keys</li>
                        <li>• Rotate existing keys</li>
                        <li>• Set key permissions and scopes</li>
                        <li>• Monitor API usage</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Pricing & Plans */}
                <section id="pricing" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <CreditCard className="mr-3 h-8 w-8 text-primary" />
                    Pricing & Plans
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card className="p-6 border-2">
                        <h3 className="text-lg font-semibold mb-2">Free</h3>
                        <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal">/month</span></p>
                        <ul className="space-y-2 text-sm mb-6">
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 1 AI assistant</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 100 conversations/month</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 5MB storage</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Email support</li>
                        </ul>
                        <Button variant="outline" className="w-full">Get Started</Button>
                      </Card>

                      <Card className="p-6 border-2 border-primary">
                        <Badge className="mb-2">Most Popular</Badge>
                        <h3 className="text-lg font-semibold mb-2">Professional</h3>
                        <p className="text-3xl font-bold mb-4">$29<span className="text-sm font-normal">/month</span></p>
                        <ul className="space-y-2 text-sm mb-6">
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 5 AI assistants</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 2,000 conversations/month</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 1GB storage</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Priority support</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Advanced analytics</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> API access</li>
                        </ul>
                        <Button className="w-full">Start Trial</Button>
                      </Card>

                      <Card className="p-6 border-2">
                        <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
                        <p className="text-3xl font-bold mb-4">Custom</p>
                        <ul className="space-y-2 text-sm mb-6">
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Unlimited assistants</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Unlimited conversations</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> Unlimited storage</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> 24/7 support</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> SSO & SAML</li>
                          <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> On-premise deployment</li>
                        </ul>
                        <Button variant="outline" className="w-full">Contact Sales</Button>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Billing Information</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• All plans include a 14-day free trial</li>
                        <li>• Cancel anytime, no long-term contracts</li>
                        <li>• Annual plans include 20% discount</li>
                        <li>• Usage-based pricing available for Enterprise</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Troubleshooting */}
                <section id="troubleshooting" className="scroll-mt-8">
                  <h2 className="text-3xl font-bold mb-6 flex items-center">
                    <HelpCircle className="mr-3 h-8 w-8 text-primary" />
                    Troubleshooting
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Common Issues</h3>
                      
                      <div className="space-y-4">
                        <Card className="p-4">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                            Assistant not responding correctly
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            If your assistant isn't providing accurate responses:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Check if your knowledge base documents are clear and well-structured</li>
                            <li>• Ensure files uploaded successfully and processing completed</li>
                            <li>• Add more relevant content to improve accuracy</li>
                            <li>• Review analytics to identify knowledge gaps</li>
                          </ul>
                        </Card>

                        <Card className="p-4">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                            File upload errors
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            If you're having trouble uploading files:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Check file size limits for your plan</li>
                            <li>• Ensure file format is supported</li>
                            <li>• Try uploading one file at a time</li>
                            <li>• Clear browser cache and try again</li>
                          </ul>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Getting Help</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="p-4">
                          <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
                          <h4 className="font-semibold mb-2">Live Chat Support</h4>
                          <p className="text-sm text-muted-foreground">
                            Available 24/7 for Professional and Enterprise plans
                          </p>
                        </Card>
                        <Card className="p-4">
                          <FileText className="h-6 w-6 text-green-600 mb-2" />
                          <h4 className="font-semibold mb-2">Submit a Ticket</h4>
                          <p className="text-sm text-muted-foreground">
                            Email support available for all plans with detailed assistance
                          </p>
                        </Card>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Need More Help?</h4>
                          <p className="text-blue-800 text-sm">
                            Contact our support team at <strong>support@executa.ai</strong> or visit our community forum for additional resources.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 