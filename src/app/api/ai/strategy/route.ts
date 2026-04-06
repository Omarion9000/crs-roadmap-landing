import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan, isNewUsagePeriod, isProUser } from "@/lib/subscriptions";
import { getOpenAIClient, AI_STRATEGY_MODEL } from "@/lib/ai/openai";
import { buildStrategyContext } from "@/lib/ai/strategy";
import type { AIStrategyRecommendation } from "@/types/ai-strategy";

const strategyResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "best_strategy",
    "reason",
    "estimated_time",
    "impact_summary",
    "confidence",
    "ordered_actions",
    "alternatives",
    "caution",
  ],
  properties: {
    best_strategy: { type: "string" },
    reason: { type: "string" },
    estimated_time: { type: "string" },
    impact_summary: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    ordered_actions: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 6,
    },
    alternatives: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "impact", "tradeoff"],
        properties: {
          name: { type: "string" },
          impact: { type: "string" },
          tradeoff: { type: "string" },
        },
      },
    },
    caution: { type: ["string", "null"] },
  },
} as const;

const recommendationSchema = z.object({
  best_strategy: z.string(),
  reason: z.string(),
  estimated_time: z.string(),
  impact_summary: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  ordered_actions: z.array(z.string()).min(1).max(6),
  alternatives: z
    .array(
      z.object({
        name: z.string(),
        impact: z.string(),
        tradeoff: z.string(),
      })
    )
    .max(3),
  caution: z.string().nullable(),
});

const bodySchema = z
  .object({
    profile: z
      .object({
        baseCrs: z.number().optional(),
        ieltsClb: z.number().optional(),
        frenchClb: z.number().optional(),
        canExpYears: z.number().optional(),
        hasJobOffer: z.boolean().optional(),
        hasPnp: z.boolean().optional(),
        educationLabel: z.string().optional(),
        foreignExperienceLabel: z.string().optional(),
        canadianCredentialLabel: z.string().optional(),
        profileModeLabel: z.string().optional(),
        rawForm: z.record(z.string(), z.unknown()).optional(),
      })
      .partial()
      .optional(),
    lang: z.enum(["en", "es"]).optional(),
    program_target: z.enum(["general", "cec", "french", "pnp"]).optional(),
    benchmark_general: z.number().optional(),
    benchmark_category: z.number().optional(),
  })
  .partial();

type LatestRoadmapRow = {
  id: string;
  profile_snapshot: {
    baseCrs?: number;
    effectiveBaseCrs?: number;
    ieltsClb?: number;
    frenchClb?: number;
    canExpYears?: number;
    hasJobOffer?: boolean;
    hasPnp?: boolean;
    lang?: "en" | "es";
    educationLabel?: string;
    foreignExperienceLabel?: string;
    canadianCredentialLabel?: string;
    profileModeLabel?: string;
    rawForm?: Record<string, unknown> | null;
  } | null;
  program_target: string | null;
  top_scenarios: Array<{
    id?: string;
    title?: string;
    description?: string;
    delta?: number;
    eligible?: boolean;
    newCrs?: number;
    programTarget?: "general" | "cec" | "french" | "pnp";
  }> | null;
  created_at: string | null;
};

type SubscriptionUsageRow = {
  user_id: string;
  plan: string | null;
  ai_requests_used: number | null;
  ai_requests_limit: number | null;
  ai_usage_period_start: string | null;
};

type SubscriptionUsageUpdateTable = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
};

function getSubscriptionsUsageUpdateTable(
  supabase: ReturnType<typeof createSupabaseAdminClient>
) {
  return (supabase.from("subscriptions") as unknown) as SubscriptionUsageUpdateTable;
}

type RoadmapsUpdateTable = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
};

function getRoadmapsUpdateTable(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  return (supabase.from("roadmaps") as unknown) as RoadmapsUpdateTable;
}

function getSystemPrompt() {
  return [
    "You are a CRS strategy interpreter for a premium Express Entry optimization product.",
    "Use ONLY the provided scenario data and profile context as source-of-truth.",
    "Do not invent CRS points, eligibility rules, or legal conclusions.",
    "Do not guarantee immigration outcomes.",
    "Recommend the most realistic and user-actionable path as the main recommendation, not merely the biggest point gain.",
    "Do NOT recommend PNP as the primary path only because it gives the most points.",
    "Treat PNP as the highest-upside or parallel path when it is conditional on stream fit, timing, or eligibility.",
    "Prefer user-controlled paths like French, English, or Canadian experience when they are more realistic to begin now.",
    "Adapt the recommendation to the user's actual profile. Do NOT output the same strategy for all users.",
    "Evaluate current language levels, proximity to stronger thresholds, whether a path is user-controlled, and whether it depends on external selection.",
    "Prioritize realistic and controllable improvements first, then high-impact but conditional paths.",
    "Distinguish clearly between best realistic path, highest upside path, fastest path to start now, and any parallel path worth exploring.",
    "Explain the best next move based on impact, realism, and sequencing.",
    "Return strict JSON only matching the requested schema.",
    "Keep reasoning concise, trustworthy, and product-grade.",
  ].join(" ");
}

function jsonError(status: number, error: string, code?: string) {
  console.log("[ai strategy] final returned status:", status, code ?? "no_code");
  return NextResponse.json(
    code ? { ok: false, error, code } : { ok: false, error },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    console.log("[ai strategy] endpoint hit");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError(401, "Unauthorized", "unauthorized");
    }

    const plan = await getUserPlan(user.id);
    console.log("[ai strategy] user id:", user.id);
    console.log("[ai strategy] plan:", plan);

    if (!isProUser(plan)) {
      return jsonError(403, "Pro required", "pro_required");
    }

    const admin = createSupabaseAdminClient();
    const { data: subscriptionRow, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("user_id, plan, ai_requests_used, ai_requests_limit, ai_usage_period_start")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionUsageRow>();

    if (subscriptionError) {
      console.error("[ai strategy] subscription usage fetch failed:", subscriptionError);
      return jsonError(
        500,
        "Failed to load subscription usage",
        "subscription_usage_failed"
      );
    }

    const subscription = subscriptionRow as SubscriptionUsageRow | null;

    if (!subscription || !isProUser(subscription.plan)) {
      return jsonError(403, "Pro required", "pro_required");
    }

    let aiRequestsUsed = subscription.ai_requests_used ?? 0;
    const aiRequestsLimit = subscription.ai_requests_limit ?? 30;
    let aiUsagePeriodStart = subscription.ai_usage_period_start ?? new Date().toISOString();

    if (isNewUsagePeriod(aiUsagePeriodStart)) {
      const resetDate = new Date().toISOString();
      const { error: resetError } = await getSubscriptionsUsageUpdateTable(admin)
        .update({
          ai_requests_used: 0,
          ai_usage_period_start: resetDate,
        })
        .eq("user_id", user.id);

      if (resetError) {
        console.error("[ai strategy] usage reset failed:", resetError);
        return jsonError(500, "Failed to reset AI usage", "usage_reset_failed");
      }

      aiRequestsUsed = 0;
      aiUsagePeriodStart = resetDate;
    }

    if (aiRequestsUsed >= aiRequestsLimit) {
      return NextResponse.json(
        {
          ok: false,
          error: "You’ve reached your monthly AI limit.",
          code: "ai_limit_reached",
          usage: {
            used: aiRequestsUsed,
            limit: aiRequestsLimit,
            remaining: 0,
            period_start: aiUsagePeriodStart,
          },
        },
        { status: 403 }
      );
    }

    const rawBody = (await req.json().catch(() => ({}))) as unknown;
    console.log("[ai strategy] request body received:", !!rawBody);
    const body = bodySchema.safeParse(rawBody);

    if (!body.success) {
      console.error("[ai strategy] invalid request payload");
      return jsonError(400, "Invalid strategy request payload", "invalid_request");
    }

    const { data: latestRoadmap } = await supabase
      .from("roadmaps")
      .select("id, profile_snapshot, program_target, top_scenarios, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<LatestRoadmapRow>();

    let context;

    try {
      context = buildStrategyContext(body.data, latestRoadmap);
      console.log("[ai strategy] context built:", !!context);
    } catch (error) {
      console.error("[ai strategy] context build failed:", error);
      return jsonError(
        400,
        "Your simulator context is incomplete. Update your profile and try again.",
        "invalid_context"
      );
    }

    console.log(
      "[ai strategy] context summary:",
      JSON.stringify({
        source: context.source,
        current_crs: context.current_crs,
        scenario_count: context.scenarios.length,
        program_target: context.program_target,
      })
    );

    let rawOutput = "";

    try {
      console.log("[ai strategy] calling OpenAI...");
      const client = getOpenAIClient();
      const response = await client.responses.create({
        model: AI_STRATEGY_MODEL,
        reasoning: { effort: "medium" },
        instructions: getSystemPrompt(),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Strategy context JSON:\n${JSON.stringify(context, null, 2)}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ai_strategy_recommendation",
            strict: true,
            schema: strategyResponseSchema,
          },
        },
      });

      console.log("[ai strategy] OpenAI response received");
      rawOutput = response.output_text;
    } catch (error) {
      console.error("[ai strategy] OpenAI request failed:", error);

      if (error instanceof Error && error.message === "Missing OPENAI_API_KEY") {
        console.error("[ai strategy] missing OpenAI configuration: OPENAI_API_KEY");
        return jsonError(
          500,
          "We couldn’t generate your strategy right now. Your roadmap is still available below. Try again in a few seconds.",
          "missing_api_key"
        );
      }

      return jsonError(500, "AI request failed", "openai_request_failed");
    }

    if (!rawOutput) {
      console.error("[ai strategy] empty model output");
      return jsonError(500, "AI response parsing failed", "ai_parse_failed");
    }

    let parsedRecommendation: AIStrategyRecommendation;

    try {
      parsedRecommendation = recommendationSchema.parse(
        JSON.parse(rawOutput)
      ) as AIStrategyRecommendation;
      console.log("[ai strategy] parsed recommendation successfully");
    } catch (error) {
      console.error("[ai strategy] parse failure", error);
      console.error("[ai strategy] raw response", rawOutput);
      return jsonError(500, "AI response parsing failed", "ai_parse_failed");
    }

    console.log("[ai strategy] final returned status: 200 ok");

    const nextUsed = aiRequestsUsed + 1;
    const { error: incrementError } = await getSubscriptionsUsageUpdateTable(admin)
      .update({
        ai_requests_used: nextUsed,
      })
      .eq("user_id", user.id);

    if (incrementError) {
      console.error("[ai strategy] usage increment failed:", incrementError);
      return jsonError(500, "Failed to update AI usage", "usage_increment_failed");
    }

    if (latestRoadmap?.id) {
      const persistedProfileSnapshot =
        latestRoadmap.profile_snapshot && typeof latestRoadmap.profile_snapshot === "object"
          ? latestRoadmap.profile_snapshot
          : {};

      const { error: roadmapAiSaveError } = await getRoadmapsUpdateTable(admin)
        .update({
          profile_snapshot: {
            ...persistedProfileSnapshot,
            ai_strategy: parsedRecommendation,
            ai_strategy_updated_at: new Date().toISOString(),
          },
        })
        .eq("id", latestRoadmap.id)
        .eq("user_id", user.id);

      if (roadmapAiSaveError) {
        console.error("[ai strategy] roadmap AI persistence failed:", roadmapAiSaveError);
      } else {
        console.log("[ai strategy] roadmap AI persisted");
      }
    }

    return NextResponse.json({
      ok: true,
      recommendation: parsedRecommendation,
      usage: {
        used: nextUsed,
        limit: aiRequestsLimit,
        remaining: Math.max(0, aiRequestsLimit - nextUsed),
        period_start: aiUsagePeriodStart,
      },
    });
  } catch (error) {
    console.error("[ai strategy] fatal error:", error);

    if (error instanceof Error && error.message === "Missing OPENAI_API_KEY") {
      console.error("[ai strategy] missing OpenAI configuration: OPENAI_API_KEY");
      return jsonError(
        500,
        "We couldn’t generate your strategy right now. Your roadmap is still available below. Try again in a few seconds.",
        "missing_api_key"
      );
    }

    return jsonError(500, "Failed to generate AI strategy", "internal_error");
  }
}
