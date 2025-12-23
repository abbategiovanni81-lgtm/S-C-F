import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BarChart3, Calendar, Users, Sparkles, Video, Mic, Image, FileText, Headphones, Scissors } from "lucide-react";
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
            <img src="/logo.png" alt="SocialCommandFlow" className="w-14 h-14 md:w-20 md:h-20 object-contain" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">
            Social<span className="text-purple-400">Command</span><span className="text-blue-400">Flow</span>
          </h1>
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto px-2">
            Your all-in-one AI content creation tool. Generate scripts, voiceovers, avatar videos, and images—then schedule directly to your social platforms.
          </p>
        </div>

        <div id="how-it-works" className="max-w-6xl mx-auto mb-12 md:mb-16 pt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">1</div>
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Connect API Keys</h3>
              <p className="text-gray-400 text-xs md:text-sm">Add your OpenAI, ElevenLabs, and other AI service keys</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">2</div>
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Create Brand Brief</h3>
              <p className="text-gray-400 text-xs md:text-sm">Define your brand voice, target audience, and content strategy</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">3</div>
              <Video className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Generate Content</h3>
              <p className="text-gray-400 text-xs md:text-sm">AI creates scripts, voiceovers, videos, and images</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">4</div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Schedule & Post</h3>
              <p className="text-gray-400 text-xs md:text-sm">Schedule directly to YouTube, TikTok, and Instagram</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Mic className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">AI Voiceovers</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Video className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Avatar Videos</p>
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
              <Scissors className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Edit & Merge</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <Sparkles className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Content Analyzer</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start max-w-6xl mx-auto">
          <div className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Video</h3>
                <p className="text-gray-400 text-sm">Create videos with AI avatars</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Content</h3>
                <p className="text-gray-400 text-sm">AI scripts and captions</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                <p className="text-gray-400 text-sm">Track performance</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Platform</h3>
                <p className="text-gray-400 text-sm">YouTube, TikTok, IG</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Powered by OpenAI, ElevenLabs, A2E, Fal.ai, and Pexels
          </p>
        </div>
      </div>
    </div>
  );
}
