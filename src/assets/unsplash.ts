export interface UnsplashImage {
  id: string;
  description: string;
  previewUrl: string;
  fullUrl: string;
  authorName: string;
  authorUrl: string;
  downloadLocation: string;
}

interface UnsplashSearchResponse {
  results?: Array<{
    id: string;
    alt_description?: string | null;
    description?: string | null;
    urls: { small: string; regular: string };
    links: { download_location: string };
    user: { name: string; links: { html: string } };
  }>;
}

export async function searchUnsplash(
  query: string,
  page = 1,
  accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined
): Promise<UnsplashImage[]> {
  if (!accessKey) throw new Error("Unsplash access key is not configured.");
  const cleanedQuery = query.trim().slice(0, 100);
  if (!cleanedQuery) return [];

  const endpoint = new URL("https://api.unsplash.com/search/photos");
  endpoint.searchParams.set("query", cleanedQuery);
  endpoint.searchParams.set("page", String(Math.max(1, page)));
  endpoint.searchParams.set("per_page", "24");

  const response = await fetch(endpoint, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    referrerPolicy: "no-referrer"
  });
  if (!response.ok) throw new Error(`Unsplash request failed (${response.status}).`);
  const payload = (await response.json()) as UnsplashSearchResponse;

  return (payload.results ?? []).map((image) => ({
    id: image.id,
    description: image.alt_description || image.description || "Unsplash image",
    previewUrl: image.urls.small,
    fullUrl: image.urls.regular,
    authorName: image.user.name,
    authorUrl: image.user.links.html,
    downloadLocation: image.links.download_location
  }));
}
