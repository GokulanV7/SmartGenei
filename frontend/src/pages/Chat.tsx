import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, User, Bot, Menu, Settings, LogOut, Crown, ExternalLink, Link2, Search, Globe, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserUsage } from "@/hooks/useUserUsage";

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI assistant. Ask me anything and I'll search the web to give you comprehensive answers with sources.",
      timestamp: new Date(),
      sources: [],
      isThinking: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPremiumPopupOpen, setIsPremiumPopupOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { usage, loading, canSendMessage, incrementMessageCount } = useUserUsage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkUser();
    initializeChatSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecentChats();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate('/auth');
      return;
    }
    
    setUser(authUser);
    
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    setProfile(profileData);
  };

  const initializeChatSession = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    // Check for an existing session or create a new one
    const { data: existingSessions, error } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return;
    }

    if (existingSessions && existingSessions.length > 0) {
      setCurrentSessionId(existingSessions[0].id);
      // Load messages for the most recent session
      loadMessages(existingSessions[0].id);
    } else {
      const { data: newSession, error: newSessionError } = await supabase
        .from('chat_sessions')
        .insert([{ user_id: authUser.id, title: 'New Chat' }])
        .select('id')
        .single();

      if (newSessionError) {
        console.error('Error creating new chat session:', newSessionError);
        return;
      }

      setCurrentSessionId(newSession.id);
    }
  };

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

  const loadMessages = async (sessionId: string) => {
    if (!user) return;

    const { data: sessionMessages, error } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    if (sessionMessages && sessionMessages.length > 0) {
      const formattedMessages = sessionMessages.map((msg, index) => ({
        id: index + 1,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        sources: [],
        isThinking: false
      }));
      setMessages(formattedMessages);
    } else {
      // Reset to default message if no history
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Hello! I'm your AI assistant. Ask me anything and I'll search the web to give you comprehensive answers with sources.",
          timestamp: new Date(),
          sources: [],
          isThinking: false
        }
      ]);
    }
  };

  const createNewChat = async () => {
    if (!user) return;

    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating new chat:', error);
      return;
    }

    setCurrentSessionId(newSession.id);
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: "Hello! I'm your AI assistant. Ask me anything and I'll search the web to give you comprehensive answers with sources.",
        timestamp: new Date(),
        sources: [],
        isThinking: false
      }
    ]);
    fetchRecentChats();
  };

  const loadChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    loadMessages(sessionId);
  };

  const saveMessageToSupabase = async (content: string, role: string) => {
    if (!currentSessionId || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert([{ 
        session_id: currentSessionId, 
        user_id: user.id, 
        content: content, 
        role: role 
      }]);

    if (error) {
      console.error('Error saving message to Supabase:', error);
    }
  };

  // Function to extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Function to check if URL is YouTube
  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Function to fetch AI response from backend
  const fetchAIResponse = async (question) => {
    try {
      // Send request to backend API
      const response = await fetch('https://smartgenei.onrender.com/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          include_youtube: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Handle backend response structure
      let sources = [];
      if (data.youtube_videos && data.youtube_videos.length > 0) {
        sources = data.youtube_videos.map(video => ({
          title: video.title,
          url: video.url,
          description: video.description,
          type: 'youtube'
        }));
      }
      if (data.source_urls && data.source_urls.length > 0) {
        sources = sources.concat(data.source_urls.map(url => ({
          title: new URL(url).hostname,
          url: url,
          description: '',
          type: 'website'
        })));
      }
      return {
        answer: data.answer,
        sources: sources
      };
    } catch (error) {
      console.error('Error fetching AI response:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check if user can send message
    // Check if message limit is reached (3/3)
    if (!canSendMessage() || usage?.messages_used >= 3) {
      setIsPremiumPopupOpen(true);
      return;
    }

    // Increment message count
    const canProceed = await incrementMessageCount();
    if (!canProceed) {
      setIsPremiumPopupOpen(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      sources: [],
      isThinking: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message to Supabase
    await saveMessageToSupabase(inputMessage, 'user');

    // Update chat session title based on the first user message if it's a new chat
    if (messages.length === 1 && currentSessionId) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: inputMessage.substring(0, 50) })
        .eq('id', currentSessionId);

      if (error) {
        console.error('Error updating chat session title:', error);
      } else {
        fetchRecentChats();
      }
    }

    try {
      // Add thinking message
      const thinkingMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Searching the web for the most current information...',
        timestamp: new Date(),
        sources: [],
        isThinking: true
      };
      setMessages(prev => [...prev, thinkingMessage]);

      const response = await fetchAIResponse(inputMessage);
      
      // Remove thinking message and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isThinking);
        return [...filtered, {
          id: Date.now() + 2,
          type: 'ai',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          isThinking: false
        }];
      });

      // Save AI response to Supabase
      await saveMessageToSupabase(response.answer, 'assistant');

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isThinking);
        return [...filtered, {
          id: Date.now() + 2,
          type: 'ai',
          content: "I apologize, but I encountered an error while searching for information. Please try again.",
          timestamp: new Date(),
          sources: [],
          isThinking: false
        }];
      });

      // Save error message to Supabase
      await saveMessageToSupabase("I apologize, but I encountered an error while searching for information. Please try again.", 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleFileUpload = () => {
    if (!usage?.is_premium) {
      toast({
        title: "Premium Feature",
        description: "File uploads are available for Premium users only.",
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const SourceCard = ({ source, index }) => {
    const isYouTube = isYouTubeUrl(source.url);
    const youTubeId = isYouTube ? extractYouTubeId(source.url) : null;
    const thumbnail = youTubeId ? getYouTubeThumbnail(youTubeId) : null;

    return (
      <div className="group relative overflow-hidden bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 hover:from-purple-100 hover:via-violet-100 hover:to-indigo-100 border border-purple-200/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* YouTube Video Preview */}
        {isYouTube && thumbnail && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
            <img 
              src={thumbnail} 
              alt={source.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                // Fallback to medium quality thumbnail if maxres fails
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg`;
              }}
            />
            {/* YouTube Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-red-600 rounded-full p-3 shadow-lg">
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            {/* YouTube Badge */}
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>YouTube</span>
            </div>
          </div>
        )}

        <div className="relative p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg flex-shrink-0 mt-1">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-purple-800 transition-colors leading-tight">
                {source.title}
              </h4>
              <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                {source.description}
              </p>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 text-xs flex items-center space-x-2 group-hover:underline transition-all"
              >
                {isYouTube ? (
                  <svg className="w-3 h-3 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                ) : (
                  <Globe className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="truncate font-medium">
                  {isYouTube ? 'Watch on YouTube' : new URL(source.url).hostname}
                </span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Sidebar */}
      <div className={`${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 backdrop-blur-xl bg-white/80 border-r border-purple-200/50 shadow-2xl transform transition-all duration-500 ease-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-purple-200/50 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600">
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <span>SmartGenie</span>
          </h1>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <nav className="space-y-3 mb-8">
            <button onClick={createNewChat} className="w-full flex items-center px-4 py-3 text-left rounded-xl hover:bg-gradient-to-r hover:from-purple-100 hover:to-violet-100 transition-all duration-300 group">
              <Bot className="h-5 w-5 mr-3 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 font-medium">New Chat</span>
            </button>
          </nav>

          <div>
            <h3 className="text-sm font-bold text-purple-800 mb-4 flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Recent Chats
            </h3>
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <button key={chat.id} onClick={() => loadChat(chat.id)} className={`w-full text-left p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-100 hover:to-violet-100 transition-all duration-300 group border border-purple-200/30 ${currentSessionId === chat.id ? 'bg-purple-100' : ''}`}>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-800 transition-colors">{chat.title}</p>
                  <p className="text-xs text-purple-600 mt-1">{new Date(chat.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-16 backdrop-blur-xl bg-white/80 border-b border-purple-200/50 flex items-center justify-between px-6 shadow-sm relative z-40">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-purple-100 transition-colors"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-purple-700" />
            </button>
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">AI Search Assistant</h2>
          </div>
          <div className="flex items-center space-x-3 relative">
            <Link to="/premium">
              <button className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 font-semibold">
                <Crown className="h-4 w-4 mr-2 inline" />
                Pro
              </button>
            </Link>
            <div className="relative">
              <button 
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center font-bold shadow-lg hover:shadow-purple-500/30 hover:scale-110 transition-all duration-300 text-white"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </button>
              {!usage?.is_premium && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {usage?.messages_used || 0}
                </div>
              )}
            </div>
            
            {/* Profile Dropdown - Fixed positioning and z-index */}
            {isProfileDropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-[100]" 
                  onClick={() => setIsProfileDropdownOpen(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-52 backdrop-blur-xl bg-white/95 shadow-2xl rounded-2xl py-3 z-[101] border border-purple-200/50">
                  <Link to="/profile">
                    <button className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-100 hover:to-violet-100 flex items-center transition-all rounded-lg mx-2">
                      <Settings className="h-4 w-4 mr-3 text-purple-600" />
                      <span className="font-medium">Settings</span>
                    </button>
                  </Link>
                  <button onClick={handleSignOut} className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 flex items-center text-red-600 transition-all rounded-lg mx-2">
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-30">
          {messages.map((message) => (
            <div key={message.id} className="max-w-4xl mx-auto">
              {message.type === 'user' ? (
                <div className="flex justify-end mb-6">
                  <div className="flex space-x-4 max-w-2xl">
                    <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-3xl px-6 py-4 shadow-lg shadow-purple-500/30">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                      {message.isThinking ? (
                        <Search className="h-5 w-5 text-white animate-pulse" />
                      ) : (
                        <Bot className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="backdrop-blur-xl bg-white/90 rounded-2xl p-6 shadow-lg shadow-purple-500/10 border border-purple-200/30">
                        {message.isThinking ? (
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-5 h-5 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            </div>
                            <p className="text-sm text-purple-700 font-medium">{message.content}</p>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-line text-sm">{message.content}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-bold text-purple-800 mb-4 flex items-center">
                            <Link2 className="h-4 w-4 mr-2" />
                            Sources ({message.sources.length})
                          </h4>
                          <div className="grid gap-4">
                            {message.sources.map((source, index) => (
                              <SourceCard key={index} source={source} index={index} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-purple-200/30 backdrop-blur-xl bg-transparent p-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            {!canSendMessage() ? (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 mb-2">You've reached your free message limit!</p>
                <Link to="/premium">
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                    Upgrade to Premium
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex space-x-4">
                <button
                  className="p-4 rounded-2xl border-2 border-purple-200/50 hover:border-purple-400 bg-white/40 hover:bg-white/60 backdrop-blur-md transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg"
                  onClick={handleFileUpload}
                >
                  <Paperclip className="h-5 w-5 text-purple-600" />
                </button>
                <div className="flex-1 relative">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask anything..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full px-6 py-4 border-2 border-purple-200/50 rounded-3xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white/40 backdrop-blur-md transition-all duration-300 text-sm placeholder-purple-400"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="absolute right-2 top-2 p-3 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-purple-600 mt-3 text-center font-medium">
              ✨ AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-purple-900/20 backdrop-blur-sm z-35 lg:hidden transition-all duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Premium Popup */}
      {isPremiumPopupOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setIsPremiumPopupOpen(false)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
                <h2 className="text-xl font-bold mb-2">Upgrade to Premium</h2>
                <p className="text-white/80 text-sm">You've reached your free message limit. Upgrade to continue chatting with unlimited messages and additional features.</p>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 perspective-1000">
                {/* Basic Plan */}
                <div className="group flex flex-col items-start max-w-xs rounded-3xl border border-gray-300/30 bg-gradient-to-br from-gray-100/20 to-slate-200/20 backdrop-blur-xl p-4 text-gray-900 transition-all duration-500 hover:scale-105 hover:-translate-y-4 transform-gpu shadow-2xl shadow-gray-500/20 hover:shadow-gray-500/40 hover:rotate-y-12 relative overflow-hidden">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-100/30 to-slate-200/20 backdrop-blur-xl"></div>
                  <div className="relative z-10 w-full">
                    <div className="text-center p-0 mb-6 w-full">
                      <h3 className="text-md font-normal text-gray-800 drop-shadow-sm font-semibold">Basic</h3>
                      <div className="my-6 flex items-baseline justify-center">
                        <span className="mr-2 text-4xl font-extrabold text-gray-900 drop-shadow-md">Free</span>
                      </div>
                      <p className="font-light text-gray-600 text-xs">Limited to 3 messages</p>
                    </div>
                    <Link to="/premium" className="block mt-4 w-full">
                      <button className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg p-2 text-xs font-semibold shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/20">
                        Upgrade Now
                      </button>
                    </Link>
                    <div className="p-0 mt-6 space-y-2 text-left text-gray-700 text-xs">
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>3 Messages</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Basic Response</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Basic Analytics</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Pro Plan */}
                <div className="group flex flex-col items-start max-w-xs rounded-3xl border border-green-300/30 bg-gradient-to-br from-emerald-400/20 to-green-500/20 backdrop-blur-xl p-4 text-gray-900 transition-all duration-500 hover:scale-110 hover:-translate-y-6 transform-gpu shadow-2xl shadow-green-600/30 hover:shadow-green-600/60 hover:rotate-y-12 relative overflow-hidden">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/30 to-green-500/20 backdrop-blur-xl"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/30 to-emerald-400/20 rounded-full blur-2xl"></div>
                  <div className="relative z-10 w-full">
                    <div className="text-center p-0 mb-6 w-full">
                      <h3 className="text-md font-normal text-gray-900 drop-shadow-sm font-semibold">Pro</h3>
                      <div className="my-6 flex items-baseline justify-center">
                        <span className="mr-2 text-4xl font-extrabold text-gray-900 drop-shadow-md">₹300</span>
                        <span className="text-gray-800 text-sm">/month</span>
                      </div>
                      <p className="font-light text-gray-700 text-xs">Balanced features for regular users</p>
                    </div>
                    <Link to="/premium" className="block mt-4 w-full">
                      <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-2 text-xs font-semibold shadow-lg shadow-green-500/40 hover:shadow-green-500/60 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/30">
                        Upgrade Now
                      </button>
                    </Link>
                    <div className="p-0 mt-6 space-y-2 text-left text-gray-800 text-xs">
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Unlimited Messages</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Faster Response Time</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Advanced Analytics</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>File Uploads</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Enterprise Plan */}
                <div className="group flex flex-col items-start max-w-xs rounded-3xl border border-purple-400/40 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-xl p-4 text-gray-900 transition-all duration-500 hover:scale-110 hover:-translate-y-6 transform-gpu shadow-2xl shadow-purple-700/40 hover:shadow-purple-700/70 hover:rotate-y-12 relative overflow-hidden">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/30 to-indigo-600/20 backdrop-blur-xl"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-600/40 to-indigo-600/30 rounded-full blur-xl"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/30 to-purple-600/20 rounded-full blur-2xl"></div>
                  <div className="relative z-10 w-full">
                    <div className="text-center p-0 mb-6 w-full">
                      <h3 className="text-md font-normal text-gray-900 drop-shadow-sm font-semibold">Enterprise</h3>
                      <div className="my-6 flex items-baseline justify-center">
                        <span className="text-4xl font-extrabold text-gray-900 drop-shadow-md">Custom</span>
                      </div>
                      <p className="font-light text-gray-700 text-xs">Tailored solutions for businesses</p>
                    </div>
                    <Link to="/premium" className="block mt-4 w-full">
                      <button className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-lg p-2 text-xs font-semibold shadow-lg shadow-purple-600/50 hover:shadow-purple-600/70 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm border border-white/30">
                        Contact Us
                      </button>
                    </Link>
                    <div className="p-0 mt-6 space-y-2 text-left text-gray-800 text-xs">
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Unlimited Everything</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Dedicated Support</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>Custom Features</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="h-4 w-4 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-0.5 text-white shadow-md">✓</span>
                          <span>SLA Guarantee</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end border-t border-gray-200">
                <button onClick={() => setIsPremiumPopupOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
