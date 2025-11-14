import { MarketingLayout } from "@/components/layout/MarketingLayout";

const BlogPost = () => {
  return (
    <MarketingLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-8">Blog Post</h1>
          <p className="text-lg text-muted-foreground text-center">Coming soon...</p>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default BlogPost;