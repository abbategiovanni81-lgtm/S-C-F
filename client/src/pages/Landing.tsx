import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Calendar, Sparkles, Video, Mic, Image, FileText, Headphones, Scissors, Wand2, Film, UserCircle, Languages, Clapperboard, Play, MessageSquare, Star, Check } from "lucide-react";
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
            Turn AI Into Viral Content That Posts Itself
          </p>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto px-2">
            Generate scripts, voiceovers, avatar videos, and images—then auto-post to 10 social platforms. All from one dashboard.
          </p>
        </div>

        <div className="text-center mb-6">
          <a 
            href="https://youtu.be/35iy5J8OgOk?si=Iie-RUeY-0LtOn9d" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
            data-testid="link-how-it-works-video"
          >
            <Play className="h-5 w-5" />
            Watch How It Works
          </a>
        </div>

        <div id="how-it-works" className="max-w-6xl mx-auto mb-12 md:mb-16 pt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">How It Works</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
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

        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <h3 className="text-lg font-bold text-white mb-1">Free</h3>
              <p className="text-3xl font-bold text-white mb-1">$0</p>
              <p className="text-gray-400 text-xs mb-4">Forever free</p>
              <ul className="text-left text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> 3 social channels</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> 10 AI generations/mo</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Basic scheduling</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500 rounded-xl p-5 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</div>
              <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
              <p className="text-3xl font-bold text-white mb-1">$49<span className="text-lg text-gray-400">/mo</span></p>
              <p className="text-gray-400 text-xs mb-4">For growing creators</p>
              <ul className="text-left text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> 10 social channels</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> 500 AI generations/mo</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Avatar videos + voice</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Social listening</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <h3 className="text-lg font-bold text-white mb-1">Studio</h3>
              <p className="text-3xl font-bold text-white mb-1">$149<span className="text-lg text-gray-400">/mo</span></p>
              <p className="text-gray-400 text-xs mb-4">For agencies & teams</p>
              <ul className="text-left text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Unlimited channels</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> 2000 AI generations/mo</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Steve AI longform</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Priority support</li>
              </ul>
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
                      <Button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isLoggingIn}
                        data-testid="button-login"
                      >
                        {isLoggingIn ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>
                    
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
                      <Button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isSigningUp}
                        data-testid="button-signup"
                      >
                        {isSigningUp ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>
                    
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
