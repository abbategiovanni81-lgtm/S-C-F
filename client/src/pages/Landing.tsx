import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { Zap, Calendar, Sparkles, Video, Mic, Image, FileText, Headphones, Scissors, Wand2, Film, UserCircle, Languages, Clapperboard, Play, MessageSquare, Star, Check, Type, Key, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { login, signup, isLoggingIn, isSigningUp, loginError, signupError } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email: loginEmail, password: loginPassword });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signup({ email: signupEmail, password: signupPassword, firstName: signupFirstName, lastName: signupLastName });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 md:mb-12 px-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="SocialCommandFlow" className="w-24 h-24 md:w-36 md:h-36 object-contain" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">
            Social<span className="text-purple-400">Command</span><span className="text-blue-400">Flow</span>
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-white mb-2">
            AI-Powered Social Media Management
          </p>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto px-2">
            Generate scripts, captions, images, and videos with AI. Connect your social channels and publish directly from one dashboard.
          </p>
        </div>

        <div className="text-center mb-6">
          <a 
            href="https://youtu.be/Eso4YpMxlQ8?si=74cbRS0fsxISBj2d" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
            data-testid="link-how-it-works-video"
          >
            <Play className="h-5 w-5" />
            Watch How It Works
          </a>
        </div>

        <div className="max-w-4xl mx-auto mb-10 px-2">
          <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 border-2 border-purple-500/40 rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Full Creator Workflow</h2>
            </div>
            <p className="text-center text-gray-300 text-sm md:text-base mb-5">
              From idea to published post—AI handles the heavy lifting
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <FileText className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-white text-xs font-medium">AI Scripts & Captions</p>
                <p className="text-gray-400 text-[10px]">GPT-4o powered</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <Image className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-white text-xs font-medium">AI Images</p>
                <p className="text-gray-400 text-[10px]">GPT-Image-1 & DALL-E</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <Video className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-white text-xs font-medium">AI Video</p>
                <p className="text-gray-400 text-[10px]">Sora, A2E, Fal.ai</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <Mic className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-white text-xs font-medium">AI Voiceover</p>
                <p className="text-gray-400 text-[10px]">ElevenLabs & OpenAI TTS</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-300">
              <span className="bg-white/10 px-2 py-1 rounded">Generate</span>
              <ArrowRight className="h-3 w-3 text-purple-400" />
              <span className="bg-white/10 px-2 py-1 rounded">Approve</span>
              <ArrowRight className="h-3 w-3 text-purple-400" />
              <span className="bg-white/10 px-2 py-1 rounded">Edit</span>
              <ArrowRight className="h-3 w-3 text-purple-400" />
              <span className="bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded text-purple-400">Publish</span>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="max-w-6xl mx-auto mb-12 md:mb-16 pt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">How It Works</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">1</div>
              <Zap className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Power Up</h3>
              <p className="text-gray-400 text-[10px]">Connect your accounts</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">2</div>
              <FileText className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Brand Brief</h3>
              <p className="text-gray-400 text-[10px]">Define your voice</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">3</div>
              <Sparkles className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Analyze Content</h3>
              <p className="text-gray-400 text-[10px]">Viral trends & mood</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">4</div>
              <FileText className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Generate Content</h3>
              <p className="text-gray-400 text-[10px]">Scripts & captions</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">5</div>
              <Video className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Add Media</h3>
              <p className="text-gray-400 text-[10px]">Voice, video, images</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">6</div>
              <Scissors className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Video to Clips</h3>
              <p className="text-gray-400 text-[10px]">Split & organize</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">7</div>
              <Type className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Editor</h3>
              <p className="text-gray-400 text-[10px]">Text overlays & style</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xs">8</div>
              <Calendar className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <h3 className="text-white font-semibold mb-1 text-xs">Schedule & Post</h3>
              <p className="text-gray-400 text-[10px]">YouTube, TikTok, IG</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Mic className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">AI Voiceovers</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Video className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Avatar Videos</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Film className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">In-Scene Video</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Image className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">AI Images</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Headphones className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Social Listening</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Sparkles className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Content Analyzer</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-3 text-center">
              <Wand2 className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Creator Studio</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Mic className="h-5 w-5 text-pink-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Voice Cloning</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Clapperboard className="h-5 w-5 text-pink-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Image to Video</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <UserCircle className="h-5 w-5 text-pink-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Face Swap</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Languages className="h-5 w-5 text-pink-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">AI Dubbing</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Scissors className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Edit & Merge</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white/5 border border-purple-500/30 rounded-xl p-4 md:p-6 text-center">
            <div className="flex justify-center gap-1 mb-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-gray-200 italic text-sm md:text-base mb-2">
              "This platform saved me 20+ hours a week. I went from struggling to post daily to having a full content calendar with AI-generated videos ready to go."
            </p>
            <p className="text-purple-400 font-medium text-sm">— Social Media Manager</p>
          </div>
          <div className="text-center mt-4">
            <Link href="/testimonials">
              <span className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">See More Success Stories</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">Simple Pricing</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <h3 className="text-sm font-bold text-white mb-1">Free</h3>
              <p className="text-2xl font-bold text-white mb-1">£0</p>
              <p className="text-gray-400 text-[10px] mb-3">Try it out</p>
              <ul className="text-left text-xs text-gray-300 space-y-1">
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 1 OpenAI API key</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 1 brand brief</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> AI scripts & captions</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> GPT-Image-1 images</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Download content</li>
                <li className="flex items-center gap-1 text-gray-500"><Check className="h-3 w-3 text-gray-500 flex-shrink-0" /> No social posting</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/40 rounded-xl p-4 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Key className="h-3 w-3" /> BYOK
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Core</h3>
              <p className="text-2xl font-bold text-white mb-1">£9.99<span className="text-xs text-gray-400">/mo</span></p>
              <p className="text-gray-400 text-[10px] mb-3">Your own API keys</p>
              <ul className="text-left text-xs text-gray-300 space-y-1">
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> All API keys (OpenAI, ElevenLabs, A2E...)</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Full Editor & Edit/Merge</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Video, voiceover, images</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 1 social channel</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 1 comparison/mo</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <h3 className="text-sm font-bold text-white mb-1">Premium</h3>
              <p className="text-2xl font-bold text-white mb-1">£29.99<span className="text-xs text-gray-400">/mo</span></p>
              <p className="text-gray-400 text-[10px] mb-3">For creators</p>
              <ul className="text-left text-xs text-gray-300 space-y-1">
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 6 social channels</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 5 brand briefs</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 30 min voiceover</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 20 videos, 180 images</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 150 lipsync, 5 avatars</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Unlimited comparisons</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500 rounded-xl p-4 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Popular</div>
              <h3 className="text-sm font-bold text-white mb-1">Pro</h3>
              <p className="text-2xl font-bold text-white mb-1">£49.99<span className="text-xs text-gray-400">/mo</span></p>
              <p className="text-gray-400 text-[10px] mb-3">For growing brands</p>
              <ul className="text-left text-xs text-gray-300 space-y-1">
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 8 social channels</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 10 brand briefs</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 75 min voiceover</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 45 videos, 500 images</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 400 lipsync, 10 avatars</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 4 team logins</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4 text-center col-span-2 md:col-span-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-white">Studio</h3>
                <span className="bg-yellow-500 text-black text-[8px] px-1.5 py-0.5 rounded font-bold">EARLY ADOPTER</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">£99.99<span className="text-xs text-gray-400">/mo</span></p>
              <p className="text-gray-400 text-[10px] mb-3">For agencies</p>
              <ul className="text-left text-xs text-gray-300 space-y-1">
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> All 10 social channels</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 90 min voiceover</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 60 videos, 500 images</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 450 lipsync, 15 avatars</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Creator Studio included</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Long form video engine</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Getty Images library</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> Priority support</li>
                <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400 flex-shrink-0" /> 6 team logins</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-4">All paid plans include: AI scripts, voiceovers, avatar videos, scheduling & analytics</p>
          
          <div className="max-w-md mx-auto mt-6">
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-400" />
                Creator Studio <span className="text-purple-400 font-normal">£20/mo add-on</span>
              </h3>
              <p className="text-gray-400 text-xs mb-3">Add-on for Premium & Pro • <span className="text-green-400">Included free with Studio</span></p>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                <span className="bg-white/5 rounded px-2 py-1 text-center">Voice Clone</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Talking Photo</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Talking Video</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Face Swap</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">AI Dubbing</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Image to Video</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Caption Removal</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Video Style</span>
                <span className="bg-white/5 rounded px-2 py-1 text-center">Virtual Try-On</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Get Started</CardTitle>
                <CardDescription className="text-gray-300">
                  Sign in or create an account to manage your social media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-white">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          data-testid="input-login-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          data-testid="input-login-password"
                        />
                      </div>
                      {loginError && (
                        <p className="text-red-400 text-sm" data-testid="text-login-error">
                          {loginError.message}
                        </p>
                      )}
                      <ResponsiveTooltip content="Sign in now">
                        <Button 
                          type="submit" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={isLoggingIn}
                          data-testid="button-login"
                        >
                          {isLoggingIn ? "Signing in..." : "Sign In"}
                        </Button>
                      </ResponsiveTooltip>
                    </form>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>
                    
                    <ResponsiveTooltip content="Sign in with Google">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.location.href = "/api/auth/google"}
                        data-testid="button-google-login"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </Button>
                    </ResponsiveTooltip>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-first-name" className="text-white">First Name</Label>
                          <Input
                            id="signup-first-name"
                            type="text"
                            placeholder="John"
                            value={signupFirstName}
                            onChange={(e) => setSignupFirstName(e.target.value)}
                            data-testid="input-signup-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-last-name" className="text-white">Last Name</Label>
                          <Input
                            id="signup-last-name"
                            type="text"
                            placeholder="Doe"
                            value={signupLastName}
                            onChange={(e) => setSignupLastName(e.target.value)}
                            data-testid="input-signup-last-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          data-testid="input-signup-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          data-testid="input-signup-password"
                        />
                      </div>
                      {signupError && (
                        <p className="text-red-400 text-sm" data-testid="text-signup-error">
                          {signupError.message}
                        </p>
                      )}
                      <ResponsiveTooltip content="Create your account">
                        <Button 
                          type="submit" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={isSigningUp}
                          data-testid="button-signup"
                        >
                          {isSigningUp ? "Creating account..." : "Create Account"}
                        </Button>
                      </ResponsiveTooltip>
                    </form>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>
                    
                    <ResponsiveTooltip content="Sign up with Google">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.location.href = "/api/auth/google"}
                        data-testid="button-google-signup"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </Button>
                    </ResponsiveTooltip>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-gray-500 text-sm">
            Powered by OpenAI, Claude, ElevenLabs, A2E, Fal.ai, and Pexels
          </p>
          <a href="/terms" className="text-gray-500 text-sm hover:text-purple-400 underline">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
