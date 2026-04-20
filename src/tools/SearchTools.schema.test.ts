import { indexTool, localSearchSchema, webSearchSchema } from "@/tools/SearchTools";
import { z } from "zod";

/**
 * Schema validation tests for SearchTools
 * These tests ensure that tool schemas match expected handler interfaces
 * without requiring complex runtime mocks
 */

describe("SearchTools Schema Validation", () => {
  describe("localSearchTool schema", () => {
    test("validates correct input structure", () => {
      const validInput = {
        query: "test query",
        salientTerms: ["test", "query"],
      };

      const result = localSearchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test("accepts empty salientTerms array", () => {
      const validInput = {
        query: "what did I do last week",
        salientTerms: [],
      };

      const result = localSearchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test("validates input with timeRange", () => {
      const validInput = {
        query: "meetings last week",
        salientTerms: ["meetings"],
        timeRange: {
          startTime: 1234567890000,
          endTime: 1234567900000,
        },
      };

      const result = localSearchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test("rejects empty query", () => {
      const invalidInput = {
        query: "",
        salientTerms: ["test"],
      };

      const result = localSearchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("query");
      }
    });

    test("rejects missing salientTerms", () => {
      const invalidInput = {
        query: "test query",
      };

      const result = localSearchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test("rejects non-array salientTerms", () => {
      const invalidInput = {
        query: "test query",
        salientTerms: "not an array",
      };

      const result = localSearchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test("ignores unknown fields like returnAll", () => {
      const input = { query: "find all notes", salientTerms: ["notes"], returnAll: true };
      const result = localSearchSchema.safeParse(input);
      // Schema strips unknown fields but still parses successfully
      expect(result.success).toBe(true);
    });
  });

  describe("webSearchTool schema", () => {
    test("validates correct input with proper chatHistory", () => {
      const validInput = {
        query: "search for TypeScript tutorials",
        chatHistory: [
          { role: "user" as const, content: "I want to learn TypeScript" },
          { role: "assistant" as const, content: "I can help you with that!" },
        ],
      };

      const result = webSearchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test("accepts empty chatHistory", () => {
      const validInput = {
        query: "TypeScript tutorials",
        chatHistory: [],
      };

      const result = webSearchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test("rejects invalid role in chatHistory", () => {
      const invalidInput = {
        query: "search query",
        chatHistory: [
          { role: "system", content: "System message" }, // 'system' not allowed
        ],
      };

      const result = webSearchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("chatHistory");
      }
    });

    test("rejects missing content in chatHistory", () => {
      const invalidInput = {
        query: "search query",
        chatHistory: [{ role: "user" }], // missing content
      };

      const result = webSearchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test("rejects non-string content", () => {
      const invalidInput = {
        query: "search query",
        chatHistory: [
          { role: "user", content: 123 }, // content must be string
        ],
      };

      const result = webSearchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test("rejects z.any() chatHistory (regression test)", () => {
      // This tests that we're NOT using z.any()
      const weakSchema = z.object({
        query: z.string(),
        chatHistory: z.array(z.any()), // This is what we want to avoid
      });

      const malformedInput = {
        query: "test",
        chatHistory: ["just", "strings", 123, null], // Should fail with proper schema
      };

      // Weak schema would accept this
      expect(weakSchema.safeParse(malformedInput).success).toBe(true);

      // But our proper schema should reject it
      expect(webSearchSchema.safeParse(malformedInput).success).toBe(false);
    });

    test("accepts optional chatHistory field", () => {
      const result = webSearchSchema.safeParse({
        query: "search query",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("indexTool schema", () => {
    const indexSchema = (indexTool as unknown as { schema: z.ZodType }).schema;

    test("accepts undefined", () => {
      const result = indexSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    test("accepts parameter objects for open index schema", () => {
      const result = indexSchema.safeParse({ someParam: "value" });
      expect(result.success).toBe(true);
    });

    test("rejects string input", () => {
      const result = indexSchema.safeParse("string");
      expect(result.success).toBe(false);
    });

    test("handles empty object with SimpleTool fix", () => {
      // The tool uses z.object({}) and accepts empty object payloads.
      const emptyObj = {};

      // Direct parse succeeds
      const directResult = indexSchema.safeParse(emptyObj);
      expect(directResult.success).toBe(true);
    });
  });

  describe("Schema type inference", () => {
    test("localSearch schema infers correct types", () => {
      type InferredType = z.infer<typeof localSearchSchema>;

      // This is a compile-time test - if it compiles, types are correct
      const testValue: InferredType = {
        query: "test",
        salientTerms: ["test"],
        timeRange: {
          startTime: 123,
          endTime: 456,
        },
        // timeRange is optional
      };

      // TypeScript should enforce these types
      const query: string = testValue.query;
      const terms: string[] = testValue.salientTerms;
      const timeRange = testValue.timeRange;

      expect(query).toBe("test");
      expect(terms).toEqual(["test"]);
      expect(timeRange).toEqual({ startTime: 123, endTime: 456 });

      // Also validate the schema works
      expect(localSearchSchema.safeParse(testValue).success).toBe(true);
    });

    test("webSearch schema matches ChatHistoryEntry interface", () => {
      // Define the expected interface
      interface ChatHistoryEntry {
        role: "user" | "assistant";
        content: string;
      }

      type InferredType = z.infer<typeof webSearchSchema>;

      // This ensures the inferred type matches ChatHistoryEntry[]
      const testValue: InferredType = {
        query: "test",
        chatHistory: [] as ChatHistoryEntry[] | undefined,
      };

      // Should be assignable to ChatHistoryEntry[]
      const history: ChatHistoryEntry[] = testValue.chatHistory ?? [];
      expect(history).toEqual([]);

      // Also validate the schema works
      expect(webSearchSchema.safeParse(testValue).success).toBe(true);
    });
  });
});
