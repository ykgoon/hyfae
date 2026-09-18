/**
 * `@hyfae/fetcher` — Tier A/B signal collection for the Hyfae machine.
 *
 * Adapter contract: emits RAW excerpts + metadata only, zero interpretation
 * (pre-interpretation principle). One `fetch_all` fan-out fetches every
 * configured source, stores one `page` resource per source plus a combined
 * `bundle` resource whose `text` is LLM-ready.
 *
 * Tier C sources are NEVER automated — they enter via `ingest_paste`.
 *
 * @module
 */
// extensions/models/fetcher.ts
import { z } from "npm:zod@4";

const SourceSchema = z.object({
  name: z.string().min(1).describe("Stable source identifier, e.g. lhdn-einvois"),
  url: z.string().url().describe("Endpoint to fetch (page or API)"),
  tier: z.enum(["A", "B"]).describe("A = public GET, B = RSS/versioned doc"),
  language: z.string().default("en").describe("Primary content language (BM/EN/TH/...)"),
  market: z.string().default("MY").describe("Market code (MY/ID/TH/VN/PH/SEA)"),
  artifactClasses: z
    .array(z.string())
    .default([])
    .describe("Expected artifact classes for triage hints"),
  extract: z
    .enum(["html", "json", "text"])
    .default("html")
    .describe("Body extraction strategy"),
});

const GlobalArgsSchema = z.object({
  sources: z.array(SourceSchema).min(1).describe("Registry of sources to collect"),
  maxCharsPerSource: z
    .number()
    .int()
    .positive()
    .default(20000)
    .describe("Hard excerpt cap per source per run"),
  userAgent: z
    .string()
    .default(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 hyfae-fetcher/0.1",
    )
    .describe("Polite User-Agent for Tier A/B fetching"),
});

type GlobalArgs = z.infer<typeof GlobalArgsSchema>;
type Source = z.infer<typeof SourceSchema>;

const PageSchema = z.object({
  sourceName: z.string(),
  url: z.string(),
  tier: z.string(),
  language: z.string(),
  market: z.string(),
  artifactClasses: z.array(z.string()),
  status: z.number(),
  text: z.string().describe("Raw extracted text, verbatim, no interpretation"),
  sha256: z.string(),
  bytes: z.number(),
  fetchedAt: z.string(),
});

const BundleSchema = z.object({
  count: z.number(),
  text: z.string().describe("All pages joined, LLM-ready"),
  pages: z.array(
    z.object({
      sourceName: z.string(),
      sha256: z.string(),
      bytes: z.number(),
      status: z.number(),
    }),
  ),
  fetchedAt: z.string(),
});

/** Strip HTML tags/scripts and collapse whitespace into readable text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Best-effort body extraction per declared strategy. */
function extractBody(body: string, strategy: Source["extract"]): string {
  if (strategy === "text") return body.trim();
  if (strategy === "json") return body.trim();
  return htmlToText(body);
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface FetchContext {
  globalArgs: GlobalArgs;
  logger: {
    info: (message: string, props?: Record<string, unknown>) => void;
    warn: (message: string, props?: Record<string, unknown>) => void;
  };
  writeResource: (
    specName: string,
    name: string,
    data: Record<string, unknown>,
  ) => Promise<{ name: string }>;
}

type PagePayload = z.infer<typeof PageSchema>;

/** Fetch one source; return the page payload (caller stores the resource). */
async function fetchOne(
  src: Source,
  maxChars: number,
  userAgent: string,
): Promise<PagePayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(src.url, {
      headers: { "User-Agent": userAgent, Accept: "*/*" },
      signal: controller.signal,
    });
    const body = await res.text();
    const text = extractBody(body, src.extract).slice(0, maxChars);
    const hash = await sha256Hex(text);
    return {
      sourceName: src.name,
      url: src.url,
      tier: src.tier,
      language: src.language,
      market: src.market,
      artifactClasses: src.artifactClasses,
      status: res.status,
      text,
      sha256: hash,
      bytes: text.length,
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `@hyfae/fetcher` model definition — deterministic signal collection.
   */
export const model = {
  type: "@hyfae/fetcher",
  version: "2026.09.14.1",
  globalArguments: GlobalArgsSchema,
  resources: {
    page: {
      description: "Raw excerpt from one source, verbatim, zero interpretation",
      schema: PageSchema,
      lifetime: "infinite",
      garbageCollection: 30,
    },
    bundle: {
      description: "Combined LLM-ready text of all pages fetched in one run",
      schema: BundleSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    rendered: {
      description: "LLM-ready rendered text for a stage",
      schema: z.object({
        count: z.number(),
        text: z.string(),
        fetchedAt: z.string(),
      }),
      lifetime: "infinite",
      garbageCollection: 5,
    },
  },
  methods: {
    fetch_all: {
      description:
        "Fan-out fetch of every configured source; one page resource each plus a combined bundle",
      arguments: z.object({}),
      execute: async (
        _args: Record<string, never>,
        context: FetchContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const { sources, maxCharsPerSource, userAgent } = context.globalArgs;
        const handles: Array<{ name: string }> = [];
        const payloads: PagePayload[] = [];
        const pageSummaries: Array<{
          sourceName: string;
          sha256: string;
          bytes: number;
          status: number;
        }> = [];

        for (const src of sources) {
          let payload: PagePayload;
          try {
            payload = await fetchOne(src, maxCharsPerSource, userAgent);
            context.logger.info("Fetched {source} status={status} chars={chars}", {
              source: src.name,
              status: payload.status,
              chars: payload.bytes,
            });
          } catch (err) {
            context.logger.warn(
              "Fetch failed for {source}: {error} — recorded as empty page",
              { source: src.name, error: String(err) },
            );
            payload = {
              sourceName: src.name,
              url: src.url,
              tier: src.tier,
              language: src.language,
              market: src.market,
              artifactClasses: src.artifactClasses,
              status: 0,
              text: "",
              sha256: "unavailable",
              bytes: 0,
              fetchedAt: new Date().toISOString(),
            };
          }
          payloads.push(payload);
          pageSummaries.push({
            sourceName: payload.sourceName,
            sha256: payload.sha256,
            bytes: payload.bytes,
            status: payload.status,
          });
          const handle = await context.writeResource(
            "page",
            `page-${slugify(src.name)}`,
            payload as unknown as Record<string, unknown>,
          );
          handles.push(handle);
        }

        const text = payloads
          .map((p) =>
            [
              `===== SOURCE: ${p.sourceName} | tier=${p.tier} | lang=${p.language} | market=${p.market} | url=${p.url} | classes=${p.artifactClasses.join("+") || "any"} =====`,
              p.text || "(fetch empty or failed — skip this source)",
            ].join("\n"),
          )
          .join("\n\n");
        const handle = await context.writeResource("bundle", "bundle", {
          count: sources.length,
          text,
          pages: pageSummaries,
          fetchedAt: new Date().toISOString(),
        });
        handles.push(handle);
        return { dataHandles: handles };
      },
    },
    ingest_paste: {
      description:
        "Tier C human-mediated intake: store a pasted excerpt (inbox file or stdin) as a page resource. Never automate Tier C.",
      arguments: z.object({
        sourceName: z.string().describe("Provenance label, e.g. telegram-seller-group"),
        url: z.string().default("human-paste").describe("Original link if known"),
        language: z.string().default("ms"),
        market: z.string().default("MY"),
        text: z.string().min(1).describe("Verbatim pasted content"),
      }),
      execute: async (
        args: { sourceName: string; url: string; language: string; market: string; text: string },
        context: FetchContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const hash = await sha256Hex(args.text);
        const handle = await context.writeResource(
          "page",
          `page-${slugify(args.sourceName)}-${hash.slice(0, 10)}`,
          {
            sourceName: args.sourceName,
            url: args.url,
            tier: "C",
            language: args.language,
            market: args.market,
            artifactClasses: [],
            status: 200,
            text: args.text.slice(0, context.globalArgs.maxCharsPerSource),
            sha256: hash,
            bytes: Math.min(args.text.length, context.globalArgs.maxCharsPerSource),
            fetchedAt: new Date().toISOString(),
          },
        );
        return { dataHandles: [handle] };
      },
    },
    render_pages: {
      description:
        "Deterministically render stored page resources (passed via CEL data.findBySpec) into LLM-ready text",
      arguments: z.object({
        records: z
          .array(z.unknown())
          .describe("data.findBySpec('<fetcher-model>', 'page') output"),
      }),
      execute: async (
        args: { records: unknown[] },
        context: FetchContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const pages = args.records
          .map((r) =>
            (r && typeof r === "object" && "attributes" in r
              ? (r as Record<string, unknown>).attributes
              : r) as Record<string, unknown>,
          )
          .filter((p) => typeof p.text === "string" && p.text.length > 0);
        const text = pages
          .map((p) =>
            [
              `===== SOURCE: ${String(p.sourceName)} | tier=${String(p.tier)} | lang=${String(p.language)} | market=${String(p.market)} | url=${String(p.url)} =====`,
              p.text,
            ].join("\n"),
          )
          .join("\n\n");
        const handle = await context.writeResource("rendered", "render-page", {
          count: pages.length,
          text: text || "(no pages yet)",
          fetchedAt: new Date().toISOString(),
        });
        context.logger.info("Rendered {count} pages", { count: pages.length });
        return { dataHandles: [handle] };
      },
    },
  },
};
