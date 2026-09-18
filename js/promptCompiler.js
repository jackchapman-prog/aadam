/**
 * Dynamic Prompt Compiler — Pattern Request + recipe → image prompt.
 *
 * Puts species identity and pattern blueprint FIRST so free image models
 * do not invent a random generic plush.
 */
(function (global) {
  const CORE_STYLE =
    "Authentic handmade amigurumi: thick fuzzy chenille yarn, " +
    "tight single-crochet stitches clearly visible, no stuffing showing, " +
    "studio product photo, not cartoon, not CGI plastic, not flat illustration.";

  const ENVIRONMENT =
    "Centered on a light wooden crafting desk, soft neutral studio light, warm handmade look.";

  function yarnWords(yarnMetric) {
    const mat = (yarnMetric && yarnMetric.materialType) || "chenille";
    if (mat === "cotton") return "smooth cotton amigurumi yarn";
    if (mat === "acrylic") return "soft acrylic amigurumi yarn";
    if (mat === "velvet") return "ultra-plush velvet chenille yarn";
    return "chunky fuzzy plush chenille yarn";
  }

  function animalLabel(settings) {
    const species = settings.animal || settings.animalSpecies || "custom";
    const display = settings.displayName || settings._displayName;
    if (display) return String(display);
    if (species === "custom") return "plush animal";
    return species.charAt(0).toUpperCase() + species.slice(1);
  }

  function compileIdentityLock(settings) {
    const name = animalLabel(settings);
    const species = String(settings.animal || settings.animalSpecies || "custom");
    return (
      "EXACT SUBJECT LOCK: one handmade crochet amigurumi " +
      name +
      " plush only. " +
      "It must be clearly recognizable as a " +
      name +
      " (" +
      species +
      "). " +
      "FORBIDDEN: generic teddy bear, random stuffed animal, wrong species, " +
      "cartoon mascot, plastic toy, or unrelated plush design."
    );
  }

  function compileBlueprint(settings) {
    const inches = settings.targetHeightInches || 10;
    const sil = settings.bodySilhouette || settings.posture || "auto";
    const face =
      settings.facialConstructionStyle ||
      settings.muzzleStyle ||
      "SEPARATE_PATCH";
    const limbs = settings.limbAttachmentStyle || "NO_SEW_JOIN_AS_YOU_GO";
    const yarn = yarnWords(settings.yarnMetric);
    return (
      "PATTERN BLUEPRINT (match this design exactly): " +
      "height≈" +
      inches +
      '" · silhouette=' +
      sil +
      " · face=" +
      face +
      " · limbs=" +
      limbs +
      " · yarn=" +
      yarn +
      "."
    );
  }

  function compileSilhouetteDetails(settings) {
    const animal = String(
      settings.animal || settings.animalSpecies || ""
    ).toLowerCase();
    const posture = settings.posture || settings.bodySilhouette || "";
    const inches = settings.targetHeightInches || settings.heightInches || 10;
    const name = animalLabel(settings);

    const floppy =
      posture === "floppy_seated" ||
      posture === "CHUBBY_FLOPPY_SEATED" ||
      (animal === "otter" &&
        (!posture || posture === "auto" || posture.indexOf("FLOPPY") !== -1));

    if (animal === "otter" || (floppy && /otter|beaver|seal/.test(animal))) {
      return (
        "POSE & PARTS (otter recipe): chubby floppy seated baby otter, ~" +
        inches +
        "\" tall, oversized head, " +
        "two small narrow tube arms on the UPPER CHEST angled inward (holding pose), " +
        "two wide flat paddle feet at the base pointing UP and FORWARD, " +
        "one thick tapered cone tail as a BACKREST prop behind the body, " +
        "plump egg-shaped body, no long neck tube, no standing stilts."
      );
    }

    if (
      posture === "SITTING_UPRIGHT_WIDE_HIP" ||
      posture === "sitting_upright" ||
      animal === "cat" ||
      animal === "bear" ||
      animal === "hippo"
    ) {
      if (animal === "cat") {
        return (
          "POSE & PARTS (kitten recipe): sitting " +
          name +
          ", ~" +
          inches +
          "\" tall, large round head ~40% of height, " +
          "wide-hip seated body, short JAYG limbs, thin tube tail, 3D cone ears, no stilts."
        );
      }
      if (animal === "hippo") {
        return (
          "POSE & PARTS (hippo recipe): sitting " +
          name +
          ", ~" +
          inches +
          "\" tall, wide hips, short legs under body, " +
          "broad continuous muzzle into head, tiny ears, tiny chain tail."
        );
      }
      if (animal === "bear") {
        return (
          "POSE & PARTS (teddy recipe): sitting " +
          name +
          ", ~" +
          inches +
          "\" tall, round head, sew-on snout, dome ears, " +
          "wide seated hips, plump limbs, tiny ball tail."
        );
      }
      return (
        "POSE & PARTS: sitting upright " +
        name +
        ", ~" +
        inches +
        "\" tall, wide hips, round belly, large head, short limbs."
      );
    }

    if (
      posture === "SLENDER_PEAR_NECK_TUBE" ||
      animal === "deer"
    ) {
      return (
        "POSE & PARTS (deer recipe): dangling chibi " +
        name +
        ", ~" +
        inches +
        "\" tall, oversized round head, pear body, " +
        "long thin hanging arms and legs, short thick neck stump, cream muzzle, branched antlers."
      );
    }

    return (
      "POSE & PARTS: " +
      name +
      " amigurumi, ~" +
      inches +
      "\" tall, following the locked silhouette " +
      (posture || "sitting") +
      "."
    );
  }

  function compileFaceDetails(settings) {
    const muzzle =
      settings.muzzleStyle ||
      settings.facialConstructionStyle ||
      "SEPARATE_PATCH";

    if (muzzle === "CONTINUOUS_NOSE_FIRST") {
      return (
        "FACE (CONTINUOUS_NOSE_FIRST): one-piece head — cream/white snout tip for the lower face, " +
        "then a clean horizontal switch into solid main-color (brown) head for the upper face and back. " +
        "Glossy black safety eyes sit ON the cream-to-brown color switch line. " +
        "No sew-on muzzle patch. Cream is only the snout tip, not the whole head."
      );
    }

    return (
      "FACE (SEPARATE_PATCH): solid main-color sphere head with a small cream oval sew-on muzzle " +
      "between the eyes, embroidered dark nose on the cream patch, glossy black safety eyes."
    );
  }

  function compileRecipeExtras(settings) {
    const bits = [];
    if (settings.description) {
      bits.push("Recipe note: " + String(settings.description).slice(0, 220));
    }
    if (settings.partsSummary) {
      bits.push("Crochet pieces in this pattern: " + settings.partsSummary);
    }
    if (settings.assemblyHint) {
      bits.push("Assembly cue: " + String(settings.assemblyHint).slice(0, 160));
    }
    return bits.join(" ");
  }

  function settingsFromPatternRequest(patternRequest, extras) {
    extras = extras || {};
    const req = patternRequest || {};
    const animal = extras.animal || null;
    let partsSummary = extras.partsSummary || "";
    let description = extras.description || extras.blurb || "";
    let assemblyHint = extras.assemblyHint || "";

    if (animal && animal.parts && animal.parts.length && !partsSummary) {
      partsSummary = animal.parts
        .map(function (p) {
          return (
            (p.label || p.key || "part") +
            (p.count && p.count > 1 ? "×" + p.count : "") +
            (p.geometry ? " (" + p.geometry + ")" : "")
          );
        })
        .join("; ");
    }
    if (animal && animal.description && !description) {
      description = animal.description;
    }
    if (animal && animal.assembly && animal.assembly.length && !assemblyHint) {
      assemblyHint = animal.assembly.slice(0, 2).join(" ");
    }

    return {
      animal: req.animalSpecies || extras.animalSpecies || "custom",
      animalSpecies: req.animalSpecies,
      displayName:
        extras.displayName ||
        req._displayName ||
        (animal && animal.name) ||
        null,
      posture: req.bodySilhouette || extras.posture,
      bodySilhouette: req.bodySilhouette,
      muzzleStyle: req.facialConstructionStyle || extras.muzzleStyle,
      facialConstructionStyle: req.facialConstructionStyle,
      targetHeightInches: req.targetHeightInches,
      yarnMetric: req.yarnMetric,
      limbAttachmentStyle: req.limbAttachmentStyle,
      description: description,
      partsSummary: partsSummary,
      assemblyHint: assemblyHint,
    };
  }

  /**
   * Full elite prompt (OpenAI / long context).
   */
  function compileImagePrompt(settings) {
    settings = settings || {};
    return [
      compileIdentityLock(settings),
      compileBlueprint(settings),
      compileSilhouetteDetails(settings),
      compileFaceDetails(settings),
      CORE_STYLE + " Yarn: " + yarnWords(settings.yarnMetric) + ".",
      compileRecipeExtras(settings),
      ENVIRONMENT,
    ]
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Shorter priority prompt for free providers (identity + blueprint first).
   */
  function compileCompactPrompt(settings) {
    settings = settings || {};
    const compact = [
      compileIdentityLock(settings),
      compileBlueprint(settings),
      compileSilhouetteDetails(settings),
      compileFaceDetails(settings),
      CORE_STYLE,
      ENVIRONMENT,
    ]
      .filter(Boolean)
      .join(" ");
    // Free URL APIs choke on huge prompts — keep the strongest clauses
    if (compact.length > 900) return compact.slice(0, 900);
    return compact;
  }

  function compileFromPatternRequest(patternRequest, extras) {
    const settings = settingsFromPatternRequest(patternRequest, extras);
    if (extras && extras.compact) {
      return compileCompactPrompt(settings);
    }
    return compileImagePrompt(settings);
  }

  global.AmigurumiPromptCompiler = {
    compileImagePrompt: compileImagePrompt,
    compileCompactPrompt: compileCompactPrompt,
    compileFromPatternRequest: compileFromPatternRequest,
    settingsFromPatternRequest: settingsFromPatternRequest,
    CORE_STYLE: CORE_STYLE,
    ENVIRONMENT: ENVIRONMENT,
  };
})(window);
