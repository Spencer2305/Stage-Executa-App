import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { 
  Bot, 
  Upload, 
  Zap, 
  Globe, 
  Shield, 
  BarChart3,
  Check,
  ArrowRight,
  MessageSquare,
  Brain,
  Rocket,
  Sparkles,
  Star,
  Circle,
  Triangle,
  Square,
  Heart,
  Hexagon,
  Zap as Lightning,
  Wand2,
  Palette,
  Music,
  Wind,
  Waves,
  Users,
  Play,
  Plug,
  RefreshCw,
  Database,
  Cloud,
  MessageCircle,
  Settings
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Hero Section - Clean and Centered */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Clean background */}
        <div className="absolute inset-0">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Centered Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium shadow-lg font-body">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
                  <Bot className="mr-2 h-4 w-4 text-slate-700" />
                  Next-Generation AI Platform
                </div>
              </div>
            
              {/* Professional headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-kanit font-bold tracking-tight leading-tight">
                <span className="block text-slate-900 mb-2">
                  Deploy Powerful
                </span>
                <span className="block bg-gradient-to-r from-purple-600 via-brand-600 to-purple-800 bg-clip-text text-transparent">
                  AI Assistants
                </span>
                <span className="block text-slate-700 text-4xl md:text-5xl lg:text-6xl mt-2">
                  in Minutes, Not Months
                </span>
              </h1>
              
              {/* Professional description */}
              <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-body">
                Create intelligent AI solutions that transform your business. From customer support chatbots to knowledge assistants and onboarding guides - deploy any AI assistant that learns from your data.
              </p>
          
              {/* Professional CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 font-body">
                  <Link href="/register">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Building Now
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-700 px-8 py-4 text-lg font-semibold font-body">
                  <Link href="#demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
          
              {/* Professional trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Enterprise Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-6" style={{ color: "#6400fe" }}>
              Enterprise Features
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Powerful capabilities designed for modern businesses and development teams.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {[
              {
                icon: Upload,
                title: "Document Upload",
                description: "Seamlessly upload and process documents, PDFs, and knowledge bases. Transform static content into interactive AI-powered resources.",
                color: "from-purple-500 to-brand-600"
              },
              {
                icon: Brain,
                title: "Advanced AI",
                description: "Powered by GPT-4 and cutting-edge language models. Deliver accurate, contextual responses with enterprise-grade reliability.",
                color: "from-purple-500 to-brand-600"
              },
              {
                icon: Zap,
                title: "Rapid Deployment",
                description: "Deploy production-ready chatbots in under 60 seconds. From upload to live deployment with zero technical complexity.",
                color: "from-purple-500 to-brand-600"
              },
              {
                icon: Globe,
                title: "Enterprise Scale",
                description: "Handle thousands of concurrent conversations with auto-scaling infrastructure. Built for high-volume enterprise workloads.",
                color: "from-purple-500 to-brand-600"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "SOC 2 compliant with end-to-end encryption. Your data is protected with bank-level security standards.",
                color: "from-purple-500 to-brand-600"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Comprehensive insights and reporting. Track performance, user interactions, and optimize your AI assistant's effectiveness.",
                color: "from-purple-500 to-brand-600"
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <Card className="relative border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden h-full bg-white">
                  <CardHeader className="relative z-10 pb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mb-6 relative overflow-hidden`}>
                      <feature.icon className="h-8 w-8 text-white relative z-10" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base leading-relaxed text-gray-600 group-hover:text-gray-700">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-100"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-5xl text-center space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-slate-900 leading-tight">
                Ready to Build 
                <span className="block bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                  Your AI Solution?
                </span>
              </h2>
               
              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
                Join thousands of companies who've already transformed their customer experience. 
                Your AI assistant is just 60 seconds away.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild size="lg" className="relative bg-brand-600 hover:bg-brand-700 text-white px-10 py-8 text-xl font-bold rounded-xl shadow-xl">
                <Link href="/register">
                  <div className="flex items-center">
                    <Rocket className="mr-3 h-6 w-6" />
                    Start Building Now
                  </div>
                </Link>
              </Button>
               
              <Button asChild variant="outline" size="lg" className="border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-10 py-8 text-xl font-bold rounded-xl bg-white">
                <Link href="#demo">
                  <Play className="mr-3 h-6 w-6" />
                  Try Live Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
