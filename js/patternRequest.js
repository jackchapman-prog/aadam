/**
 * AmigurumiPatternRequest — locked JSON from the form → generator.
 * Frontend choices are serialized into this schema, then applied so
 * generation matches the request exactly (no silent “auto” drift).
 */
(function (global) {
  const SCHEMA = {
    $schema: "http://json-schema.org",
    title: "AmigurumiPatternRequest",
    type: "object",
    properties: {
      animalSpecies: {
        type: "string",
        enum: ["otter", "cat", "hippo", "deer", "bear", "custom"],
      },
      targetHeightInches: {
        type: "number",
        minimum: 3,
        maximum: 24,
        default: 10.0,
      },
      yarnMetric: {
        type: "object",
        properties: {
          weightClass: { type: "integer", enum: [4, 5, 6, 7] },
          materialType: {
            type: "string",
            enum: ["chenille", "velvet", "acrylic", "cotton"],
          },
          hookSizeMm: { type: "number" },
        },
        required: ["weightClass", "materialType", "hookSizeMm"],
      },
      facialConstructionStyle: {
        type: "string",
        enum: ["SEPARATE_PATCH", "CONTINUOUS_NOSE_FIRST"],
      },
      limbAttachmentStyle: {
        type: "string",
        enum: ["SEW_ON_POST_ASSEMBLY", "NO_SEW_JOIN_AS_YOU_GO"],
      },
      bodySilhouette: {
        type: "string",
        enum: [
          "CHUBBY_FLOPPY_SEATED",
          "SITTING_UPRIGHT_WIDE_HIP",
          "SLENDER_PEAR_NECK_TUBE",
          "STANDING_QUADRUPED",
        ],
      },
    },
    required: [
      "animalSpecies",
      "targetHeightInches",
      "yarnMetric",
      "facialConstructionStyle",
      "limbAttachmentStyle",
      "bodySilhouette",
    ],
  };

  const SPECIES_ENUM = SCHEMA.properties.animalSpecies.enum;
  const FACE_ENUM = SCHEMA.properties.facialConstructionStyle.enum;
  const LIMB_ENUM = SCHEMA.properties.limbAttachmentStyle.enum;
  const SILHOUETTE_ENUM = SCHEMA.properties.bodySilhouette.enum;

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!(x > 0) && x !== 0) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function resolveSpecies(rawName) {
    const n = String(rawName || "")
      .toLowerCase()
      .trim();
    if (!n) return "custom";
    if (/\b(otter|beaver|seal|sea lion)\b/.test(n)) return "otter";
    if (/\b(cat|kitten|kitty|lion|tiger|lynx)\b/.test(n)) return "cat";
    if (/\b(hippo|hippopotamus)\b/.test(n)) return "hippo";
    if (/\b(deer|fawn|stag|doe)\b/.test(n)) return "deer";
    if (/\b(bear|teddy|panda|koala)\b/.test(n)) return "bear";
    if (SPECIES_ENUM.indexOf(n) !== -1) return n;
    return "custom";
  }

  function displayNameForSpecies(species, customName) {
    if (species === "custom") {
      return String(customName || "Custom").trim() || "Custom";
    }
    const map = {
      otter: "Otter",
      cat: "Cat",
      hippo: "Hippo",
      deer: "Deer",
      bear: "Teddy Bear",
    };
    return map[species] || customName || species;
  }

  function weightClassFromForm(yarnWeight) {
    const w = String(yarnWeight || "");
    if (w === "jumbo") return 7;
    if (w === "super-bulky") return 6;
    if (w === "bulky") return 5;
    if (w === "medium") return 4;
    // Schema only allows 4–7; map finer yarns up to worsted class
    return 4;
  }

  function yarnWeightFromClass(weightClass) {
    const c = Number(weightClass);
    if (c === 7) return "jumbo";
    if (c === 6) return "super-bulky";
    if (c === 5) return "bulky";
    return "medium";
  }

  function materialTypeFromForm(yarnType) {
    const t = String(yarnType || "").toLowerCase();
    if (t.indexOf("chenille") !== -1) return "chenille";
    if (t.indexOf("velvet") !== -1 || t.indexOf("plush") !== -1) return "velvet";
    if (t.indexOf("cotton") !== -1) return "cotton";
    return "acrylic";
  }

  function yarnTypeLabelFromMaterial(materialType) {
    if (materialType === "chenille") return "Chenille";
    if (materialType === "velvet") return "Velvet / plush";
    if (materialType === "cotton") return "Cotton";
    return "Acrylic";
  }

  function hookSizeMmFromForm(hookLabel) {
    const m = String(hookLabel || "").match(/(\d+(?:\.\d+)?)\s*mm/i);
    return m ? Number(m[1]) : 4.0;
  }

  function resolveFacial(faceUi, species) {
    if (faceUi === "SEPARATE_PATCH" || faceUi === "CONTINUOUS_NOSE_FIRST") {
      return faceUi;
    }
    // auto: hippo continuous; otter defaults separate (beginner); else separate
    if (species === "hippo") return "CONTINUOUS_NOSE_FIRST";
    return "SEPARATE_PATCH";
  }

  function resolveLimb(assemblyUi) {
    if (
      assemblyUi === "NO_SEW_JOIN_AS_YOU_GO" ||
      assemblyUi === "SEW_ON_POST_ASSEMBLY"
    ) {
      return assemblyUi;
    }
    if (assemblyUi === "jayg") return "NO_SEW_JOIN_AS_YOU_GO";
    return "SEW_ON_POST_ASSEMBLY";
  }

  function resolveSilhouette(bodyUi, postureUi, shapingUi, species, customName) {
    if (SILHOUETTE_ENUM.indexOf(bodyUi) !== -1) return bodyUi;
    const n = String(customName || species || "")
      .toLowerCase()
      .trim();

    // Species / name first — never dump every "custom" animal into sitting teddy
    if (species === "otter" || /\b(otter|beaver|seal)\b/.test(n)) {
      return "CHUBBY_FLOPPY_SEATED";
    }
    if (species === "deer" || /\b(deer|fawn|stag|doe)\b/.test(n)) {
      return "SLENDER_PEAR_NECK_TUBE";
    }
    if (
      species === "cat" ||
      species === "bear" ||
      species === "hippo" ||
      /\b(cat|kitten|hippo|bear|teddy|unicorn|bunny|rabbit|chinchilla)\b/.test(n)
    ) {
      return "SITTING_UPRIGHT_WIDE_HIP";
    }
    if (
      /\b(elephant|mammoth|fox|wolf|dog|giraffe|horse|zebra|dragon|rhino|cow|pig)\b/.test(
        n
      )
    ) {
      return "STANDING_QUADRUPED";
    }

    if (shapingUi === "chubby") return "CHUBBY_FLOPPY_SEATED";
    if (postureUi === "sitting") return "SITTING_UPRIGHT_WIDE_HIP";
    if (postureUi === "dangling") return "SLENDER_PEAR_NECK_TUBE";
    if (postureUi === "quadruped") return "STANDING_QUADRUPED";

    // Unknown custom: prefer standing only if name hints at four legs; else sitting plush
    return "SITTING_UPRIGHT_WIDE_HIP";
  }

  /**
   * Build locked AmigurumiPatternRequest from current form values.
   */
  function buildFromForm(form) {
    form = form || {};
    const customName = form.animalName || "";
    const species =
      form.animalSpecies && SPECIES_ENUM.indexOf(form.animalSpecies) !== -1
        ? form.animalSpecies
        : resolveSpecies(customName);

    const request = {
      animalSpecies: species,
      targetHeightInches: clamp(form.targetHeightInches, 3, 24),
      yarnMetric: {
        weightClass: weightClassFromForm(form.yarnWeight),
        materialType: materialTypeFromForm(form.yarnType),
        hookSizeMm: hookSizeMmFromForm(form.hookSize),
      },
      facialConstructionStyle: resolveFacial(
        form.facialConstructionStyle,
        species
      ),
      limbAttachmentStyle: resolveLimb(form.limbAttachmentStyle || form.assemblyStyle),
      bodySilhouette: resolveSilhouette(
        form.bodySilhouette,
        form.posture,
        form.shaping,
        species,
        customName
      ),
    };

    // Preserve free-text name for custom (and display)
    request._displayName = displayNameForSpecies(species, customName);
    request._customAnimalName =
      species === "custom" ? String(customName).trim() : request._displayName;

    return request;
  }

  function validate(request) {
    const issues = [];
    if (!request || typeof request !== "object") {
      return { ok: false, issues: ["Request missing"] };
    }
    SCHEMA.required.forEach(function (key) {
      if (request[key] == null) issues.push("Missing " + key);
    });
    if (SPECIES_ENUM.indexOf(request.animalSpecies) === -1) {
      issues.push("animalSpecies not in enum");
    }
    if (FACE_ENUM.indexOf(request.facialConstructionStyle) === -1) {
      issues.push("facialConstructionStyle not in enum");
    }
    if (LIMB_ENUM.indexOf(request.limbAttachmentStyle) === -1) {
      issues.push("limbAttachmentStyle not in enum");
    }
    if (SILHOUETTE_ENUM.indexOf(request.bodySilhouette) === -1) {
      issues.push("bodySilhouette not in enum");
    }
    const y = request.yarnMetric || {};
    if ([4, 5, 6, 7].indexOf(y.weightClass) === -1) {
      issues.push("yarnMetric.weightClass must be 4–7");
    }
    if (["chenille", "velvet", "acrylic", "cotton"].indexOf(y.materialType) === -1) {
      issues.push("yarnMetric.materialType not in enum");
    }
    if (!(y.hookSizeMm > 0)) issues.push("yarnMetric.hookSizeMm required");
    const h = request.targetHeightInches;
    if (!(h >= 3 && h <= 24)) issues.push("targetHeightInches must be 3–24");
    return { ok: issues.length === 0, issues: issues };
  }

  /**
   * Map locked request → options the animal generator already understands.
   */
  function toGeneratorOptions(request) {
    const limb = request.limbAttachmentStyle;
    const sil = request.bodySilhouette;
    let posture = "auto";
    let shaping = "auto";
    if (sil === "CHUBBY_FLOPPY_SEATED") {
      posture = "sitting";
      shaping = "chubby";
    } else if (sil === "SITTING_UPRIGHT_WIDE_HIP") {
      posture = "sitting";
    } else if (sil === "STANDING_QUADRUPED") {
      posture = "quadruped";
    } else if (sil === "SLENDER_PEAR_NECK_TUBE") {
      posture = request.animalSpecies === "deer" ? "dangling" : "quadruped";
    }

    return {
      patternRequest: request,
      facialConstructionStyle: request.facialConstructionStyle,
      assemblyStyle:
        limb === "NO_SEW_JOIN_AS_YOU_GO" ? "jayg" : "sew",
      limbAttachmentStyle: limb,
      bodySilhouette: sil,
      posture: posture,
      shaping: shaping,
      yarnProfileHint: {
        weightClass: request.yarnMetric.weightClass,
        materialType: request.yarnMetric.materialType,
        hookSizeMm: request.yarnMetric.hookSizeMm,
        yarnWeight: yarnWeightFromClass(request.yarnMetric.weightClass),
        yarnType: yarnTypeLabelFromMaterial(request.yarnMetric.materialType),
      },
    };
  }

  function toPromptBlock(request) {
    const clean = {
      animalSpecies: request.animalSpecies,
      targetHeightInches: request.targetHeightInches,
      yarnMetric: request.yarnMetric,
      facialConstructionStyle: request.facialConstructionStyle,
      limbAttachmentStyle: request.limbAttachmentStyle,
      bodySilhouette: request.bodySilhouette,
    };
    return (
      "## Pattern request (locked JSON)\n\n" +
      "```json\n" +
      JSON.stringify(clean, null, 2) +
      "\n```\n"
    );
  }

  global.AmigurumiPatternRequest = {
    SCHEMA: SCHEMA,
    buildFromForm: buildFromForm,
    validate: validate,
    toGeneratorOptions: toGeneratorOptions,
    toPromptBlock: toPromptBlock,
    resolveSpecies: resolveSpecies,
    displayNameForSpecies: displayNameForSpecies,
    yarnWeightFromClass: yarnWeightFromClass,
    yarnTypeLabelFromMaterial: yarnTypeLabelFromMaterial,
  };
})(window);
