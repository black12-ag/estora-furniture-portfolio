import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Clock, ArrowRight, Tag, Rss, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BLOG_POSTS, BLOG_CATEGORIES, type BlogPost } from "@/lib/blog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Journal — Estora Interiors, Trends & Care Guides" },
      { name: "description", content: "Interior design ideas, care guides, lighting tips and seasonal trends from the Estora studio." },
      { property: "og:title", content: "The Estora Journal" },
      { property: "og:description", content: "Interior design ideas, care guides, lighting tips and seasonal trends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type SupaPost = {
  slug: string; title: string; excerpt: string; cover: string; category: string;
  author: string; author_role: string; date: string; read_minutes: number;
  tags: string[]; featured: boolean;
  body: { type: string; text?: string; items?: string[] }[];
};

function mapSupa(p: SupaPost): BlogPost {
  return {
    slug: p.slug, title: p.title, excerpt: p.excerpt, cover: p.cover, category: p.category,
    author: p.author, authorRole: p.author_role, date: p.date, readMinutes: p.read_minutes,
    tags: p.tags ?? [], featured: p.featured,
    body: (p.body ?? []).map((b) => ({ type: (b.type as BlogPost["body"][number]["type"]) ?? "p", text: b.text, items: b.items })),
  };
}

function BlogPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [supaPosts, setSupaPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("blog_posts").select("*")
        .eq("is_published", true).order("created_at", { ascending: false });
      if (data) setSupaPosts((data as unknown as SupaPost[]).map(mapSupa));
    })();
  }, []);

  const allPosts = useMemo<BlogPost[]>(() => {
    // Supabase wins on slug conflict
    const slugs = new Set(supaPosts.map((p) => p.slug));
    return [...supaPosts, ...BLOG_POSTS.filter((p) => !slugs.has(p.slug))];
  }, [supaPosts]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: allPosts.length };
    for (const p of allPosts) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [allPosts]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allPosts.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [q, cat, allPosts]);

  const featured = allPosts.find((p) => p.featured) ?? allPosts[0];
  const rest = filtered.filter((p) => featured && p.slug !== featured.slug);
  const topPosts = allPosts.slice(0, 4);

  return (
    <div className="bg-background">
      <header className="border-b border-border/60 bg-accent/40">
        <div className="container-x flex flex-col gap-4 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">The Journal</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl">
              Ideas, guides & inspiration for a better home.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Curated stories from our studio — interior styling, care guides, seasonal trends and thoughtful buys.
            </p>
          </div>
          <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Blog</span>
          </nav>
        </div>
      </header>

      <div className="container-x grid gap-10 py-12 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles…"
              aria-label="Search articles"
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Categories</p>
            <ul className="space-y-1 text-sm">
              {BLOG_CATEGORIES.map((c) => {
                const active = cat === c;
                return (
                  <li key={c}>
                    <button
                      onClick={() => setCat(c)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                        active ? "bg-foreground text-background" : "hover:bg-accent"
                      }`}
                    >
                      <span className="font-semibold">{c}</span>
                      <span className={active ? "text-background/70" : "text-muted-foreground"}>
                        {counts[c] ?? 0}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Top Posts</p>
            <ul className="space-y-4">
              {topPosts.map((p) => (
                <li key={p.slug}>
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="group flex gap-3">
                    <img src={p.cover} alt="" loading="lazy" width={64} height={64} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-semibold leading-snug group-hover:text-primary">{p.title}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{p.date} · {p.readMinutes} min read</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Popular tags</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(allPosts.flatMap((p) => p.tags))).slice(0, 12).map((t) => (
                <button
                  key={t}
                  onClick={() => setQ(t)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <p className="text-sm font-extrabold">Get the weekly edit</p>
            <p className="mt-1 text-xs text-muted-foreground">One short email every Friday. Ideas, discounts, no fluff.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); toast.success("You're subscribed."); (e.currentTarget as HTMLFormElement).reset(); }}
              className="mt-3 flex gap-2"
            >
              <input required type="email" placeholder="you@email.com" className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary" />
              <button className="rounded-full bg-foreground px-3 py-2 text-xs font-bold text-background hover:bg-foreground/90">Join</button>
            </form>
          </div>
        </aside>

        <div>
          {featured && cat === "All" && !q && (
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="group mb-12 grid gap-6 overflow-hidden rounded-3xl border border-border bg-surface md:grid-cols-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
                <img src={featured.cover} alt={featured.title} width={1200} height={800} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground">Featured</span>
              </div>
              <div className="flex flex-col justify-center p-6 md:p-8">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">{featured.category}</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{featured.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{featured.author}</span>
                  <span>·</span>
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readMinutes} min</span>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">
                  Read the story <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}

          <div className="mb-6 flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-extrabold">
              {cat === "All" && !q ? "Latest articles" : `${filtered.length} ${filtered.length === 1 ? "result" : "results"}`}
              {q && <span className="ml-2 text-sm font-normal text-muted-foreground">for “{q}”</span>}
            </h3>
            {(cat !== "All" || q) && (
              <button
                onClick={() => { setCat("All"); setQ(""); }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {rest.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Rss className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-bold">No articles match</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different keyword or category.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block overflow-hidden rounded-2xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={post.cover} alt={post.title} loading="lazy" width={800} height={600} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-foreground">
            <Tag className="mr-1 inline h-3 w-3 text-primary" />{post.category}
          </span>
        </div>
      </Link>
      <p className="mt-3 text-xs text-muted-foreground">
        By <span className="font-semibold text-foreground">{post.author}</span> · {post.date} · <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readMinutes} min</span>
      </p>
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="mt-2 block">
        <h3 className="text-base font-extrabold leading-snug group-hover:text-primary">{post.title}</h3>
      </Link>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
    </article>
  );
}
