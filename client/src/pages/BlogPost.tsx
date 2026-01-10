import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { ArrowLeft, Calendar, User, Share2, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface Blog {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  heroImageUrl: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  authorName: string | null;
  publishedAt: string | null;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3 text-white">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-white">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-white">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 py-0.5 rounded text-purple-300">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal text-slate-300">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-slate-300 leading-relaxed">')
    .replace(/\n/g, '<br />');
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: blog, isLoading, error } = useQuery<Blog>({
    queryKey: ["/api/blogs", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blogs/${slug}`);
      if (!res.ok) throw new Error("Blog not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (blog) {
      document.title = `${blog.title} | SocialCommandFlow Blog`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && blog.metaDescription) {
        metaDesc.setAttribute("content", blog.metaDescription);
      }
    }
    return () => {
      document.title = "SocialCommandFlow";
    };
  }, [blog]);

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.summary || blog.metaDescription || "",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Blog Post Not Found</h1>
          <p className="text-slate-300 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link href="/blog">
            <ResponsiveTooltip content="View all articles">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
              </Button>
            </ResponsiveTooltip>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/blog">
            <ResponsiveTooltip content="View all articles">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
              </Button>
            </ResponsiveTooltip>
          </Link>
          <ResponsiveTooltip content="Share this article">
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-white hover:bg-white/10">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </ResponsiveTooltip>
        </div>

        {blog.heroImageUrl && (
          <div className="aspect-video overflow-hidden rounded-lg mb-8">
            <img 
              src={blog.heroImageUrl} 
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="text-blog-title">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
            {blog.authorName && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> {blog.authorName}
              </span>
            )}
            {blog.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> 
                {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            )}
          </div>

          {blog.metaKeywords && (
            <div className="flex flex-wrap gap-2">
              {blog.metaKeywords.split(",").map((keyword, i) => (
                <Badge key={i} variant="secondary" className="bg-purple-500/20 text-purple-300">
                  {keyword.trim()}
                </Badge>
              ))}
            </div>
          )}

          {blog.summary && (
            <p className="text-lg text-slate-300 mt-4 italic border-l-4 border-purple-500 pl-4">
              {blog.summary}
            </p>
          )}
        </header>

        <div 
          className="prose prose-invert prose-purple max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: `<p class="mb-4 text-slate-300 leading-relaxed">${renderMarkdown(blog.body)}</p>` 
          }}
        />

        <footer className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <Link href="/blog">
              <ResponsiveTooltip content="Browse more posts">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" /> More Articles
                </Button>
              </ResponsiveTooltip>
            </Link>
            <ResponsiveTooltip content="Share this article">
              <Button onClick={handleShare} className="bg-purple-600 hover:bg-purple-700">
                <Share2 className="w-4 h-4 mr-2" /> Share This Post
              </Button>
            </ResponsiveTooltip>
          </div>
        </footer>
      </article>
    </div>
  );
}
