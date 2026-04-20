import { getSettings } from "@/settings/model";
import {
  BraveSearchProvider,
  ExaSearchProvider,
  getWebSearchProvider,
  GoogleCustomSearchProvider,
  SearxngSearchProvider,
  TavilySearchProvider,
} from "@/tools/webSearch/providers";
import { getDecryptedKey } from "@/encryptionService";

const mockGetSettings = jest.fn();
const mockFetch = jest.fn();

jest.mock("@/settings/model", () => ({
  getSettings: jest.fn(),
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
    (global as any).fetch = mockFetch;

    (getDecryptedKey as jest.Mock).mockImplementation(async (value: string) => value);

    mockGetSettings.mockReturnValue({
      localSearchProvider: "searxng",
      searxngUrl: "https://search.example.com",
      tavilyApiKey: "tvly-test",
      exaApiKey: "exa-test",
      braveApiKey: "brave-test",
      googleSearchApiKey: "google-test",
      googleSearchEngineId: "cx-test",
    });
  });

  it("returns provider instance by configured type", () => {
    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "searxng" });
    expect(getWebSearchProvider()).toBeInstanceOf(SearxngSearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "tavily" });
    expect(getWebSearchProvider()).toBeInstanceOf(TavilySearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "exa" });
    expect(getWebSearchProvider()).toBeInstanceOf(ExaSearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "brave" });
    expect(getWebSearchProvider()).toBeInstanceOf(BraveSearchProvider);

    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "google" });
    expect(getWebSearchProvider()).toBeInstanceOf(GoogleCustomSearchProvider);
  });

  it("throws on unsupported provider", () => {
    mockGetSettings.mockReturnValue({ ...mockGetSettings(), localSearchProvider: "invalid" });
    expect(() => getWebSearchProvider()).toThrow("Unknown search provider");
  });

  it("normalizes searxng URL path and preserves query params", async () => {
    const provider = new SearxngSearchProvider();
    mockGetSettings.mockReturnValue({
      ...mockGetSettings(),
      searxngUrl: "https://search.example.com/base?lang=en",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "Result 1",
            content: "Body",
            url: "https://example.com/1",
          },
        ],
      }),
    });

    const result = await provider.search("test query");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://search.example.com/base/search?"),
      expect.objectContaining({ method: "GET" })
    );
    expect(mockFetch.mock.calls[0][0]).toContain("lang=en");
    expect(mockFetch.mock.calls[0][0]).toContain("q=test+query");
    expect(result.citations).toEqual(["https://example.com/1"]);
  });

  it("normalizes searxng root URL to /search", async () => {
    const provider = new SearxngSearchProvider();
    mockGetSettings.mockReturnValue({
      ...mockGetSettings(),
      searxngUrl: "https://search.example.com",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    await provider.search("root query");

    expect(mockFetch.mock.calls[0][0]).toContain("https://search.example.com/search?");
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

  it("maps brave response format", async () => {
    const provider = new BraveSearchProvider();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        web: {
          results: [
            {
              title: "Brave Result",
              description: "Brave snippet",
              url: "https://brave.example/1",
            },
          ],
        },
      }),
    });

    const result = await provider.search("brave query");

    expect(result.citations).toEqual(["https://brave.example/1"]);
    expect(result.content).toContain("Brave snippet");
  });

  it("maps google custom search response format", async () => {
    const provider = new GoogleCustomSearchProvider();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            title: "Google Result",
            snippet: "Google snippet",
            link: "https://google.example/1",
          },
        ],
      }),
    });

    const result = await provider.search("google query");

    expect(result.citations).toEqual(["https://google.example/1"]);
    expect(result.content).toContain("Google snippet");
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
      /^Error: Tavily search failed \(400\): x+\.\.\.$/
    );
  });
});
