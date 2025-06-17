import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Crown, Check, ArrowLeft, Zap, MessageCircle, Upload, History, HeadphonesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParallax } from "@/hooks/useParallax";
import { useUserUsage } from "@/hooks/useUserUsage";
import "@/styles/parallax.css";

const Premium = () => {
  const [mounted, setMounted] = useState(false);
  const { usage, loading } = useUserUsage();
  
  // Parallax effects
  const heroParallax = useParallax({ speed: 0.08, reverse: true });
  const cardParallax = useParallax({ speed: 0.1 });
  const bgBlob1Parallax = useParallax({ speed: 0.05 });
  const bgBlob2Parallax = useParallax({ speed: 0.07 });

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleUpgrade = () => {
    // This would integrate with a payment processor like Stripe
    alert('Premium upgrade would be handled by a payment processor like Stripe');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
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

          {/* Premium Features with Parallax effect on items */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Premium Features</h2>
              <div className="space-y-4">
                {[
                  { icon: <MessageCircle className="h-6 w-6 text-blue-600 mt-1" />, title: "Unlimited Messages", desc: "Chat as much as you want, no daily limits" },
                  { icon: <Zap className="h-6 w-6 text-purple-600 mt-1" />, title: "Advanced AI Responses", desc: "Get more detailed and intelligent answers" },
                  { icon: <Upload className="h-6 w-6 text-green-600 mt-1" />, title: "File Uploads", desc: "Upload documents, images, and more" },
                  { icon: <History className="h-6 w-6 text-orange-600 mt-1" />, title: "Chat History", desc: "Access all your previous conversations" },
                  { icon: <HeadphonesIcon className="h-6 w-6 text-red-600 mt-1" />, title: "Priority Support", desc: "Get help when you need it most" }
                ].map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3"
                    style={{ 
                      transform: mounted ? `translateY(${Math.sin((index * 0.8) + (window.scrollY * 0.003)) * 8}px)` : 'none',
                      transition: 'transform 0.5s ease-out'
                    }}
                  >
                    {feature.icon}
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Card with Parallax */}
            <div style={cardParallax}>
              <Card className="border-2 border-purple-600 relative parallax-card">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
                <CardHeader className="text-center">
                  <Crown className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                  <CardTitle className="text-3xl">Premium Plan</CardTitle>
                  <div className="text-4xl font-bold mb-2">
                    $9.99<span className="text-lg text-gray-600">/month</span>
                  </div>
                  <CardDescription>Everything you need for unlimited AI assistance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span>Unlimited messages</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span>Advanced AI responses</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span>File upload support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span>Full chat history</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span>Priority customer support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                  
                  {!usage?.is_premium ? (
                    <Button 
                      onClick={handleUpgrade}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Premium
                    </Button>
                  ) : (
                    <Button 
                      disabled
                      className="w-full bg-green-600"
                      size="lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Already on Premium
                    </Button>
                  )}
                  
                  <p className="text-center text-sm text-gray-500">
                    Secure payment • Cancel anytime • 30-day money back guarantee
                  </p>
                </CardContent>
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
    </div>
  );
};

export default Premium;
