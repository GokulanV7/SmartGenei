import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Crown, MessageSquare, Calendar, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "@/hooks/useAuth";
import { useUserUsage } from "@/hooks/useUserUsage";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { usage, loading } = useUserUsage();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  
  const [userProfile, setUserProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || 'Not available',
    isPremium: usage?.is_premium || false,
    totalChats: usage?.messages_used || 0,
    joinDate: user?.created_at?.split('T')[0] || 'Unknown',
    lastActive: user?.last_sign_in_at?.split('T')[0] || 'Unknown'
  });

  const [editProfile, setEditProfile] = useState({
    name: userProfile.name,
    email: userProfile.email
  });

  // Parallax effects
  const bgBlob1Parallax = useParallax({ speed: 0.05 });
  const bgBlob2Parallax = useParallax({ speed: 0.08 });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setUserProfile({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || 'Not available',
        isPremium: usage?.is_premium || false,
        totalChats: usage?.messages_used || 0,
        joinDate: user.created_at?.split('T')[0] || 'Unknown',
        lastActive: user.last_sign_in_at?.split('T')[0] || 'Unknown'
      });
      setEditProfile({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || 'Not available'
      });
      fetchRecentChats();
    }
  }, [user, usage]);

  const fetchRecentChats = async () => {
    if (!user) return;

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent chats:', error);
      return;
    }

    setRecentChats(sessions || []);
  };

  const handleSaveProfile = () => {
    setUserProfile({
      ...userProfile,
      name: editProfile.name,
      email: editProfile.email
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 relative overflow-hidden">
      {/* Parallax background elements */}
      <div 
        className="gradient-blob bg-blue-400" 
        style={{
          ...bgBlob1Parallax,
          width: '600px', 
          height: '600px', 
          left: '-200px',
          top: '30%',
          zIndex: 0,
          opacity: 0.1
        }}
      />
      
      <div 
        className="gradient-blob bg-purple-400" 
        style={{
          ...bgBlob2Parallax,
          width: '700px', 
          height: '700px', 
          right: '-250px',
          bottom: '10%',
          zIndex: 0,
          opacity: 0.07
        }}
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/chat" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Chat
              </Link>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SmartGenie
            </h1>
            <div></div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card className="parallax-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-white font-medium text-2xl">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {userProfile.isPremium && (
                    <div className="flex items-center justify-center space-x-1 text-yellow-600 mb-2">
                      <Crown className="h-4 w-4" />
                      <span className="text-sm font-medium">Premium Member</span>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editProfile.name}
                        onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={editProfile.email}
                        onChange={(e) => setEditProfile({...editProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile} className="flex-1">
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <p className="text-gray-900 font-medium">{userProfile.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-gray-900 font-medium">{userProfile.email}</p>
                    </div>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card className="parallax-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userProfile.isPremium ? (
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg p-4 mb-4">
                      <Crown className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Premium Active</p>
                      <p className="text-sm opacity-90">Unlimited messages</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <p className="font-semibold text-gray-900">Free Plan</p>
                      <p className="text-sm text-gray-600">
                        {userProfile.totalChats}/3 messages used
                      </p>
                    </div>
                    <Link to="/premium">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage Stats & Chat History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Usage Statistics */}
            <Card className="parallax-card">
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Your SmartGenie activity overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{userProfile.totalChats}</p>
                    <p className="text-sm text-gray-600">Total Messages</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {Math.floor((new Date().getTime() - new Date(userProfile.joinDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-sm text-gray-600">Days Active</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {userProfile.isPremium ? 'Premium' : 'Free'}
                    </p>
                    <p className="text-sm text-gray-600">Plan Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat History with Parallax effect on cards */}
            <Card>
              <CardHeader>
                <CardTitle>Chat History</CardTitle>
                <CardDescription>Your recent conversations with SmartGenie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentChats.map((chat, index) => (
                    <div 
                      key={chat.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                      style={{ 
                        transform: mounted ? `translateY(${Math.sin((index * 0.8) + (window.scrollY * 0.003)) * 5}px)` : 'none',
                        transition: 'transform 0.5s ease-out'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{chat.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(chat.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link to={`/chat/${chat.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                {recentChats.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No chat history yet</p>
                    <p className="text-sm text-gray-500">Start a conversation to see your history here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="parallax-card">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates about your account</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Export</p>
                      <p className="text-sm text-gray-600">Download your chat history and data</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => {
                      alert('Data export functionality will be implemented soon.');
                    }}>
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-600">Delete Account</p>
                      <p className="text-sm text-gray-600">Permanently delete your account and data</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={async () => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        alert('Account deletion functionality will be implemented soon.');
                      }
                    }}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
