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
  Rocket
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
                <Bot className="mr-2 h-4 w-4" />
                AI-Powered Knowledge Base
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Build AI chatbots from your{" "}
                <span className="text-primary">knowledge base</span> in minutes
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Upload documents, connect data sources, and instantly deploy scalable AI assistants 
                that understand your business. No coding required.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link href="/register">
                  Start building free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                <Link href="#demo">
                  Watch demo
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              ✨ No credit card required • 🚀 Deploy in 60 seconds • 💬 1000+ sessions supported
            </p>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      </section>

      {/* Dashboard Preview */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl border shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background/50 to-primary/10 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Interactive Demo Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Experience the full Executa dashboard with live AI chat, analytics, and deployment tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to deploy AI assistants
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From document upload to production deployment, we handle the complex AI infrastructure 
              so you can focus on your business.
            </p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                icon: Upload,
                title: "Smart Document Processing",
                description: "Upload PDFs, Word docs, or connect Gmail. Our AI extracts and indexes knowledge automatically."
              },
              {
                icon: Brain,
                title: "OpenAI-Powered Intelligence",
                description: "Built on GPT-4 with custom fine-tuning for your specific domain and use cases."
              },
              {
                icon: Zap,
                title: "60-Second Deployment",
                description: "From upload to live chatbot in under a minute. Get embed codes, API keys, and iframe widgets instantly."
              },
              {
                icon: Globe,
                title: "Scalable Infrastructure",
                description: "Handle 1000+ concurrent conversations with edge-optimized responses and 99.9% uptime."
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "SOC 2 compliant with end-to-end encryption, SSO integration, and audit logging."
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Track conversations, user satisfaction, knowledge gaps, and ROI with detailed insights."
              }
            ].map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors rounded-2xl">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees or complex usage calculations.
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for testing and small projects",
                features: [
                  "1 AI assistant",
                  "100 conversations/month",
                  "5MB document storage",
                  "Email support",
                  "Basic analytics"
                ],
                cta: "Start free",
                href: "/register"
              },
              {
                name: "Professional",
                price: "$29",
                description: "Great for growing businesses",
                features: [
                  "5 AI assistants",
                  "2,000 conversations/month",
                  "1GB document storage",
                  "Priority support",
                  "Advanced analytics",
                  "Custom branding",
                  "API access"
                ],
                cta: "Start 14-day trial",
                href: "/register",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large organizations",
                features: [
                  "Unlimited assistants",
                  "Unlimited conversations",
                  "Unlimited storage",
                  "24/7 dedicated support",
                  "SSO & SAML",
                  "On-premise deployment",
                  "Custom integrations",
                  "SLA guarantee"
                ],
                cta: "Contact sales",
                href: "/contact"
              }
            ].map((plan, index) => (
              <Card key={index} className={`relative rounded-2xl ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Free" && plan.price !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to transform your customer support?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of businesses already using Executa to automate support, 
                improve customer satisfaction, and scale their operations.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link href="/register">
                  <Rocket className="mr-2 h-4 w-4" />
                  Get started free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                <Link href="/contact">
                  Schedule demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
