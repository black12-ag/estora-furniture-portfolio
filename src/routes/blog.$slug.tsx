import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Facebook, Twitter, Instagram, Clock, ArrowLeft, ArrowRight, Share2, Link as LinkIcon, Heart, Bookmark, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getPost, getRelated, BLOG_POSTS, BLOG_CATEGORIES, categoryCounts, type BlogPost } from "@/lib/blog";
import { supabase } from "@/integrations/supabase/client";

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

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: NotFoundPost,
  loader: async ({ params }) => {
    let post = getPost(params.slug) as BlogPost | undefined;
    if (!post) {
      const { data } = await supabase
        .from("blog_posts").select("*")
        .eq("slug", params.slug).eq("is_published", true).maybeSingle();
      if (data) post = mapSupa(data as unknown as SupaPost);
    }
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.post;
    if (!p) return { meta: [{ title: "Article not found — Estora" }] };
    const url = "https://id-preview--9b478ba3-6046-4129-b643-73418ab58c88.lovable.app";
    return {
      meta: [
        { title: `${p.title} — Estora Journal` },
        { name: "description", content: p.excerpt },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:image", content: `${url}/og-blog.jpg` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: `${url}/og-blog.jpg` },
      ],
    };
  },
});

function PostPage() {
  const { post } = Route.useLoaderData() as { post: BlogPost };
  const related = getRelated(post.slug, 3);
  const counts = categoryCounts();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const idx = BLOG_POSTS.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? BLOG_POSTS[idx - 1] : null;
  const next = idx < BLOG_POSTS.length - 1 ? BLOG_POSTS[idx + 1] : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-surface">
        <div className="container-x flex items-center justify-between py-4 text-sm text-muted-foreground">
          <div className="min-w-0 truncate">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">{post.category}</span>
          </div>
          <Link to="/blog" className="hidden items-center gap-1 text-xs font-semibold text-foreground/70 hover:text-foreground sm:inline-flex">
            <ArrowLeft className="h-3.5 w-3.5" /> All articles
          </Link>
        </div>
      </div>

      {/* Hero */}
      <header className="container-x pt-10 md:pt-14">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">{post.category}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight md:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-bold text-primary">
              {post.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </span>
            <span className="font-semibold text-foreground">{post.author}</span>
            <span className="hidden text-xs sm:inline">· {post.authorRole}</span>
          </span>
          <span>·</span>
          <span>{post.date}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readMinutes} min read</span>
        </div>
        <img
          src={post.cover}
          alt={post.title}
          width={1600}
          height={900}
          className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover"
        />
      </header>

      {/* Body layout */}
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[220px_1fr_260px]">
        {/* Left rail: share + engage */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Share</p>
          <div className="mt-3 flex flex-col gap-2">
            <ShareBtn icon={Facebook} label="Facebook" href={`https://facebook.com/sharer/sharer.php?u=`} />
            <ShareBtn icon={Twitter} label="Twitter" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=`} />
            <ShareBtn icon={Instagram} label="Instagram" href="https://instagram.com" />
            <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary">
              <LinkIcon className="h-3.5 w-3.5" /> Copy link
            </button>
          </div>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => { setLiked((v) => !v); toast.success(liked ? "Removed like" : "Thanks!"); }}
              className={`flex w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${liked ? "border-sale text-sale" : "border-border hover:border-primary hover:text-primary"}`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> {liked ? "Liked" : "Like article"}
            </button>
            <button
              onClick={() => { setSaved((v) => !v); toast.success(saved ? "Removed from saved" : "Saved for later"); }}
              className={`flex w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${saved ? "border-primary text-primary" : "border-border hover:border-primary hover:text-primary"}`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save"}
            </button>
          </div>
        </aside>

        {/* Article body */}
        <article className="min-w-0">
          <div className="prose prose-neutral max-w-none space-y-5 text-[15px] leading-relaxed text-foreground/85">
            <p className="text-lg font-medium text-foreground/90">{post.excerpt}</p>
            {post.body.map((b, i) => {
              if (b.type === "h2") return <h2 key={i} className="pt-4 text-2xl font-extrabold text-foreground">{b.text}</h2>;
              if (b.type === "quote") return (
                <blockquote key={i} className="border-l-4 border-primary bg-accent/40 py-3 pl-5 pr-4 text-lg font-semibold italic text-foreground">
                  “{b.text}”
                </blockquote>
              );
              if (b.type === "list") return (
                <ul key={i} className="ml-5 list-disc space-y-1.5">
                  {b.items?.map((it) => <li key={it}>{it}</li>)}
                </ul>
              );
              return <p key={i}>{b.text}</p>;
            })}
          </div>

          {/* Tags + mobile share */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Link key={t} to="/blog" search={{} as never} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary">
                  #{t}
                </Link>
              ))}
            </div>
            <button onClick={copyLink} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline lg:hidden">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>

          {/* Author card */}
          <div className="mt-8 flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
            <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-extrabold text-primary">
              {post.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold">{post.author}</p>
              <p className="text-xs text-muted-foreground">{post.authorRole} at Estora</p>
              <p className="mt-2 text-sm text-foreground/80">Writes about interiors, materials and the small design decisions that make a home feel considered.</p>
            </div>
          </div>

          {/* Prev / Next */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link to="/blog/$slug" params={{ slug: prev.slug }} className="group rounded-2xl border border-border p-5 hover:border-primary">
                <p className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </p>
                <p className="mt-2 text-sm font-bold group-hover:text-primary">{prev.title}</p>
              </Link>
            ) : <div className="hidden sm:block" />}
            {next && (
              <Link to="/blog/$slug" params={{ slug: next.slug }} className="group rounded-2xl border border-border p-5 text-right hover:border-primary sm:text-right">
                <p className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground sm:ml-auto sm:justify-end">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </p>
                <p className="mt-2 text-sm font-bold group-hover:text-primary">{next.title}</p>
              </Link>
            )}
          </div>

          {/* Comments */}
          <section className="mt-14">
            <h3 className="text-lg font-extrabold">Comments</h3>
            <div className="mt-5 flex items-start gap-3 border-b border-border pb-6">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-surface font-bold">A</div>
              <div>
                <p className="text-sm font-bold">Amanda Spencer <span className="ml-2 text-xs font-normal text-muted-foreground">June 26, 2026</span></p>
                <p className="mt-1 text-sm text-foreground/80">Just redid our living room following the layered lighting tip — the room feels twice as warm at night. Thank you!</p>
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); toast.success("Comment submitted for review"); (e.currentTarget as HTMLFormElement).reset(); }}
              className="mt-8"
            >
              <p className="mb-4 text-sm font-bold">Leave a comment</p>
              <div className="grid gap-4 md:grid-cols-2">
                <input required placeholder="Your name" className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <input required type="email" placeholder="Your email" className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <textarea required rows={5} placeholder="Write your comment here…" className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <div className="mt-4 flex justify-end">
                <button className="rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:bg-foreground/90">Post comment</button>
              </div>
            </form>
          </section>
        </article>

        {/* Right rail: categories + top posts */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border p-5">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Categories</p>
            <ul className="space-y-1 text-sm">
              {BLOG_CATEGORIES.filter((c) => c !== "All").map((c) => (
                <li key={c}>
                  <Link to="/blog" className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent">
                    <span className="font-semibold">{c}</span>
                    <span className="text-muted-foreground">({counts[c] ?? 0})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-border p-5">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Top posts</p>
            <ul className="space-y-4">
              {BLOG_POSTS.slice(0, 4).map((p) => (
                <li key={p.slug}>
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="group flex gap-3">
                    <img src={p.cover} alt="" loading="lazy" width={56} height={56} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
                    <div>
                      <p className="line-clamp-2 text-xs font-semibold group-hover:text-primary">{p.title}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{p.date}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border/60 bg-surface/40 py-14">
          <div className="container-x">
            <div className="mb-6 flex items-end justify-between">
              <h3 className="text-xl font-extrabold">You might also like</h3>
              <Link to="/blog" className="text-sm font-bold text-primary hover:underline">View all →</Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }} className="group">
                  <div className="overflow-hidden rounded-2xl">
                    <img src={r.cover} alt={r.title} loading="lazy" width={600} height={450} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wider text-primary">{r.category}</p>
                  <p className="mt-1 text-sm font-extrabold leading-snug group-hover:text-primary">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.date} · {r.readMinutes} min read</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ShareBtn({ icon: Icon, label, href }: { icon: typeof Facebook; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Share on ${label}`}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  );
}

function NotFoundPost() {
  return (
    <div className="container-x py-20 text-center">
      <Search className="mx-auto h-8 w-8 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-extrabold">Article not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The story you're looking for may have moved.</p>
      <Link to="/blog" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:bg-foreground/90">
        Back to the Journal
      </Link>
    </div>
  );
}
