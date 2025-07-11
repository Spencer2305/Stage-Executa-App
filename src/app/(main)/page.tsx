import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bot, Rocket, Play, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Minimal Hero Section */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
              <Bot className="mr-2 h-4 w-4" />
              Next-Generation AI Platform
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="block text-slate-900 mb-2">Deploy Powerful</span>
              <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Assistants
              </span>
              <span className="block text-slate-700 text-4xl md:text-5xl mt-2">
                in Minutes
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Create intelligent AI solutions that transform your business. Deploy any AI assistant that learns from your data.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                <Link href="/register">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Building Now
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="px-8 py-4">
                <Link href="/login">
                  <Play className="mr-2 h-5 w-5" />
                  Try Demo
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Executa?
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for modern businesses.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced AI</h3>
              <p className="text-gray-600">Powered by GPT-4 with enterprise-grade reliability.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rapid Deployment</h3>
              <p className="text-gray-600">Deploy in under 60 seconds with zero complexity.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">SOC 2 compliant with end-to-end encryption.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of companies transforming their customer experience.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
              <Link href="/register">
                Start Building Today
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
