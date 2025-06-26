import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Check, ArrowLeft, Zap, MessageCircle, Upload, History, HeadphonesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParallax } from "@/hooks/useParallax";
import { useUserUsage } from "@/hooks/useUserUsage";
import "@/styles/parallax.css";
import "@/styles/landing.css";

const Premium = () => {
  const [mounted, setMounted] = useState(false);
  const [isMaintenancePopupOpen, setIsMaintenancePopupOpen] = useState(false);
  const { usage, loading } = useUserUsage();
  const navigate = useNavigate();
  
  // Parallax effects
  const heroParallax = useParallax({ speed: 0.08, reverse: true });
  const cardParallax = useParallax({ speed: 0.1 });
  const bgBlob1Parallax = useParallax({ speed: 0.05 });
  const bgBlob2Parallax = useParallax({ speed: 0.07 });

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleUpgrade = () => {
    setIsMaintenancePopupOpen(true);
  };

  const handleFreeClick = () => {
    navigate('/chat');
  };

  const handleContactClick = () => {
    setIsMaintenancePopupOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 relative overflow-hidden">
      {/* Parallax background elements */}
      <div 
        className="gradient-blob bg-blue-400" 
        style={{
          ...bgBlob1Parallax,
          width: '500px', 
          height: '500px', 
          left: '-100px',
          top: '30%',
          zIndex: 0,
          opacity: 0.1
        }}
      />
      
      <div 
        className="gradient-blob bg-purple-400" 
        style={{
          ...bgBlob2Parallax,
          width: '600px', 
          height: '600px', 
          right: '-150px',
          bottom: '10%',
          zIndex: 0,
          opacity: 0.08
        }}
      />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/chat" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Link>
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            <span className="font-semibold text-gray-800">Upgrade to Premium</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12" style={heroParallax}>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {usage?.is_premium ? "You're Already on Premium!" : "Unlock Unlimited Conversations"}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {usage?.is_premium ? "Enjoy unlimited access to SmartGenie with your Premium plan." : "You've reached your free message limit. Upgrade to Premium for unlimited access to SmartGenie."}
            </p>
            {!usage?.is_premium && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 inline-block">
                <p className="text-yellow-800 font-medium">
                  ⚡ You've used all 3 free messages today
                </p>
              </div>
            )}
          </div>

          {/* Enhanced 3D Pricing Cards with Glassy Effect */}
          <div className="mb-12" style={cardParallax}>
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
                  <Button onClick={handleFreeClick} className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl p-3 text-sm font-semibold shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/20 mt-6">
                    Get Started
                  </Button>
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
                  <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-3 text-sm font-semibold shadow-lg shadow-green-500/40 hover:shadow-green-500/60 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/30 mt-6">
                    Upgrade Now
                  </Button>
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
                  <Button onClick={handleContactClick} className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl p-3 text-sm font-semibold shadow-lg shadow-purple-600/50 hover:shadow-purple-600/70 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/30 mt-6">
                    Contact Us
                  </Button>
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
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg p-8 shadow-sm relative z-10">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time with no cancellation fees.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">Every user gets 3 free messages per day to try out SmartGenie.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards and PayPal for your convenience.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is my data secure?</h3>
                <p className="text-gray-600">Yes, we use enterprise-grade security to protect your conversations and data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Under Maintenance Popup */}
      {isMaintenancePopupOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center"
            onClick={() => setIsMaintenancePopupOpen(false)}
          />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Under Maintenance</h2>
                <p className="text-white/90 text-sm">Payment system is currently under maintenance. Please try again later.</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-gray-600 mb-4">We're working hard to bring you the best payment experience. Thank you for your patience!</p>
                <button 
                  onClick={() => setIsMaintenancePopupOpen(false)}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Premium;
