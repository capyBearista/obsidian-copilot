import { getDecryptedKey } from "@/encryptionService";
import { logError } from "@/logger";
import { getSettings } from "@/settings/model";

/**
 * Structured web search payload returned to the webSearch tool.
 */
export interface WebSearchResult {
  content: string;
  citations: string[];
}

/**
 * Provider contract for BYOK web search implementations.
 */
export interface WebSearchProvider {
  /**
   * Execute a web search query and return normalized content + citations.
   *
   * @param query - The user query, typically converted to standalone form.
   */
  search(query: string): Promise<WebSearchResult>;
}

/**
 * Fetch an error body string with a maximum size cap.
 *
 * @param response - Failed upstream response.
 * @returns Bounded error body text for diagnostics.
 */
async function readErrorBody(response: Response): Promise<string> {
  const raw = await response.text();
  return raw.length > 1000 ? `${raw.slice(0, 1000)}...` : raw;
}

/**
 * Normalize and bound text fields for provider output.
 *
 * @param value - Candidate text value.
 * @param maxLength - Maximum output length.
 * @returns Safe normalized string.
 */
function normalizeText(value: unknown, maxLength = 1500): string {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

/**
 * Parse provider results into markdown-like blocks consumed by the tool.
 *
 * @param rows - Result rows with title/snippet/url fields.
 * @returns Normalized content and citation list.
 */
function formatResults(
  rows: Array<{ title?: unknown; snippet?: unknown; url?: unknown }>
): WebSearchResult {
  const citations: string[] = [];
  const contentParts: string[] = [];

  rows.slice(0, 5).forEach((row) => {
    const title = normalizeText(row.title, 200) || "Untitled";
    const snippet = normalizeText(row.snippet, 1200);
    const link = normalizeText(row.url, 500);

    const sourceLine = link ? `\nSource: ${link}` : "";
    contentParts.push(`### ${title}\n${snippet}${sourceLine}`);
    if (link) {
      citations.push(link);
    }
  });

  return {
    content: contentParts.join("\n\n"),
    citations,
  };
}

/**
 * SearxNG provider using user-configured instance URL.
 */
export class SearxngSearchProvider implements WebSearchProvider {
  /**
   * Execute search against a SearxNG instance.
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const url = getSettings().searxngUrl;
    if (!url) {
      throw new Error("SearxNG URL is not configured in settings.");
    }

    const searchUrl = new URL(url);
    const normalizedPath = searchUrl.pathname.replace(/\/+$/, "");
    if (normalizedPath.endsWith("/search")) {
      searchUrl.pathname = normalizedPath || "/search";
    } else {
      searchUrl.pathname = `${normalizedPath}/search`;
    }
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("format", "json");

    const response = await fetch(searchUrl.toString(), { method: "GET" });
    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`SearxNG search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.content ?? item?.snippet,
        url: item?.url,
      }))
    );
  }
}

/**
 * Tavily API provider.
 */
export class TavilySearchProvider implements WebSearchProvider {
  /**
   * Execute search via Tavily API.
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const rawKey = getSettings().tavilyApiKey;
    if (!rawKey) {
      throw new Error("Tavily API key is not configured.");
    }
    const apiKey = await getDecryptedKey(rawKey);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Tavily search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.content,
        url: item?.url,
      }))
    );
  }
}

/**
 * Exa API provider.
 */
export class ExaSearchProvider implements WebSearchProvider {
  /**
   * Execute search via Exa API.
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const rawKey = getSettings().exaApiKey;
    if (!rawKey) {
      throw new Error("Exa API key is not configured.");
    }
    const apiKey = await getDecryptedKey(rawKey);

    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        useAutoprompt: true,
        numResults: 5,
        contents: {
          text: true,
        },
      }),
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Exa search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.text ?? item?.snippet,
        url: item?.url,
      }))
    );
  }
}

/**
 * Brave Search API provider.
 */
export class BraveSearchProvider implements WebSearchProvider {
  /**
   * Execute search via Brave Search API.
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const rawKey = getSettings().braveApiKey;
    if (!rawKey) {
      throw new Error("Brave API key is not configured.");
    }
    const apiKey = await getDecryptedKey(rawKey);

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "5");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Brave search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.web?.results) ? data.web.results : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.description,
        url: item?.url,
      }))
    );
  }
}

/**
 * Google Custom Search JSON API provider.
 */
export class GoogleCustomSearchProvider implements WebSearchProvider {
  /**
   * Execute search via Google Custom Search API.
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const rawKey = getSettings().googleSearchApiKey;
    const cx = getSettings().googleSearchEngineId;
    if (!rawKey || !cx) {
      throw new Error("Google Search API key or Engine ID is not configured.");
    }
    const apiKey = await getDecryptedKey(rawKey);

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "5");

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Google search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.items) ? data.items : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.snippet,
        url: item?.link,
      }))
    );
  }
}

/**
 * Resolve the currently configured BYOK web search provider.
 */
export function getWebSearchProvider(): WebSearchProvider {
  const provider = getSettings().localSearchProvider;

  switch (provider) {
    case "searxng":
      return new SearxngSearchProvider();
    case "tavily":
      return new TavilySearchProvider();
    case "exa":
      return new ExaSearchProvider();
    case "brave":
      return new BraveSearchProvider();
    case "google":
      return new GoogleCustomSearchProvider();
    default:
      logError(`Unsupported localSearchProvider value: ${provider}`);
      throw new Error(`Unknown search provider: ${provider}`);
  }
}
