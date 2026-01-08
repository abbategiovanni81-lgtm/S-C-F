import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, BookOpen, Loader2 } from "lucide-react";

interface Blog {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  heroImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
  metaKeywords: string | null;
}

export default function Blogs() {
  const { data, isLoading } = useQuery<{ blogs: Blog[] }>({
    queryKey: ["/api/blogs"],
    queryFn: async () => {
      const res = await fetch("/api/blogs");
      if (!res.ok) throw new Error("Failed to fetch blogs");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3" data-testid="text-page-title">
              <BookOpen className="w-8 h-8 text-purple-400" />
              Blog
            </h1>
            <p className="text-slate-300">Tips, guides, and insights for social media success</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : !data?.blogs?.length ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-16 text-center">
              <p className="text-slate-400">No blog posts yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.blogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}>
                <Card 
                  className="bg-slate-800/50 border-slate-700 hover:border-purple-500 transition-all cursor-pointer h-full"
                  data-testid={`blog-card-${blog.id}`}
                >
                  {blog.heroImageUrl && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={blog.heroImageUrl} 
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-white line-clamp-2">{blog.title}</CardTitle>
                    {blog.summary && (
                      <CardDescription className="text-slate-300 line-clamp-2">
                        {blog.summary}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      {blog.authorName && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {blog.authorName}
                        </span>
                      )}
                      {blog.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> 
                          {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      )}
                    </div>
                    {blog.metaKeywords && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {blog.metaKeywords.split(",").slice(0, 3).map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-500/20 text-purple-300">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
