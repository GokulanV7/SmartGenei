import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import "./styles/parallax.css";

const queryClient = new QueryClient();

const OAuthRedirectHandler = () => {
  useEffect(() => {
    // Check if we're on localhost and have OAuth tokens in the URL
    if (window.location.hostname === 'localhost' && window.location.hash.includes('access_token=')) {
      // Extract the hash fragment with OAuth tokens
      const hashFragment = window.location.hash;
      
      // Redirect to production domain with the OAuth tokens
      const productionUrl = `https://smart-genei.vercel.app/chat${hashFragment}`;
      window.location.replace(productionUrl);
    }
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OAuthRedirectHandler />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/index" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
