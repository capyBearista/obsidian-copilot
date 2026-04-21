import { getDecryptedKey } from "@/encryptionService";
import { logError } from "@/logger";
import { getSettings } from "@/settings/model";
import { safeFetch } from "@/utils";

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

    const response = await safeFetch("https://api.tavily.com/search", {
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
      throwOnHttpError: false,
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

    const response = await safeFetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        type: "auto",
        numResults: 5,
        contents: {
          text: true,
        },
      }),
      throwOnHttpError: false,
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
 * Perplexity Search API provider.
 */
export class PerplexitySearchProvider implements WebSearchProvider {
  /**
   * Execute search via Perplexity Search API.
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const rawKey = getSettings().perplexityApiKey;
    if (!rawKey) {
      throw new Error("Perplexity API key is not configured.");
    }
    const apiKey = await getDecryptedKey(rawKey);

    const response = await safeFetch("https://api.perplexity.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: 5,
        max_tokens_per_page: 4096,
      }),
      throwOnHttpError: false,
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Perplexity search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.snippet,
        url: item?.url,
      }))
    );
  }
}

/**
 * Firecrawl Search API provider.
 */
export class FirecrawlSearchProvider implements WebSearchProvider {
  /**
   * Execute search via Firecrawl Search API (combines search + scraping).
   *
   * @param query - Search query.
   */
  async search(query: string): Promise<WebSearchResult> {
    const rawKey = getSettings().firecrawlApiKey;
    if (!rawKey) {
      throw new Error("Firecrawl API key is not configured.");
    }
    const apiKey = await getDecryptedKey(rawKey);

    const response = await safeFetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: {
          formats: [{ type: "markdown" }],
        },
      }),
      throwOnHttpError: false,
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Firecrawl search failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.data?.web) ? data.data.web : [];
    return formatResults(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map((item: any) => ({
        title: item?.title,
        snippet: item?.markdown ?? item?.description,
        url: item?.url,
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
    case "tavily":
      return new TavilySearchProvider();
    case "exa":
      return new ExaSearchProvider();
    case "perplexity":
      return new PerplexitySearchProvider();
    case "firecrawl":
      return new FirecrawlSearchProvider();
    default:
      logError(`Unsupported localSearchProvider value: ${provider}`);
      throw new Error(`Unknown search provider: ${provider}`);
  }
}
