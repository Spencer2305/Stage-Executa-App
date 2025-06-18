"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useState, useEffect } from "react";
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

// Professional animation variants
const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 30
  },
  visible: { 
    opacity: 1, 
    y: 0
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const staggerChild = {
  hidden: { 
    opacity: 0, 
    y: 20
  },
  visible: { 
    opacity: 1, 
    y: 0
  }
};

const floatingIcons = {
  animate: {
    y: [0, -20, 0],
    rotate: [0, 10, 0],
    scale: [1, 1.1, 1]
  }
};

const spiralMotion = {
  animate: {
    rotate: 360,
    scale: [1, 1.2, 1],
  }
};

const liquidMotion = {
  animate: {
    borderRadius: ["50%", "60% 40% 70% 30%", "40% 60% 30% 70%", "50%"],
    scale: [1, 1.1, 0.9, 1],
  }
};

const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(100, 0, 254, 0.3)",
      "0 0 40px rgba(100, 0, 254, 0.6)",
      "0 0 20px rgba(100, 0, 254, 0.3)"
    ]
  }
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', updateMousePosition);
    
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Hero Section - Clean and Centered */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Clean background */}
        <div className="absolute inset-0">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          
          {/* Static purple circles with mouse-reactive movement */}
          <motion.div
            className="absolute top-1/4 left-1/3 w-3 h-3 bg-purple-500/30 rounded-full blur-sm pointer-events-none"
            animate={{
              x: (mousePosition.x - window.innerWidth / 2) * 0.02,
              y: (mousePosition.y - window.innerHeight / 2) * 0.02,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
          />
          <motion.div
            className="absolute top-3/4 right-1/4 w-2 h-2 bg-brand-600/40 rounded-full blur-sm pointer-events-none"
            animate={{
              x: (mousePosition.x - window.innerWidth / 2) * -0.015,
              y: (mousePosition.y - window.innerHeight / 2) * 0.015,
            }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 25,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-600/50 rounded-full pointer-events-none"
            animate={{
              x: (mousePosition.x - window.innerWidth / 2) * 0.01,
              y: (mousePosition.y - window.innerHeight / 2) * -0.01,
            }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 30,
            }}
          />
          <motion.div
            className="absolute top-1/6 right-1/3 w-2.5 h-2.5 bg-purple-400/25 rounded-full blur-sm pointer-events-none"
            animate={{
              x: (mousePosition.x - window.innerWidth / 2) * -0.025,
              y: (mousePosition.y - window.innerHeight / 2) * -0.02,
            }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 20,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Centered Content */}
            <motion.div className="space-y-8" variants={staggerChild}>
              <motion.div 
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium shadow-lg font-heebo"
                variants={staggerChild}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
                  <Bot className="mr-2 h-4 w-4 text-slate-700" />
                  Next-Generation AI Platform
                </div>
              </motion.div>
            
              {/* Professional headline */}
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-kanit font-bold tracking-tight leading-tight uppercase"
                variants={staggerChild}
              >
                <span className="block text-slate-900 mb-2">
                  Deploy Powerful
                </span>
                <span className="block bg-gradient-to-r from-purple-600 via-brand-600 to-purple-800 bg-clip-text text-transparent">
                  AI Assistants
                </span>
                <span className="block text-slate-700 text-4xl md:text-5xl lg:text-6xl mt-2">
                  in Minutes, Not Months
                </span>
              </motion.h1>
              
              {/* Professional description */}
              <motion.p 
                className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-heebo"
                variants={staggerChild}
              >
                Create intelligent AI solutions that transform your business. From customer support chatbots to knowledge assistants and onboarding guides - deploy any AI assistant that learns from your data.
              </motion.p>
          
              {/* Professional CTAs */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                variants={staggerChild}
              >
                <Button asChild size="lg" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 font-heebo">
                  <Link href="/register">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Building Now
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-700 px-8 py-4 text-lg font-semibold font-heebo">
                  <Link href="#demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>
          
              {/* Professional trust indicators */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-slate-500"
                variants={staggerChild}
              >
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
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Features Section */}
      <motion.section 
        id="features" 
        className="py-32 bg-slate-50 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-200px" }}
        variants={staggerContainer}
      >
        {/* Professional background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-purple-200/15 to-brand-200/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-brand-200/10 to-purple-200/15 rounded-full blur-3xl"
            animate={{
              scale: [1.1, 1, 1.1],
              x: [0, -20, 0],
              y: [0, 20, 0],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
        <motion.div
            className="mx-auto max-w-3xl text-center mb-20"
            variants={fadeInUp}
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-kanit font-bold tracking-tight mb-6 uppercase"
              style={{ color: "#6400fe" }}
            >
              Enterprise Features
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 leading-relaxed"
            >
              Powerful capabilities designed for modern businesses and development teams.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
            variants={staggerContainer}
          >
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
              <motion.div
                key={index}
                variants={staggerChild}
                className="group"
              >
                <motion.div>
                  <Card 
                    className="relative border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden h-full bg-white"
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    
                    <CardHeader className="relative z-10 pb-6">
                      <motion.div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mb-6 relative overflow-hidden`}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(100, 0, 254, 0.2)",
                            "0 0 40px rgba(100, 0, 254, 0.4)",
                            "0 0 20px rgba(100, 0, 254, 0.2)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        />
                        <feature.icon className="h-8 w-8 text-white relative z-10" />
                      </motion.div>
                      <CardTitle className="text-2xl group-hover:text-purple-700 transition-colors duration-300">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CardDescription className="text-base leading-relaxed text-gray-600 group-hover:text-gray-700">
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

       {/* Professional Testimonials Section */}
      <motion.section 
         className="py-32 bg-white relative overflow-hidden"
         initial="hidden"
         whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
         variants={staggerContainer}
      >
         <div className="container mx-auto px-4 relative z-10">
            <motion.div 
             className="mx-auto max-w-3xl text-center mb-20"
             variants={fadeInUp}
           >
             <motion.h2 
               className="text-4xl md:text-6xl font-kanit font-bold tracking-tight mb-6 uppercase"
               style={{
                 background: "linear-gradient(135deg, #4f46e5 0%, #6400fe 100%)",
                 WebkitBackgroundClip: "text",
                 WebkitTextFillColor: "transparent",
                 backgroundClip: "text",
               }}
             >
               Trusted by Leaders
             </motion.h2>
             <p className="text-xl text-slate-600">
               See what industry professionals are saying about our platform
             </p>
           </motion.div>
           
           <motion.div 
             className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
             variants={staggerContainer}
           >
             {[
               {
                 name: "Sarah Chen",
                 role: "Product Manager at TechFlow",
                 avatar: "SC",
                 rating: 5,
                 quote: "Executa transformed our customer support. We went from 2-hour response times to instant, accurate answers. Our team can now focus on building instead of answering the same questions over and over.",
                 gradient: "from-brand-500 to-brand-600"
               },
               {
                 name: "Marcus Rodriguez",
                 role: "CEO of InnovateLab",
                 avatar: "MR",
                 rating: 5,
                 quote: "The setup was incredible - literally 60 seconds from upload to live chatbot. Our technical documentation is now interactive and our developers love it. ROI was immediate.",
                 gradient: "from-brand-500 to-brand-600"
               },
               {
                 name: "Emily Watson",
                 role: "Head of Operations at DataStream",
                 avatar: "EW",
                 rating: 5,
                 quote: "We've tried every AI solution out there. Executa is different - it actually understands context and maintains conversation flow. Our customers think they're talking to our best support agent.",
                 gradient: "from-brand-500 to-brand-600"
               },
               {
                 name: "David Kim",
                 role: "Founder of StartupX",
                 avatar: "DK",
                 rating: 5,
                 quote: "As a non-technical founder, I was amazed how easy it was. Uploaded our FAQ, connected our help docs, and boom - we had a sophisticated AI assistant. Game changer for early-stage startups.",
                 gradient: "from-brand-500 to-brand-600"
               },
               {
                 name: "Lisa Thompson",
                 role: "Customer Success at CloudTech",
                 avatar: "LT",
                 rating: 5,
                 quote: "The analytics are incredible. We can see exactly what customers are asking, identify knowledge gaps, and improve our content. It's like having a crystal ball for customer needs.",
                 gradient: "from-brand-500 to-brand-600"
               },
               {
                 name: "Alex Johnson",
                 role: "CTO at FutureScale",
                 avatar: "AJ",
                 rating: 5,
                 quote: "Enterprise-grade security with startup-level simplicity. The API integration was seamless, and the scalability is exactly what we needed for our growing user base.",
                 gradient: "from-brand-500 to-brand-600"
               }
             ].map((testimonial, index) => (
               <motion.div
                 key={index}
                 variants={staggerChild}
                 whileHover="hover"
                 className="group"
               >
                 <motion.div
                   whileHover={{ 
                     scale: 1.02,
                     y: -4
                   }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                   <Card 
                     className="relative border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden h-full bg-white"
                   >
                     <CardContent className="p-8 relative z-10 flex flex-col h-full min-h-[320px]">
                       <div className="flex items-center mb-6">
                         <motion.div 
                           className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg`}
                           whileHover={{ scale: 1.05 }}
                         >
                           {testimonial.avatar}
                         </motion.div>
                         <div>
                           <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                           <p className="text-sm text-slate-600">{testimonial.role}</p>
                         </div>
                       </div>
                       
                       <div className="flex mb-4">
                         {[...Array(testimonial.rating)].map((_, i) => (
                  <motion.div 
                             key={i}
                             initial={{ scale: 0 }}
                             whileInView={{ scale: 1 }}
                             transition={{ delay: i * 0.1, type: "spring" }}
                           >
                             <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </motion.div>
                         ))}
              </div>
                       
                       <blockquote className="text-slate-700 leading-relaxed flex-grow">
                         "{testimonial.quote}"
                       </blockquote>
                     </CardContent>
                   </Card>
                 </motion.div>
               </motion.div>
             ))}
            </motion.div>
        </div>
      </motion.section>

      {/* Integrations Section */}
      <motion.section 
        className="py-24 bg-white relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-kanit font-bold tracking-tight text-slate-900 mb-6 uppercase"
            >
              Seamless 
              <motion.span 
                className="block bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent"
              >
                Integrations
              </motion.span>
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto"
            >
              Connect with your favorite tools and platforms. Our AI assistant integrates seamlessly 
              with your existing workflow to maximize productivity.
            </motion.p>
          </motion.div>

          {/* Integration Hub Graphic */}
          <motion.div 
            className="relative max-w-6xl mx-auto my-24 md:my-32"
            variants={fadeInUp}
          >
            <div className="relative w-full h-32 flex items-center justify-center">
              {/* Horizontal Connection Line */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-brand-500 to-purple-500 rounded-full opacity-30"></div>
              </div>

              {/* Integration Service Nodes - Left Side (3 icons) */}
              <div className="flex items-center justify-center space-x-8 md:space-x-16">
                {[
                  { name: 'Analytics', icon: BarChart3, color: 'from-blue-500 to-blue-600', delay: 0.3 },
                  { name: 'CRM', icon: Users, color: 'from-orange-500 to-red-500', delay: 0.4 },
                  { name: 'Database', icon: Database, color: 'from-emerald-500 to-green-600', delay: 0.5 }
                ].map((service, index) => {
                  const IconComponent = service.icon;
                  return (
                    <motion.div
                      key={service.name}
                      className={`relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${service.color} rounded-full shadow-xl flex items-center justify-center border-2 border-white/20 backdrop-blur-sm z-20 group`}
                      initial={{ scale: 0, opacity: 0, x: -50 }}
                      whileInView={{ scale: 1, opacity: 1, x: 0 }}
                      transition={{ delay: service.delay, type: "spring", stiffness: 200, damping: 15 }}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg" />
                      
                      {/* Enhanced Tooltip */}
                      <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-30 border border-white/10">
                        {service.name}
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900/95"></div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Central Hub */}
                <motion.div
                  className="relative z-30 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-brand-500 via-brand-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl mx-8 md:mx-16"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                >
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center">
                    <Zap className="w-10 h-10 md:w-12 md:h-12 text-brand-600" />
                  </div>
                </motion.div>

                {/* Integration Service Nodes - Right Side (3 icons) */}
                {[
                  { name: 'Storage', icon: Cloud, color: 'from-cyan-500 to-blue-500', delay: 0.6 },
                  { name: 'Communication', icon: MessageCircle, color: 'from-purple-500 to-pink-500', delay: 0.7 },
                  { name: 'Automation', icon: Settings, color: 'from-gray-600 to-gray-700', delay: 0.8 }
                ].map((service, index) => {
                  const IconComponent = service.icon;
                  return (
                    <motion.div
                      key={service.name}
                      className={`relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${service.color} rounded-full shadow-xl flex items-center justify-center border-2 border-white/20 backdrop-blur-sm z-20 group`}
                      initial={{ scale: 0, opacity: 0, x: 50 }}
                      whileInView={{ scale: 1, opacity: 1, x: 0 }}
                      transition={{ delay: service.delay, type: "spring", stiffness: 200, damping: 15 }}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg" />
                      
                      {/* Enhanced Tooltip */}
                      <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-30 border border-white/10">
                        {service.name}
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900/95"></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Integration Features */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
          >
            {[
              {
                icon: Plug,
                title: "One-Click Setup",
                description: "Connect your tools in seconds with our pre-built integrations"
              },
              {
                icon: RefreshCw,
                title: "Real-Time Sync",
                description: "Data flows seamlessly between platforms in real-time"
              },
              {
                icon: Shield,
                title: "Secure Connections",
                description: "Enterprise-grade security for all your integrations"
              }
            ].map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerChild}
                  className="text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 group-hover:shadow-xl group-hover:shadow-brand-500/25 transition-all duration-300 shadow-lg">
                      <FeatureIcon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

       {/* Professional Stats Section */}
      <motion.section 
         className="py-32 bg-slate-50 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
         viewport={{ once: true }}
        variants={staggerContainer}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-100"></div>
         
         <div className="container mx-auto px-4 relative z-10">
          <motion.div 
             className="mx-auto max-w-4xl text-center mb-20"
            variants={fadeInUp}
          >
             <h2 className="text-4xl md:text-6xl font-kanit font-bold tracking-tight text-slate-900 mb-6 uppercase">
               Trusted by Industry Leaders
               <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent block">
                 Worldwide
               </span>
            </h2>
             <p className="text-xl text-slate-600 leading-relaxed">
               Real performance metrics from companies transforming their customer experience
            </p>
          </motion.div>
          
          <motion.div 
             className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
            variants={staggerContainer}
          >
            {[
              {
                 value: "10M+",
                 label: "Messages Processed",
                 description: "Intelligent conversations handled",
                 icon: MessageSquare,
                 gradient: "from-brand-500 to-brand-600",
                 delay: 0
               },
               {
                 value: "98.7%",
                 label: "Accuracy Rate",
                 description: "Precise answers delivered",
                icon: Brain,
                 gradient: "from-brand-500 to-brand-600",
                 delay: 0.2
              },
              {
                 value: "2.3s",
                 label: "Avg Response Time",
                 description: "Lightning-fast interactions",
                icon: Zap,
                 gradient: "from-brand-500 to-brand-600",
                 delay: 0.4
              },
              {
                 value: "5,000+",
                 label: "Active Companies",
                 description: "Trusted worldwide",
                icon: Globe,
                 gradient: "from-brand-500 to-brand-600",
                 delay: 0.6
               }
             ].map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerChild}
                   className="group h-full"
                >
                   <motion.div className="h-full">
                     <Card className="relative border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-500 rounded-2xl overflow-hidden group-hover:shadow-xl group-hover:shadow-brand-500/10 h-full">
                       <CardContent className="p-6 text-center relative z-10 flex flex-col justify-center h-full min-h-[280px]">
                         <motion.div 
                           className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.gradient} p-4 mb-6 mx-auto shadow-lg`}
                           whileHover={{ scale: 1.05 }}
                           transition={{ duration: 0.3 }}
                         >
                           <StatIcon className="h-8 w-8 text-white" />
                         </motion.div>
                         
                        <motion.div 
                           className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}
                           initial={{ scale: 0 }}
                           whileInView={{ scale: 1 }}
                           transition={{ delay: stat.delay, type: "spring" }}
                         >
                           {stat.value}
                        </motion.div>
                         
                         <h4 className="text-xl font-semibold text-slate-900 mb-2">{stat.label}</h4>
                         <p className="text-slate-600 text-sm">{stat.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

       {/* Professional Demo Section */}
       <motion.section 
         id="demo"
         className="py-32 bg-white relative overflow-hidden"
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true, margin: "-100px" }}
         variants={staggerContainer}
       >
         <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50"></div>
         
         <div className="container mx-auto px-4 relative z-10">
           <motion.div 
             className="mx-auto max-w-4xl text-center mb-20"
             variants={fadeInUp}
           >
             <motion.h2 
               className="text-4xl md:text-6xl font-kanit font-bold tracking-tight mb-6 uppercase"
               style={{
                 background: "linear-gradient(135deg, #1e40af 0%, #6400fe 100%)",
                 WebkitBackgroundClip: "text",
                 WebkitTextFillColor: "transparent",
                 backgroundClip: "text",
               }}
             >
               Try It Yourself
             </motion.h2>
             <p className="text-xl text-slate-600 leading-relaxed">
               Experience our platform in real-time. Ask our AI assistant anything about Executa!
             </p>
           </motion.div>
           
           <motion.div 
             className="max-w-4xl mx-auto"
             variants={staggerChild}
           >
             <motion.div
               className="relative rounded-2xl shadow-xl border border-slate-200 overflow-hidden bg-white"
               whileHover={{ scale: 1.01 }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
             >
               {/* Header */}
               <div className="relative flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                 <div className="flex items-center space-x-3">
                   <motion.div 
                     className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg"
                     animate={{ rotate: [0, 5, 0] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   >
                     <Bot className="w-5 h-5 text-white" />
                   </motion.div>
                   <div>
                     <div className="font-semibold text-slate-900">Executa AI Assistant</div>
                     <div className="text-xs text-green-600 flex items-center">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                       Online & Ready
                     </div>
                   </div>
                 </div>
                 <motion.div 
                   className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full"
                   animate={{ opacity: [0.7, 1, 0.7] }}
                   transition={{ duration: 2, repeat: Infinity }}
                 >
                   Live Demo
                 </motion.div>
               </div>
               
               {/* Interactive Chat */}
               <div className="p-8 space-y-6 h-96 overflow-y-auto relative">
                 <motion.div 
                   className="flex items-start space-x-3"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 }}
                 >
                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                     <Users className="w-4 h-4 text-gray-600" />
                   </div>
                   <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-xs">
                     <p className="text-sm text-gray-700">What makes Executa different from other AI chatbot platforms?</p>
                   </div>
                 </motion.div>
                 
                 <motion.div 
                   className="flex items-start space-x-3 justify-end"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 1 }}
                 >
                   <div className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-4 max-w-md">
                     <p className="text-sm">Great question! Executa stands out in several key ways:</p>
                     <ul className="text-sm mt-2 space-y-1">
                       <li>• 60-second deployment vs hours/days with competitors</li>
                       <li>• Context-aware conversations, not just Q&A</li>
                       <li>• Enterprise security with startup simplicity</li>
                       <li>• Advanced analytics to improve your content</li>
                     </ul>
                   </div>
                   <motion.div 
                     className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
                     animate={{ rotate: [0, 360] }}
                     transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                   >
                     <Bot className="w-4 h-4 text-white" />
                   </motion.div>
                 </motion.div>
                 
                 <motion.div 
                   className="flex items-start space-x-3"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 1.5 }}
                 >
                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                     <Users className="w-4 h-4 text-gray-600" />
                   </div>
                   <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-xs">
                     <p className="text-sm text-gray-700">How accurate are the responses?</p>
                   </div>
                 </motion.div>
                 
                 <motion.div 
                   className="flex items-start space-x-3 justify-end"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 2 }}
                 >
                   <div className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-4 max-w-md">
                     <p className="text-sm">We maintain a 98.7% accuracy rate! Our AI is powered by GPT-4 and fine-tuned specifically for your content. Plus, you can train it further with feedback to make it even more accurate for your specific use case. 🎯</p>
                   </div>
                   <motion.div 
                     className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
                     animate={{ rotate: [0, 360] }}
                     transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                   >
                     <Bot className="w-4 h-4 text-white" />
                   </motion.div>
                 </motion.div>
                 
                 {/* Try it prompt */}
                 <motion.div 
                   className="text-center py-4"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 2.5 }}
                 >
                   <motion.div
                     className="inline-flex items-center text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-full border border-blue-200"
                     animate={{ scale: [1, 1.05, 1] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   >
                     <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                     Try asking: "How much does it cost?" or "Can I integrate with my existing tools?"
                   </motion.div>
                 </motion.div>
               </div>
               
               {/* Input area */}
               <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
                 <motion.div 
                   className="flex items-center space-x-3"
                   whileHover={{ scale: 1.01 }}
                 >
                   <input 
                     type="text" 
                     placeholder="Ask me anything about Executa..."
                     className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                   <motion.button 
                     className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg transition-all duration-200"
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                   >
                     <ArrowRight className="w-4 h-4" />
                   </motion.button>
                 </motion.div>
                 <p className="text-xs text-gray-500 mt-2 text-center">
                   This is a live demo connected to our actual AI assistant!
                 </p>
               </div>
             </motion.div>
           </motion.div>
         </div>
       </motion.section>

       {/* Professional Pricing Section */}
      <motion.section 
        id="pricing"
        className="py-32 bg-slate-50 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="mx-auto max-w-3xl text-center mb-20"
            variants={fadeInUp}
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-kanit font-bold tracking-tight mb-6 uppercase"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #6400fe 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Choose Your Plan
            </motion.h2>
            <p className="text-xl text-slate-600">
              Flexible pricing options designed to scale with your business needs.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto pt-24"
            variants={staggerContainer}
          >
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for individuals and small teams getting started",
                features: [
                  "1 AI assistant",
                  "100 conversations/month",
                  "5MB knowledge storage",
                  "Email support",
                  "Basic analytics"
                ],
                cta: "Get Started",
                href: "/register",
                gradient: "from-brand-500 to-brand-600"
              },
              {
                name: "Professional",
                price: "$29",
                description: "For growing businesses ready to scale their operations",
                features: [
                  "5 AI assistants",
                  "2,000 conversations/month",
                  "1GB knowledge storage",
                  "Priority support",
                  "Advanced analytics",
                  "Custom branding",
                  "API access"
                ],
                cta: "Start Free Trial",
                href: "/register",
                popular: true,
                gradient: "from-brand-500 to-brand-600"
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large organizations with advanced requirements",
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
                cta: "Contact Sales",
                href: "/contact",
                gradient: "from-brand-500 to-brand-600"
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                variants={staggerChild}
                className="group"
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.02,
                    y: -4
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card 
                    className={`relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 h-full overflow-visible bg-white border border-slate-200 ${plan.popular ? 'ring-2 ring-brand-500/50 scale-105' : ''}`}
                  >
                    <CardHeader className="text-center pb-8 relative z-10">
                      {plan.popular && (
                        <motion.div 
                          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 -mt-8"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 15 }}
                        >
                          <div className={`bg-gradient-to-r ${plan.gradient} text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg border-2 border-white whitespace-nowrap`}>
                            Most Popular
                          </div>
                        </motion.div>
                      )}
                      <CardTitle className="text-2xl mb-4 text-slate-900">{plan.name}</CardTitle>
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className={`text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                          {plan.price}
                        </span>
                        {plan.price !== "Free" && plan.price !== "Custom" && (
                          <span className="text-slate-500">/month</span>
                        )}
                      </motion.div>
                      <CardDescription className="text-base text-slate-600">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                      <ul className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li 
                            key={featureIndex} 
                            className="flex items-center"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * featureIndex }}
                          >
                            <Check className="h-5 w-5 text-brand-600 mr-3 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button asChild className={`w-full bg-gradient-to-r ${plan.gradient} hover:shadow-lg text-white hover:text-white border-0 rounded-xl py-6 text-lg font-semibold`}>
                          <Link href={plan.href}>
                            <motion.div
                              className="flex items-center justify-center"
                            >
                              {plan.cta}
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </motion.div>
                          </Link>
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

      {/* Professional CTA Section */}
      <motion.section 
         className="py-24 bg-slate-50 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
         variants={staggerContainer}
       >
         <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-100"></div>
         
         <div className="container mx-auto px-4 relative z-10">
           <motion.div 
             className="mx-auto max-w-5xl text-center space-y-12"
        variants={fadeInUp}
      >
             <div className="space-y-6">
              <motion.h2 
                 className="text-4xl md:text-6xl lg:text-7xl font-kanit font-bold tracking-tight text-slate-900 leading-tight uppercase"
               >
                 Ready to Build 
                 <motion.span 
                   className="block bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent"
                 >
                   your AI solution?
                 </motion.span>
              </motion.h2>
               
              <motion.p 
                 className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto"
               >
                 Join thousands of companies who've already transformed their customer experience. 
                 Your AI assistant is just 60 seconds away.
              </motion.p>
            </div>
            
            <motion.div 
               className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={staggerChild}
            >
              <motion.div
                 className="relative group"
                 whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
               >
                 <Button asChild size="lg" className="relative bg-brand-600 hover:bg-brand-700 text-white px-10 py-8 text-xl font-bold rounded-xl shadow-xl">
                  <Link href="/register">
                     <motion.div
                       className="flex items-center"
                     >
                       <Rocket className="mr-3 h-6 w-6" />
                       Start Building Now
                     </motion.div>
                  </Link>
                </Button>
              </motion.div>
               
              <motion.div
                 whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
               >
                 <Button asChild variant="outline" size="lg" className="border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-10 py-8 text-xl font-bold rounded-xl bg-white">
                   <Link href="#demo">
                     <Play className="mr-3 h-6 w-6" />
                     Try Live Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
             
             <motion.div 
               className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16"
               variants={staggerContainer}
             >
               {[
                 {
                   icon: Lightning,
                   title: "60 Second Setup",
                   description: "Fastest deployment in the industry",
                   color: "from-brand-500 to-brand-600"
                 },
                 {
                   icon: Shield,
                   title: "Enterprise Security",
                   description: "SOC 2 compliant & encrypted",
                   color: "from-brand-500 to-brand-600"
                 },
                 {
                   icon: Heart,
                   title: "24/7 Support",
                   description: "We're here when you need us",
                   color: "from-brand-500 to-brand-600"
                 }
               ].map((feature, index) => (
                 <motion.div
                   key={index}
                   variants={staggerChild}
                   className="text-center group"
                 >
                   <motion.div
                     whileHover={{ scale: 1.05 }}
                     transition={{ type: "spring", stiffness: 400 }}
                   >
                     <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${feature.color} p-4 group-hover:shadow-xl group-hover:shadow-brand-500/25 transition-all duration-300 shadow-lg`}>
                       <feature.icon className="w-8 h-8 text-white" />
          </div>
                   </motion.div>
                   <h4 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h4>
                   <p className="text-slate-600 text-sm">{feature.description}</p>
                 </motion.div>
               ))}
             </motion.div>
           </motion.div>
        </div>
      </motion.section>

      {/* Add CSS for additional animations */}
      <style jsx global>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .hover-lift {
          transition: transform 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
                 .animate-shimmer {
           animation: shimmer 2s infinite;
         }
       `}</style>
    </main>
  );
}
