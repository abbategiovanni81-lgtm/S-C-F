import { addDays, subDays } from 'date-fns';

export const MOCK_USER = {
  name: "Alex Chen",
  email: "alex@socialcommand.io",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  plan: "Pro Plan"
};

export const MOCK_CHANNELS = [
  { id: 1, platform: "twitter", name: "TechStart Inc", handle: "@techstart", followers: "12.5K", status: "connected" },
  { id: 2, platform: "linkedin", name: "TechStart Inc", handle: "company/techstart", followers: "8.2K", status: "connected" },
  { id: 3, platform: "instagram", name: "TechStart Life", handle: "@techstart_life", followers: "45.1K", status: "connected" },
  { id: 4, platform: "facebook", name: "TechStart Official", handle: "TechStart", followers: "10.3K", status: "connected" },
  { id: 5, platform: "youtube", name: "TechStart TV", handle: "@techstart_tv", followers: "102K", status: "connected" },
  { id: 6, platform: "twitter", name: "Alex Chen", handle: "@alexc_dev", followers: "3.2K", status: "connected" },
  { id: 7, platform: "linkedin", name: "Alex Chen", handle: "in/alexchen", followers: "5.4K", status: "disconnected" },
];

export const MOCK_AI_ENGINES = [
  { 
    id: 1, 
    name: "Steve.AI", 
    type: "Avatar Video Generation", 
    status: "connected", 
    description: "Generates lip-synced talking avatars",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80" 
  },
  { 
    id: 2, 
    name: "Dola AI", 
    type: "Cinematic Visuals", 
    status: "connected", 
    description: "Creates high-quality 3D scenes and background visuals",
    logo: "https://images.unsplash.com/photo-1633419461186-7d40a23933a7?auto=format&fit=crop&w=150&q=80" 
  },
  { 
    id: 3, 
    name: "OpenAI GPT-4", 
    type: "Text & Strategy", 
    status: "connected", 
    description: "Writes captions, hashtags, and content strategy",
    logo: "https://images.unsplash.com/photo-1692312349581-8a5316db048c?auto=format&fit=crop&w=150&q=80" 
  }
];

export const MOCK_STATS = [
  { label: "Total Followers", value: "181.7K", change: "+12%", trend: "up" },
  { label: "Impressions", value: "2.4M", change: "+25%", trend: "up" },
  { label: "Engagement Rate", value: "4.8%", change: "-0.2%", trend: "down" },
  { label: "Scheduled Posts", value: "12", change: "0", trend: "neutral" },
];

export const ANALYTICS_DATA = Array.from({ length: 7 }).map((_, i) => ({
  name: subDays(new Date(), 6 - i).toLocaleDateString('en-US', { weekday: 'short' }),
  twitter: Math.floor(Math.random() * 5000) + 1000,
  linkedin: Math.floor(Math.random() * 4000) + 1000,
  instagram: Math.floor(Math.random() * 8000) + 2000,
}));

export const SCHEDULED_POSTS = [
  {
    id: 1,
    content: "Excited to announce our new feature launch! 🚀 #tech #startup",
    platforms: ["twitter", "linkedin"],
    scheduledFor: addDays(new Date(), 1),
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: 2,
    content: "Behind the scenes at our annual retreat 🌲",
    platforms: ["instagram", "facebook"],
    scheduledFor: addDays(new Date(), 2),
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: 3,
    content: "5 tips for better productivity in 2024. Thread 👇",
    platforms: ["twitter"],
    scheduledFor: addDays(new Date(), 3),
    image: null
  }
];

export const RECENT_ACTIVITY = [
  { id: 1, action: "Post published", target: "Twitter", time: "2h ago" },
  { id: 2, action: "Account connected", target: "Instagram", time: "5h ago" },
  { id: 3, action: "Post scheduled", target: "LinkedIn", time: "1d ago" },
  { id: 4, action: "Report generated", target: "Weekly Analytics", time: "2d ago" },
];
