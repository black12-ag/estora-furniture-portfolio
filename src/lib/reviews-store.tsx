import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  slug: string;
  name: string;
  email?: string;
  rating: number;
  body: string;
  createdAt: number;
};

type Row = {
  id: string;
  product_slug: string;
  name: string;
  email: string | null;
  rating: number;
  body: string;
  created_at: string;
};

function mapRow(r: Row): Review {
  return {
    id: r.id,
    slug: r.product_slug,
    name: r.name,
    email: r.email ?? undefined,
    rating: r.rating,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function useProductReviews(slug: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, product_slug, name, email, rating, body, created_at")
      .eq("product_slug", slug)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (!error && data) setReviews((data as Row[]).map(mapRow));
    setHydrated(true);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const addReview = useCallback(
    async (r: Omit<Review, "id" | "createdAt" | "slug">) => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) throw new Error("Please sign in to leave a review.");
      const { error } = await supabase.from("product_reviews").insert({
        product_slug: slug,
        user_id: user.id,
        name: r.name,
        email: r.email || user.email || null,
        rating: r.rating,
        body: r.body,
      });
      if (error) throw new Error(error.message);
      await load();
    },
    [slug, load],
  );

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return { reviews, addReview, avg, count: reviews.length, hydrated };
}
