import { webSearchTool } from "@/tools/SearchTools";

const mockGetStandaloneQuestion = jest.fn();
const mockProviderSearch = jest.fn();
const mockLogError = jest.fn();

jest.mock("@/chainUtils", () => ({
  getStandaloneQuestion: (...args: unknown[]) => mockGetStandaloneQuestion(...args),
}));

jest.mock("@/tools/webSearch/providers", () => ({
  getWebSearchProvider: () => ({
    search: (...args: unknown[]) => mockProviderSearch(...args),
  }),
}));

jest.mock("@/LLMProviders/chainRunner/utils/citationUtils", () => ({
  getWebSearchCitationInstructions: () => "Use footnote citations",
}));

jest.mock("@/logger", () => ({
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: (...args: unknown[]) => mockLogError(...args),
}));

/**
 * Parse StructuredTool output into JSON object.
 *
 * @param raw - Raw tool output.
 */
function parseToolOutput<T>(raw: unknown): T {
  return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
}

describe("webSearchTool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns formatted web search results", async () => {
    mockGetStandaloneQuestion.mockResolvedValue("standalone query");
    mockProviderSearch.mockResolvedValue({
      content: "### Result\nSnippet\nSource: https://example.com",
      citations: ["https://example.com"],
    });

    const raw = await (webSearchTool as { invoke: (args: unknown) => Promise<unknown> }).invoke({
      query: "raw query",
    });
    const parsed = parseToolOutput<Array<Record<string, unknown>>>(raw);

    expect(mockGetStandaloneQuestion).toHaveBeenCalledWith("raw query", []);
    expect(mockProviderSearch).toHaveBeenCalledWith("standalone query");
    expect(parsed).toEqual([
      {
        type: "web_search",
        content: "### Result\nSnippet\nSource: https://example.com",
        citations: ["https://example.com"],
        instruction: "Use footnote citations",
      },
    ]);
  });

  it("returns safe generic error when provider throws", async () => {
    mockGetStandaloneQuestion.mockResolvedValue("standalone query");
    mockProviderSearch.mockRejectedValue(new Error("upstream provider leaked details"));

    const raw = await (webSearchTool as { invoke: (args: unknown) => Promise<unknown> }).invoke({
      query: "raw query",
      chatHistory: [{ role: "user", content: "prior" }],
    });
    const parsed = parseToolOutput<{ error: string }>(raw);

    expect(parsed).toEqual({
      error:
        "Web search failed. Check your Local Tools provider configuration and API credentials, then try again.",
    });
    expect(mockLogError).toHaveBeenCalled();
  });

  it("returns safe generic error when standalone question generation fails", async () => {
    mockGetStandaloneQuestion.mockRejectedValue(new Error("standalone parsing failed"));

    const raw = await (webSearchTool as { invoke: (args: unknown) => Promise<unknown> }).invoke({
      query: "raw query",
    });
    const parsed = parseToolOutput<{ error: string }>(raw);

    expect(parsed).toEqual({
      error:
        "Web search failed. Check your Local Tools provider configuration and API credentials, then try again.",
    });
    expect(mockLogError).toHaveBeenCalled();
  });
});
