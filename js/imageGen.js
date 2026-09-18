/**
 * Text-to-image preview for AADAM plushies.
 * Pipeline: Pattern Request → promptCompiler → OpenAI DALL·E 3.
 * API key stays in localStorage only.
 */
(function (global) {
  const STORAGE_KEY = "aadam_openai_api_key";
  const ENDPOINT = "https://api.openai.com/v1/images/generations";

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

  /**
   * Build prompt via the Dynamic Prompt Compiler (elite crochet language).
   * Falls back to a short stub only if the compiler script failed to load.
   */
  function buildPrompt(patternRequest, extras) {
    extras = extras || {};
    if (global.AmigurumiPromptCompiler) {
      return global.AmigurumiPromptCompiler.compileFromPatternRequest(
        patternRequest,
        extras
      );
    }
    const req = patternRequest || {};
    const name = extras.displayName || req.animalSpecies || "plush animal";
    return (
      "Studio photograph of a handmade chenille amigurumi " +
      name +
      " plush with visible single-crochet stitches, not a cartoon."
    );
  }

  /**
   * Call OpenAI DALL·E 3. Returns { url, revisedPrompt, prompt }.
   */
  async function generatePlushImage(options) {
    options = options || {};
    const apiKey = String(options.apiKey || getApiKey() || "").trim();
    if (!apiKey) {
      throw new Error(
        "Add your OpenAI API key in the Image preview section (kept only in this browser)."
      );
    }
    const prompt =
      options.prompt || buildPrompt(options.patternRequest, options);
    if (!prompt) throw new Error("Missing image prompt.");

    const body = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: options.size || "1024x1024",
      quality: options.quality || "standard",
    };

    const res = await fetch(ENDPOINT, {
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
    };
  }

  global.AmigurumiImageGen = {
    STORAGE_KEY: STORAGE_KEY,
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    buildPrompt: buildPrompt,
    generatePlushImage: generatePlushImage,
  };
})(window);
