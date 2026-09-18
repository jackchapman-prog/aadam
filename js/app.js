(function () {
  const shapes = window.AmigurumiShapes;
  const generator = window.AmigurumiGenerator;

  const form = document.getElementById("pattern-form");
  const animalNameInput = document.getElementById("animal-name");
  const animalBlurb = document.getElementById("animal-blurb");
  const heightInput = document.getElementById("total-height");
  const quickPicks = document.getElementById("quick-picks");
  const output = document.getElementById("output");
  const outputTitle = document.getElementById("output-title");
  const patternText = document.getElementById("pattern-text");
  const copyBtn = document.getElementById("copy-btn");
  const refPhoto = document.getElementById("ref-photo");
  const refPreview = document.getElementById("ref-preview");
  const refImage = document.getElementById("ref-image");
  const refClear = document.getElementById("ref-clear");
  const refStatus = document.getElementById("ref-status");
  const refCanvas = document.getElementById("ref-canvas");
  const openaiKeyInput = document.getElementById("openai-api-key");
  const imageProviderSelect = document.getElementById("image-provider");
  const openaiKeyRow = document.getElementById("openai-key-row");
  const genImageBtn = document.getElementById("gen-image-btn");
  const clearApiKeyBtn = document.getElementById("clear-api-key-btn");
  const imageGenStatus = document.getElementById("image-gen-status");
  const aiImageWrap = document.getElementById("ai-image-wrap");
  const aiImage = document.getElementById("ai-image");
  const patternPreviewCanvas = document.getElementById("pattern-preview-canvas");
  const otter3dHost = document.getElementById("otter-3d-host");
  const aiImagePrompt = document.getElementById("ai-image-prompt");

  let photoMetrics = null;

  const yarnWeightLabels = {
    lace: "0 – Lace",
    "super-fine": "1 – Super Fine",
    fine: "2 – Fine",
    light: "3 – Light / DK",
    medium: "4 – Medium / Worsted",
    bulky: "5 – Bulky",
    "super-bulky": "6 – Super Bulky",
    jumbo: "7 – Jumbo",
  };

  // Typical tight amigurumi gauges (smaller hook than garment knitting).
  // Changing yarn weight updates SPI/RPI so stitch math actually changes.
  const yarnGaugeDefaults = {
    lace: { spi: 9, rpi: 9.5, hook: "B-1 (2.25 mm)" },
    "super-fine": { spi: 7.5, rpi: 8, hook: "C-2 (2.75 mm)" },
    fine: { spi: 6.5, rpi: 7, hook: "D-3 (3.25 mm)" },
    light: { spi: 5.5, rpi: 6, hook: "E-4 (3.5 mm)" },
    medium: { spi: 5, rpi: 5.5, hook: "E-4 (3.5 mm)" },
    bulky: { spi: 4, rpi: 4.5, hook: "G-6 (4.0 mm)" },
    "super-bulky": { spi: 3, rpi: 3.5, hook: "J-10 (6.0 mm)" },
    jumbo: { spi: 2.25, rpi: 2.5, hook: "L-11 (8.0 mm)" },
  };

  const spiInput = document.getElementById("spi");
  const rpiInput = document.getElementById("rpi");
  const yarnWeightSelect = document.getElementById("yarn-weight");
  const yarnTypeSelect = document.getElementById("yarn-type");
  const hookSelect = document.getElementById("hook-size");

  let regenTimer = null;
  let applyingYarnDefaults = false;

  function currentHeight() {
    const height = Number(heightInput.value);
    if (!(height > 0)) return 10;
    return Math.min(24, Math.max(3, height));
  }

  function readPatternRequest() {
    const PR = window.AmigurumiPatternRequest;
    if (!PR) return null;
    return PR.buildFromForm({
      animalName: animalNameInput.value,
      targetHeightInches: currentHeight(),
      yarnWeight: yarnWeightSelect.value,
      yarnType: yarnTypeSelect.value,
      hookSize: hookSelect.value,
      facialConstructionStyle: document.getElementById("facial-construction")
        .value,
      limbAttachmentStyle: document.getElementById("limb-attachment").value,
      bodySilhouette: (function () {
        const v = document.getElementById("body-silhouette").value;
        return v === "auto" ? null : v;
      })(),
    });
  }

  function previewRecipe() {
    const name = animalNameInput.value.trim();
    if (!name) {
      animalBlurb.textContent = "Type an animal name to preview the body plan.";
      return null;
    }
    try {
      const PR = window.AmigurumiPatternRequest;
      const req = readPatternRequest();
      const reqOpts = req && PR ? PR.toGeneratorOptions(req) : {};
      const animal = generator.generateAnimal(
        (req && req._customAnimalName) || name,
        (req && req.targetHeightInches) || currentHeight(),
        {
          photoMetrics: photoMetrics,
          posture: reqOpts.posture || "auto",
          shaping: reqOpts.shaping || "auto",
          assemblyStyle: reqOpts.assemblyStyle || "jayg",
          facialConstructionStyle: reqOpts.facialConstructionStyle || "auto",
          bodySilhouette: reqOpts.bodySilhouette || null,
          limbAttachmentStyle: reqOpts.limbAttachmentStyle || null,
          patternRequest: req,
        }
      );
      const featureList = Object.keys(animal.features)
        .filter(function (key) {
          return animal.features[key];
        })
        .join(", ");
      let blurb =
        animal.description +
        " Body plan: " +
        animal.plan +
        (featureList ? ". Features: " + featureList + "." : ".");
      if (req) {
        blurb +=
          " Request: " +
          req.animalSpecies +
          " / " +
          req.bodySilhouette +
          " / " +
          req.facialConstructionStyle +
          ".";
      }
      if (photoMetrics && photoMetrics.applied) {
        blurb += " Photo proportions: " + photoMetrics.posture + ".";
      }
      animalBlurb.textContent = blurb;
      highlightQuickPick(name);
      return animal;
    } catch (err) {
      animalBlurb.textContent = err.message;
      return null;
    }
  }

  function setRefStatus(text, isError) {
    if (!refStatus) return;
    refStatus.textContent = text;
    refStatus.hidden = !text;
    refStatus.classList.toggle("is-error", !!isError);
  }

  function highlightQuickPick(name) {
    const chips = quickPicks.querySelectorAll(".chip");
    const lower = name.trim().toLowerCase();
    for (let i = 0; i < chips.length; i += 1) {
      const chipName = chips[i].getAttribute("data-name").toLowerCase();
      chips[i].classList.toggle("is-active", chipName === lower);
    }
  }

  function fillQuickPicks() {
    quickPicks.innerHTML = "";
    generator.quickPicks.forEach(function (name) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = name;
      btn.setAttribute("data-name", name);
      btn.addEventListener("click", function () {
        animalNameInput.value = name;
        previewRecipe();
        try {
          showPattern();
        } catch (err) {
          alert(err.message || "Could not generate pattern.");
        }
      });
      quickPicks.appendChild(btn);
    });
  }

  function readGauge() {
    const spi = Number(document.getElementById("spi").value);
    const rpi = Number(document.getElementById("rpi").value);
    if (!(spi > 0) || !(rpi > 0)) {
      throw new Error("Gauge must be greater than zero.");
    }
    return { spi: spi, rpi: rpi };
  }

  /**
   * Polish piece lines to designer write-up quality:
   * strip notebook sketches, use "1." not "R1:", group consecutive even rounds.
   */
  function polishPieceLines(rawLines) {
    const cleaned = [];
    for (let i = 0; i < rawLines.length; i += 1) {
      const line = rawLines[i];
      if (!line && line !== "") continue;
      if (line.indexOf("Notebook sketch") !== -1) continue;
      if (/^\s*Math:/.test(line)) continue;
      if (/^\s*Schedule:/.test(line)) continue;
      if (/^\s*Note:/.test(line)) continue;
      if (/^📐/.test(line)) continue;
      let out = line.replace(/^###\s+/, "");
      out = out.replace(/^R(\d+)\s*:\s*/i, "$1. ");
      out = out.replace(/^R(\d+)\s+/i, "$1. ");
      cleaned.push(out);
    }

    // Group consecutive "N. Sc around. (X)" / "N. sc around (X)"
    const evenRe =
      /^(\d+)\.\s*Sc around\.?\s*\((\d+)\)\s*$/i;
    const evenRe2 = /^(\d+)\.\s*sc around\s*\((\d+)\)\s*$/i;
    const grouped = [];
    let i = 0;
    while (i < cleaned.length) {
      const m = cleaned[i].match(evenRe) || cleaned[i].match(evenRe2);
      if (!m) {
        grouped.push(cleaned[i]);
        i += 1;
        continue;
      }
      const start = parseInt(m[1], 10);
      const sts = m[2];
      let end = start;
      let j = i + 1;
      while (j < cleaned.length) {
        const m2 = cleaned[j].match(evenRe) || cleaned[j].match(evenRe2);
        if (!m2 || m2[2] !== sts || parseInt(m2[1], 10) !== end + 1) break;
        end = parseInt(m2[1], 10);
        j += 1;
      }
      const count = end - start + 1;
      if (count >= 2) {
        grouped.push(
          start +
            "-" +
            end +
            ". sc around (" +
            count +
            " rounds) (" +
            sts +
            ")"
        );
      } else {
        grouped.push(start + ". sc around (" + sts + ")");
      }
      i = j;
    }
    return grouped;
  }

  function buildPart(part, gauge, limbFolds, limbFinals) {
    limbFolds = limbFolds || {};
    limbFinals = limbFinals || {};
    const foldOpts = {
      heightIn: part.heightIn,
      maxStitchCap: part.maxStitchCap,
      minBellyEven: part.minBellyEven,
      kayaSizeScale: part.kayaSizeScale,
      preferCh2Start: part.preferCh2Start,
      legFoldSts: limbFolds.leg || limbFolds.hindleg || limbFolds.foot,
      armFoldSts: limbFolds.arm || limbFolds.foreleg,
      footFoldSts: limbFolds.foot || limbFolds.feet || limbFolds.leg,
      limbFinalSts:
        limbFinals.leg ||
        limbFinals.hindleg ||
        limbFinals.foot ||
        null,
      legJoinSts:
        limbFinals.leg ||
        limbFinals.hindleg ||
        limbFinals.foot ||
        null,
      chainBridge: 2,
    };
    let pattern;
    if (part.shape === "sphere") {
      pattern = shapes.buildSpherePattern(part.label, part.diameterIn, gauge);
    } else if (part.shape === "dome") {
      pattern = shapes.buildDomePattern(part.label, part.diameterIn, gauge);
    } else if (part.shape === "cylinder") {
      pattern = shapes.buildCylinderPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "elongated") {
      pattern = shapes.buildElongatedBodyPattern(
        part.label,
        part.lengthIn,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "body-neck") {
      pattern = shapes.buildBodyWithNeckPattern(
        part.label,
        part.lengthIn,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "head-from-nose") {
      pattern = shapes.buildHeadFromNosePattern(
        part.label,
        part.diameterIn,
        part.lengthIn,
        gauge
      );
    } else if (part.shape === "bird-head-body") {
      pattern = shapes.buildBirdHeadBodyPattern(
        part.label,
        part.lengthIn,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "cone") {
      pattern = shapes.buildConePattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "kaya-cat-ear") {
      pattern = shapes.buildKayaCatEarPattern(
        part.label,
        part.diameterIn,
        gauge,
        { kayaSizeScale: part.kayaSizeScale }
      );
    } else if (part.shape === "kaya-cat-leg") {
      pattern = shapes.buildKayaCatLegPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge,
        { kayaSizeScale: part.kayaSizeScale }
      );
    } else if (part.shape === "kaya-cat-arm") {
      pattern = shapes.buildKayaCatArmPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge,
        { kayaSizeScale: part.kayaSizeScale }
      );
    } else if (part.shape === "kaya-cat-tail") {
      pattern = shapes.buildKayaCatTailPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge,
        { kayaSizeScale: part.kayaSizeScale }
      );
    } else if (part.shape === "kaya-cat-body") {
      pattern = shapes.buildKayaCatBodyPattern(
        part.label,
        part.diameterIn,
        gauge,
        {
          heightIn: part.heightIn,
          kayaSizeScale: part.kayaSizeScale,
          minBellyEven: part.minBellyEven || 3,
          maxStitchCap: part.maxStitchCap,
          legFoldSts: foldOpts.legFoldSts,
          armFoldSts: foldOpts.armFoldSts,
        }
      );
    } else if (part.shape === "kaya-cat-head") {
      pattern = shapes.buildKayaCatHeadPattern(
        part.label,
        part.diameterIn,
        gauge,
        {
          kayaSizeScale: part.kayaSizeScale,
          maxStitchCap: part.maxStitchCap,
          preferCh2Start: part.preferCh2Start,
        }
      );
    } else if (part.shape === "marty-teddy-head") {
      pattern = shapes.buildMartyTeddyHeadPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "marty-teddy-snout") {
      pattern = shapes.buildMartyTeddySnoutPattern(
        part.label,
        part.lengthIn || part.diameterIn * 0.5,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "marty-teddy-ear") {
      pattern = shapes.buildMartyTeddyEarPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "marty-teddy-body") {
      pattern = shapes.buildMartyTeddyBodyPattern(
        part.label,
        part.diameterIn,
        gauge,
        {
          heightIn: part.heightIn || part.diameterIn * 0.8,
          legFoldSts: foldOpts.legFoldSts,
          armFoldSts: foldOpts.armFoldSts,
          maxStitchCap: part.maxStitchCap,
        }
      );
    } else if (part.shape === "flat-ear") {
      pattern = shapes.buildFlatEarPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "sitting-leg") {
      pattern = shapes.buildSittingLegPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "round-foot-leg") {
      pattern = shapes.buildRoundFootLegPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "sitting-arm") {
      pattern = shapes.buildSittingArmPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "sitting-body-jayg") {
      pattern = shapes.buildSittingBodyJAYGPattern(
        part.label,
        part.diameterIn,
        gauge,
        {
          heightIn: part.heightIn || part.diameterIn * 0.75,
          legFoldSts: foldOpts.legFoldSts,
          armFoldSts: foldOpts.armFoldSts,
          maxStitchCap: part.maxStitchCap,
        }
      );
    } else if (part.shape === "sculpted-head") {
      pattern = shapes.buildSculptedHeadPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "thin-tail") {
      pattern = shapes.buildThinTailPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "pear-body") {
      pattern = shapes.buildPearBodyPattern(
        part.label,
        part.heightIn,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "chibi-deer-head") {
      pattern = shapes.buildChibiDeerHeadPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "unicorn-head") {
      pattern = shapes.buildUnicornHeadPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "horn") {
      pattern = shapes.buildHornPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "spiral-lock") {
      pattern = shapes.buildSpiralLockPattern(
        part.label,
        part.lengthIn || part.heightIn,
        part.scPerChain || 2,
        gauge
      );
    } else if (part.shape === "sitting-body-jointed") {
      pattern = shapes.buildSittingBodyJointedPattern(
        part.label,
        part.diameterIn,
        gauge,
        { heightIn: part.heightIn || part.diameterIn * 0.8 }
      );
    } else if (part.shape === "hippo-head") {
      pattern = shapes.buildHippoHeadPattern(
        part.label,
        part.diameterIn,
        part.lengthIn || part.diameterIn * 0.4,
        gauge
      );
    } else if (part.shape === "harry-hippo-ear") {
      pattern = shapes.buildHarryHippoEarPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "harry-hippo-arm") {
      pattern = shapes.buildHarryHippoArmPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "harry-hippo-leg") {
      pattern = shapes.buildHarryHippoLegPattern(
        part.label,
        part.diameterIn,
        part.heightIn,
        gauge
      );
    } else if (part.shape === "harry-hippo-body") {
      pattern = shapes.buildHarryHippoBodyPattern(
        part.label,
        part.diameterIn,
        gauge,
        {
          heightIn: part.heightIn || part.diameterIn * 0.85,
          armFoldSts: foldOpts.armFoldSts,
          limbFinalSts: foldOpts.limbFinalSts,
          legJoinSts: foldOpts.legJoinSts,
          chainBridge: foldOpts.chainBridge,
          maxStitchCap: part.maxStitchCap,
        }
      );
    } else if (part.shape === "chain-tail") {
      pattern = shapes.buildChainTailPattern(
        part.label,
        part.lengthIn || part.heightIn || 0.5,
        gauge
      );
    } else if (part.shape === "chinchilla-body-head") {
      pattern = shapes.buildChinchillaBodyHeadPattern(
        part.label,
        part.diameterIn,
        part.headDiameterIn || part.diameterIn * 1.15,
        part.heightIn || part.diameterIn * 2,
        gauge,
        {
          footFoldSts: foldOpts.footFoldSts || foldOpts.legFoldSts,
          armFoldSts: foldOpts.armFoldSts,
        }
      );
    } else if (part.shape === "chinchilla-ear") {
      pattern = shapes.buildChinchillaEarPattern(
        part.label,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "fur-tail") {
      pattern = shapes.buildFurTailPattern(
        part.label,
        part.diameterIn,
        part.heightIn || part.lengthIn || 1,
        gauge
      );
    } else if (part.shape === "snout") {
      pattern = shapes.buildSnoutPattern(
        part.label,
        part.lengthIn,
        part.diameterIn,
        gauge
      );
    } else if (part.shape === "otter-head") {
      pattern = shapes.buildOtterHeadPattern(
        part.label,
        part.diameterIn,
        gauge,
        { maxStitchCap: part.maxStitchCap }
      );
    } else if (part.shape === "otter-continuous-head") {
      pattern = shapes.buildOtterContinuousHeadPattern(
        part.label,
        part.diameterIn,
        gauge,
        { maxStitchCap: part.maxStitchCap }
      );
    } else if (part.shape === "otter-muzzle") {
      pattern = shapes.buildOtterMuzzlePattern(part.label, gauge, {
        chLen: part.chLen || part.targetR1 || 10,
        targetR1: part.targetR1 || 10,
      });
    } else if (part.shape === "otter-arm") {
      pattern = shapes.buildOtterNarrowArmPattern(
        part.label,
        part.heightIn || 1.4,
        gauge
      );
    } else if (part.shape === "otter-paddle-foot") {
      pattern = shapes.buildOtterPaddleFootPattern(part.label, gauge, {
        chLen: part.chLen || 7,
        targetR1: part.targetR1 || 14,
        maxRounds: part.maxRounds || 7,
      });
    } else if (part.shape === "otter-tail") {
      pattern = shapes.buildOtterThickTailPattern(
        part.label,
        part.heightIn || part.lengthIn || 2.5,
        gauge,
        {
          bodyDiameterIn: part.bodyDiameterIn,
          bodyMaxStitches: part.bodyMaxStitches,
        }
      );
    } else if (part.shape === "otter-body") {
      pattern = shapes.buildOtterBodyPattern(
        part.label,
        part.diameterIn,
        part.heightIn || part.diameterIn,
        gauge,
        { maxStitchCap: part.maxStitchCap }
      );
    } else {
      throw new Error("Unknown shape: " + part.shape);
    }

    const count = part.count || 1;
    // Designer pieces already include "(make 2)" in the title
    if (count > 1 && !(pattern.designer || (pattern.lines[0] || "").indexOf("make") !== -1)) {
      pattern.lines.unshift("Make " + count + ".");
      pattern.lines.unshift("");
    }
    if (part.finishNotes && part.finishNotes.length) {
      pattern.lines.push("Finishing for this piece:");
      for (let n = 0; n < part.finishNotes.length; n += 1) {
        pattern.lines.push("- " + part.finishNotes[n]);
      }
      pattern.lines.push("");
    }
    pattern.lines = polishPieceLines(pattern.lines);
    return pattern;
  }

  function appendHeightStack(lines, animal) {
    if (!animal.heightStack || !animal.heightStack.length) return;
    lines.push('## How the height is built');
    lines.push("");
    let total = 0;
    for (let i = 0; i < animal.heightStack.length; i += 1) {
      const row = animal.heightStack[i];
      total += row.inches;
      const sign = row.inches < 0 ? "" : "+";
      lines.push(
        "- " + row.label + ": " + sign + row.inches.toFixed(2) + '"'
      );
    }
    lines.push("- Total: ~" + total.toFixed(2) + '"');
    lines.push("");
  }

  function featureSummary(animal) {
    const keys = Object.keys(animal.features).filter(function (key) {
      return animal.features[key];
    });
    if (!keys.length) return "standard " + animal.plan + " build";
    return keys.join(", ");
  }

  function generateDesignerPatternText(
    animal,
    gauge,
    height,
    yarnWeight,
    yarnType,
    hookSize
  ) {
    const lines = [];
    const sizeWord = animal.plan === "fish" ? "long" : "tall";

    lines.push("# " + animal.name + " Crochet Pattern");
    lines.push("");
    lines.push("## Skills required");
    lines.push(
      "Crocheting in spiral, magic ring, chain, slip stitch, single crochet, increasing and decreasing."
    );
    lines.push("");
    lines.push("## Notes");
    lines.push(
      "- Work in a spiral; do not join rounds or turn your work unless the pattern says so."
    );
    lines.push(
      "- Use a stitch marker (or contrasting yarn) to mark the beginning of each round; move it up every round."
    );
    lines.push(
      "- Invisible decreases and a tight fabric (hook 1 size smaller if needed) give a clean finish."
    );
    if (animal.artistNotes && animal.artistNotes.length) {
      for (let i = 0; i < animal.artistNotes.length; i += 1) {
        lines.push("- " + animal.artistNotes[i]);
      }
    }
    lines.push("");
    lines.push("## Difficulty");
    lines.push("Advanced beginner / Intermediate");
    lines.push("");
    lines.push("## Finished size");
    lines.push(
      "About " +
        height.toFixed(1) +
        " inches " +
        sizeWord +
        " at your gauge (" +
        gauge.spi +
        " spi / " +
        gauge.rpi +
        " rpi). Size changes if you change yarn or tension."
    );
    lines.push("");
    lines.push("## Materials");
    lines.push(
      "- Yarn: " +
        (yarnWeightLabels[yarnWeight] || yarnWeight) +
        " — " +
        yarnType +
        " (main color)"
    );
    lines.push(
      "- Leftover yarn in white, pink, and black or dark grey (eyes / cheeks / brows / teeth as needed)"
    );
    lines.push("- Hook: " + hookSize + " (or size that matches your gauge)");
    lines.push("- Safety eyes (size to suit your yarn — larger for chenille)");
    lines.push("- Safety nose (optional) or embroidered nose");
    lines.push("- Polyester fiberfill");
    lines.push("- Yarn needle, scissors, stitch marker");
    lines.push("");
    lines.push("## Gauge (your swatch)");
    lines.push("- " + gauge.spi + " stitches per inch");
    lines.push("- " + gauge.rpi + " rounds per inch");
    lines.push(
      "- Edit SPI/RPI anytime to match a real swatch; stitch counts below follow your numbers."
    );
    lines.push("");
    lines.push("## Abbreviations");
    lines.push("- ch = chain");
    lines.push("- sc = single crochet");
    lines.push("- inc = increase (2 sc in the same stitch)");
    lines.push("- dec = invisible decrease (prefer) or sc2tog");
    lines.push("- BLO = back loops only");
    lines.push("- sl st = slip stitch");
    lines.push("- mr = magic ring");
    lines.push("- st(s) = stitch(es)");
    lines.push("- (36) = number of stitches at the end of the round");
    lines.push("");
    lines.push("## Tips");
    lines.push(
      "- Invisible decrease: insert under the front loop of the next 2 stitches, yarn over, pull through, finish the sc."
    );
    lines.push(
      "- Closing an opening: weave through front loops around, pull tight, hide the tail."
    );
    lines.push(
      "- Crochet both sides together: flatten the piece and sc through both layers."
    );
    lines.push("");
    lines.push("Let's start!");
    lines.push("");

    const limbFolds = {};
    const limbFinals = {};
    for (let i = 0; i < animal.parts.length; i += 1) {
      const built = buildPart(animal.parts[i], gauge, limbFolds, limbFinals);
      if (built.foldStitches != null && animal.parts[i].key) {
        limbFolds[animal.parts[i].key] = built.foldStitches;
      }
      if (built.joinStitches != null && animal.parts[i].key) {
        limbFinals[animal.parts[i].key] = built.joinStitches;
      } else if (
        built.lastTubeStitches != null &&
        animal.parts[i].key
      ) {
        limbFinals[animal.parts[i].key] = built.lastTubeStitches;
      }
      for (let j = 0; j < built.lines.length; j += 1) {
        const line = built.lines[j];
        if (line.indexOf("Notebook sketch") !== -1) continue;
        if (/^\s*Math:/.test(line)) continue;
        if (/^\s*Schedule:/.test(line)) continue;
        if (/^\s*Note:/.test(line)) continue;
        lines.push(line);
      }
      if (
        built.lines.length &&
        built.lines[built.lines.length - 1] !== ""
      ) {
        lines.push("");
      }
    }

    lines.push("## Assembly");
    lines.push("");
    for (let i = 0; i < animal.assembly.length; i += 1) {
      lines.push(i + 1 + ". " + animal.assembly[i]);
    }
    lines.push("");
    lines.push("Congratulations!");
    lines.push("");

    return {
      title: animal.name + " pattern (" + height.toFixed(1) + '")',
      text: lines.join("\n"),
      animal: animal,
    };
  }

  function generatePatternText() {
    const gauge = readGauge();
    const yarnWeight = yarnWeightSelect.value;
    const yarnType = yarnTypeSelect.value || "yarn";
    const hookSize = hookSelect.value;

    const PR = window.AmigurumiPatternRequest;
    const patternRequest = readPatternRequest();

    if (patternRequest && PR) {
      const check = PR.validate(patternRequest);
      if (!check.ok) {
        throw new Error(
          "Pattern request invalid: " + (check.issues || []).join("; ")
        );
      }
    }

    const reqOpts =
      patternRequest && PR ? PR.toGeneratorOptions(patternRequest) : {};
    const height =
      (patternRequest && patternRequest.targetHeightInches) || currentHeight();

    const yarnProfile =
      window.AmigurumiPatternMath &&
      window.AmigurumiPatternMath.yarnScaleProfile
        ? window.AmigurumiPatternMath.yarnScaleProfile(
            (reqOpts.yarnProfileHint && reqOpts.yarnProfileHint.yarnWeight) ||
              yarnWeight,
            (reqOpts.yarnProfileHint && reqOpts.yarnProfileHint.yarnType) ||
              yarnType,
            height
          )
        : null;

    const animalName =
      (patternRequest && patternRequest._customAnimalName) ||
      animalNameInput.value;

    const animal = generator.generateAnimal(animalName, height, {
      photoMetrics: photoMetrics,
      posture: reqOpts.posture || "auto",
      shaping: reqOpts.shaping || "auto",
      assemblyStyle: reqOpts.assemblyStyle || "jayg",
      facialConstructionStyle: reqOpts.facialConstructionStyle || "auto",
      bodySilhouette: reqOpts.bodySilhouette || null,
      limbAttachmentStyle: reqOpts.limbAttachmentStyle || null,
      patternRequest: patternRequest,
      yarnProfile: yarnProfile,
    });

    const result = generateDesignerPatternText(
      animal,
      gauge,
      height,
      yarnWeight,
      yarnType,
      hookSize
    );

    // Lock request JSON at the top so generation rules match the form exactly
    if (patternRequest && PR) {
      result.text = PR.toPromptBlock(patternRequest) + "\n" + result.text;
      result.patternRequest = patternRequest;
    }

    // Math compiler: Rule D enforce, then Rule D + Rule A audit
    if (window.AmigurumiPatternMath) {
      if (window.AmigurumiPatternMath.enforceRowStepValidation) {
        const enforced = window.AmigurumiPatternMath.enforceRowStepValidation(
          result.text
        );
        result.text = enforced.text;
        result.rowStepFixes = enforced.fixes;
      }
      const audit = window.AmigurumiPatternMath.auditPatternText
        ? window.AmigurumiPatternMath.auditPatternText(result.text)
        : { ok: true, issues: [] };
      const foldAudit = window.AmigurumiPatternMath.auditFlatFoldClosures
        ? window.AmigurumiPatternMath.auditFlatFoldClosures(result.text)
        : { ok: true, issues: [] };
      const maskAudit = window.AmigurumiPatternMath.auditTapestryMaskVerticality
        ? window.AmigurumiPatternMath.auditTapestryMaskVerticality(result.text)
        : { ok: true, issues: [] };
      const issues = (audit.issues || [])
        .concat(foldAudit.issues || [])
        .concat(maskAudit.issues || []);
      const combined = { ok: issues.length === 0, issues: issues };
      if (!combined.ok && issues.length) {
        const note = [
          "",
          "## Math compiler notes",
          "",
          "Auto-check found " +
            issues.length +
            " round(s) that need a closer look (complex face/join rounds are often fine):",
          "",
        ];
        const maxShow = Math.min(5, issues.length);
        for (let i = 0; i < maxShow; i += 1) {
          note.push("- Line " + issues[i].line + ": " + issues[i].message);
        }
        if (issues.length > maxShow) {
          note.push("- …and " + (issues.length - maxShow) + " more.");
        }
        note.push("");
        result.text = result.text + note.join("\n");
        result.mathAudit = combined;
      } else {
        result.mathAudit = combined;
      }
    }

    if (yarnProfile && yarnProfile.preferCh2Start) {
      result.text = result.text.replace(
        "## Tips\n",
        "## Tips\n- Chenille/velvet: if magic rings snap, start pieces with ch 2 and work the same stitch count into the 2nd chain from the hook instead.\n"
      );
    }

    return result;
  }

  function showPattern() {
    const result = generatePatternText();
    outputTitle.textContent = result.title;
    patternText.textContent = result.text;
    output.hidden = false;
    animalBlurb.textContent =
      result.animal.description +
      " Body plan: " +
      result.animal.plan +
      ".";
    highlightQuickPick(result.animal.name);
  }

  function scheduleRegen() {
    if (applyingYarnDefaults) return;
    clearTimeout(regenTimer);
    regenTimer = setTimeout(function () {
      previewRecipe();
      if (!animalNameInput.value.trim()) return;
      try {
        showPattern();
      } catch (err) {
        // Keep prior output if inputs are temporarily invalid
      }
    }, 200);
  }

  function applyYarnWeightDefaults() {
    const weight = yarnWeightSelect.value;
    const defaults = yarnGaugeDefaults[weight];
    if (!defaults) return;
    applyingYarnDefaults = true;
    spiInput.value = defaults.spi;
    rpiInput.value = defaults.rpi;
    // Set hook if that option exists
    const hookOptions = hookSelect.options;
    for (let i = 0; i < hookOptions.length; i += 1) {
      if (hookOptions[i].value === defaults.hook) {
        hookSelect.value = defaults.hook;
        break;
      }
    }
    applyingYarnDefaults = false;
    scheduleRegen();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      showPattern();
      output.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      alert(err.message || "Could not generate pattern.");
    }
  });

  animalNameInput.addEventListener("input", scheduleRegen);
  heightInput.addEventListener("input", scheduleRegen);
  spiInput.addEventListener("input", scheduleRegen);
  rpiInput.addEventListener("input", scheduleRegen);
  yarnTypeSelect.addEventListener("change", scheduleRegen);
  hookSelect.addEventListener("change", scheduleRegen);
  document.getElementById("body-silhouette").addEventListener("change", scheduleRegen);
  document.getElementById("limb-attachment").addEventListener("change", scheduleRegen);
  document
    .getElementById("facial-construction")
    .addEventListener("change", scheduleRegen);
  yarnWeightSelect.addEventListener("change", function () {
    applyYarnWeightDefaults();
  });

  refPhoto.addEventListener("change", function () {
    const file = refPhoto.files && refPhoto.files[0];
    photoMetrics = null;
    if (refCanvas) {
      refCanvas.hidden = true;
    }
    if (!file) {
      refPreview.hidden = true;
      refImage.removeAttribute("src");
      setRefStatus("");
      return;
    }

    const url = URL.createObjectURL(file);
    refPreview.hidden = false;
    setRefStatus("Analyzing photo for animal + proportions…");

    refImage.onload = async function () {
      URL.revokeObjectURL(url);
      try {
        if (!window.AmigurumiPhoto) {
          throw new Error("Photo analysis module missing.");
        }
        const metrics = await window.AmigurumiPhoto.analyzePhoto(refImage);
        photoMetrics = metrics;
        setRefStatus(metrics.reason, !metrics.applied);

        if (metrics.applied) {
          animalNameInput.value = metrics.animalName;
          window.AmigurumiPhoto.drawBBoxOverlay(refImage, refCanvas, metrics);
          previewRecipe();
          showPattern();
        } else {
          if (refCanvas) refCanvas.hidden = true;
          previewRecipe();
        }
      } catch (err) {
        photoMetrics = {
          applied: false,
          reason:
            (err && err.message) ||
            "Photo analysis failed. Math unchanged; photo is visual only.",
        };
        setRefStatus(photoMetrics.reason, true);
      }
    };
    refImage.src = url;
  });

  refClear.addEventListener("click", function () {
    refPhoto.value = "";
    refImage.removeAttribute("src");
    refPreview.hidden = true;
    photoMetrics = null;
    if (refCanvas) refCanvas.hidden = true;
    setRefStatus("");
    previewRecipe();
  });

  function setImageGenStatus(text, isError) {
    if (!imageGenStatus) return;
    imageGenStatus.textContent = text || "";
    imageGenStatus.hidden = !text;
    imageGenStatus.classList.toggle("is-error", !!isError);
  }

  function syncImageProviderUi() {
    if (!imageProviderSelect) return;
    const provider = imageProviderSelect.value || "3d";
    if (window.AmigurumiImageGen && window.AmigurumiImageGen.setProvider) {
      if (provider === "free" || provider === "openai") {
        window.AmigurumiImageGen.setProvider(provider);
      }
    }
    if (openaiKeyRow) openaiKeyRow.hidden = provider !== "openai";
    if (genImageBtn) {
      if (provider === "3d") genImageBtn.textContent = "Show 3D otter";
      else if (provider === "pattern")
        genImageBtn.textContent = "Draw pattern preview";
      else genImageBtn.textContent = "Generate AI preview";
    }
  }

  function waitForOtter3D(timeoutMs) {
    return new Promise(function (resolve, reject) {
      const start = Date.now();
      function tick() {
        if (window.AmigurumiOtter3D && window.AmigurumiOtter3D.createOtter3DPreview) {
          resolve(window.AmigurumiOtter3D);
          return;
        }
        if (Date.now() - start > (timeoutMs || 4000)) {
          reject(new Error("3D module still loading — try again in a second."));
          return;
        }
        setTimeout(tick, 50);
      }
      tick();
    });
  }

  function initImageGenUi() {
    if (imageProviderSelect) {
      if (!imageProviderSelect.dataset.touched) {
        imageProviderSelect.value = "3d";
      }
      imageProviderSelect.addEventListener("change", function () {
        imageProviderSelect.dataset.touched = "1";
        syncImageProviderUi();
      });
      syncImageProviderUi();
    }

    if (openaiKeyInput && window.AmigurumiImageGen) {
      const savedKey = window.AmigurumiImageGen.getApiKey();
      if (savedKey) openaiKeyInput.value = savedKey;
      openaiKeyInput.addEventListener("change", function () {
        window.AmigurumiImageGen.setApiKey(openaiKeyInput.value);
      });
    }

    if (clearApiKeyBtn && window.AmigurumiImageGen) {
      clearApiKeyBtn.addEventListener("click", function () {
        if (openaiKeyInput) openaiKeyInput.value = "";
        window.AmigurumiImageGen.setApiKey("");
        setImageGenStatus("Saved API key cleared on this device.");
      });
    }

    if (genImageBtn) {
      genImageBtn.addEventListener("click", async function () {
        const req = readPatternRequest();
        if (!req) {
          setImageGenStatus("Could not build pattern request from the form.", true);
          return;
        }
        const provider = imageProviderSelect
          ? imageProviderSelect.value
          : "3d";

        genImageBtn.disabled = true;

        try {
          let animal = null;
          try {
            const resultPack = generatePatternText();
            animal = resultPack && resultPack.animal ? resultPack.animal : null;
            if (resultPack && resultPack.text) {
              patternText.textContent = resultPack.text;
              output.hidden = false;
              outputTitle.textContent = resultPack.title || "Pattern";
            }
          } catch (errGen) {
            animal = null;
          }

          if (provider === "3d") {
            setImageGenStatus("Building 3D otter from your pattern settings…");
            const Otter3D = await waitForOtter3D(5000);
            if (patternPreviewCanvas) patternPreviewCanvas.hidden = true;
            if (aiImage) aiImage.hidden = true;
            if (otter3dHost) otter3dHost.hidden = false;
            if (aiImageWrap) aiImageWrap.hidden = false;
            const gauge = readGauge();
            Otter3D.createOtter3DPreview(otter3dHost, {
              animal: animal,
              patternRequest: req,
              gauge: gauge,
              facialConstructionStyle: req.facialConstructionStyle,
              bodySilhouette: req.bodySilhouette,
              animalSpecies: req.animalSpecies,
            });
            if (aiImagePrompt) {
              const h =
                (animal && animal.designedHeightIn) ||
                req.targetHeightInches ||
                "?";
              aiImagePrompt.textContent =
                "3D from pattern recipe: " +
                (req.animalSpecies || "otter") +
                " · " +
                h +
                '" · SPI ' +
                gauge.spi +
                " · " +
                req.facialConstructionStyle +
                " · drag to orbit";
            }
            setImageGenStatus(
              animal
                ? "3D otter sized from your pattern parts (head/body/paddles/tail inches + stitch caps)."
                : "3D otter shown with fallback sizes — generate a pattern first for recipe accuracy."
            );
          } else if (provider === "pattern") {
            setImageGenStatus("Drawing construction preview from your pattern…");
            if (otter3dHost && otter3dHost._otter3d) {
              otter3dHost._otter3d.dispose();
            }
            if (otter3dHost) otter3dHost.hidden = true;
            if (!window.AmigurumiPatternPreview || !patternPreviewCanvas) {
              throw new Error("Pattern preview module missing.");
            }
            window.AmigurumiPatternPreview.renderPatternPreview(
              patternPreviewCanvas,
              req,
              animal
            );
            patternPreviewCanvas.hidden = false;
            if (aiImage) aiImage.hidden = true;
            if (aiImageWrap) aiImageWrap.hidden = false;
            if (aiImagePrompt) {
              aiImagePrompt.textContent =
                "Drawn from your locked recipe: " +
                req.animalSpecies +
                " · " +
                (req.bodySilhouette || "auto") +
                " · " +
                req.facialConstructionStyle;
            }
            setImageGenStatus(
              "Pattern construction preview ready — this is what the app will crochet (not an AI photo)."
            );
          } else {
            if (otter3dHost && otter3dHost._otter3d) {
              otter3dHost._otter3d.dispose();
            }
            if (otter3dHost) otter3dHost.hidden = true;
            if (patternPreviewCanvas) patternPreviewCanvas.hidden = true;
            if (!window.AmigurumiImageGen) {
              throw new Error("Image module missing.");
            }
            window.AmigurumiImageGen.setProvider(provider);
            if (provider === "openai" && openaiKeyInput) {
              window.AmigurumiImageGen.setApiKey(openaiKeyInput.value);
            }
            setImageGenStatus(
              provider === "free"
                ? "AI guess (free) — may not match your pattern…"
                : "AI guess (OpenAI)…"
            );
            const result = await window.AmigurumiImageGen.generatePlushImage({
              patternRequest: req,
              displayName: req._displayName || animalNameInput.value,
              animal: animal,
              description: animal && animal.description,
              blurb: animalBlurb ? animalBlurb.textContent : "",
              provider: provider,
              apiKey: openaiKeyInput ? openaiKeyInput.value : "",
            });
            if (aiImage) {
              aiImage.hidden = false;
              aiImage.src = result.url;
            }
            if (aiImageWrap) aiImageWrap.hidden = false;
            if (aiImagePrompt) {
              aiImagePrompt.textContent =
                "AI guess prompt (not a faithful crochet render): " +
                (result.revisedPrompt || result.prompt);
            }
            setImageGenStatus(
              "AI preview ready — treat as inspiration only; use 3D or 2D pattern preview for accuracy."
            );
          }
        } catch (err) {
          setImageGenStatus(
            (err && err.message) || "Could not create preview.",
            true
          );
        } finally {
          genImageBtn.disabled = false;
        }
      });
    }
  }

  copyBtn.addEventListener("click", function () {
    const text = patternText.textContent;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () {
            copyBtn.textContent = "Copy";
          }, 1200);
        },
        function () {
          alert("Could not copy. Select the pattern text and copy manually.");
        }
      );
    } else {
      alert("Could not copy. Select the pattern text and copy manually.");
    }
  });

  fillQuickPicks();
  initImageGenUi();
  previewRecipe();

  try {
    showPattern();
  } catch (err) {
    // Leave output hidden if defaults are invalid
  }
})();
