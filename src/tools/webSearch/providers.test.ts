import { getSettings } from "@/settings/model";
import { safeFetch } from "@/utils";
import {
  ExaSearchProvider,
  getWebSearchProvider,
  TavilySearchProvider,
  PerplexitySearchProvider,
  FirecrawlSearchProvider,
} from "@/tools/webSearch/providers";
import { getDecryptedKey } from "@/encryptionService";

const mockGetSettings = jest.fn();
const mockFetch = jest.fn();

jest.mock("@/settings/model", () => ({
  getSettings: jest.fn(),
}));

jest.mock("@/utils", () => ({
  safeFetch: jest.fn(),
}));

jest.mock("@/encryptionService", () => ({
  getDecryptedKey: jest.fn(),
}));

jest.mock("@/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe("webSearch providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSettings as jest.Mock).mockImplementation(() => mockGetSettings());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (safeFetch as jest.Mock).mockImplementation(mockFetch);

    (getDecryptedKey as jest.Mock).mockImplementation(async (value: string) => value);

    mockGetSettings.mockReturnValue({
      localSearchProvider: "tavily",
      tavilyApiKey: "tvly-test",
      exaApiKey: "exa-test",
      perplexityApiKey: "pplx-test",
      firecrawlApiKey: "fc-test",
    });
  });

  it("returns provider instance by configured type", () => {
    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "tavily" });
    expect(getWebSearchProvider()).toBeInstanceOf(TavilySearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "exa" });
    expect(getWebSearchProvider()).toBeInstanceOf(ExaSearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "perplexity" });
    expect(getWebSearchProvider()).toBeInstanceOf(PerplexitySearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "firecrawl" });
    expect(getWebSearchProvider()).toBeInstanceOf(FirecrawlSearchProvider);
  });

  it("throws on unsupported provider", () => {
    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "invalid" });
    expect(() => getWebSearchProvider()).toThrow("Unknown search provider");
  });

  it("maps tavily response and includes citations", async () => {
    const provider = new TavilySearchProvider();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { title: "T1", content: "T1 body", url: "https://t1.example" },
          { title: "T2", content: "T2 body", url: "https://t2.example" },
        ],
      }),
    });

    const result = await provider.search("tavily query");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.citations).toEqual(["https://t1.example", "https://t2.example"]);
    expect(result.content).toContain("### T1");
  });

  it("maps exa response and truncates long snippets", async () => {
    const provider = new ExaSearchProvider();
    const longText = "a".repeat(2000);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ title: "Exa Result", text: longText, url: "https://exa.example/1" }],
      }),
    });

    const result = await provider.search("exa query");

    expect(result.citations).toEqual(["https://exa.example/1"]);
    expect(result.content).toContain("### Exa Result");
    expect(result.content.length).toBeLessThan(2200);
  });

  it("maps perplexity response format", async () => {
    const provider = new PerplexitySearchProvider();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "Perplexity Result",
            snippet: "Perplexity snippet",
            url: "https://pplx.example/1",
          },
        ],
      }),
    });

    const result = await provider.search("perplexity query");

    expect(result.citations).toEqual(["https://pplx.example/1"]);
    expect(result.content).toContain("Perplexity snippet");
  });

  it("maps firecrawl response format with markdown content", async () => {
    const provider = new FirecrawlSearchProvider();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          web: [
            {
              title: "Firecrawl Result",
              description: "Firecrawl snippet",
              url: "https://fc.example/1",
              markdown: "# Firecrawl markdown content",
            },
          ],
        },
      }),
    });

    const result = await provider.search("firecrawl query");

    expect(result.citations).toEqual(["https://fc.example/1"]);
    expect(result.content).toContain("# Firecrawl markdown content");
  });

  it("throws bounded errors for non-2xx responses", async () => {
    const provider = new TavilySearchProvider();
    const oversizedError = "x".repeat(2000);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => oversizedError,
    });

    await expect(provider.search("bad query")).rejects.toThrow(
      /^Tavily search failed \(400\): x+\.\.\.$/
    );
  });
});
