"use client";

import Link from "next/link";
import { Crimson_Text } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CardHeader, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Check, User } from 'lucide-react';
import Image from 'next/image';
import { motion, useInView } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import Script from 'next/script';
import { Switch } from "@/components/ui/switch";

const crimson = Crimson_Text({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const StyleToggleDemo = ({ inView }: { inView: boolean }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setIsEnabled(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  return (
    <div className="rounded-md border p-4 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Apply Writer Style</span>
        <Switch checked={isEnabled} onCheckedChange={setIsEnabled} className="scale-110" />
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const featuresRef = useRef<HTMLElement>(null);
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.3 });
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);
  const card5Ref = useRef<HTMLDivElement>(null);
  const card6Ref = useRef<HTMLDivElement>(null);
  const card1InView = useInView(card1Ref, { once: true, amount: 0.5 });
  const card2InView = useInView(card2Ref, { once: true, amount: 0.5 });
  const card3InView = useInView(card3Ref, { once: true, amount: 0.5 });
  const card4InView = useInView(card4Ref, { once: true, amount: 0.5 });
  const card5InView = useInView(card5Ref, { once: true, amount: 0.5 });
  const card6InView = useInView(card6Ref, { once: true, amount: 0.5 });

  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: session, error } = await authClient.getSession();
        if (error) {
          console.error("Error fetching session:", error);
          return;
        }

        const isLoggedIn = !!session?.user;
        setHasSession(isLoggedIn);

      } catch (error) {
        console.error("Error checking session unexpectedly:", error);
      }
    };

    checkSession();
  }, [router]);

  const handleBeginClick = () => {
    // Skip onboarding - go directly to writing interface
    if (hasSession) {
      // Logged in users: go to project dashboard  
      router.push("/write");
    } else {
      // Guest users: still need to sign up/in first
      router.push("/onboarding");
    }
  };

  const modelNames = ["Llama", "Kimi", "Deepseek", "Claude"] as const;
  const proIndex = 3; 

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="absolute top-0 w-full z-10 py-4">
        <div className="container mx-auto flex justify-between items-center px-6 md:px-8 lg:px-12">
          <h1 className="text-xl font-normal tracking-tighter text-foreground/90">
            MUSE
          </h1>
          <div className="flex items-center gap-3">
            {hasSession && (
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 w-8 p-0"
                  title="Profile & Settings"
                >
                  <User className="size-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full group flex items-center"
              onClick={handleBeginClick}
            >
              {hasSession ? "Open" : "Try Now"}
              <span className="inline-block ml-2 text-xs transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 flex flex-col items-center text-center">
          {/* Title Group */}
          <div className="space-y-0">
            <div className="relative">
              <h2
                className={`text-6xl md:text-[128px] ${crimson.className} tracking-[-0.08em] leading-none text-foreground`}
              >
                Professional Story
              </h2>
            </div>

            <div className="relative mt-4">
              <h3
                className={`text-6xl md:text-[128px] ${crimson.className} tracking-[-0.06em] leading-none text-foreground `}
              >
                Development
                <span className="animate-blink ml-0.5 font-normal">|</span>
              </h3>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl text-balance mx-auto font-light">
            The collaborative AI platform for professional screenwriters. 
            From brainstorming to final draft—experience the full MUSE workflow before you sign up.
          </p>
          
          {/* Try Before You Buy Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mt-3 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Try Before You Sign Up</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2 mt-6 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleBeginClick}
            >
              {hasSession ? "Open MUSE" : "Try MUSE Free"}{" "}
              <span className="inline-block ml-2 text-xs transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link href="https://github.com/eddiebe147/MUSE" target="_blank" rel="noopener noreferrer">
                GitHub{" "}
                <span className="inline-block ml-2 text-xs transition-transform group-hover:translate-x-0.5">
                  ›
                </span>
              </Link>
            </Button>
          </div>

          <div className="mt-16 flex justify-center w-full">
            <div className="hero-frame">
              <Image
                src="/images/lightmode.png"
                alt="MUSE Story Intelligence Preview"
                width={1200}
                height={675}
                className="rounded-lg block dark:hidden"
                priority={true}
              />
              <Image
                src="/images/darkmode.png"
                alt="MUSE Story Intelligence Preview (Dark Mode)"
                width={1200}
                height={675}
                className="rounded-lg hidden dark:block"
                priority={true}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        ref={featuresRef}
        aria-labelledby="features-heading"
        className={`py-20 ${isFeaturesInView ? 'in-view' : ''}`}
      >
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 id="features-heading" className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
              Professional Story Development Platform
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From collaborative brainstorming to industry-ready scripts. Experience the complete MUSE workflow powered by Claude AI.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: ARC Generator Intelligence */}
            <motion.div
              ref={card1Ref}
              initial={{ opacity: 0, y: 20 }}
              animate={card1InView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="size-full"
            >
              <Card className="h-full flex flex-col min-h-[320px] rounded-xl overflow-visible">
                <CardHeader className="p-6 text-base font-medium">
                  ARC Generator Intelligence
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Tree of Thought Exploration
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Character Deep Dives
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Collaborative Chat with Claude
                    </div>
                  </div>
                  <p className="text-center w-full mt-4 text-sm">
                    Advanced brainstorming methods powered by Claude AI for deep story exploration.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 2: 4-Phase Professional Workflow */}
            <motion.div
              ref={card2Ref}
              initial={{ opacity: 0, y: 20 }}
              animate={card2InView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="size-full"
            >
              <Card className="h-full flex flex-col min-h-[320px] rounded-xl overflow-visible">
                <CardHeader className="p-6 text-base font-medium">
                  4-Phase Professional Workflow
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">1</div>
                      <span className="text-xs">Brainstorming & Analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">2</div>
                      <span className="text-xs">Scene Summary Generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">3</div>
                      <span className="text-xs">Detailed Scene Development</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">4</div>
                      <span className="text-xs">Professional Script Formatting</span>
                    </div>
                  </div>
                  <p className="text-center w-full mt-4 text-sm">
                    Structured workflow from concept to industry-ready script with custom templates.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 3: Two-Tier Knowledge Base */}
            <motion.div
              ref={card3Ref}
              initial={{ opacity: 0, y: 20 }}
              animate={card3InView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="size-full"
            >
              <Card className="h-full flex flex-col min-h-[320px] rounded-xl overflow-visible">
                <CardHeader className="p-6 text-base font-medium">
                  Two-Tier Knowledge Base
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-3 bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Global Guidelines</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Universal standards for all projects</p>
                    </div>
                    
                    <div className="border border-border rounded-lg p-3 bg-green-50/50 dark:bg-green-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Story-Specific Files</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Custom guidelines for individual projects</p>
                    </div>
                  </div>
                  
                  <p className="text-center w-full mt-4 text-sm">
                    Intelligent context management with Active Guidelines integration.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 4: Dual Workspace Experience */}
            <motion.div
              ref={card4Ref}
              initial={{ opacity: 0, y: 20 }}
              animate={card4InView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="size-full"
            >
              <Card className="h-full flex flex-col min-h-[320px] rounded-xl overflow-visible">
                <CardHeader className="p-6 text-base font-medium">
                  Dual Workspace Experience
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-3 bg-purple-50/50 dark:bg-purple-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">ARC Mode</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Collaborative generation with Claude AI</p>
                    </div>
                    
                    <div className="border border-border rounded-lg p-3 bg-orange-50/50 dark:bg-orange-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Canvas Mode</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Professional script refinement</p>
                    </div>
                  </div>
                  
                  <p className="text-center w-full mt-4 text-sm">
                    Seamless workflow between collaborative brainstorming and professional writing.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 5: Professional Export & Customization */}
            <motion.div
              ref={card5Ref}
              initial={{ opacity: 0, y: 20 }}
              animate={card5InView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="size-full"
            >
              <Card className="h-full flex flex-col min-h-[320px] rounded-xl">
                <CardHeader className="p-6 text-base font-medium">
                  Professional Export & Customization
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-xs">Network-ready formatting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-blue-500"></div>
                      <span className="text-xs">Custom style templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-red-500"></div>
                      <span className="text-xs">Multiple export formats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      <span className="text-xs">Industry submission ready</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center w-full mt-4">
                    Professional formatting and export options for industry standards.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 6: Try-Before-You-Buy Model */}
            <motion.div
              ref={card6Ref}
              initial={{ opacity: 0, y: 20 }}
              animate={card6InView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="size-full"
            >
              <Card className="h-full flex flex-col min-h-[320px] rounded-xl">
                <CardHeader className="p-6 text-base font-medium">
                  Try-Before-You-Buy Model
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">FREE</span>
                      </div>
                      <p className="text-xs">Story Starter - Full access to try</p>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">$19/mo</span>
                      </div>
                      <p className="text-xs">Story Master - Enhanced features</p>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">$39/mo</span>
                      </div>
                      <p className="text-xs">Story Studio - Team collaboration</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center w-full mt-4">
                    Experience the full platform before upgrading. No credit card required.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Social Proof Section */}
      <section id="social-proof" className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center mb-14">
            <h2 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
              Trusted by Creative Professionals
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powered by Claude AI for industry-standard story development
            </p>
          </div>
          
          <TooltipProvider>
            <div className="flex flex-col items-center justify-center gap-5 max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-base text-muted-foreground">
                <span>Used by</span>
                <Link 
                  href="https://twitter.com/dps" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Image 
                    src="/images/dps.jpg" 
                    alt="David Singleton" 
                    width={28} 
                    height={28} 
                    className="size-7 rounded-full object-cover" 
                  />
                  <span className="text-sm">@dps</span>
                </Link>
                <span>the ex-CTO of</span>
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                  alt="Stripe" 
                  width={64} 
                  height={26} 
                  className="h-5 w-auto opacity-85" 
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-base text-muted-foreground">
                <span>Part of the</span>
                <Link
                  href="https://vercel.com/ai-accelerator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:underline underline-offset-2"
                >
                  Vercel AI Accelerator
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                      & used by the Vercel team
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-sm font-normal">
                    Including{' '}
                    <a 
                      href="https://twitter.com/leerob" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      @leerob
                    </a>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-x-2.5 gap-y-2 text-base text-muted-foreground">
                <span>We&apos;re open-source & self-hostable</span>
                <a
                  className="github-button"
                  href="https://github.com/eddiebe147/MUSE"
                  data-icon="octicon-star"
                  data-size="large"
                  data-show-count="true"
                  aria-label="Star eddiebe147/MUSE on GitHub"
                >
                  Star
                </a>
                <Script async defer src="https://buttons.github.io/buttons.js" />
              </div>
            </div>
          </TooltipProvider>
          <div className="mt-10 text-center">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full px-8 py-3"
              onClick={handleBeginClick}
            >
              {hasSession ? "Open MUSE" : "Start Writing Now"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Try the full platform - No credit card required</p>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-border bg-background/80 backdrop-blur-sm py-4 mt-8">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} MUSE. All rights reserved.</span>
          <Button variant="outline" size="icon" className="size-8 shrink-0" asChild>
            <Link href="https://github.com/eddiebe147/MUSE" target="_blank" rel="noopener noreferrer">
              <Image src="/images/github-logo.png" alt="Github" width={16} height={16} className="dark:invert" />
            </Link>
          </Button>
        </div>
      </footer>
      <style jsx global>{`
        :root {
          --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --ease-out-cubic: cubic-bezier(0.215, 0.610, 0.355, 1.000);
          --ease-out-quart: cubic-bezier(0.165, 0.840, 0.440, 1.000);
        }
        .demo-prose-mirror-style {
          line-height: 1.6;
          min-height: 100px; 
        }

        .demo-text-base {
          color: hsl(var(--foreground));
        }

        /* Inline Suggestion Animation - Streaming Effect */
        .demo-inline-suggestion-animated::after {
          content: attr(data-suggestion);
          color: var(--muted-foreground);
          opacity: 1;
          padding-left: 0.1em;
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          width: 0; /* Start with no width */
          vertical-align: bottom;
          animation: streamInSuggestion 1s steps(22, end) 1.2s forwards; /* 22 steps for " a helpful completion." */
        }

        @keyframes streamInSuggestion {
          to { width: 100%; } /* Animate to full width of the content */
        }

        /* Selection Overlay Animation & Enhanced Styling */
        .demo-selected-text-animated {
          animation: highlightText 0.6s 0.7s forwards var(--ease-out-quad);
          background-color: transparent;
          padding: 0.1em 0.2em;
          border-radius: 3px;
          display: inline; /* Or inline-block if needed for specific highlight styles */
        }
        @keyframes highlightText {
          0% { background-color: transparent; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          30% { background-color: rgba(59, 130, 246, 0.2); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);}
          100% { background-color: rgba(59, 130, 246, 0.2); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);}
        }
        .demo-suggestion-overlay-animated {
          position: absolute;
          bottom: -0.75rem; /* Position slightly below the card content bottom */
          left: 5%;
          right: 5%;
          background-color: hsl(var(--card));
          border-radius: 0.75rem; 
          padding: 0.625rem; /* Increased from 0.5rem */
          box-shadow: 0 6px 16px -2px rgba(0,0,0,0.1), 0 3px 8px -2px rgba(0,0,0,0.06);
          opacity: 0;
          transform: translateY(calc(100% + 1rem)) scale(0.98);
          animation: slideInOverlayEnhanced 0.6s 1.5s forwards var(--ease-out-quart); /* Delay to 1.5s */
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem; /* Increased from 0.375rem */
        }
        .demo-overlay-header {
          display: flex;
          align-items: center;
          padding: 0 0.125rem; 
          gap: 0.375rem;
        }
        .demo-overlay-input-placeholder {
          width: 100%;
          padding: 0.375rem 0.625rem; 
          border-radius: 0.5rem; 
          border: 1px solid hsl(var(--border));
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          background-color: transparent;
          min-height: calc(0.75rem * 1.5 + 0.375rem * 2); /* Approx line height + padding */
          position: relative; /* For caret */
        }
        .demo-overlay-input-placeholder::before { /* Animated text */
          content: "";
          display: inline-block;
          animation: demoInputTyping 2s steps(22, end) 2.2s forwards; /* 22 steps for "Make it more punchy." */
          opacity: 0;
        }
        .demo-overlay-input-placeholder::after { /* Blinking caret */
          content: '|';
          display: inline-block;
          color: var(--foreground);
          animation: demoCaretAnimation 2s linear 2.2s forwards;
          opacity: 0; 
          margin-left: 1px;
        }

        @keyframes demoInputTyping {
          0% { content: ""; opacity: 0;}
          1% { opacity: 1;}
          4.5% { content: "M"; }  9% { content: "Ma"; } 13.5% { content: "Mak"; } 18% { content: "Make"; }
          22.5% { content: "Make "; } 27% { content: "Make i"; } 31.5% { content: "Make it"; } 36% { content: "Make it "; }
          40.5% { content: "Make it m"; } 45% { content: "Make it mo"; } 49.5% { content: "Make it mor"; } 54% { content: "Make it more"; }
          58.5% { content: "Make it more "; } 63% { content: "Make it more p"; } 67.5% { content: "Make it more pu"; } 72% { content: "Make it more pun"; }
          76.5% { content: "Make it more punc"; } 81% { content: "Make it more punch"; } 85.5% { content: "Make it more punchy"; }
          90% { content: "Make it more punchy."; }
          100% { content: "Make it more punchy."; opacity: 1; }
        }

        @keyframes demoCaretAnimation { /* Controls both visibility and blinking */
          0%, 100% { opacity: 0; } /* Ends hidden */
          1% { opacity: 1; } /* Visible when typing starts */
          /* Blinking effect */
          5%, 15%, 25%, 35%, 45%, 55%, 65%, 75%, 85%, 95% { opacity: 1; }
          10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90% { opacity: 0; }
        }

        .demo-overlay-diff-view {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem; 
          padding: 0.5rem; 
          font-size: 0.75rem;
          background-color: var(--muted-background-subtle, rgba(0,0,0,0.015));
          min-height: 32px; 
          opacity: 0; /* Initially hidden */
          animation: fadeInDiffView 0.3s ease-out 4.3s forwards; /* Fade in after input typing */
        }

        @keyframes fadeInDiffView {
          to { opacity: 1; }
        }

        .demo-diff-new-text-animated {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          width: 0; /* Start with no width */
          vertical-align: bottom;
          animation: streamInDiffNewText 1s steps(22, end) 4.7s forwards; /* Stream in after diff view fades in */
        }

        @keyframes streamInDiffNewText {
          to { width: max-content; } /* Ensure it takes the full width of its text content */
        }

        html.dark .demo-overlay-diff-view {
            background-color: var(--muted-background-subtle, rgba(255,255,255,0.02));
        }
        .demo-overlay-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.25rem;
          padding-top: 0.5rem; /* Increased padding */
          border-top: 1px solid hsl(var(--border));
        }

        @keyframes slideInOverlayEnhanced {
          from { opacity: 0; transform: translateY(calc(100% + 1rem)) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Synonym Plugin Animation */
        .demo-synonym-word-animated {
          display: inline-block;
          position: relative;
          cursor: default;
          margin-left: 0.25em; /* Added for spacing */
          margin-right: 0.25em; /* Added for spacing */
        }
        .demo-synonym-word-animated::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px; 
          background-color: transparent;
          border-radius: 3px;
          pointer-events: none;
          animation: synonymLoadingState 0.7s 0.7s forwards var(--ease-out-quad); /* Delay 0.7s */
        }
        @keyframes synonymLoadingState {
          0% { text-decoration: none; background-color: transparent; }
          40%, 60%, 100% { text-decoration: underline dotted var(--muted-foreground); background-color: rgba(100, 100, 100, 0.07); }
        }
        
        .demo-synonym-menu-animated {
          position: absolute;
          left: 50%;
          bottom: 135%; 
          background-color: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem; 
          padding: 7px 9px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          display: flex;
          gap: 7px;
          font-size: 0.75rem; 
          z-index: 10;
          opacity: 0;
          white-space: nowrap;
          transform: translateX(-50%) translateY(8px) scale(0.95); 
          animation: fadeInSynonymMenu 0.5s 1.6s forwards var(--ease-out-cubic);
        }
        .demo-synonym-menu-animated span {
          padding: 4px 6px; 
          border-radius: 0.375rem; 
          transition: background-color 0.2s, color 0.2s;
        }
        .demo-synonym-menu-animated span:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        @keyframes fadeInSynonymMenu {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        html.dark .demo-overlay-input-placeholder {
            /* border: 1px solid var(--input-border, #374151); Fallback already uses CSS var, explicit now */
            /* color: var(--muted-foreground, #9ca3af); Fallback already uses CSS var, explicit now */
         }

        /* Metallic macOS style frame for hero image */
        .hero-frame {
          border: 8px solid #c0c0c0;
          border-radius: 1rem;
          background: linear-gradient(145deg, #e0e0e0, #f9f9f9);
          padding: 4px;
        }
        html.dark .hero-frame {
          background: linear-gradient(145deg, #1f1f1f, #2c2c2c);
          border-color: #555555;
        }

        /* Initial state: no demo CSS animations until in-view */
        #features .demo-inline-suggestion-animated::after,
        #features .demo-selected-text-animated,
        #features .demo-suggestion-overlay-animated,
        #features .demo-overlay-input-placeholder::before,
        #features .demo-overlay-input-placeholder::after,
        #features .demo-overlay-diff-view,
        #features .demo-diff-new-text-animated,
        #features .demo-synonym-word-animated::before,
        #features .demo-synonym-menu-animated {
          animation: none;
        }
        /* Play animations once when features section enters viewport via Framer Motion useInView */
        #features.in-view .demo-inline-suggestion-animated::after {
          animation: streamInSuggestion 1s steps(22, end) 1.2s forwards;
        }
        #features.in-view .demo-selected-text-animated {
          animation: highlightText 0.6s 0.7s forwards var(--ease-out-quad);
        }
        #features.in-view .demo-suggestion-overlay-animated {
          animation: slideInOverlayEnhanced 0.6s 1.5s forwards var(--ease-out-quart);
        }
        #features.in-view .demo-overlay-input-placeholder::before {
          animation: demoInputTyping 2s steps(22, end) 2.2s forwards;
        }
        #features.in-view .demo-overlay-input-placeholder::after {
          animation: demoCaretAnimation 2s linear 2.2s forwards;
        }
        #features.in-view .demo-overlay-diff-view {
          animation: fadeInDiffView 0.3s ease-out 4.3s forwards;
        }
        #features.in-view .demo-diff-new-text-animated {
          animation: streamInDiffNewText 1s steps(22, end) 4.7s forwards;
        }
        #features.in-view .demo-synonym-word-animated::before {
          animation: synonymLoadingState 0.7s 0.7s forwards var(--ease-out-quad);
        }
        #features.in-view .demo-synonym-menu-animated {
          animation: fadeInSynonymMenu 0.5s 1.6s forwards var(--ease-out-cubic);
        }

        /* Ensure feature cards have no extra hover effects */
        #features .rounded-xl:hover {
          box-shadow: var(--tw-shadow, 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)); /* Explicitly set to base shadow if using Tailwind's 'shadow' class */
          transform: none;
        }

        /* Synonym menu styling enhancements */
        .demo-synonym-menu-animated {
          z-index: 20; /* Ensure above other content */
          box-shadow: 0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid hsl(var(--border));
        }

        /* On mobile, position synonyms menu below the word so it never clips off-screen */
        @media (max-width: 768px) {
          .demo-synonym-menu-animated {
            bottom: auto !important;
            top: 100% !important;
            transform: translateX(-50%) translateY(4px) scale(1) !important;
            margin-top: 0.25rem;
          }
        }

        /* Inline Suggestion 3D Tab Key Styling */
        .inline-suggestion-wrapper {
          display: inline-flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        .inline-tab-icon {
          background: linear-gradient(145deg, #f3f3f3, #e0e0e0);
          border: 1px solid #c0c0c0;
          border-radius: 4px;
          padding: 0.15em 0.5em;
          font-size: 0.75em;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          box-shadow: 0 2px 0 rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8);
          opacity: 0;
          animation: fadeInInlineTab 0.3s ease-out 1.3s forwards;
        }
        @keyframes fadeInInlineTab {
          to { opacity: 1; }
        }
        html.dark .inline-tab-icon {
          background: linear-gradient(145deg, #2c2c2c, #1f1f1f);
          border-color: #444444;
          box-shadow: 0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}