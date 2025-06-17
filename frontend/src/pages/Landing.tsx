import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Zap, Shield, Crown, Check, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "@/hooks/useAuth";
import "@/styles/parallax.css";
import "@/styles/interactive-card.css";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
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
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-200">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-gray-700 font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </Button>
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

      {/* Pricing Section with Parallax */}
      <section ref={pricingRef} className="container mx-auto px-4 py-16 relative">
        <div className="text-center mb-12" style={mounted ? pricingParallax : {}}>
          <h2 className="text-4xl font-bold mb-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pay once, use forever</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-screen-xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col items-start max-w-lg rounded-3xl border border-gray-200 bg-white p-6 xl:p-8 text-gray-900 transition-transform duration-300 hover:-translate-y-1">
            <CardHeader className="text-center p-0 mb-8 w-full">
              <CardTitle className="text-lg font-normal">Free</CardTitle>
              <div className="my-8 flex items-baseline justify-center">
                <span className="mr-2 text-5xl font-extrabold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="font-light text-gray-600 text-sm">Perfect for trying out SmartGenie</CardDescription>
            </CardHeader>
            <Link to="/auth" className="block mt-6 w-full">
              <Button className="w-full bg-gray-900 text-white rounded-md p-3 text-sm font-semibold shadow-sm hover:-translate-y-1 transition-transform duration-300">
                Get Started
              </Button>
            </Link>
            <CardContent className="p-0 mt-8 space-y-4 text-left text-gray-600 text-sm">
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>3 messages per day</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Basic AI responses</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Email support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Standard Plan */}
          <Card className="flex flex-col items-start max-w-lg rounded-3xl bg-[#D8FA6D] p-6 xl:p-8 text-gray-900 transition-transform duration-300 hover:-translate-y-1">
            <CardHeader className="text-center p-0 mb-8 w-full">
              <CardTitle className="text-lg font-normal">Standard</CardTitle>
              <div className="my-8 flex items-baseline justify-center">
                <span className="mr-2 text-5xl font-extrabold">$4.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="font-light text-gray-600 text-sm">Balanced features for regular users</CardDescription>
            </CardHeader>
            <Link to="/auth" className="block mt-6 w-full">
              <Button className="w-full bg-gray-900 text-white rounded-md p-3 text-sm font-semibold shadow-sm hover:-translate-y-1 transition-transform duration-300">
                Get Started
              </Button>
            </Link>
            <CardContent className="p-0 mt-8 space-y-4 text-left text-gray-600 text-sm">
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>20 messages per day</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Enhanced AI responses</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Limited file uploads</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Standard support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="flex flex-col items-start max-w-lg rounded-3xl bg-[#DCA6F3] p-6 xl:p-8 text-gray-900 transition-transform duration-300 hover:-translate-y-1">
            <CardHeader className="text-center p-0 mb-8 w-full">
              <CardTitle className="text-lg font-normal">Premium</CardTitle>
              <div className="my-8 flex items-baseline justify-center">
                <span className="mr-2 text-5xl font-extrabold">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="font-light text-gray-600 text-sm">Unlimited access to SmartGenie</CardDescription>
            </CardHeader>
            <Link to="/auth" className="block mt-6 w-full">
              <Button className="w-full bg-gray-900 text-white rounded-md p-3 text-sm font-semibold shadow-sm hover:-translate-y-1 transition-transform duration-300">
                Get Started
              </Button>
            </Link>
            <CardContent className="p-0 mt-8 space-y-4 text-left text-gray-600 text-sm">
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Unlimited messages</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Advanced AI responses</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>File uploads</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 flex-shrink-0 bg-gray-900 rounded-full p-0.5 text-white" />
                  <span>Chat history</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t relative z-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Bot className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-800">SmartGenie</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600">Terms of Service</a>
              <a href="#" className="hover:text-blue-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
