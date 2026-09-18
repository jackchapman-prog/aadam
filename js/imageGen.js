/**
 * Text-to-image preview for AADAM plushies.
 * Pipeline: Pattern Request → promptCompiler → image provider.
 *
 * Providers:
 *  - free (default): Pollinations — no API key, good for testing
 *  - openai: DALL·E 3 — needs a paid OpenAI key
 */
(function (global) {
  const STORAGE_KEY = "aadam_openai_api_key";
  const PROVIDER_KEY = "aadam_image_provider";
  const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";

  function getApiKey() {
    try {
      return String(localStorage.getItem(STORAGE_KEY) || "").trim();
    } catch (err) {
      return "";
    }
  }

  function setApiKey(key) {
    try {
      const k = String(key || "").trim();
      if (k) localStorage.setItem(STORAGE_KEY, k);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* private mode */
    }
  }

  function getProvider() {
    try {
      const p = String(localStorage.getItem(PROVIDER_KEY) || "free").trim();
      return p === "openai" ? "openai" : "free";
    } catch (err) {
      return "free";
    }
  }

  function setProvider(provider) {
    try {
      localStorage.setItem(
        PROVIDER_KEY,
        provider === "openai" ? "openai" : "free"
      );
    } catch (err) {
      /* private mode */
    }
  }

  function buildPrompt(patternRequest, extras) {
    extras = extras || {};
    if (global.AmigurumiPromptCompiler) {
      // Free providers: compact identity-first prompt; OpenAI: full recipe prompt
      const forFree = extras.provider === "free" || extras.compact;
      return global.AmigurumiPromptCompiler.compileFromPatternRequest(
        patternRequest,
        Object.assign({}, extras, { compact: !!forFree })
      );
    }
    const req = patternRequest || {};
    const name = extras.displayName || req.animalSpecies || "plush animal";
    return (
      "EXACT SUBJECT: handmade crochet amigurumi " +
      name +
      " only, not a generic teddy. Visible chenille single-crochet stitches."
    );
  }

  /** Free test path — Pollinations image URL (no key, no billing). */
  async function generateWithPollinations(prompt) {
    // Keep URL reasonable; very long prompts can break some clients
    const trimmed =
      prompt.length > 1200 ? prompt.slice(0, 1200) : prompt;
    const encoded = encodeURIComponent(trimmed);
    const seed = Date.now() % 1000000;
    const url =
      "https://image.pollinations.ai/prompt/" +
      encoded +
      "?width=1024&height=1024&nologo=true&enhance=true&seed=" +
      seed;

    // Warm the URL (Pollinations generates on first fetch)
    const res = await fetch(url, { method: "GET", mode: "cors" });
    if (!res.ok) {
      throw new Error(
        "Free image service error (" +
          res.status +
          "). Try again in a moment."
      );
    }

    return {
      url: url,
      revisedPrompt: prompt,
      prompt: prompt,
      provider: "free",
    };
  }

  /** Paid path — OpenAI DALL·E 3. */
  async function generateWithOpenAI(prompt, apiKey, options) {
    options = options || {};
    const body = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: options.size || "1024x1024",
      quality: options.quality || "standard",
    };

    const res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }

    if (!res.ok) {
      const msg =
        (data && data.error && data.error.message) ||
        "Image API error (" + res.status + ").";
      throw new Error(msg);
    }

    const item = data && data.data && data.data[0];
    if (!item || !item.url) {
      throw new Error("Image API returned no image URL.");
    }

    return {
      url: item.url,
      revisedPrompt: item.revised_prompt || prompt,
      prompt: prompt,
      provider: "openai",
    };
  }

  async function generatePlushImage(options) {
    options = options || {};
    const provider = options.provider || getProvider();
    const prompt =
      options.prompt ||
      buildPrompt(
        options.patternRequest,
        Object.assign({}, options, { provider: provider })
      );
    if (!prompt) throw new Error("Missing image prompt.");

    if (provider === "openai") {
      const apiKey = String(options.apiKey || getApiKey() || "").trim();
      if (!apiKey) {
        throw new Error(
          "OpenAI is selected. Switch Image provider to “Free test (no API key)” — or paste a key only if you want paid DALL·E."
        );
      }
      return generateWithOpenAI(prompt, apiKey, options);
    }

    return generateWithPollinations(prompt);
  }

  global.AmigurumiImageGen = {
    STORAGE_KEY: STORAGE_KEY,
    PROVIDER_KEY: PROVIDER_KEY,
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    getProvider: getProvider,
    setProvider: setProvider,
    buildPrompt: buildPrompt,
    generatePlushImage: generatePlushImage,
  };
})(window);
