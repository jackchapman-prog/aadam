/**
 * Dynamic Prompt Compiler — UI / Pattern Request → elite DALL·E prompt.
 *
 * Step 1 of the image pipeline: convert locked AmigurumiPatternRequest
 * settings into a highly specific crochet-plush description so the model
 * does not fall back to generic cartoons or CGI.
 *
 * (Static-site equivalent of utils/promptCompiler.js — no Next.js required.)
 */
(function (global) {
  const CORE_STYLE =
    "A professional, crisp studio photograph of an authentic handmade amigurumi plush toy. " +
    "It is meticulously crocheted using thick, chunky, fuzzy plush chenille yarn. " +
    "The individual tight single-crochet stitches are cleanly defined and highly visible across the entire surface. " +
    "No stuffing is showing. Not a cartoon illustration, not flat vector art, not glossy CGI plastic.";

  const ENVIRONMENT =
    "The plush sits centered on a clean, light-colored wooden crafting desk with soft, " +
    "neutral studio background lighting, creating a warm, handmade aesthetic.";

  function yarnOverride(yarnMetric) {
    const mat = (yarnMetric && yarnMetric.materialType) || "chenille";
    if (mat === "cotton") {
      return " Worked in smooth cotton yarn with visible amigurumi single-crochet texture (still handmade, not plastic).";
    }
    if (mat === "acrylic") {
      return " Worked in soft acrylic yarn with clear single-crochet stitch definition.";
    }
    if (mat === "velvet") {
      return " Worked in ultra-plush velvet yarn with a fuzzy chenille look and visible stitch ridges.";
    }
    return ""; // chenille already in CORE_STYLE
  }

  function animalLabel(settings) {
    const species = settings.animal || settings.animalSpecies || "custom";
    const display = settings.displayName || settings._displayName;
    if (display) return String(display);
    if (species === "custom") return "plush animal";
    return species;
  }

  /**
   * Silhouette injection matching owned style families / Pattern Request enums.
   */
  function compileSilhouetteDetails(settings) {
    const animal = String(settings.animal || settings.animalSpecies || "").toLowerCase();
    const posture = settings.posture || settings.bodySilhouette || "";
    const inches = settings.targetHeightInches || settings.heightInches || 10;
    const name = animalLabel(settings);

    // Explicit posture aliases from the example architecture
    const floppy =
      posture === "floppy_seated" ||
      posture === "CHUBBY_FLOPPY_SEATED" ||
      (animal === "otter" && !posture);

    if (animal === "otter" && floppy) {
      return (
        "A baby otter in a chubby, floppy seated posture, about " +
        inches +
        " inches tall. " +
        "It has small narrow tube arms on its upper chest pointing inward, " +
        "a long thick tapered cone tail propping it up from behind, " +
        "and wide flat paddle-like back feet pointing upward and forward."
      );
    }

    if (
      posture === "SITTING_UPRIGHT_WIDE_HIP" ||
      posture === "sitting_upright"
    ) {
      if (animal === "cat") {
        return (
          "A sitting kitten-style " +
          name +
          " amigurumi, about " +
          inches +
          " inches tall, large round head (~40% of height), " +
          "wide-hip seated body, short limbs joined at the hips and chest, thin tube tail, 3D cone ears."
        );
      }
      if (animal === "hippo") {
        return (
          "A sitting " +
          name +
          " amigurumi, about " +
          inches +
          " inches tall, chubby wide-hip body, short legs under the hips, " +
          "rounded head with a broad muzzle, tiny ears, tiny chain-like tail."
        );
      }
      if (animal === "bear") {
        return (
          "A classic sitting teddy bear amigurumi, about " +
          inches +
          " inches tall, round head, sew-on snout look, dome ears, " +
          "wide seated hips, plump limbs, tiny ball tail."
        );
      }
      return (
        "A sitting upright " +
        name +
        " amigurumi plush, about " +
        inches +
        " inches tall, wide hips, round belly, large head, short limbs."
      );
    }

    if (
      posture === "SLENDER_PEAR_NECK_TUBE" ||
      posture === "dangling" ||
      animal === "deer"
    ) {
      return (
        "A dangling chibi " +
        name +
        " amigurumi, about " +
        inches +
        " inches tall, oversized round head, pear-shaped body, " +
        "long thin arms and legs hanging down, short thick neck stump, cream muzzle, branched antlers if deer."
      );
    }

    return (
      "A handmade " +
      name +
      " amigurumi plush toy, about " +
      inches +
      " inches tall, chubby seated proportions, large head, short limbs."
    );
  }

  /**
   * Face / muzzle injection — PATH A vs PATH B.
   */
  function compileFaceDetails(settings) {
    const muzzle =
      settings.muzzleStyle ||
      settings.facialConstructionStyle ||
      "SEPARATE_PATCH";

    if (muzzle === "CONTINUOUS_NOSE_FIRST") {
      return (
        "The face features a seamless, continuous nose-first head profile where a soft cream-white snout " +
        "transitions horizontally straight across into a solid brown (or main-color) head. " +
        "Large glossy black plastic safety eyes are pinned right along the horizontal color switch line. " +
        "No separate sew-on muzzle patch."
      );
    }

    // SEPARATE_PATCH (default)
    return (
      "The head is a clean solid-colored sphere. A small lightly stuffed cream oval muzzle patch " +
      "is sewn between the eyes on the lower face. Large glossy black plastic safety eyes. " +
      "Embroidered dark nose on the cream muzzle."
    );
  }

  /**
   * Normalize Pattern Request JSON (or loose UI settings) → compiler settings.
   */
  function settingsFromPatternRequest(patternRequest, extras) {
    extras = extras || {};
    const req = patternRequest || {};
    return {
      animal: req.animalSpecies || extras.animal || "custom",
      animalSpecies: req.animalSpecies,
      displayName: extras.displayName || req._displayName,
      posture: req.bodySilhouette || extras.posture,
      bodySilhouette: req.bodySilhouette,
      muzzleStyle: req.facialConstructionStyle || extras.muzzleStyle,
      facialConstructionStyle: req.facialConstructionStyle,
      targetHeightInches: req.targetHeightInches,
      yarnMetric: req.yarnMetric,
      limbAttachmentStyle: req.limbAttachmentStyle,
    };
  }

  /**
   * Main compiler — elite prompt string for the image API.
   */
  function compileImagePrompt(settings) {
    settings = settings || {};
    const core = CORE_STYLE + yarnOverride(settings.yarnMetric);
    const silhouetteDetails = compileSilhouetteDetails(settings);
    const faceDetails = compileFaceDetails(settings);
    return [core, silhouetteDetails, faceDetails, ENVIRONMENT]
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Convenience: Pattern Request → prompt (used by imageGen).
   */
  function compileFromPatternRequest(patternRequest, extras) {
    return compileImagePrompt(settingsFromPatternRequest(patternRequest, extras));
  }

  global.AmigurumiPromptCompiler = {
    compileImagePrompt: compileImagePrompt,
    compileFromPatternRequest: compileFromPatternRequest,
    settingsFromPatternRequest: settingsFromPatternRequest,
    CORE_STYLE: CORE_STYLE,
    ENVIRONMENT: ENVIRONMENT,
  };
})(window);
