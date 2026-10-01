/**
 * `@hyfae/records` — the typed, append-only store for the Hyfae machine.
 *
 * Every stage's output is validated against a JSON schema before write;
 * failures land in `deadletter`, never silently dropped. Later stages never
 * mutate earlier records — corrections are new records. Resources are named
 * `<kind>-<id-hash>` and are append-only by construction (new name per id).
 *
 * Also hosts the deterministic promoter (max 3 cards/week) and the weekly
 * digest markdown renderer.
 *
 * @module
 */
// extensions/models/records.ts
import { z } from "npm:zod@4";

// ---------------------------------------------------------------------------
// Record schemas — the unit contract (proposal v2, six tables)
// ---------------------------------------------------------------------------

export const ObservationSchema = z.object({
  id: z.string().min(3).describe("Stable id, e.g. obs-<hash>"),
  sourceName: z.string(),
  sourceRef: z.string().describe("URL or provenance pointer"),
  tier: z.enum(["A", "B", "C"]),
  rawExcerpt: z.string().min(1).describe("Verbatim quote in original language"),
  language: z.string(),
  market: z.string(),
  artifactClass: z.enum([
    "workaround",
    "grey_market",
    "queue",
    "hire_ducttape",
    "price_asymmetry",
    "ritual",
    "policy_shift",
    "other",
  ]),
  actor: z.string().describe("Who experiences it"),
  workflow: z.string().describe("What they are trying to do"),
  friction: z.string().describe("What is broken, stated behaviorally"),
  gravity: z.object({
    touchpoint: z.enum(["transaction", "compliance", "labor"]),
    monthlyCostEst: z.preprocess(coerceMyr, z.number().min(0)).describe(
      "MYR-equivalent per month, bare number",
    ),
    evidence: z.string().describe("Why this cost estimate — cite the excerpt"),
    independentSources: z.number().int().min(1),
  }),
  firstSeen: z.string().describe("ISO date"),
  collectorVersion: z.string(),
});

export const TensionSchema = z.object({
  id: z.string().min(3),
  observationIds: z.array(z.string()).min(1),
  expectation: z.string(),
  reality: z.string(),
  costBearer: z.string(),
  enablingShift: z.object({
    whatChanged: z.string(),
    date: z.string(),
    evidence: z.string(),
    within24mo: z.boolean(),
  }),
  unaddressedReason: z.string().describe("Why has this gone unaddressed — nobody noticed vs startups died"),
  marketInvariants: z.array(z.string()).default([]),
  status: z.enum(["active", "dormant"]).default("active"),
  extractorVersion: z.string(),
});

export const SynthesisSchema = z.object({
  id: z.string().min(3),
  tensionIds: z.array(z.string()).min(1),
  mechanismSourceDomain: z.string().describe("Where the mechanism comes from"),
  mechanism: z.string().describe("What is transplanted, how it would work"),
  causalStructure: z.object({
    actors: z.string(),
    incentives: z.string(),
    constraintTypes: z.string(),
    match: z.boolean().describe("Structural isomorphism verified — actors/incentives/constraints align"),
    note: z.string(),
  }),
  invariantViolations: z.array(z.string()).default([]).describe("Empty = attestation passes"),
  falsification: z.object({
    priorArt: z.array(z.string()).default([]),
    structuralBarriers: z.string(),
    unawarenessAffirmative: z.string().describe("Why sufferers lack the frame"),
    unawarenessNegative: z.string().describe("Someone-would-have-built-it sweep result"),
    durability: z.string().describe("Too big to be trivial AND too invisible to be competed?"),
    verdict: z.enum(["alive", "mirage"]),
    priceTest: z.object({
      seats: z.number().int().positive().optional(),
      priceRM: z.number().min(0).optional(),
      who: z.string().optional(),
    }).default({}).describe("Price plausibility as numbers: seats x priceRM for who"),
    firstBuyers: z.array(z.string()).default([]).describe("First-20-buyers sketch: concrete buyer types"),
    wedge: z.string().default("").describe("Smallest sellable thing, one sentence"),
  }),
  panel: z
    .object({
      operator: z.string().default(""),
      economist: z.string().default(""),
      behaviorist: z.string().default(""),
      skeptic: z.string().default(""),
      convergedObvious: z.boolean().default(false),
    })
    .default({
      operator: "",
      economist: "",
      behaviorist: "",
      skeptic: "",
      convergedObvious: false,
    }),
  createdByVersion: z.string(),
});

export const CardSchema = z.object({
  id: z.string().min(3),
  synthesisId: z.string(),
  hook: z.string().max(280).describe("The broken-assumption statement, <=2 lines"),
  evidenceBullets: z.array(z.string()).max(3),
  panelDisagreement: z.string().default(""),
  probeResult: z.string().default("none"),
  believe: z.string().describe("What you would have to believe"),
  week: z.string().describe("ISO week label, e.g. 2026-W37"),
  status: z.enum(["promoted", "escalated", "dismissed"]).default("promoted"),
  whoPays: z.string().default("").describe("Reader display: who pays, plain words"),
  painRM: z.string().default("").describe("Reader display: money size line, e.g. ~RM2,400/mo"),
  whyNow: z.string().default("").describe("Reader display: enabling shift in plain words"),
  offering: z.string().default("").describe("Reader display: smallest sellable thing"),
});

export const GraveyardSchema = z.object({
  id: z.string().min(3),
  entityType: z.enum(["observation", "tension", "synthesis", "card"]),
  entityId: z.string(),
  reasonCode: z.enum([
    "transient",
    "too_small",
    "not_monetizable",
    "prior_art",
    "invariant_violation",
    "incohate",
    "panel_converged_obvious",
    "other",
  ]),
  detail: z.string(),
  killedBy: z.string().describe("stage+version"),
  killedAt: z.string(),
});

export const FeedbackSchema = z.object({
  id: z.string().min(3),
  cardId: z.string(),
  decision: z.enum(["escalate", "dismiss"]),
  reason: z.string().default("").describe("<=140 chars ideally"),
  assumptionBroken: z.boolean().describe("Did this break an assumption you held?"),
  at: z.string(),
});

const KindSchemas = {
  observation: ObservationSchema,
  tension: TensionSchema,
  synthesis: SynthesisSchema,
  card: CardSchema,
  graveyard: GraveyardSchema,
  feedback: FeedbackSchema,
} as const;

type Kind = keyof typeof KindSchemas;

const KindEnum = z.enum([
  "observation",
  "tension",
  "synthesis",
  "card",
  "graveyard",
  "feedback",
]);

const RecordSchemas = {
  observation: ObservationSchema,
  tension: TensionSchema,
  synthesis: SynthesisSchema,
  card: CardSchema,
  graveyard: GraveyardSchema,
  feedback: FeedbackSchema,
};

// ---------------------------------------------------------------------------
// Model definition
// ---------------------------------------------------------------------------

const GlobalArgsSchema = z.object({
  maxCardsPerWeek: z
    .number()
    .int()
    .positive()
    .default(3)
    .describe("Scarcity cap — max cards promoted per week"),
});

type GlobalArgs = z.infer<typeof GlobalArgsSchema>;

const DeadletterSchema = z.object({
  kind: z.string(),
  errors: z.array(z.string()),
  record: z.unknown(),
  receivedAt: z.string(),
});

const IngestResultSchema = z.object({
  kind: z.string(),
  accepted: z.number(),
  rejected: z.number(),
  names: z.array(z.string()),
});

const RenderTextSchema = z.object({
  kind: z.string(),
  count: z.number(),
  text: z.string(),
});

const DigestSchema = z.object({
  week: z.string(),
  cards: z.number(),
  markdown: z.string(),
});

const NoteSchema = z.object({
  title: z.string(),
  text: z.string(),
  savedAt: z.string(),
});

interface RecContext {
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

/**
 * Coerce local-LLM cost strings to a bare MYR number: strips currency
 * symbols/commas/whitespace ("RM 100,000" -> 100000); ranges keep the first
 * number ("50000-500000" -> 50000). Unparseable input passes through so the
 * schema still rejects it honestly into deadletter.
 */
function coerceMyr(v: unknown): unknown {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return v;
  const m = v.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : v;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function sha1Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Salvage complete top-level JSON objects from text whose outer array was
 * cut off (e.g. LLM hit maxTokens mid-emit). Brace-matches from each `{`,
 * string-aware, and keeps every span that parses. Returns [] when nothing
 * salvageable exists.
 */
function salvageObjects(t: string): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== "{") continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let j = i; j < t.length; j++) {
      const c = t[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') {
        inStr = true;
      } else if (c === "{") {
        depth++;
      } else if (c === "}") {
        depth--;
        if (depth === 0) {
          try {
            out.push(JSON.parse(t.slice(i, j + 1)));
          } catch {
            // Broken span — keep scanning for inner complete objects.
          }
          i = j;
          break;
        }
      }
    }
  }
  return out;
}

/**
 * Extract a JSON array from LLM text: strips markdown fences, finds the
 * outermost [ ... ] block. When the array is truncated (missing close) or
 * otherwise unparseable, falls back to salvaging complete top-level objects.
 * Returns [] when nothing parseable exists.
 */
export function extractJsonArray(text: string): unknown[] {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    // Maybe a single JSON object — wrap it.
    const os = t.indexOf("{");
    const oe = t.lastIndexOf("}");
    if (os !== -1 && oe > os) {
      try {
        return [JSON.parse(t.slice(os, oe + 1))];
      } catch {
        return salvageObjects(t);
      }
    }
    return salvageObjects(t);
  }
  try {
    const parsed: unknown = JSON.parse(t.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return salvageObjects(t.slice(start));
  }
}

/** Accept a bare record or a DataRecord ({attributes:{...}}) and unwrap it. */
function unwrap(item: unknown): Record<string, unknown> {
  if (
    item &&
    typeof item === "object" &&
    "attributes" in item &&
    (item as Record<string, unknown>).attributes &&
    typeof (item as Record<string, unknown>).attributes === "object"
  ) {
    const attrs = (item as Record<string, unknown>).attributes;
    return attrs as Record<string, unknown>;
  }
  return item as Record<string, unknown>;
}

async function storeValidated(
  kind: Kind,
  items: unknown[],
  context: RecContext,
): Promise<{ accepted: number; rejected: number; names: string[] }> {
  const schema = RecordSchemas[kind];
  const names: string[] = [];
  let accepted = 0;
  let rejected = 0;

  for (const raw of items) {
    const record = unwrap(raw);
    const parsed = schema.safeParse(record);
    if (!parsed.success) {
      rejected++;
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      await context.writeResource("deadletter", `deadletter-${slugify(kind)}-${await sha1Hex(JSON.stringify(record)).then((h) => h.slice(0, 12))}`, {
        kind,
        errors,
        record,
        receivedAt: new Date().toISOString(),
      });
      context.logger.warn("Rejected {kind} record: {errors}", {
        kind,
        errors: errors.join("; ").slice(0, 300),
      });
      continue;
    }
    accepted++;
    const id = parsed.data.id as string;
    const name = `${kind}-${(await sha1Hex(id)).slice(0, 12)}`;
    await context.writeResource(kind, name, parsed.data as Record<string, unknown>);
    names.push(name);
  }
  return { accepted, rejected, names };
}

/** Render records of one kind into LLM-ready text, unwrapping DataRecords. */
function renderRecords(kind: Kind, items: unknown[]): { count: number; text: string } {
  const records = items.map(unwrap);
  const text = records
    .map((r) => `----- ${kind} ${String(r.id ?? "?")} -----\n${JSON.stringify(r, null, 1)}`)
    .join("\n\n");
  return { count: records.length, text };
}

function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Plain-language helpers for the reader-first digest (no machine jargon). */
function plainStr(v: unknown, max = 200): string {
  if (typeof v !== "string") return "";
  return v.trim().replace(/\s+/g, " ").slice(0, max);
}

function sentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortenPriorArtName(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  const cut = t.split(" (")[0].split(" — ")[0].split(" - ")[0];
  return cut.trim().slice(0, 80) || t.slice(0, 80);
}

function formatRM(n: number): string {
  if (!Number.isFinite(n)) return "unknown";
  return `~RM${Math.round(n).toLocaleString("en-MY")}/mo`;
}

/**
 * `@hyfae/records` model definition — validated append-only store, promoter,
 * and digest renderer.
 */
export const model = {
  type: "@hyfae/records",
  version: "2026.09.14.1",
  globalArguments: GlobalArgsSchema,
  resources: {
    observation: {
      description: "Loop-1 structured observation with economic-gravity evidence",
      schema: ObservationSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    tension: {
      description: "Loop-2 tension: expectation vs reality + enabling shift",
      schema: TensionSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    synthesis: {
      description: "Loop-3 synthesis with isomorphism attestation + two-gate falsification",
      schema: SynthesisSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    card: {
      description: "Promoted anomaly card shown to the operator",
      schema: CardSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    graveyard: {
      description: "Kill record with taxonomy reason code",
      schema: GraveyardSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    feedback: {
      description: "Operator feedback gesture on a card",
      schema: FeedbackSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    deadletter: {
      description: "Records that failed schema validation — never silently dropped",
      schema: DeadletterSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    rendered: {
      description: "LLM-ready rendered text for a stage",
      schema: RenderTextSchema,
      lifetime: "infinite",
      garbageCollection: 5,
    },
    ingestResult: {
      description: "Summary of an ingest run",
      schema: IngestResultSchema,
      lifetime: "infinite",
      garbageCollection: 20,
    },
    digest: {
      description: "Weekly digest markdown for the operator",
      schema: DigestSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
    note: {
      description: "Freeform persisted text (red-team memos, probe results)",
      schema: NoteSchema,
      lifetime: "infinite",
      garbageCollection: 1000,
    },
  },
  methods: {
    ingest_text: {
      description:
        "Parse LLM text into JSON records, validate against the kind schema, store; failures go to deadletter",
      arguments: z.object({
        kind: KindEnum,
        text: z.string().min(1).describe("LLM output text containing a JSON array"),
        maxRecords: z.number().int().positive().default(50),
      }),
      execute: async (
        args: { kind: Kind; text: string; maxRecords: number },
        context: RecContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const items = extractJsonArray(args.text).slice(0, args.maxRecords);
        if (items.length === 0) {
          await context.writeResource("deadletter", `deadletter-${slugify(args.kind)}-unparsed-${Date.now()}`, {
            kind: args.kind,
            errors: ["No JSON array found in text"],
            record: args.text.slice(0, 2000),
            receivedAt: new Date().toISOString(),
          });
          context.logger.warn("Ingest found no JSON records in text for {kind}", { kind: args.kind });
        }
        const { accepted, rejected, names } = await storeValidated(args.kind, items, context);
        const handle = await context.writeResource("ingestResult", `ingest-${slugify(args.kind)}-${Date.now()}`, {
          kind: args.kind,
          accepted,
          rejected,
          names,
        });
        return { dataHandles: [handle] };
      },
    },
    ingest: {
      description: "Validate and store already-structured records (CLI feedback, programmatic use)",
      arguments: z.object({
        kind: KindEnum,
        records: z.array(z.unknown()).min(1),
      }),
      execute: async (
        args: { kind: Kind; records: unknown[] },
        context: RecContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const { accepted, rejected, names } = await storeValidated(args.kind, args.records, context);
        const handle = await context.writeResource("ingestResult", `ingest-${slugify(args.kind)}-${Date.now()}`, {
          kind: args.kind,
          accepted,
          rejected,
          names,
        });
        return { dataHandles: [handle] };
      },
    },
    render: {
      description:
        "Deterministically render stored records (passed via CEL data.findBySpec) into LLM-ready text",
      arguments: z.object({
        kind: KindEnum,
        records: z.array(z.unknown()).describe("data.findBySpec('records','<kind>') output"),
      }),
      execute: async (
        args: { kind: Kind; records: unknown[] },
        context: RecContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const { count, text } = renderRecords(args.kind, args.records);
        const handle = await context.writeResource("rendered", `render-${slugify(args.kind)}`, {
          kind: args.kind,
          count,
          text: text || "(no records yet)",
        });
        context.logger.info("Rendered {count} {kind} records", { count, kind: args.kind });
        return { dataHandles: [handle] };
      },
    },
    promote: {
      description:
        "Deterministic card promotion: filter alive syntheses, deprioritize panel-converged, cap at maxCardsPerWeek, write cards + weekly digest markdown",
      arguments: z.object({
        candidates: z
          .array(z.unknown())
          .describe("data.findBySpec('records','synthesis') output"),
        tensions: z
          .array(z.unknown())
          .default([])
          .describe("data.findBySpec('records','tension') output for upstream join"),
        observations: z
          .array(z.unknown())
          .default([])
          .describe("data.findBySpec('records','observation') output for upstream join"),
        week: z.string().default("").describe("ISO week label; defaults to current"),
      }),
      execute: async (
        args: { candidates: unknown[]; tensions?: unknown[]; observations?: unknown[]; week: string },
        context: RecContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const week = args.week || isoWeekLabel(new Date());
        const cap = context.globalArgs.maxCardsPerWeek;

        const tensionById = new Map<string, Record<string, unknown>>();
        for (const t of (args.tensions ?? []).map(unwrap)) {
          if (t.id && typeof t.id === "string") tensionById.set(t.id, t);
        }
        const obsById = new Map<string, Record<string, unknown>>();
        for (const o of (args.observations ?? []).map(unwrap)) {
          if (o.id && typeof o.id === "string") obsById.set(o.id, o);
        }

        const alive = args.candidates
          .map(unwrap)
          .filter((s) => s.falsification && (s.falsification as Record<string, unknown>).verdict === "alive")
          .filter((s) => Array.isArray(s.invariantViolations) && (s.invariantViolations as string[]).length === 0);

        // Panel disagreement ranks above converged-obvious.
        const ranked = alive.sort((a, b) => {
          const ac = Boolean((a.panel as Record<string, unknown> | undefined)?.convergedObvious) ? 1 : 0;
          const bc = Boolean((b.panel as Record<string, unknown> | undefined)?.convergedObvious) ? 1 : 0;
          return ac - bc;
        });

        const promoted = ranked.slice(0, cap);
        const demoted = ranked.slice(cap);
        const names: string[] = [];

        type ReaderView = {
          whoHurts: string;
          vertical: string;
          whatBreaks: string;
          money: string;
          whatToSell: string;
          whyNow: string;
          whyGap: string;
          proof: string;
          nextStep: string;
          trace: string;
          partial: boolean;
          obsIds: string[];
          tensionIds: string[];
          sourceRefs: string[];
        };

        function buildReader(s: Record<string, unknown>): ReaderView {
          const tensionIds = Array.isArray(s.tensionIds)
            ? (s.tensionIds as unknown[]).filter((x): x is string => typeof x === "string")
            : [];
          const tensionsResolved = tensionIds
            .map((id) => tensionById.get(id))
            .filter((t): t is Record<string, unknown> => Boolean(t));
          const expectedObsIds = tensionsResolved.flatMap((t) =>
            Array.isArray(t.observationIds)
              ? (t.observationIds as unknown[]).filter((x): x is string => typeof x === "string")
              : []
          );
          const obsResolved = expectedObsIds
            .map((id) => obsById.get(id))
            .filter((o): o is Record<string, unknown> => Boolean(o));
          const firstTension = tensionsResolved[0];
          const firstObs = obsResolved[0];
          const fals = (s.falsification as Record<string, unknown>) ?? {};
          const priceTest = (fals.priceTest as Record<string, unknown> | undefined) ?? {};
          const wedge = plainStr(fals.wedge, 140);
          const mechanism = plainStr(s.mechanism, 200);
          const mechanismDomain = plainStr(s.mechanismSourceDomain, 80);

          const partial = tensionsResolved.length !== tensionIds.length ||
            (tensionsResolved.length > 0 && obsResolved.length === 0);

          // Who hurts — buyer in plain words.
          const rawBuyer = plainStr((firstObs as Record<string, unknown> | undefined)?.actor, 80) ||
            plainStr(firstTension?.costBearer, 80) ||
            plainStr(priceTest.who, 80);
          const whoHurts = rawBuyer ? sentenceCase(rawBuyer) : "unknown";

          // Vertical — buyer population plus evidence-bound source/market context.
          const firstBuyer = Array.isArray(fals.firstBuyers)
            ? (fals.firstBuyers as unknown[]).find((x): x is string => typeof x === "string" && x.trim().length > 0) ?? ""
            : "";
          const verticalBuyer = whoHurts !== "unknown" ? whoHurts : firstBuyer ? sentenceCase(firstBuyer.trim()) : "unknown";
          const marketBit = plainStr((firstObs as Record<string, unknown> | undefined)?.market, 20);
          const sourceBit = plainStr((firstObs as Record<string, unknown> | undefined)?.sourceName, 80);
          const vertical = verticalBuyer === "unknown" && !marketBit && !sourceBit
            ? "unknown"
            : [verticalBuyer, marketBit, sourceBit ? `via ${sourceBit}` : ""].filter(Boolean).join(" · ");

          // What breaks — behavioral friction.
          const rawBreaks = plainStr((firstObs as Record<string, unknown> | undefined)?.friction, 200) ||
            (firstObs ? [plainStr((firstObs as Record<string, unknown>).workflow, 120), plainStr((firstObs as Record<string, unknown>).friction, 120)].filter(Boolean).join(" — ") : "") ||
            plainStr(firstTension?.reality, 200);
          const whatBreaks = rawBreaks || "unknown";

          // Money — one number per line from observation gravity, else price plausibility.
          let money = "unknown";
          const gravity = (firstObs as Record<string, unknown> | undefined)?.gravity as Record<string, unknown> | undefined;
          if (gravity && typeof gravity.monthlyCostEst === "number") {
            const touch = typeof gravity.touchpoint === "string" ? gravity.touchpoint : "";
            const cue = plainStr(gravity.evidence, 80);
            const buyerBit = whoHurts === "unknown" ? "Someone pays" : whoHurts;
            money = `${buyerBit} — ${formatRM(gravity.monthlyCostEst)}${touch ? ` (${touch}` : ""}${touch && cue ? `; ${cue}` : cue && !touch ? ` (${cue}` : ""}${touch || cue ? ")" : ""}`;
          } else if (typeof priceTest.priceRM === "number") {
            const seats = typeof priceTest.seats === "number" ? ` x ${priceTest.seats} seats` : "";
            const whoBit = plainStr(priceTest.who, 60) || whoHurts;
            money = `${whoBit} — ${formatRM(priceTest.priceRM)}${seats} (plausibility check)`;
          }

          // What to sell — smallest sellable thing.
          const whatToSell = wedge ||
            (mechanism ? `${mechanism.slice(0, 140)}${mechanismDomain ? ` (borrowed from ${mechanismDomain})` : ""}` : "unknown");

          // Why now — enabling shift in plain words.
          const shift = (firstTension?.enablingShift as Record<string, unknown> | undefined);
          const shiftWhat = plainStr(shift?.whatChanged, 140);
          const shiftDate = plainStr(shift?.date, 20);
          const whyNow = shiftWhat ? `${sentenceCase(shiftWhat)}${shiftDate ? ` (${shiftDate})` : ""}` : "unknown";

          // Why nobody did it — gap reason.
          const whyGap = plainStr(firstTension?.unaddressedReason, 200) ||
            plainStr(fals.structuralBarriers, 200) ||
            "unknown";

          // Proof — one verbatim quote, truncated.
          const excerpt = plainStr((firstObs as Record<string, unknown> | undefined)?.rawExcerpt, 200);
          const proof = excerpt ? `"${excerpt}"` : "unknown";

          // Next step — plain action, no machine commands in reader view.
          const buyerShort = whoHurts === "unknown" ? "three likely buyers" : `3 ${whoHurts.charAt(0).toLowerCase() + whoHurts.slice(1)}`;
          const offerShort = (wedge || mechanism).slice(0, 80) || "the idea";
          const nextStep = `Speak to ${buyerShort} about "${offerShort}" this week; log the decision in the weekly review.`;

          const obsIds = obsResolved.map((o) => String(o.id));
          const sourceRefs = obsResolved.map((o) => String((o as Record<string, unknown>).sourceRef ?? "")).filter(Boolean);
          const trace = partial
            ? `Trace: partial (synthesis ${String(s.id)}; ${tensionsResolved.length}/${tensionIds.length} tensions, ${obsResolved.length} observations joined)`
            : `Trace: ${String(s.id)} → ${tensionIds.join(", ") || "—"} → ${obsIds.join(", ") || "—"}`;

          return { whoHurts, vertical, whatBreaks, money, whatToSell, whyNow, whyGap, proof, nextStep, trace, partial, obsIds, tensionIds, sourceRefs };
        }

        const readerBySyn = new Map<string, ReaderView>();
        for (const s of promoted) {
          readerBySyn.set(String(s.id), buildReader(s));
        }

        for (const s of promoted) {
          const cardId = `card-${(s.id as string) ?? "unknown"}`;
          const panel = (s.panel as Record<string, unknown> | undefined) ?? {};
          const disagreement = [panel.operator, panel.economist, panel.behaviorist, panel.skeptic]
            .filter((x) => typeof x === "string" && x.length > 0)
            .join(" | ");
          const fals = (s.falsification as Record<string, unknown>) ?? {};
          const reader = readerBySyn.get(String(s.id))!;
          const card = {
            id: cardId,
            synthesisId: String(s.id ?? "unknown"),
            hook: String(s.mechanism ?? "").slice(0, 280),
            evidenceBullets: [
              String(fals.unawarenessAffirmative ?? "").slice(0, 300),
              String(fals.durability ?? "").slice(0, 300),
            ].filter((x) => x.length > 0),
            panelDisagreement: disagreement.slice(0, 400),
            probeResult: "none",
            believe: String(fals.structuralBarriers ?? "").slice(0, 400),
            week,
            status: "promoted",
            whoPays: reader.whoHurts.slice(0, 200),
            painRM: reader.money.slice(0, 200),
            whyNow: reader.whyNow.slice(0, 200),
            offering: reader.whatToSell.slice(0, 280),
          };
          const parsed = CardSchema.safeParse(card);
          if (!parsed.success) {
            context.logger.warn("Card for {synthesis} failed card schema — deadlettered", {
              synthesis: String(s.id),
            });
            await context.writeResource("deadletter", `deadletter-card-${await sha1Hex(cardId).then((h) => h.slice(0, 12))}`, {
              kind: "card",
              errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
              record: card,
              receivedAt: new Date().toISOString(),
            });
            continue;
          }
          const name = `card-${(await sha1Hex(cardId)).slice(0, 12)}`;
          await context.writeResource("card", name, parsed.data as Record<string, unknown>);
          names.push(name);
        }

        for (const s of demoted) {
          await storeValidated("graveyard", [
            {
              id: `grave-${s.id}-capacity`,
              entityType: "synthesis",
              entityId: String(s.id),
              reasonCode: "panel_converged_obvious",
              detail: "Below weekly promotion cap — archived with reason",
              killedBy: "records.promote",
              killedAt: new Date().toISOString(),
            },
          ], context);
        }

        // Weekly digest markdown — reader view first, operator appendix second.
        const lines: string[] = [
          `# Hyfae Weekly — ${week}`,
          "",
          `${promoted.length} promoted (cap ${cap}). ${demoted.length} archived.`,
          "",
        ];
        for (const s of promoted) {
          const reader = readerBySyn.get(String(s.id))!;
          const fals = (s.falsification as Record<string, unknown>) ?? {};
          const panel = (s.panel as Record<string, unknown> | undefined) ?? {};
          const priorArt = Array.isArray(fals.priorArt) ? (fals.priorArt as unknown[]).filter((x): x is string => typeof x === "string") : [];
          const priorPlain = priorArt.map(shortenPriorArtName).filter(Boolean);
          const panelLines = [
            `Operator: ${plainStr(panel.operator, 200) || "—"}`,
            `Economist: ${plainStr(panel.economist, 200) || "—"}`,
            `Behaviorist: ${plainStr(panel.behaviorist, 200) || "—"}`,
            `Skeptic: ${plainStr(panel.skeptic, 200) || "—"}`,
          ];
          lines.push(
            `## ${s.id}`,
            "",
            `Who hurts: ${reader.whoHurts}`,
            "",
            `Vertical: ${reader.vertical}`,
            "",
            `What breaks: ${reader.whatBreaks}`,
            "",
            `Money: ${reader.money}`,
            "",
            `What to sell: ${reader.whatToSell}`,
            "",
            `Why now: ${reader.whyNow}`,
            "",
            `Why nobody did it: ${reader.whyGap}`,
            "",
            `Proof: ${reader.proof}`,
            "",
            `Next step: ${reader.nextStep}`,
            "",
            `${reader.trace}`,
            "",
            `### Operator notes`,
            "",
            priorPlain.length > 0
              ? `${priorPlain.length} similar tries: ${priorPlain.join("; ")}`
              : `0 similar tries found`,
            "",
            ...panelLines,
            "",
            reader.sourceRefs.length > 0 ? `Sources: ${reader.sourceRefs.join("; ")}` : `Sources: ${reader.partial ? "unknown" : "—"}`,
            "",
            `Feedback: \`bin/feedback ${String(s.id)} escalate|dismiss "reason"\``,
            "",
            "",
          );
        }
        const handle = await context.writeResource("digest", `digest-${week}`, {
          week,
          cards: names.length,
          markdown: lines.join("\n"),
        });
        return { dataHandles: [handle] };
      },
    },
    save_note: {
      description: "Persist freeform text (red-team memo, probe result) as a note resource",
      arguments: z.object({
        title: z.string(),
        text: z.string().min(1),
      }),
      execute: async (
        args: { title: string; text: string },
        context: RecContext,
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        const handle = await context.writeResource("note", `note-${slugify(args.title)}`, {
          title: args.title,
          text: args.text,
          savedAt: new Date().toISOString(),
        });
        return { dataHandles: [handle] };
      },
    },
  },
};
