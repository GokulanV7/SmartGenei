import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Zap, Shield, Crown, Check, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "@/hooks/useAuth";
import "@/styles/parallax.css";
import "@/styles/interactive-card.css";
import "@/styles/landing.css";

const Landing = () => {
  const [mounted, setMounted] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();
  
  // Parallax effects for different elements
  const heroBgParallax = useParallax({ speed: 0.2 });
  const heroContentParallax = useParallax({ speed: 0.05, reverse: true });
  const blob1Parallax = useParallax({ speed: 0.05 });
  const blob2Parallax = useParallax({ speed: 0.08 });
  const featuresParallax = useParallax({ speed: 0.1 });
  const pricingParallax = useParallax({ speed: 0.15 });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-x-hidden">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 relative z-20">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SmartGenie
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">Get Started</Button>
                </Link>
              </>
            ) : (
              <Link to="/profile">
                <div className="relative">
                  <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover" 
                      />
                    ) : (
                      <span>
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </Button>
                  {/* Assuming there's a way to check if user is not premium, similar to Chat.tsx */}
                  {/* {!usage?.is_premium && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {usage?.messages_used || 0}
                    </div>
                  )} */}
                </div>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section with Parallax */}
      <section className="container mx-auto px-4 py-20 text-center relative parallax-container overflow-visible">
        {/* Parallax background elements */}
        <div 
          className="gradient-blob bg-blue-400" 
          style={{
            ...blob1Parallax,
            width: '600px', 
            height: '600px', 
            left: '-100px',
            top: '-100px',
            zIndex: 1,
            opacity: 0.15
          }}
        />
        
        <div 
          className="gradient-blob bg-purple-400" 
          style={{
            ...blob2Parallax,
            width: '500px', 
            height: '500px', 
            right: '-100px',
            bottom: '50px',
            zIndex: 1,
            opacity: 0.1
          }}
        />
        
        <div className="max-w-4xl mx-auto relative parallax-content" style={heroContentParallax}>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your AI Assistant for Everything
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            SmartGenie helps you with tasks, answers questions, and provides intelligent assistance. 
            Start chatting today and experience the power of AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? "/chat" : "/auth"}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Chatting Free
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              <Zap className="h-5 w-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section with Parallax */}
      <section ref={featuresRef} className="container mx-auto px-4 py-16 relative">
        <div className="text-center mb-12" style={mounted ? featuresParallax : {}}>
          <h2 className="text-3xl font-bold mb-4">Why Choose SmartGenie?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powerful AI capabilities designed to make your life easier
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 justify-items-center">
          <div className="parent parallax-card">
            <div className="card card-blue">
              <div className="glass glass-custom"></div>
              <div className="content">
                <Bot className="h-20 w-20 mb-4 text-white" style={{ transform: "translate3d(0, 0, 26px)" }} />
                <span className="title title-custom">Intelligent Conversations</span>
                <span className="text text-custom">Have natural conversations with our advanced AI assistant</span>
              </div>

              <div className="logo logo-custom">
                <span className="circle circle1"></span>
                <span className="circle circle2"></span>
                <span className="circle circle3"></span>
                <span className="circle circle4"></span>
                <span className="circle circle5"></span>
              </div>
            </div>
          </div>

          <div className="parent parallax-card">
            <div className="card card-purple">
              <div className="glass glass-custom"></div>
              <div className="content">
                <Zap className="h-20 w-20 mb-4 text-white" style={{ transform: "translate3d(0, 0, 26px)" }} />
                <span className="title title-custom">Lightning Fast</span>
                <span className="text text-custom">Get instant responses to your questions and requests</span>
              </div>

              <div className="logo logo-custom">
                <span className="circle circle1"></span>
                <span className="circle circle2"></span>
                <span className="circle circle3"></span>
                <span className="circle circle4"></span>
                <span className="circle circle5"></span>
              </div>
            </div>
          </div>

          <div className="parent parallax-card">
            <div className="card card-green">
              <div className="glass glass-custom"></div>
              <div className="content">
                <Shield className="h-20 w-20 mb-4 text-white" style={{ transform: "translate3d(0, 0, 26px)" }} />
                <span className="title title-custom">Secure & Private</span>
                <span className="text text-custom">Your conversations are protected and kept confidential</span>
              </div>

              <div className="logo logo-custom">
                <span className="circle circle1"></span>
                <span className="circle circle2"></span>
                <span className="circle circle3"></span>
                <span className="circle circle4"></span>
                <span className="circle circle5"></span>
              </div>
            </div>
          </div>
        </div>
      </section>
{/* Enhanced 3D Pricing Section with Glassy Effect */}
<section ref={pricingRef} className="container mx-auto px-4 py-16 relative">
  <div className="text-center mb-12" style={mounted ? pricingParallax : {}}>
    <h2 className="text-4xl font-bold mb-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
      Pay once, use forever
    </h2>
  </div>

  <div className="grid md:grid-cols-3 gap-10 max-w-screen-xl mx-auto perspective-1000">
    {/* Basic Plan */}
    <Card className="group flex flex-col items-start max-w-lg rounded-3xl border border-gray-300/30 bg-gradient-to-br from-gray-100/20 to-slate-200/20 backdrop-blur-xl p-6 xl:p-8 text-gray-900 transition-all duration-500 hover:scale-105 hover:-translate-y-4 transform-gpu shadow-2xl shadow-gray-500/20 hover:shadow-gray-500/40 hover:rotate-y-12">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-100/30 to-slate-200/20 backdrop-blur-xl"></div>
      <div className="relative z-10 w-full">
        <CardHeader className="text-center p-0 mb-8 w-full">
          <CardTitle className="text-lg font-normal text-gray-800 drop-shadow-sm font-semibold">Basic</CardTitle>
          <div className="my-8 flex items-baseline justify-center">
            <span className="mr-2 text-5xl font-extrabold text-gray-900 drop-shadow-md">Free</span>
          </div>
          <CardDescription className="font-light text-gray-600 text-sm">
            Limited to 3 messages
          </CardDescription>
        </CardHeader>
        <Link to="/auth" className="block mt-6 w-full">
          <Button className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl p-3 text-sm font-semibold shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/20">
            Get Started
          </Button>
        </Link>
        <CardContent className="p-0 mt-8 space-y-4 text-left text-gray-700 text-sm">
          <ul className="space-y-4">
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full p-0.5 text-white shadow-md" />
              <span>3 Messages</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full p-0.5 text-white shadow-md" />
              <span>Basic Response</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full p-0.5 text-white shadow-md" />
              <span>Basic Analytics</span>
            </li>
          </ul>
        </CardContent>
      </div>
    </Card>

    {/* Pro Plan */}
    <Card className="group flex flex-col items-start max-w-lg rounded-3xl border border-green-300/30 bg-gradient-to-br from-emerald-400/20 to-green-500/20 backdrop-blur-xl p-6 xl:p-8 text-gray-900 transition-all duration-500 hover:scale-110 hover:-translate-y-6 transform-gpu shadow-2xl shadow-green-600/30 hover:shadow-green-600/60 hover:rotate-y-12 relative overflow-hidden">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/30 to-green-500/20 backdrop-blur-xl"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/30 to-emerald-400/20 rounded-full blur-2xl"></div>
      <div className="relative z-10 w-full">
        <CardHeader className="text-center p-0 mb-8 w-full">
          <CardTitle className="text-lg font-normal text-gray-900 drop-shadow-sm font-semibold">Pro</CardTitle>
          <div className="my-8 flex items-baseline justify-center">
            <span className="mr-2 text-5xl font-extrabold text-gray-900 drop-shadow-md">₹300</span>
            <span className="text-gray-800">/month</span>
          </div>
          <CardDescription className="font-light text-gray-700 text-sm">
            Balanced features for regular users
          </CardDescription>
        </CardHeader>
        <Link to="/auth" className="block mt-6 w-full">
          <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-3 text-sm font-semibold shadow-lg shadow-green-500/40 hover:shadow-green-500/60 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/30">
            Get Started
          </Button>
        </Link>
        <CardContent className="p-0 mt-8 space-y-4 text-left text-gray-800 text-sm">
          <ul className="space-y-4">
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md" />
              <span>Unlimited Messages</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md" />
              <span>Faster Response Time</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md" />
              <span>Advanced Analytics</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md" />
              <span>File Uploads</span>
            </li>
          </ul>
        </CardContent>
      </div>
    </Card>

    {/* Enterprise Plan */}
    <Card className="group flex flex-col items-start max-w-lg rounded-3xl border border-purple-400/40 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-xl p-6 xl:p-8 text-gray-900 transition-all duration-500 hover:scale-110 hover:-translate-y-6 transform-gpu shadow-2xl shadow-purple-700/40 hover:shadow-purple-700/70 hover:rotate-y-12 relative overflow-hidden">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/30 to-indigo-600/20 backdrop-blur-xl"></div>
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-600/40 to-indigo-600/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/30 to-purple-600/20 rounded-full blur-2xl"></div>
      <div className="relative z-10 w-full">
        <CardHeader className="text-center p-0 mb-8 w-full">
          <CardTitle className="text-lg font-normal text-gray-900 drop-shadow-sm font-semibold">Enterprise</CardTitle>
          <div className="my-8 flex items-baseline justify-center">
            <span className="mr-2 text-5xl font-extrabold text-gray-900 drop-shadow-md">Custom</span>
          </div>
          <CardDescription className="font-light text-gray-700 text-sm">
            Tailored solutions for businesses
          </CardDescription>
        </CardHeader>
        <Link to="/auth" className="block mt-6 w-full">
          <Button className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl p-3 text-sm font-semibold shadow-lg shadow-purple-600/50 hover:shadow-purple-600/70 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/30">
            Contact Us
          </Button>
        </Link>
        <CardContent className="p-0 mt-8 space-y-4 text-left text-gray-800 text-sm">
          <ul className="space-y-4">
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md" />
              <span>Unlimited Everything</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md" />
              <span>Dedicated Support</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md" />
              <span>Custom Features</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md" />
              <span>SLA Guarantee</span>
            </li>
          </ul>
        </CardContent>
      </div>
    </Card>
  </div>
</section>

      {/* Footer */}
      <footer className="bg-white border-t relative z-20">
        <div className="mx-auto max-w-screen-xl space-y-8 px-4 py-16 sm:px-6 lg:space-y-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div>
              <div className="text-blue-600 flex items-center space-x-2">
                <Bot className="h-8 w-8" />
                <span className="text-xl font-bold">SmartGenie</span>
              </div>

              <p className="mt-4 max-w-xs text-gray-500">
                Your AI Assistant for Everything. Start chatting today and experience the power of AI.
              </p>

              <ul className="mt-8 flex gap-6">
                <li>
                  <a
                    href="#"
                    rel="noreferrer"
                    target="_blank"
                    className="text-gray-700 transition hover:opacity-75"
                  >
                    <span className="sr-only">Facebook</span>
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    rel="noreferrer"
                    target="_blank"
                    className="text-gray-700 transition hover:opacity-75"
                  >
                    <span className="sr-only">Instagram</span>
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    rel="noreferrer"
                    target="_blank"
                    className="text-gray-700 transition hover:opacity-75"
                  >
                    <span className="sr-only">Twitter</span>
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                      />
                    </svg>
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    rel="noreferrer"
                    target="_blank"
                    className="text-gray-700 transition hover:opacity-75"
                  >
                    <span className="sr-only">GitHub</span>
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    rel="noreferrer"
                    target="_blank"
                    className="text-gray-700 transition hover:opacity-75"
                  >
                    <span className="sr-only">Dribbble</span>
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.283-.177-.423C16.511 9.96 18.574 9.106 19.895 9.05c.284.134.579.27.894.407a8.452 8.452 0 011.206 2.597c-.178.068-3.335.842-6.145 2.793c.089-.33.159-.656.199-.981c2.399-1.433 4.346-2.082 5.311-1.932a8.504 8.504 0 01-1.586 4.918c-1.718-.25-3.334.057-4.447.639c-.05.026-.099.053-.146.081c-.591.354-1.08.81-1.405 1.316c-.134.21-.24.431-.314.656c-1.529.258-2.72.639-3.437 1.052c-.719.417-1.162.842-1.162.842c.269-1.525 1.57-2.946 3.095-3.214a17.03 17.03 0 01-.564-2.852c0-.091.005-.179.014-.265c-2.954.431-5.767 2.671-7.306 6.268a9.963 9.963 0 01-1.256-4.718c0-.085.003-.169.01-.252c2.22.589 4.007 1.129 5.409 1.104c-.353-2.236-.056-3.952.89-5.127c.944-.172 1.594.057 1.594.057l-.057.031c-.267.152-.518.326-.74.499a23.305 23.305 0 01-1.488-3.12a9.981 9.981 0 013.291-2.477c-1.594.143-2.788.491-3.291.981c-.082-.266.162-.52.428-.601c1.241-.335 2.674-.174 3.947.346c.35.145.668.34.93.566c-.854-.606-1.946-1.049-3.147-1.049c-.223 0-.448.034-.67.105c1.257-.385 2.663-.256 3.705.319c.246.136.473.309.674.5c-.787-.59-1.81-1.027-2.96-1.027c-.238 0-.48.046-.718.139c1.164-.31 2.478-.16 3.548.414c.232.124.446.28.641.46c-.698-.528-1.61-.914-2.633-.914c-.215 0-.432.045-.647.139c.95-.203 2.057-.05 2.958.503c.217.133.418.295.59.474c-.613-.465-1.41-.805-2.3-.805c-.191 0-.387.05-.576.158c.793-.168 1.711-.016 2.463.537Zm-3.019 12.216c0 0-.074.01-.162.03c-.613.136-1.232.162-1.836.076c-.152-.021-.296-.05-.423-.086a5.85 5.85 0 01-.314-.076c-.091-.023-.179-.05-.265-.082c-.106-.04-.207-.086-.302-.14a5.993 5.993 0 01-2.288-1.737c.552-1.52 1.845-2.986 3.356-3.539c.104.633.016 1.3-.238 1.864c-.022.05-.045.099-.069.146c.354.156.678.354.96.582c.031.025.062.05.089.074c.134.114.256.235.366.356c.05.055.1.11.146.169c.207.265.36.55.46.842c.023.066.045.133.066.2c.074.238.106.484.096.73Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
              <div>
                <p className="font-medium text-gray-900">Company</p>

                <ul className="mt-6 space-y-4 text-sm">
                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      About
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Careers
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900">Help</p>

                <ul className="mt-6 space-y-4 text-sm">
                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Support
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Contact Us
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900">Products</p>

                <ul className="mt-6 space-y-4 text-sm">
                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Chat
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Premium
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      API
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900">Legal</p>

                <ul className="mt-6 space-y-4 text-sm">
                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Terms of Service
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Privacy Policy
                    </a>
                  </li>

                  <li>
                    <a href="#" className="text-gray-700 transition hover:opacity-75">
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs text-gray-500">&copy; 2025 SmartGenie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
