import { assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  __resetIntegrationBrainPromptCacheForTest,
  __setIntegrationBrainPromptReaderForTest,
  getOmniLinkIntegrationBrainPrompt,
} from "./omnilinkIntegrationBrain.ts";

Deno.test("returns non-empty prompt when file exists", async () => {
  __resetIntegrationBrainPromptCacheForTest();
  const prompt = await getOmniLinkIntegrationBrainPrompt();
  assert(prompt.length > 0);
});

Deno.test("uses fallback prompt when file read fails", async () => {
  __resetIntegrationBrainPromptCacheForTest();
  __setIntegrationBrainPromptReaderForTest(() => Promise.reject(new Error("missing")));

  const prompt = await getOmniLinkIntegrationBrainPrompt();
  assert(prompt.includes("OMNiLiNK Integration Brain"));

  __setIntegrationBrainPromptReaderForTest();
});

