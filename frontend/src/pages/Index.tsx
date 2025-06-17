import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Shield, Zap, Users, Star, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParallax } from "@/hooks/useParallax";
import "@/styles/parallax.css";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  
  // Parallax effects
  const heroBgParallax = useParallax({ speed: 0.15 });
  const heroContentParallax = useParallax({ speed: 0.05, reverse: true });
  const featuresParallax = useParallax({ speed: 0.1 });
  const testimonialsParallax = useParallax({ speed: 0.08 });
  const ctaParallax = useParallax({ speed: 0.12 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-600" />,
      title: "Intelligent Conversations",
      description: "Advanced AI that understands context and provides meaningful responses"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure & Private",
      description: "Your conversations are encrypted and your privacy is our priority"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Lightning Fast",
      description: "Get instant responses powered by cutting-edge AI technology"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Community Driven",
      description: "Join thousands of users exploring the future of AI communication"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      content: "SmartGenie has revolutionized how I approach problem-solving. The AI insights are incredible!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Developer",
      content: "The file upload feature is a game-changer. I can analyze documents instantly.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Student",
      content: "Perfect for research and learning. The free tier is generous for getting started.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SmartGenie
                </h1>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Pricing
                </a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Testimonials
                </a>
                <Link to="/auth" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a href="#features" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                Testimonials
              </a>
              <Link to="/auth" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                Sign In
              </Link>
              <Link to="/auth" className="block px-3 py-2">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative parallax-container overflow-visible">
        {/* Parallax background elements */}
        <div
          className="gradient-blob bg-blue-400"
          style={{
            width: '40%',
            height: '40%',
            left: '-10%',
            top: '10%',
            opacity: 0.15,
            transform: mounted ? `translate3d(${-window.scrollY * 0.03}px, 0, 0)` : 'none',
            zIndex: 1,
          }}
        />
        
        <div
          className="gradient-blob bg-purple-400"
          style={{
            width: '35%',
            height: '35%',
            right: '-5%',
            bottom: '10%',
            opacity: 0.1,
            transform: mounted ? `translate3d(${window.scrollY * 0.02}px, 0, 0)` : 'none',
            zIndex: 1,
          }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="parallax-content" style={heroContentParallax}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Meet Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI Assistant</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of AI conversation. Upload files, ask questions, and get intelligent responses that understand your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                  Start Chatting <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
            
            {/* Hero Image with Parallax */}
            <div className="mt-16 relative">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-1 transform"
                style={heroBgParallax}
              >
                <div className="bg-white rounded-lg p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-left">
                        <p className="text-sm text-gray-600">You</p>
                        <p className="text-gray-800">Can you help me analyze this document?</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 text-left">
                        <p className="text-sm opacity-90">SmartGenie</p>
                        <p>Of course! I can analyze documents, images, and provide detailed insights. Upload your file and I'll help you understand it better.</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-24 w-24 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" style={featuresParallax}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for intelligent AI conversations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all parallax-card"
                style={{ 
                  transform: mounted ? `translateY(${Math.sin((index * 0.5) + (window.scrollY * 0.002)) * 10}px)` : 'none'
                }}
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600 mb-4">Perfect for getting started</p>
                <div className="text-4xl font-bold text-gray-900">$0</div>
                <p className="text-gray-600">forever</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">3 messages per session</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Basic AI responses</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">File upload support</span>
                </li>
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 shadow-lg text-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="opacity-90 mb-4">For power users</p>
                <div className="text-4xl font-bold">$9</div>
                <p className="opacity-90">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Unlimited messages</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Advanced AI responses</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Chat history</span>
                </li>
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with Parallax */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" style={testimonialsParallax}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-xl p-6 parallax-card"
                style={{ 
                  transform: mounted ? `translateY(${-Math.sin((index * 0.8) + (window.scrollY * 0.001)) * 15}px)` : 'none'
                }}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Parallax */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Parallax decorative elements */}
        <div 
          className="absolute inset-0 opacity-10"
          style={ctaParallax}
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already experiencing smarter conversations
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8">
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                SmartGenie
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                The future of AI conversation is here. Experience intelligent, context-aware responses that understand your needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartGenie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
