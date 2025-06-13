"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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

// Animation variants
const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    }
  }
};

const staggerChild = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1
  }
};

const scaleOnHover = {
  hover: { 
    scale: 1.02,
    y: -10
  }
};

const glowEffect = {
  hover: {
    boxShadow: "0 0 30px rgba(100, 0, 254, 0.15), 0 0 60px rgba(100, 0, 254, 0.05)"
  }
};

const floatingAnimation = {
  animate: {
    y: [0, -10, 0]
  }
};

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 via-transparent to-purple-50/20 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/20 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="mx-auto max-w-4xl text-center space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="space-y-4">
              <motion.div 
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium"
                variants={staggerChild}
                whileHover={{ scale: 1.05 }}
              >
                <Bot className="mr-2 h-4 w-4" />
                AI-Powered Knowledge Base
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                variants={staggerChild}
              >
                Build AI chatbots from your{" "}
                <motion.span 
                  className="text-brand-600"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    background: "linear-gradient(90deg, #6400fe, #8b5cf6, #6400fe)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  knowledge base
                </motion.span>{" "}
                in minutes
              </motion.h1>
              
              <motion.p 
                className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl"
                variants={staggerChild}
              >
                Upload documents, connect data sources, and instantly deploy scalable AI assistants 
                that understand your business. No coding required.
              </motion.p>
            </div>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={staggerChild}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild size="lg" className="min-w-[200px] bg-brand-600 hover:bg-brand-700 focus:ring-brand-600 text-white hover:text-white relative overflow-hidden group hover-lift">
                  <Link href="/register">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                      initial={{ x: "-100%" }}
                      whileHover={{
                        x: "100%",
                        transition: { duration: 0.8, ease: "easeInOut" }
                      }}
                    />
                    <span className="relative z-10">Start building free</span>
                    <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild variant="outline" size="lg" className="min-w-[200px] border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                  <Link href="#demo">
                    Watch demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.p 
              className="text-sm text-muted-foreground"
              variants={staggerChild}
            >
              ✨ No credit card required • 🚀 Deploy in 60 seconds • 💬 1000+ sessions supported
            </motion.p>
          </motion.div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-muted/20 via-transparent to-muted/30" />
        
        {/* Floating particles with enhanced animations */}
        <motion.div
          className="absolute top-20 left-10 w-2 h-2 bg-brand-600/30 rounded-full animate-float animate-glow"
          variants={floatingAnimation}
          animate="animate"
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-3 h-3 bg-brand-600/20 rounded-full animate-float"
          variants={floatingAnimation}
          animate="animate"
          transition={{ delay: 1, duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-2 h-2 bg-brand-600/25 rounded-full animate-float animate-pulse-glow"
          variants={floatingAnimation}
          animate="animate"
          transition={{ delay: 2, duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-32 right-1/3 w-1 h-1 bg-brand-600/40 rounded-full animate-float"
          variants={floatingAnimation}
          animate="animate"
          transition={{ delay: 0.5, duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-2 h-2 bg-brand-600/15 rounded-full animate-float"
          variants={floatingAnimation}
          animate="animate"
          transition={{ delay: 1.5, duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </section>

      {/* Dashboard Preview */}
      <motion.section 
        className="py-12 lg:py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <motion.div 
              className="relative aspect-video overflow-hidden rounded-2xl border shadow-2xl"
              whileHover={{ scale: 1.02, rotateX: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ transformPerspective: 1000 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background/50 to-brand-600/10 flex items-center justify-center">
                <motion.div 
                  className="text-center space-y-4 p-8"
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.div 
                    className="mx-auto w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                  >
                    <MessageSquare className="h-8 w-8 text-brand-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold">Interactive Demo Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Experience the full Executa dashboard with live AI chat, analytics, and deployment tools.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        className="py-20 lg:py-32"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-200px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="mx-auto max-w-2xl text-center mb-16"
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to deploy AI assistants
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From document upload to production deployment, we handle the complex AI infrastructure 
              so you can focus on your business.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
            variants={staggerContainer}
          >
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
              <motion.div
                key={index}
                variants={staggerChild}
                whileHover="hover"
              >
                <motion.div
                  variants={scaleOnHover}
                >
                  <Card className="border-2 hover:border-brand-600/50 hover:shadow-xl hover:shadow-brand-600/10 transition-all duration-500 rounded-2xl group h-full hover-lift hover:bg-gradient-to-br hover:from-brand-50/50 hover:to-transparent">
                    <CardHeader>
                      <motion.div 
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600/10 to-brand-600/5 group-hover:from-brand-600/20 group-hover:to-brand-600/10 transition-all duration-300 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-brand-600/20"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                      >
                        <feature.icon className="h-6 w-6 text-brand-600 group-hover:scale-110 transition-transform duration-300" />
                      </motion.div>
                      <CardTitle className="text-xl group-hover:text-brand-700 transition-colors">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        id="pricing" 
        className="py-20 lg:py-32 bg-muted/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="mx-auto max-w-2xl text-center mb-16"
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees or complex usage calculations.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto"
            variants={staggerContainer}
          >
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
              <motion.div
                key={index}
                variants={staggerChild}
                whileHover="hover"
              >
                <motion.div
                  variants={{
                    ...scaleOnHover,
                    ...(plan.popular ? glowEffect : {})
                  }}
                >
                  <Card className={`relative rounded-2xl hover:shadow-2xl hover:shadow-brand-600/10 transition-all duration-500 h-full hover-lift ${plan.popular ? 'border-brand-600 ring-2 ring-brand-600/20 bg-gradient-to-b from-brand-50/50 to-white animate-pulse-glow' : 'hover:border-brand-600/30 hover:bg-gradient-to-br hover:from-brand-50/20 hover:to-transparent'}`}>
                    {plan.popular && (
                      <motion.div 
                        className="absolute -top-3 left-1/2 -translate-x-1/2"
                        initial={{ scale: 0, rotate: -10 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </div>
                      </motion.div>
                    )}
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <motion.div 
                        className="mt-4"
                        initial={{ scale: 0.8 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.price !== "Free" && plan.price !== "Custom" && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </motion.div>
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li 
                            key={featureIndex} 
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * featureIndex }}
                          >
                            <Check className="h-4 w-4 text-brand-600 mr-3 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button asChild className={`w-full ${plan.popular ? 'bg-brand-600 hover:bg-brand-700 text-white hover:text-white' : 'border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white'}`} variant={plan.popular ? "default" : "outline"}>
                          <Link href={plan.href}>{plan.cta}</Link>
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 lg:py-32"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center space-y-8">
            <div className="space-y-4">
              <motion.h2 
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                variants={staggerChild}
              >
                Ready to transform your customer support?
              </motion.h2>
              <motion.p 
                className="text-lg text-muted-foreground"
                variants={staggerChild}
              >
                Join thousands of businesses already using Executa to automate support, 
                improve customer satisfaction, and scale their operations.
              </motion.p>
            </div>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={staggerChild}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button asChild size="lg" className="min-w-[200px] bg-brand-600 hover:bg-brand-700 focus:ring-brand-600 text-white hover:text-white relative overflow-hidden group hover-lift">
                  <Link href="/register">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer group-hover:animate-none"></div>
                    <Rocket className="mr-2 h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">Get started free</span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button asChild variant="outline" size="lg" className="min-w-[200px] border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white hover-lift hover:shadow-lg hover:shadow-brand-600/20 transition-all duration-300">
                  <Link href="/contact">
                    Schedule demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
