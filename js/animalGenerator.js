/**
 * Turns any animal name into an amigurumi "recipe"
 * (body parts + sizes + assembly steps).
 *
 * CROCHET-ARTIST RULES (not "every body part is a separate ball"):
 * - Only split a piece when makers usually sew it on (ears, legs, tail, antlers, wings).
 * - Join what makers usually work continuous:
 *   · Quadrupeds (deer, fox, horse…): Body & neck ONE piece; Head from nose ONE piece.
 *   · Teddy / sitting bear: separate muzzle is OK (classic look); head sewn to body (no neck tube).
 *   · Bunny: embroider nose on head (no sew-on muzzle); long ears sew on.
 *   · Birds: head & body often ONE piece; beak embroidered or tiny tip; wings/legs sew on.
 *   · Fish: one body tube; fins sew on.
 *   · Elephant trunk: truly separate (or worked from face) — keep as its own piece.
 * - Prefer fewer seams when the shape can be worked in one spiral.
 */
(function (global) {
  function titleCase(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map(function (word) {
        if (!word) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  function includesAny(haystack, words) {
    // Match whole words only so "fox" does not match "ox"
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i].toLowerCase();
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp("(?:^|[^a-z0-9])" + escaped + "(?:[^a-z0-9]|$)", "i");
      if (re.test(haystack)) return true;
    }
    return false;
  }

  /**
   * Construction choices a crochet artist would make for this animal.
   * Used by builders + printed in the pattern so the logic is visible.
   */
  function artistConstruction(analysis) {
    const plan = analysis.plan;
    const f = analysis.features;
    const name = analysis.name.toLowerCase();
    const notes = [];

    if (plan === "quadruped") {
      notes.push(
        "Chibi balance like a designer deer: on 10\" tall, head ≈ 4\" (about 40% of height), long legs, short neck — not a 9.5\" head."
      );
      notes.push(
        "Body & neck worked as one piece; sew a finished head onto the neck opening."
      );
      if (f.trunk) {
        notes.push(
          "Trunk is its own piece (elephants need that shape); sew to the face."
        );
      } else {
        notes.push(
          "Head is worked from the nose tip back — no separate sew-on muzzle."
        );
      }
      notes.push(
        "Legs, ears, tail, and antlers/horns (if any) are sew-on pieces."
      );
    } else if (plan === "sitting") {
      notes.push(
        "Sitting plush: round/sculpted head sewn to body — no deer-style neck tube, no long standing stilts."
      );
      if (includesAny(name, ["cat", "kitten", "kitty"]) || (f.sitting && f.thinTail)) {
        notes.push(
          "For cats/kittens: join legs & arms into the body as-you-go; 3D cone ears (Rule C); thin tube tail; face shaping on the head."
        );
      } else if (includesAny(name, ["unicorn"])) {
        notes.push(
          "For unicorns (Molly style): sitting body; hoof-tipped legs/arms (joints or sew); sculpted head; thin horn; spiral mane & tail locks — not a standing horse."
        );
      } else if (includesAny(name, ["hippo", "hippopotamus"])) {
        notes.push(
          "For hippos (Harry style): chain-oval muzzle worked into the head as one piece; legs join into the body with a chain bridge; arms join as-you-go; tiny chain tail."
        );
      } else if (includesAny(name, ["chinchilla"])) {
        notes.push(
          "For chinchillas: head+body one piece (feet up); join feet and bushy fur tail as-you-go; sew small arms; large flat ears with fur edging."
        );
      } else if (includesAny(name, ["bear", "teddy", "panda", "koala"])) {
        notes.push(
          "For teddies: join hind legs & arms into the body as-you-go; folded dome ears; sew-on snout; tiny ball tail; cheek shaping + needle sculpting."
        );
      } else if (
        f.floppyWaterMammal ||
        includesAny(name, ["otter"])
      ) {
        notes.push(
          "For chibi floppy water mammals (otter/beaver/seal): facialConstructionStyle SEPARATE_PATCH (default sphere + sew-on cream oval) or CONTINUOUS_NOSE_FIRST (cream snout R1–7 then clean round-switch to main — no mid-row tapestry). Narrow fold-close arms on the upper chest angled inward; wide flat paddle feet; thick tapered tail as a backrest."
        );
      } else if (f.longEars || includesAny(name, ["bunny", "rabbit", "hare"])) {
        notes.push(
          "Bunny-style: embroider the nose on the head — skip a sew-on muzzle."
        );
      } else {
        notes.push(
          "Teddy-style: a small separate muzzle can be traditional."
        );
      }
      notes.push("Ears and tail finish the sit; limbs may join into the body while crocheting.");
    } else if (plan === "bird") {
      notes.push(
        "Head & body worked as one piece (common for amigurumi birds)."
      );
      notes.push(
        "Beak is embroidered on the face (or a tiny felt triangle) — not a big sew-on snout."
      );
      notes.push("Wings, legs, and tail feathers are sew-on pieces.");
    } else if (plan === "fish") {
      notes.push("One elongated body; fins and tail are sew-on pieces.");
    } else if (plan === "serpent") {
      notes.push("Long body tube with a head on one end — minimal sewing.");
    } else if (plan === "shelled") {
      notes.push("Shell + belly sewn together; head, legs, and tail sew on.");
    } else if (plan === "insect") {
      notes.push("Head and body separate or joined simply; six legs and antennae sew on.");
    } else if (plan === "cephalopod") {
      notes.push("Round mantle; tentacles sew around the bottom opening.");
    } else if (plan === "biped") {
      if (f.antlers || includesAny(name, ["deer", "fawn", "stag", "reindeer"])) {
        notes.push(
          "Dangling chibi deer: oversized round head, pear body, long thin arms + legs that hang — not four stilts under a horizontal torso."
        );
        notes.push(
          "Sew-on cream muzzle; color-block the lower face cream; flat layered ears; branched antlers."
        );
        notes.push(
          "Body is a vertical pear with a short neck stump; sew the finished head on top."
        );
      } else {
        notes.push(
          "Upright build: body can carry a short neck stump; head is separate and finished."
        );
        notes.push("Arms, legs, and tail are sew-on pieces.");
      }
    } else if (plan === "amphibian") {
      notes.push(
        "Round body and head; embroider or bump-on eyes; legs sew on."
      );
    }

    return notes;
  }

  /**
   * Figure out body plan + feature flags from the animal name.
   */
  function analyzeName(rawName) {
    const name = String(rawName || "").trim().toLowerCase();
    const features = {
      antlers: false,
      horns: false,
      trunk: false,
      longNeck: false,
      longEars: false,
      shortSnout: false,
      longSnout: false,
      wings: false,
      beak: false,
      shell: false,
      fins: false,
      tentacles: false,
      mane: false,
      bushyTail: false,
      thinTail: false,
      spikes: false,
      sitting: false,
      biped: false,
      floppyWaterMammal: false,
    };

    let plan = "quadruped"; // default land mammal

    // Body plans (order matters — more specific first)
    if (
      includesAny(name, [
        "snake",
        "serpent",
        "eel",
        "worm",
        "python",
        "cobra",
      ])
    ) {
      plan = "serpent";
    } else if (
      includesAny(name, [
        "fish",
        "shark",
        "whale",
        "dolphin",
        "orca",
        "goldfish",
        "tuna",
        "salmon",
      ])
    ) {
      plan = "fish";
    } else if (
      includesAny(name, [
        "bird",
        "owl",
        "eagle",
        "duck",
        "goose",
        "chicken",
        "rooster",
        "penguin",
        "parrot",
        "flamingo",
        "swan",
        "crow",
        "raven",
        "sparrow",
        "cardinal",
        "toucan",
      ])
    ) {
      plan = "bird";
    } else if (
      includesAny(name, [
        "octopus",
        "squid",
        "jellyfish",
        "cuttlefish",
      ])
    ) {
      plan = "cephalopod";
    } else if (
      includesAny(name, [
        "turtle",
        "tortoise",
        "snail",
      ])
    ) {
      plan = "shelled";
      features.shell = true;
    } else if (
      includesAny(name, [
        "spider",
        "insect",
        "bug",
        "bee",
        "butterfly",
        "ant",
        "ladybug",
        "beetle",
      ])
    ) {
      plan = "insect";
    } else if (
      includesAny(name, [
        "trex",
        "t-rex",
        "tyrannosaurus",
        "raptor",
        "dinosaur",
        "dino",
        "kangaroo",
        "monkey",
        "ape",
        "gorilla",
        "chimp",
        "meerkat",
      ])
    ) {
      plan = "biped";
      features.biped = true;
    } else if (
      includesAny(name, ["bear", "teddy", "panda", "koala"])
    ) {
      plan = "sitting";
      features.sitting = true;
      features.shortSnout = true;
    } else if (
      includesAny(name, ["hippo", "hippopotamus"])
    ) {
      plan = "sitting";
      features.sitting = true;
      features.shortSnout = true;
    } else if (
      includesAny(name, ["chinchilla"])
    ) {
      plan = "sitting";
      features.sitting = true;
      features.shortSnout = true;
      features.bushyTail = true;
    } else if (
      includesAny(name, ["bunny", "rabbit", "hare"])
    ) {
      plan = "sitting";
      features.sitting = true;
      features.longEars = true;
      features.bushyTail = true;
    } else if (
      includesAny(name, ["frog", "toad"])
    ) {
      plan = "amphibian";
    } else {
      plan = "quadruped";
    }

    // Feature keywords (can stack on any plan)
    if (includesAny(name, ["deer", "stag", "elk", "moose", "reindeer", "caribou", "fawn"])) {
      // Reference: dangling chibi deer plush (2 arms + 2 legs, pear body) — not standing 4-leg quadruped
      features.antlers = true;
      features.shortSnout = true;
      features.biped = true;
      plan = "biped";
    }
    if (includesAny(name, ["giraffe"])) {
      features.longNeck = true;
      features.shortSnout = true;
      plan = "quadruped";
    }
    if (includesAny(name, ["elephant", "mammoth"])) {
      features.trunk = true;
      features.bigEars = true;
      features.shortSnout = false;
      features.bushyTail = false;
      plan = "quadruped";
    }
    if (includesAny(name, ["rhino", "rhinoceros", "bull", "bison", "ram", "goat"])) {
      features.horns = true;
      plan = plan === "sitting" ? "quadruped" : plan;
    }
    if (includesAny(name, ["fox", "wolf", "dog", "puppy", "coyote", "dingo"])) {
      features.longSnout = true;
      features.bushyTail = true;
      plan = "quadruped";
    }
    if (includesAny(name, ["cat", "kitten", "kitty", "lion", "tiger", "leopard", "panther", "cougar", "lynx"])) {
      // Amigurumi cats/kittens are almost always SITTING plush style (not standing deer legs).
      features.shortSnout = true;
      features.sitting = true;
      plan = "sitting";
      if (includesAny(name, ["lion"])) features.mane = true;
      // Thin tube tail — not a bushy sphere
      features.bushyTail = false;
      features.thinTail = true;
    }
    // Owned Molly Unicorn family: sitting plush + horn + spiral mane/tail (NOT standing horse)
    if (includesAny(name, ["unicorn"])) {
      features.horns = true;
      features.mane = true;
      features.shortSnout = true;
      features.sitting = true;
      features.bushyTail = false;
      features.thinTail = false;
      plan = "sitting";
    }
    if (includesAny(name, ["horse", "pony", "zebra", "donkey"])) {
      features.longSnout = true;
      features.mane = true;
      plan = "quadruped";
    }
    if (includesAny(name, ["pig", "boar"])) {
      features.shortSnout = true;
      plan = "quadruped";
    }
    if (includesAny(name, ["cow", "cattle", "ox"])) {
      features.horns = true;
      features.shortSnout = true;
      plan = "quadruped";
    }
    if (includesAny(name, ["dragon", "bat", "pegasus", "griffin"])) {
      features.wings = true;
      if (includesAny(name, ["dragon"])) {
        features.spikes = true;
        features.longSnout = true;
      }
      if (plan !== "bird") plan = "quadruped";
    }
    if (includesAny(name, ["bunny", "rabbit", "hare", "donkey", "mule"])) {
      features.longEars = true;
    }
    if (includesAny(name, ["duck", "goose", "swan", "pelican", "toucan", "flamingo", "bird", "owl", "eagle", "parrot", "chicken", "penguin"])) {
      features.beak = true;
      features.wings = true;
    }
    if (includesAny(name, ["hedgehog", "porcupine", "stegosaurus"])) {
      features.spikes = true;
    }
    if (includesAny(name, ["squirrel"])) {
      features.bushyTail = true;
      features.sitting = true;
      plan = "sitting";
    }
    // Chibi floppy water mammal (otter/beaver/seal)
    if (
      includesAny(name, [
        "otter",
        "sea otter",
        "river otter",
        "beaver",
        "seal",
        "sea lion",
      ])
    ) {
      features.sitting = true;
      features.shortSnout = true;
      features.floppyWaterMammal = true;
      plan = "sitting";
    }

    return {
      name: titleCase(rawName) || "Critter",
      plan: plan,
      features: features,
    };
  }

  function scaleStackToHeight(stack, targetHeight) {
    let sum = 0;
    for (let i = 0; i < stack.length; i += 1) sum += stack[i].inches;
    if (sum === 0) return stack;
    const factor = targetHeight / sum;
    return stack.map(function (row) {
      return { label: row.label, inches: row.inches * factor };
    });
  }

  /**
   * Chibi amigurumi balance matched to designer-quality toys
   * (see assets/reference-deer.png).
   * On a 10" deer: head ≈ 4.0" — large vs body, but NOT 9.5".
   * Legs still carry real standing height (~3.5–4").
   */
  function balancedHeadDiameter(H, photoHeadScale, baseRatio) {
    const ratio = baseRatio == null ? 0.4 : baseRatio;
    const scale = photoHeadScale == null ? 1 : photoHeadScale;
    const raw = H * ratio * scale;
    const minH = H * 0.35;
    const maxH = H * 0.48;
    if (raw < minH) return minH;
    if (raw > maxH) return maxH;
    return raw;
  }

  function finishHeightStack(stack, H) {
    let sum = 0;
    for (let i = 0; i < stack.length; i += 1) {
      if (stack[i].label.indexOf("overlap") === -1) sum += stack[i].inches;
    }
    stack.push({
      label: "Sewing overlaps (subtract)",
      inches: H - sum,
    });
    return stack;
  }

  function buildQuadruped(analysis, H, photo) {
    const f = analysis.features;
    const parts = [];
    const assembly = [];
    const p = photo && photo.applied ? photo : null;
    const legScale = p ? p.legScale : 1;
    const neckScale = p ? p.neckScale : 1;
    const bodyThickScale = p ? p.bodyThickScale : 1;
    const headScale = p ? p.headScale : 1;
    const bodyLengthScale = p ? p.bodyLengthScale : 1;

    // Reference deer (10" tall standing quadrupeds): head ~4.0", legs ~3.7", body ~2.5", neck ~0.7"
    // Note: "Deer" itself uses dangling chibi biped (buildChibiDeer) — this path is fox/horse/etc.
    // Elephant: stocky pillar legs, almost no neck, big head — not fox stilts.
    const isElephant = !!f.trunk;
    const headRatio = f.longNeck ? 0.36 : isElephant ? 0.44 : 0.4;
    const headD = balancedHeadDiameter(H, headScale, headRatio);
    const legH =
      (isElephant ? H * 0.22 : f.longNeck ? H * 0.32 : H * 0.37) * legScale;
    const bodyThick =
      (isElephant ? H * 0.36 : f.longNeck ? H * 0.22 : H * 0.25) *
      bodyThickScale;
    const bodyLen = H * (isElephant ? 0.32 : 0.42) * bodyLengthScale;
    const neckH =
      (isElephant ? H * 0.01 : f.longNeck ? H * 0.2 : H * 0.07) * neckScale;
    const topBits = f.antlers || f.horns ? H * 0.16 : H * 0.03;
    const legDia = isElephant ? H * 0.16 : H * 0.08;
    const designerDeer = false; // Deer animal now uses buildChibiDeer; keep false here

    const stack = [];
    stack.push({ label: "Legs (ground to belly)", inches: legH });
    stack.push({ label: "Body thickness", inches: bodyThick });
    stack.push({ label: "Neck (worked from body)", inches: neckH });
    stack.push({ label: "Head", inches: headD });
    if (f.antlers || f.horns) {
      stack.push({ label: "Antlers/horns above head", inches: topBits });
    }
    finishHeightStack(stack, H);

    parts.push({
      key: "leg",
      label: "Leg",
      shape: "cylinder",
      geometry: "cylinder",
      diameterIn: legDia,
      heightIn: legH,
      count: 4,
      finishNotes: designerDeer
        ? [
            "Work the last ~15% of rounds in dark brown for hooves.",
            "Stuff firmly. Attach at the four corners of the body underside so it stands.",
          ]
        : isElephant
          ? [
              "Pillar legs — thicker tubes, not stilts. Stuff firmly.",
              "Sew under the four corners of the body so it stands.",
            ]
          : ["Stuff firmly. Sew under the body so the animal stands evenly."],
    });

    parts.push({
      key: "body",
      label: "Body & neck",
      shape: "body-neck",
      geometry: "horizontal oval → short neck",
      lengthIn: bodyLen,
      diameterIn: bodyThick,
      heightIn: Math.max(neckH, H * 0.05),
      count: 1,
      finishNotes: designerDeer
        ? [
            "Shape as a horizontal oval (chest to rump), not a round ball.",
            "Cream belly/chest panel (tapestry, intarsia, or sew-on oval).",
            "Add 6–8 small cream spot circles on the back/flanks.",
          ]
        : isElephant
          ? [
              "Stocky horizontal oval (chest to rump) — thicker than a fox torso.",
              "Almost no neck stump; sew the large head flush to the chest.",
            ]
          : ["Keep the torso long; neck is a short stump for the head."],
    });

    if (designerDeer) {
      parts.push({
        key: "head",
        label: "Head",
        shape: "sphere",
        geometry: "sphere (slightly flattened OK)",
        diameterIn: headD,
        count: 1,
        finishNotes: [
          "Medium brown. Place safety eyes on the lower half of the face, wide apart.",
        ],
      });
      parts.push({
        key: "muzzle",
        label: "Muzzle",
        shape: "snout",
        geometry: "short cylinder/cone",
        lengthIn: headD * 0.28,
        diameterIn: headD * 0.42,
        count: 1,
        finishNotes: [
          "Cream/off-white. Sew centered on the lower face.",
          "Embroider dark brown triangle nose and a simple Y mouth.",
        ],
      });
      parts.push({
        key: "eye-patch",
        label: "Eye patch",
        shape: "dome",
        geometry: "flat circle / teardrop",
        diameterIn: headD * 0.28,
        count: 2,
        finishNotes: [
          "Cream. Sew behind each safety eye (or crochet as a flat oval).",
        ],
      });
      parts.push({
        key: "ear",
        label: "Ear (outer)",
        shape: "dome",
        geometry: "leaf / pointed oval",
        diameterIn: headD * 0.42,
        count: 2,
        finishNotes: [
          "Brown outer. Pinch into a pointed leaf shape.",
          "Sew cream inner ear on before attaching to the head.",
        ],
      });
      parts.push({
        key: "ear-inner",
        label: "Ear (inner)",
        shape: "dome",
        geometry: "smaller leaf oval",
        diameterIn: headD * 0.28,
        count: 2,
        finishNotes: ["Cream. Sew centered on each outer ear."],
      });
      parts.push({
        key: "antler",
        label: "Antler (main beam)",
        shape: "cone",
        geometry: "branched cylinder/cone",
        diameterIn: headD * 0.12,
        heightIn: topBits * 0.85,
        count: 2,
        finishNotes: [
          "Cream. Stuff lightly.",
          "Sew 2 tines onto each beam (mid + upper) for a branched Y shape.",
        ],
      });
      parts.push({
        key: "tine",
        label: "Antler tine",
        shape: "cone",
        geometry: "cone",
        diameterIn: headD * 0.08,
        heightIn: topBits * 0.4,
        count: 4,
        finishNotes: ["Cream. Attach to beams before sewing antlers on the head."],
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "cone",
        geometry: "teardrop / small cone",
        diameterIn: headD * 0.16,
        heightIn: headD * 0.22,
        count: 1,
        finishNotes: ["Brown base with a cream tip (color change near the end)."],
      });
    } else {
      if (f.trunk) {
        parts.push({
          key: "head",
          label: "Head",
          shape: "sphere",
          geometry: "sphere (large, almost no neck)",
          diameterIn: headD,
          count: 1,
          finishNotes: [
            "Grey. Place safety eyes on the lower half of the face, fairly wide.",
            "Sew the trunk centered on the lower face before attaching the head.",
          ],
        });
        parts.push({
          key: "trunk",
          label: "Trunk",
          shape: "cylinder",
          geometry: "tapered tube that hangs and curves slightly",
          diameterIn: headD * 0.3,
          heightIn: headD * 1.2,
          count: 1,
          finishNotes: [
            "Stuff lightly so it stays bendy. Taper toward the tip.",
            "Sew to the center of the face so it hangs below the chin and curls a little.",
          ],
        });
        parts.push({
          key: "tusk",
          label: "Tusk",
          shape: "cone",
          geometry: "short cream cone",
          diameterIn: headD * 0.1,
          heightIn: headD * 0.35,
          count: 2,
          finishNotes: ["Cream/ivory. Sew beside the trunk base, angling slightly outward."],
        });
      } else {
        parts.push({
          key: "head",
          label: "Head",
          shape: "head-from-nose",
          geometry: "snout → sphere",
          diameterIn: headD,
          lengthIn: f.longSnout ? headD * 0.3 : headD * 0.22,
          count: 1,
        });
      }
      if (f.longEars) {
        parts.push({
          key: "ear",
          label: "Ear",
          shape: "cylinder",
          geometry: "cylinder",
          diameterIn: headD * 0.12,
          heightIn: headD * 0.28,
          count: 2,
        });
      } else if (f.bigEars || f.trunk) {
        parts.push({
          key: "ear",
          label: "Ear (floppy)",
          shape: "dome",
          geometry: "huge flat oval flap — bigger than the head",
          diameterIn: headD * 1.25,
          heightIn: headD * 0.1,
          count: 2,
          finishNotes: [
            "Work flat (pancake). Elephant ears must read HUGE — wider than the head.",
            "Sew to the sides of the head so they fan out and hang slightly forward.",
          ],
        });
      } else {
        parts.push({
          key: "ear",
          label: "Ear",
          shape: "dome",
          geometry: "dome",
          diameterIn: headD * 0.28,
          count: 2,
        });
      }
      if (f.antlers) {
        parts.push({
          key: "antler",
          label: "Antler (main beam)",
          shape: "cone",
          geometry: "cone",
          diameterIn: headD * 0.1,
          heightIn: topBits * 0.85,
          count: 2,
        });
        parts.push({
          key: "tine",
          label: "Antler tine",
          shape: "cone",
          geometry: "cone",
          diameterIn: headD * 0.07,
          heightIn: topBits * 0.4,
          count: 4,
        });
      }
      if (f.horns) {
        parts.push({
          key: "horn",
          label: "Horn",
          shape: "cone",
          geometry: "cone",
          diameterIn: headD * 0.12,
          heightIn: topBits,
          count: includesAny(analysis.name.toLowerCase(), ["rhino", "unicorn"])
            ? 1
            : 2,
        });
      }
      if (f.wings) {
        parts.push({
          key: "wing",
          label: "Wing",
          shape: "dome",
          geometry: "dome",
          diameterIn: headD * 0.55,
          count: 2,
        });
      }
      if (f.spikes) {
        parts.push({
          key: "spike",
          label: "Spike / plate",
          shape: "cone",
          geometry: "cone",
          diameterIn: headD * 0.1,
          heightIn: headD * 0.12,
          count: 6,
        });
      }
      parts.push({
        key: "tail",
        label: f.bushyTail ? "Bushy tail" : f.trunk ? "Rope tail" : "Tail",
        shape: f.bushyTail ? "sphere" : "cylinder",
        geometry: f.bushyTail ? "sphere" : f.trunk ? "thin rope with tuft tip" : "cylinder",
        diameterIn: f.bushyTail ? headD * 0.2 : f.trunk ? headD * 0.06 : headD * 0.1,
        heightIn: f.bushyTail ? undefined : f.trunk ? headD * 0.35 : headD * 0.18,
        count: 1,
        finishNotes: f.trunk
          ? ["Thin tube. Optional tiny fringe at the tip. Sew at the rump."]
          : undefined,
      });
    }

    if (designerDeer) {
      assembly.push(
        "QUALITY TARGET: tight even sc (hook 1–2 sizes smaller than yarn label), clean color changes, no stuffing showing."
      );
      assembly.push(
        "Sew cream muzzle to lower center of head; embroider dark nose + Y mouth."
      );
      assembly.push(
        "Add safety eyes with cream eye patches behind or around them."
      );
      assembly.push(
        "Layer cream inner ears onto brown outers; sew ears to the upper sides of the head."
      );
      assembly.push(
        "Build branched antlers (beam + 2 tines each); sew between the ears."
      );
      assembly.push(
        "Sew head onto the short thick neck stump (reference style — not a long tube)."
      );
      assembly.push(
        "Attach four legs at body corners so it stands; dark hoof tips on the ground."
      );
      assembly.push(
        "Add cream belly panel + back spots; sew cream-tipped tail at the rump."
      );
    } else {
      if (f.mane) {
        assembly.push(
          "Add a mane with short fringe yarn along the neck (or crochet a thin strip)."
        );
      }
      assembly.push("Stuff the Body & neck firmly (long oval torso, short neck stump).");
      assembly.push("Sew four legs under the body so the animal stands evenly.");
      assembly.push("Sew the finished head onto the open neck edge.");
      if (f.trunk) assembly.push("Sew the trunk to the center of the face.");
      assembly.push("Add safety eyes (or embroider) on the sides of the head.");
      assembly.push("Sew ears to the top sides of the head.");
      if (f.antlers) {
        assembly.push("Sew tines onto beams, then sew antlers between the ears.");
      }
      if (f.horns) assembly.push("Sew horn(s) to the top of the head.");
      if (f.wings) {
        assembly.push("Flatten wings slightly and sew to the upper sides of the body.");
      }
      if (f.spikes) assembly.push("Sew spikes/plates along the back.");
      assembly.push("Sew the tail to the rear of the body.");
    }

    return {
      parts: parts,
      assembly: assembly,
      heightStack: stack,
      description: designerDeer
        ? "Designer chibi deer: ~" +
          headD.toFixed(1) +
          '" head on ' +
          H.toFixed(1) +
          '" tall — long legs, short neck, branched antlers, cream muzzle/belly/spots.'
        : "Standing chibi " +
          analysis.name +
          " (~" +
          headD.toFixed(1) +
          '" head on ' +
          H.toFixed(1) +
          '" tall)' +
          (f.longNeck ? ", long neck" : "") +
          ".",
      qualityNotes: designerDeer
        ? [
            "Match assets/reference-deer.png proportions: head ~40% of height, long slender legs, short thick neck, horizontal oval body.",
            "Colors: medium brown main; cream belly/muzzle/eye patches/spots/antlers; dark brown hooves + nose.",
            "Tight sc fabric so stuffing never shows through.",
          ]
        : null,
    };
  }

  function buildSitting(analysis, H, photo, options) {
    options = options || {};
    const f = analysis.features;
    const parts = [];
    const assembly = [];
    const p = photo && photo.applied ? photo : null;
    const headScale = p ? p.headScale : 1;
    const bodyScale = p ? p.bodyThickScale : 1;
    const legScale = p ? p.legScale : 1;
    const isCat = includesAny(analysis.name.toLowerCase(), [
      "cat",
      "kitten",
      "kitty",
      "lion",
      "tiger",
      "leopard",
      "panther",
      "lynx",
    ]);
    const isTeddy = includesAny(analysis.name.toLowerCase(), [
      "bear",
      "teddy",
      "panda",
      "koala",
    ]);
    const isUnicorn = includesAny(analysis.name.toLowerCase(), ["unicorn"]);
    const isHippo = includesAny(analysis.name.toLowerCase(), [
      "hippo",
      "hippopotamus",
    ]);
    const isChinchilla = includesAny(analysis.name.toLowerCase(), [
      "chinchilla",
    ]);
    const isOtter =
      analysis.features.floppyWaterMammal ||
      includesAny(analysis.name.toLowerCase(), [
        "otter",
        "beaver",
        "seal",
        "sea lion",
      ]);
    const bunnyStyle =
      f.longEars ||
      includesAny(analysis.name.toLowerCase(), ["bunny", "rabbit", "hare"]);

    // Sitting plush proportions — diameters drive stitch counts at YOUR gauge.
    // Kitten Kaya look: head slightly larger than body (not bobblehead).
    const headD = balancedHeadDiameter(
      H,
      headScale,
      isCat
        ? 0.38
        : isUnicorn
          ? 0.4
          : isChinchilla
            ? 0.42
            : isHippo
              ? 0.4
              : isTeddy
                ? 0.4
                : isOtter
                  ? 0.4
                  : 0.42
    );
    const bodyD =
      headD *
      (isCat
        ? 0.9 // plump body under a slightly larger head (Kaya silhouette, gauge-safe)
        : isUnicorn
          ? 0.88
          : isChinchilla
            ? 0.85
            : isHippo
              ? 0.9
              : isTeddy
                ? 0.9
                : isOtter
                  ? 0.95
                  : 0.8) *
      bodyScale;
    const legH =
      headD *
      (isCat
        ? 0.35
        : isUnicorn
          ? 0.5
          : isChinchilla
            ? 0.18
            : isHippo
              ? 0.32
              : isTeddy
                ? 0.42
                : isOtter
                  ? 0.22
                  : 0.28) *
      legScale;
    const armH =
      headD *
      (isTeddy || isUnicorn
        ? 0.45
        : isHippo
          ? 0.38
          : isChinchilla
            ? 0.22
            : isOtter
              ? 0.32
              : 0.4);
    const earExtra = bunnyStyle
      ? headD * 0.35
      : isChinchilla
        ? headD * 0.28
        : isOtter
          ? headD * 0.18
          : headD * 0.22;
    const tailLen = headD * (isCat || f.thinTail ? 0.7 : isChinchilla ? 0.55 : isOtter ? 0.85 : 0.25);
    const hornH = headD * 0.35;
    const muzzleLen = headD * (isHippo ? 0.42 : 0.2);

    const stack = [
      { label: "Sitting height (legs + body)", inches: legH * 0.45 + bodyD * 0.7 },
      { label: "Head", inches: headD },
      { label: bunnyStyle ? "Ears above head" : "Ear tips", inches: earExtra * 0.35 },
    ];
    finishHeightStack(stack, H);

    if (isCat) {
      // Owned Kitten Kaya construction — stitch counts come from diameter × your SPI
      const kayaSizeScale = H / 10;
      parts.push({
        key: "ear",
        label: "Ears",
        shape: "kaya-cat-ear",
        geometry: "3D spiral cone",
        diameterIn: headD * 0.32,
        count: 2,
        kayaSizeScale: kayaSizeScale,
      });
      parts.push({
        key: "leg",
        label: "Legs",
        shape: "kaya-cat-leg",
        geometry: "oval sole + tube, fold-close",
        diameterIn: headD * 0.28,
        heightIn: legH,
        count: 2,
        kayaSizeScale: kayaSizeScale,
      });
      parts.push({
        key: "arm",
        label: "Arms",
        shape: "kaya-cat-arm",
        geometry: "paw tube, fold-close",
        diameterIn: headD * 0.22,
        heightIn: armH,
        count: 2,
        kayaSizeScale: kayaSizeScale,
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "kaya-cat-tail",
        geometry: "thin tube",
        diameterIn: headD * 0.14,
        heightIn: tailLen,
        count: 1,
        kayaSizeScale: kayaSizeScale,
      });
      parts.push({
        key: "body",
        label: "Body",
        shape: "kaya-cat-body",
        geometry: "JAYG legs then arms",
        diameterIn: bodyD,
        heightIn: Math.max(bodyD * 0.85, H * 0.28),
        count: 1,
        kayaSizeScale: kayaSizeScale,
      });
      parts.push({
        key: "head",
        label: "Head",
        shape: "kaya-cat-head",
        geometry: "sculpted face on sphere",
        diameterIn: headD,
        count: 1,
        kayaSizeScale: kayaSizeScale,
      });

      assembly.push("Crochet ears, legs, arms, and tail first.");
      assembly.push(
        "Crochet the body next, joining legs then arms as-you-go on the marked rounds."
      );
      assembly.push(
        "Finish the head (eyes, nose, sculpting, embroidery), then sew the ears to the head."
      );
      assembly.push("Sew the head to the open top of the body (no separate neck piece).");
      assembly.push(
        "Sew the thin tail to the lower back of the body (about mid-body rounds)."
      );
      assembly.push(
        "Optional: cut short monofilament whiskers and knot them into the muzzle."
      );
      if (f.mane) {
        assembly.push("Add a mane around the head/neck join.");
      }
    } else if (isUnicorn) {
      // Owned Molly Unicorn family (~26 cm / 10")
      parts.push({
        key: "leg",
        label: "Leg",
        shape: "round-foot-leg",
        geometry: "hoof foot + tube (close for joints)",
        diameterIn: headD * 0.55,
        heightIn: legH,
        count: 2,
        finishNotes: [
          "Start in hoof/contrast color for the foot, then change to main color.",
          "Close the top with decreases (or fold). Insert plastic joints near the top if using them; otherwise sew to the body.",
        ],
      });
      parts.push({
        key: "arm",
        label: "Arm",
        shape: "sitting-arm",
        geometry: "hoof paw + tube",
        diameterIn: headD * 0.32,
        heightIn: armH,
        count: 2,
        finishNotes: [
          "Start with hoof color for a few rounds, then main color.",
          "Close the top; insert smaller joints if using them.",
        ],
      });
      parts.push({
        key: "body",
        label: "Body",
        shape: "sitting-body-jointed",
        geometry: "sitting body (jointed/sewn limbs)",
        diameterIn: bodyD,
        heightIn: bodyD * 0.8,
        count: 1,
        finishNotes: [
          "Attach legs at the widest rounds; attach arms higher as you taper.",
          "Sew the finished head on after decorating it.",
        ],
      });
      parts.push({
        key: "head",
        label: "Head",
        shape: "unicorn-head",
        geometry: "sculpted unicorn head",
        diameterIn: headD,
        count: 1,
        finishNotes: [
          "Needle-sculpt eye sockets; sew or insert safety eyes; embroider eyelids and nostrils.",
        ],
      });
      parts.push({
        key: "ear",
        label: "Ear",
        shape: "dome",
        geometry: "small pointed dome",
        diameterIn: headD * 0.28,
        count: 2,
        finishNotes: ["Lightly shape to a point; sew to the upper sides of the head."],
      });
      parts.push({
        key: "horn",
        label: "Horn",
        shape: "horn",
        geometry: "thin cone",
        diameterIn: headD * 0.14,
        heightIn: hornH,
        count: 1,
        finishNotes: [
          "Prefer thinner yarn / smaller hook than the body. Stuff lightly; sew on the forehead.",
        ],
      });
      parts.push({
        key: "mane",
        label: "Mane lock",
        shape: "spiral-lock",
        geometry: "spiral fringe",
        lengthIn: headD * 2.2,
        scPerChain: 3,
        count: 6,
        finishNotes: [
          "Use several colors. Sew locks along the head/neck line for a full mane.",
        ],
      });
      parts.push({
        key: "tail",
        label: "Tail lock",
        shape: "spiral-lock",
        geometry: "spiral fringe",
        lengthIn: headD * 1.6,
        scPerChain: 2,
        count: 6,
        finishNotes: [
          "Bundle the locks together, then sew the bundle to the lower back.",
        ],
      });

      assembly.push(
        "QUALITY TARGET: Molly-style sitting unicorn — ~10\" chenille body, hoof-tipped limbs, sculpted head, thin horn, spiral mane & tail."
      );
      assembly.push("Crochet legs and arms first (hoof color → main); close tops and add joints if using them.");
      assembly.push("Crochet the body; attach legs at the wide section, arms higher up.");
      assembly.push(
        "Finish the head (sculpt eyes, sew eyes, embroider lids/nostrils/brows), sew ears and horn, then sew head to body."
      );
      assembly.push("Sew mane locks to the head; bundle and sew tail locks to the body.");
      assembly.push("Optional: soft pastel tint on ears, muzzle, and nostrils.");
    } else if (isHippo) {
      // Owned Harry the Hippo — All From Jade write-up quality
      parts.push({
        key: "head",
        label: "Muzzle | Head",
        shape: "hippo-head",
        geometry: "chain-oval muzzle → head (one piece)",
        diameterIn: headD,
        lengthIn: muzzleLen,
        count: 1,
      });
      parts.push({
        key: "ear",
        label: "Ears",
        shape: "harry-hippo-ear",
        geometry: "small dome, folded",
        diameterIn: headD * 0.22,
        count: 2,
      });
      parts.push({
        key: "arm",
        label: "Arms",
        shape: "harry-hippo-arm",
        geometry: "short tube → skinny, fold-close",
        diameterIn: headD * 0.22,
        heightIn: armH,
        count: 2,
      });
      parts.push({
        key: "leg",
        label: "Legs",
        shape: "harry-hippo-leg",
        geometry: "oval chain foot + short tube",
        diameterIn: headD * 0.28,
        heightIn: legH,
        count: 2,
      });
      parts.push({
        key: "body",
        label: "Body",
        shape: "harry-hippo-body",
        geometry: "from 2nd leg → belly → JAYG arms",
        diameterIn: bodyD,
        heightIn: bodyD * 0.85,
        count: 1,
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "chain-tail",
        geometry: "tiny chain tab",
        lengthIn: headD * 0.2,
        count: 1,
      });

      assembly.push(
        "Crochet the Muzzle | Head first. Add eyes, cheeks, brows, nostrils (and optional teeth). Sew the folded ears on."
      );
      assembly.push(
        "Crochet both Arms (fold-close) and both Legs. Do not cut yarn on the 2nd leg."
      );
      assembly.push(
        "Continue into the Body from the 2nd leg, joining leg 1 with a chain bridge. Join arms as-you-go near the top."
      );
      assembly.push(
        "Sew the body to the head; stuff the neck before closing. Add the tiny chain Tail on the lower back."
      );
      assembly.push("You're done — share your hippo!");
    } else if (isChinchilla) {
      // Owned chinchilla family (~21 cm / 8" incl. ears) — head+body one piece
      parts.push({
        key: "arm",
        label: "Arm",
        shape: "sitting-arm",
        geometry: "tiny unstuffed paw tube",
        diameterIn: headD * 0.16,
        heightIn: armH,
        count: 2,
        finishNotes: [
          "Start in beige/cream for the paw, then change to main color (BLO on the color-change round).",
          "Do not stuff. Flatten and sc through both layers; sew to the chest later.",
        ],
      });
      parts.push({
        key: "foot",
        label: "Foot",
        shape: "sitting-arm",
        geometry: "tiny flat foot (unstuffed)",
        diameterIn: headD * 0.18,
        heightIn: legH,
        count: 2,
        finishNotes: [
          "Cream/beige. Do not stuff. Flatten and close — join into the body as-you-go near the base.",
        ],
      });
      parts.push({
        key: "ear",
        label: "Ear",
        shape: "chinchilla-ear",
        geometry: "oval chain ear + fur edge",
        diameterIn: headD * 0.45,
        count: 2,
        finishNotes: [
          "Work in turning rows around a short chain; edge with fur yarn (sl st) if you have it.",
          "Fold each ear slightly toward center (mirror left/right) before sewing.",
        ],
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "fur-tail",
        geometry: "bushy fur-yarn tail",
        diameterIn: headD * 0.45,
        heightIn: tailLen,
        count: 1,
        finishNotes: [
          "Prefer fur / eyelash yarn. Join into the body as-you-go on an early body round (or sew if needed).",
        ],
      });
      parts.push({
        key: "body",
        label: "Head & body",
        shape: "chinchilla-body-head",
        geometry: "feet-up body → neck → head (one piece)",
        diameterIn: bodyD,
        heightIn: H * 0.85,
        headDiameterIn: headD,
        count: 1,
        finishNotes: [
          "Start from a foundation-chain oval at the bottom.",
          "Join both feet early; join the tail a couple of rounds later.",
          "Decrease for a short neck, then increase into the head; place safety nose and eyes; close the top.",
        ],
      });

      assembly.push(
        "QUALITY TARGET: chinchilla sitting plush — head+body one piece, tiny flat feet & bushy fur tail joined in, sew-on arms, large fur-edged ears (~8\" incl. ears)."
      );
      assembly.push("Crochet arms, feet, ears, and fur tail first.");
      assembly.push(
        "Crochet head & body from the bottom up, joining feet then tail as-you-go; shape neck then head; add nose and eyes while open enough."
      );
      assembly.push("Sew ears to the top of the head; embroider brows/eyeliner.");
      assembly.push("Sew arms to the upper chest.");
    } else if (isOtter) {
      // Face path: SEPARATE_PATCH (default) vs CONTINUOUS_NOSE_FIRST
      let faceStyle = options.facialConstructionStyle || "auto";
      if (faceStyle === "auto") faceStyle = "SEPARATE_PATCH";
      if (
        faceStyle !== "SEPARATE_PATCH" &&
        faceStyle !== "CONTINUOUS_NOSE_FIRST"
      ) {
        faceStyle = "SEPARATE_PATCH";
      }

      if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
        parts.push({
          key: "head",
          label: "Head",
          shape: "otter-continuous-head",
          geometry: "continuous snout→head (round-switch)",
          diameterIn: headD,
          count: 1,
          facialConstructionStyle: faceStyle,
        });
      } else {
        parts.push({
          key: "head",
          label: "Head",
          shape: "otter-head",
          geometry: "solid sphere (SEPARATE_PATCH)",
          diameterIn: headD,
          count: 1,
          facialConstructionStyle: faceStyle,
        });
        parts.push({
          key: "muzzle",
          label: "Muzzle",
          shape: "otter-muzzle",
          geometry: "cream oval patch, sew-on",
          chLen: 5,
          targetR1: 10,
          count: 1,
        });
      }
      parts.push({
        key: "ear",
        label: "Ears",
        shape: "marty-teddy-ear",
        geometry: "small rounded dome",
        diameterIn: headD * 0.22,
        count: 2,
      });
      parts.push({
        key: "arm",
        label: "Forelimbs / Arms",
        shape: "otter-arm",
        geometry: "narrow tube, fold-close",
        heightIn: armH,
        count: 2,
      });
      parts.push({
        key: "leg",
        label: "Hindlimbs / Paddle Feet",
        shape: "otter-paddle-foot",
        geometry: "flat oval paddle, fold-close",
        chLen: 7,
        targetR1: 14,
        maxRounds: 7,
        count: 2,
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "otter-tail",
        geometry: "thick tapered cone (backrest)",
        heightIn: tailLen,
        bodyDiameterIn: bodyD,
        count: 1,
      });
      parts.push({
        key: "body",
        label: "Body",
        shape: "otter-body",
        geometry: "plump floppy egg, sew-on limbs",
        diameterIn: bodyD,
        heightIn: Math.max(bodyD * 0.9, H * 0.32),
        count: 1,
      });

      if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
        assembly.push(
          "Crochet the continuous cream-to-main head first (Rounds 1–7 cream, then switch to main at Round 8 — no mid-row color changes), then ears, narrow arms, paddle feet, and thick tail."
        );
        assembly.push(
          "Finish the head (eyes just above the cream snout, stuff snout firmly), sew ears high on the sides."
        );
      } else {
        assembly.push(
          "Crochet head, cream muzzle, ears, narrow arms, paddle feet, and thick tail first."
        );
        assembly.push(
          "Finish the head: sew the cream oval muzzle between the eyes (lightly stuffed), embroider nose/mouth, sew ears high on the sides."
        );
      }
      assembly.push(
        "Crochet the plump body next (leave the top open). Stuff the belly firmly."
      );
      assembly.push(
        "Sew paddle feet to the lower front/base so they face up and forward (floppy seated pose)."
      );
      assembly.push(
        "Sew both narrow arms close together on the upper chest, angling the paws inward so they can hold a shell or small accessory."
      );
      assembly.push(
        "Sew the thick tail low on the back as a backrest prop. Sew the finished head to the open top (no neck tube)."
      );
      assembly.push(
        "Optional: crochet or find a tiny shell and tuck it between the paws."
      );
    } else if (isTeddy) {
      // Owned Marty teddy — detailed write-up
      parts.push({
        key: "head",
        label: "Head",
        shape: "marty-teddy-head",
        geometry: "sphere with cheek shaping",
        diameterIn: headD,
        count: 1,
      });
      parts.push({
        key: "snout",
        label: "Snout",
        shape: "marty-teddy-snout",
        geometry: "short sew-on oval",
        lengthIn: headD * 0.2,
        diameterIn: headD * 0.38,
        count: 1,
      });
      parts.push({
        key: "ear",
        label: "Ears",
        shape: "marty-teddy-ear",
        geometry: "small dome, fold-close",
        diameterIn: headD * 0.28,
        count: 2,
      });
      parts.push({
        key: "leg",
        label: "Hind Legs",
        shape: "round-foot-leg",
        geometry: "round MR foot + tube",
        diameterIn: headD * 0.55,
        heightIn: legH,
        count: 2,
        finishNotes: [
          "Mirror left/right fold closures so the wrong side faces the body.",
          "Join into the body as-you-go (preferred).",
        ],
      });
      parts.push({
        key: "arm",
        label: "Forelegs / Arms",
        shape: "sitting-arm",
        geometry: "paw tube, fold-close",
        diameterIn: headD * 0.28,
        heightIn: armH,
        count: 2,
        finishNotes: [
          "Slightly wider at the paw, then taper. Join into the body on a later round.",
        ],
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "sphere",
        geometry: "tiny ball",
        diameterIn: headD * 0.22,
        count: 1,
        finishNotes: ["Sew just above the hind legs on the lower back."],
      });
      parts.push({
        key: "body",
        label: "Body",
        shape: "marty-teddy-body",
        geometry: "JAYG hind legs then forelegs",
        diameterIn: bodyD,
        heightIn: bodyD * 0.8,
        count: 1,
      });

      assembly.push("Crochet head, snout, ears, hind legs, arms, and tail first.");
      assembly.push(
        "Decorate the head (eyes, snout, needle sculpting, optional eyelids/eye whites, brows) before sewing it on."
      );
      assembly.push(
        "Crochet the body next, joining hind legs then arms as-you-go on the marked rounds."
      );
      assembly.push("Sew the tiny tail just above the hind legs.");
      assembly.push("Sew the finished head to the open top of the body (no neck tube).");
    } else {
      // Bunny / generic sitting style
      parts.push({
        key: "head",
        label: "Head",
        shape: "sphere",
        geometry: "sphere",
        diameterIn: headD,
        count: 1,
      });
      parts.push({
        key: "body",
        label: "Body",
        shape: "sitting-body-jayg",
        geometry: "sitting body (JAYG limbs)",
        diameterIn: bodyD,
        heightIn: bodyD * 0.75,
        count: 1,
      });
      if (bunnyStyle) {
        parts.push({
          key: "ear",
          label: "Ear",
          shape: "cylinder",
          geometry: "cylinder",
          diameterIn: headD * 0.14,
          heightIn: earExtra,
          count: 2,
        });
      } else {
        parts.push({
          key: "ear",
          label: "Ear",
          shape: "dome",
          geometry: "dome",
          diameterIn: headD * 0.22,
          count: 2,
        });
      }
      parts.push({
        key: "arm",
        label: "Arm",
        shape: "sitting-arm",
        geometry: "arm tube",
        diameterIn: headD * 0.16,
        heightIn: armH,
        count: 2,
      });
      parts.push({
        key: "leg",
        label: "Leg",
        shape: "sitting-leg",
        geometry: "oval foot + tube",
        diameterIn: headD * 0.2,
        heightIn: legH,
        count: 2,
      });
      parts.push({
        key: "tail",
        label: "Tail",
        shape: "sphere",
        geometry: "sphere",
        diameterIn: headD * 0.16,
        count: 1,
      });

      if (bunnyStyle) {
        assembly.push("Embroider nose/mouth on the head.");
      }
      assembly.push("Add eyes; sew ears to the head.");
      assembly.push(
        "Crochet the body, joining legs then arms as-you-go when possible."
      );
      assembly.push("Sew head to body (no neck tube).");
      assembly.push("Sew tail to the lower back.");
    }

    // Yarn scale coupling — tag parts for the math engine / shapes
    if (options.yarnProfile && options.yarnProfile.maxStitchCap) {
      for (let pi = 0; pi < parts.length; pi += 1) {
        parts[pi].maxStitchCap = options.yarnProfile.maxStitchCap;
        parts[pi].preferCh2Start = options.yarnProfile.preferCh2Start;
        parts[pi].minBellyEven = options.yarnProfile.minBellyEven;
      }
    }

    return {
      parts: parts,
      assembly: assembly,
      heightStack: stack,
      description: isCat
        ? "Sitting kitten/cat style: ~" +
          headD.toFixed(1) +
          '" sculpted head on ' +
          H.toFixed(1) +
          '" tall — JAYG limbs, 3D cone ears, thin tail (not standing legs + neck).'
        : isUnicorn
          ? "Sitting unicorn (Molly style): ~" +
            headD.toFixed(1) +
            '" head on ' +
            H.toFixed(1) +
            '" tall — hoof limbs, sculpted head, horn, spiral mane & tail.'
          : isHippo
            ? "Sitting hippo (Harry style): ~" +
              headD.toFixed(1) +
              '" muzzle-head on ' +
              H.toFixed(1) +
              '" tall — oval muzzle→head, legs into body, JAYG arms, chain tail.'
            : isChinchilla
              ? "Sitting chinchilla: ~" +
                headD.toFixed(1) +
                '" head on ' +
                H.toFixed(1) +
                '" tall — head+body one piece, JAYG feet/tail, sew-on arms, fur ears.'
              : isOtter
                ? "Chibi floppy water mammal: ~" +
                  headD.toFixed(1) +
                  '" sphere head on ' +
                  H.toFixed(1) +
                  '" tall — separate cream muzzle, narrow chest arms, paddle feet, thick tail backrest.'
                : isTeddy
                ? "Sitting teddy style: ~" +
                  headD.toFixed(1) +
                  '" head on ' +
                  H.toFixed(1) +
                  '" tall — sew-on snout, JAYG limbs, folded ears, tiny tail.'
                : "Sitting plush " +
                  analysis.name +
                  " (~" +
                  headD.toFixed(1) +
                  '" head on ' +
                  H.toFixed(1) +
                  '" tall).',
      qualityNotes: isCat
        ? [
            "Compare to sitting-kitten structure: JAYG limbs; sculpted head (no sew-on snout); 3D cone ears; slim tube tail.",
            "Do not generate a deer-style body+neck or four long standing legs for a cat/kitten.",
            "Tight sc, clean color changes on soles/ear linings when using contrast yarn.",
          ]
        : isCat
          ? [
              "Follow owned Kitten Kaya (assets/KittenKaya.txt) exactly: head 48 / body 36 at ~10\", scaled only by your height.",
              "Head is intentionally larger than the body (48 vs 36) — that is Kaya's look, not a sizing bug.",
              "Body even rounds after legs stay at 2 (Kaya 9-10). Flat dual-panel ears; oval-sole legs; exact JAYG joins; sculpt + embroider before sewing head on.",
            ]
        : isUnicorn
          ? [
              "Match Molly the Unicorn (~26 cm / 10\"): sitting body, hoof-colored limb tips, limbs attached with joints or sew (not a standing horse).",
              "Head is shaped in-round (early taper then face rebuild) — no sew-on snout; thin horn; 6 spiral mane locks + 6 spiral tail locks.",
              "Decorate the head fully before sewing it to the body.",
            ]
          : isHippo
            ? [
                "Match Harry the Hippo (~8–15\" depending on yarn): chain-oval muzzle continues into the head as one piece.",
                "Legs: oval chain feet; 2nd leg continues into the body with a chain bridge to leg 1; arms join as-you-go near the top.",
                "Tiny chain tail on the body; embroider cheeks/brows/nostrils; optional teeth.",
              ]
            : isChinchilla
              ? [
                  "Match plush chinchilla (~21 cm / 8\" incl. ears): head and body are ONE piece worked feet-up.",
                  "Join tiny flat feet and bushy fur tail into the body; sew small unstuffed arms; large oval ears with fur edging.",
                  "Safety nose + eyes; embroider brows; bulky chenille + optional fur yarn.",
                ]
              : isOtter
                ? [
                    "CHIBI FLOPPY WATER MAMMAL: sphere head + SEPARATE cream oval muzzle (never continuous snout→head).",
                    "Narrow fold-close arms sewn close on the upper chest, paws angled inward for a shell/accessory.",
                    "Wide flat paddle feet sew-on at the lower base facing up/forward; thick tapered tail as backrest support.",
                  ]
                : isTeddy
                ? [
                    "Compare to sitting-teddy structure: JAYG limbs; sew-on snout + cheek shaping; folded dome ears; round MR feet; tiny ball tail.",
                    "Head ≈ 40% of height on ~12\" toys; body slightly smaller than head but wider than a kitten body.",
                    "Decorate the head fully before sewing it to the body.",
                  ]
                : null,
    };
  }

  function buildBird(analysis, H, photo) {
    const parts = [];
    const assembly = [];
    const p = photo && photo.applied ? photo : null;
    const bodyScale = p ? p.bodyThickScale : 1;
    const headScale = p ? p.headScale : 1;
    const legScale = p ? p.legScale : 1;

    // Bird body mass ~55% of height (chibi, not nearly full height)
    const bodyD = balancedHeadDiameter(H, bodyScale, 0.55);
    const headD = bodyD * 0.72 * (headScale / Math.max(bodyScale, 0.01));
    const legH = H * 0.12 * legScale;
    const crest = H * 0.05;

    const stack = [
      { label: "Legs", inches: legH },
      { label: "Head & body (one piece)", inches: bodyD },
      { label: "Beak (embroidered)", inches: crest },
    ];
    finishHeightStack(stack, H);

    parts.push({
      key: "body",
      label: "Head & body",
      shape: "bird-head-body",
      geometry: "sphere stack (head→body)",
      diameterIn: bodyD,
      lengthIn: headD,
      count: 1,
    });
    parts.push({
      key: "wing",
      label: "Wing",
      shape: "dome",
      geometry: "dome (half-sphere)",
      diameterIn: bodyD * 0.4,
      count: 2,
    });
    parts.push({
      key: "leg",
      label: "Leg",
      shape: "cylinder",
      geometry: "cylinder",
      diameterIn: bodyD * 0.08,
      heightIn: legH,
      count: 2,
    });
    parts.push({
      key: "tail",
      label: "Tail feather piece",
      shape: "dome",
      geometry: "dome (half-sphere)",
      diameterIn: bodyD * 0.28,
      count: 1,
    });

    assembly.push(
      "Embroider a small beak on the face (yarn or felt). Do not crochet a separate snout."
    );
    assembly.push("Add eyes on the sides of the head area.");
    assembly.push("Flatten wings and sew to the sides of the body.");
    assembly.push("Sew two thin legs under the body so it can stand.");
    assembly.push("Sew the tail piece to the back of the body.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: stack,
      description:
        "Bird-style " +
        analysis.name +
        " with a large head/body mass (~" +
        bodyD.toFixed(1) +
        '" on ' +
        H.toFixed(1) +
        '" tall).',
    };
  }


  function buildFish(analysis, H) {
    // For fish, "height" means overall length (nose to tail tip)
    const parts = [];
    const assembly = [];
    const bodyLen = H * 0.65;
    const bodyD = H * 0.28;
    const stack = [
      { label: "Body length", inches: bodyLen },
      { label: "Tail extension", inches: H * 0.25 },
      { label: "Overlap", inches: H * 0.1 * -1 },
    ];

    parts.push({
      key: "body",
      label: "Body",
      shape: "elongated",
      lengthIn: bodyLen,
      diameterIn: bodyD,
      count: 1,
    });
    parts.push({
      key: "tail",
      label: "Tail fin",
      shape: "dome",
      diameterIn: H * 0.22,
      count: 1,
    });
    parts.push({
      key: "fin",
      label: "Side fin",
      shape: "dome",
      diameterIn: H * 0.14,
      count: 2,
    });
    parts.push({
      key: "dorsal",
      label: "Dorsal fin",
      shape: "dome",
      diameterIn: H * 0.12,
      count: 1,
    });

    assembly.push("Stuff the body into a tapered fish shape.");
    assembly.push("Sew the tail fin to the rear opening.");
    assembly.push("Sew side fins mid-body, and dorsal fin on top.");
    assembly.push("Embroider or attach eyes near the front.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: scaleStackToHeight(stack, H),
      description:
        "Aquatic " +
        analysis.name +
        ". Total size is treated as overall length (nose to tail).",
    };
  }

  function buildSerpent(analysis, H) {
    const parts = [];
    const assembly = [];
    const stack = [
      { label: "Body length (coiled display ~height)", inches: H * 0.85 },
      { label: "Head", inches: H * 0.2 },
      { label: "Coil overlap (subtract)", inches: H * -0.05 },
    ];

    parts.push({
      key: "body",
      label: "Body tube",
      shape: "cylinder",
      diameterIn: H * 0.12,
      heightIn: H * 2.2,
      count: 1,
    });
    parts.push({
      key: "head",
      label: "Head",
      shape: "sphere",
      diameterIn: H * 0.2,
      count: 1,
    });

    assembly.push(
      "Do not overstuff the long tube — keep it flexible so it can coil."
    );
    assembly.push("Sew the head to one end of the tube.");
    assembly.push("Embroider eyes and a small mouth. Optionally add a felt tongue.");
    assembly.push("Coil the body for display; finished 'height' is the coiled pile.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: scaleStackToHeight(stack, H),
      description:
        "Long serpentine " +
        analysis.name +
        ". Pattern length is longer than display height so it can coil.",
    };
  }

  function buildShelled(analysis, H) {
    const parts = [];
    const assembly = [];
    const shellD = H * 0.55;
    const headD = H * 0.22;
    const legH = H * 0.18;
    const stack = [
      { label: "Legs", inches: legH },
      { label: "Shell", inches: shellD },
      { label: "Head poke", inches: headD * 0.5 },
      { label: "Overlap", inches: -(legH + shellD + headD * 0.5 - H) },
    ];

    parts.push({
      key: "shell",
      label: "Shell",
      shape: "dome",
      diameterIn: shellD,
      count: 1,
    });
    parts.push({
      key: "belly",
      label: "Belly / underside",
      shape: "dome",
      diameterIn: shellD * 0.9,
      count: 1,
    });
    parts.push({
      key: "head",
      label: "Head",
      shape: "sphere",
      diameterIn: headD,
      count: 1,
    });
    parts.push({
      key: "leg",
      label: "Leg",
      shape: "cylinder",
      diameterIn: H * 0.08,
      heightIn: legH,
      count: 4,
    });
    parts.push({
      key: "tail",
      label: "Tail",
      shape: "snout",
      lengthIn: H * 0.08,
      diameterIn: H * 0.07,
      count: 1,
    });

    assembly.push("Sew shell dome to belly dome, stuffing firmly.");
    assembly.push("Sew head to the front opening between shell and belly.");
    assembly.push("Sew four legs underneath and a small tail at the back.");
    assembly.push("Add eyes on the head.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: scaleStackToHeight(stack, H),
      description: "Shelled " + analysis.name + " with dome shell and four legs.",
    };
  }

  function buildInsect(analysis, H) {
    const parts = [];
    const assembly = [];
    const stack = [
      { label: "Legs", inches: H * 0.2 },
      { label: "Body", inches: H * 0.45 },
      { label: "Head", inches: H * 0.25 },
      { label: "Antenna tip", inches: H * 0.1 },
    ];

    parts.push({
      key: "head",
      label: "Head",
      shape: "sphere",
      diameterIn: H * 0.28,
      count: 1,
    });
    parts.push({
      key: "body",
      label: "Body",
      shape: "elongated",
      lengthIn: H * 0.45,
      diameterIn: H * 0.28,
      count: 1,
    });
    parts.push({
      key: "leg",
      label: "Leg",
      shape: "cylinder",
      diameterIn: H * 0.04,
      heightIn: H * 0.22,
      count: 6,
    });
    parts.push({
      key: "antenna",
      label: "Antenna",
      shape: "cylinder",
      diameterIn: H * 0.03,
      heightIn: H * 0.16,
      count: 2,
    });
    if (analysis.features.wings || includesAny(analysis.name.toLowerCase(), ["bee", "butterfly", "bug"])) {
      parts.push({
        key: "wing",
        label: "Wing",
        shape: "dome",
        diameterIn: H * 0.25,
        count: 2,
      });
    }

    assembly.push("Sew head to the front of the body.");
    assembly.push("Sew six legs under the body (three per side).");
    assembly.push("Sew antennae to the top of the head.");
    assembly.push("Add eyes. Sew wings on top if included.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: scaleStackToHeight(stack, H),
      description: "Insect-style " + analysis.name + " with six legs.",
    };
  }

  function buildCephalopod(analysis, H) {
    const parts = [];
    const assembly = [];
    const headD = H * 0.45;
    const stack = [
      { label: "Head / mantle", inches: headD },
      { label: "Tentacle drape", inches: H * 0.55 },
    ];

    parts.push({
      key: "head",
      label: "Head / mantle",
      shape: "sphere",
      diameterIn: headD,
      count: 1,
    });
    parts.push({
      key: "tentacle",
      label: "Tentacle",
      shape: "cylinder",
      diameterIn: H * 0.06,
      heightIn: H * 0.55,
      count: includesAny(analysis.name.toLowerCase(), ["squid"]) ? 10 : 8,
    });

    assembly.push("Stuff the head/mantle firmly.");
    assembly.push("Sew tentacles evenly around the bottom opening.");
    assembly.push("Add eyes on the sides of the head.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: scaleStackToHeight(stack, H),
      description: analysis.name + " with a round mantle and trailing tentacles.",
    };
  }

  function buildBiped(analysis, H, photo) {
    const f = analysis.features;
    const isDeer =
      f.antlers ||
      includesAny(analysis.name.toLowerCase(), [
        "deer",
        "fawn",
        "stag",
        "reindeer",
        "elk",
        "moose",
        "caribou",
      ]);
    if (isDeer) {
      return buildChibiDeer(analysis, H, photo);
    }

    const parts = [];
    const assembly = [];
    const p = photo && photo.applied ? photo : null;
    const legScale = p ? p.legScale : 1;
    const bodyScale = p ? p.bodyThickScale : 1;
    const headScale = p ? p.headScale : 1;

    const headD = balancedHeadDiameter(H, headScale, 0.42);
    const legH = Math.max(H * 0.12, headD * 0.18) * legScale;
    const bodyH = headD * 0.4 * bodyScale;

    const stack = [
      { label: "Legs", inches: legH },
      { label: "Body", inches: bodyH },
      { label: "Head", inches: headD },
    ];
    finishHeightStack(stack, H);

    parts.push({
      key: "leg",
      label: "Leg",
      shape: "cylinder",
      geometry: "cylinder",
      diameterIn: headD * 0.1,
      heightIn: legH,
      count: 2,
    });
    parts.push({
      key: "body",
      label: "Body",
      shape: "elongated",
      geometry: "elongated cylinder",
      lengthIn: bodyH,
      diameterIn: headD * 0.38,
      count: 1,
    });
    parts.push({
      key: "arm",
      label: "Arm",
      shape: "cylinder",
      geometry: "cylinder",
      diameterIn: headD * 0.09,
      heightIn: headD * 0.35,
      count: 2,
    });
    parts.push({
      key: "head",
      label: "Head",
      shape: "sphere",
      geometry: "sphere",
      diameterIn: headD,
      count: 1,
    });
    parts.push({
      key: "snout",
      label: f.longSnout ? "Snout" : "Muzzle",
      shape: "snout",
      geometry: "cone/snout",
      lengthIn: headD * 0.18,
      diameterIn: headD * 0.2,
      count: 1,
    });
    if (f.wings) {
      parts.push({
        key: "wing",
        label: "Wing",
        shape: "dome",
        geometry: "dome (half-sphere)",
        diameterIn: headD * 0.35,
        count: 2,
      });
    }
    if (f.spikes) {
      parts.push({
        key: "spike",
        label: "Back spike",
        shape: "dome",
        geometry: "dome (half-sphere)",
        diameterIn: headD * 0.08,
        count: 5,
      });
    }
    parts.push({
      key: "tail",
      label: "Tail",
      shape: "cylinder",
      geometry: "cylinder",
      diameterIn: headD * 0.08,
      heightIn: headD * 0.35,
      count: 1,
    });

    assembly.push("Sew two short legs under the body so it stands.");
    assembly.push("Sew the large head to the top of the body.");
    assembly.push("Sew snout/muzzle to the face; add eyes.");
    assembly.push("Sew arms to the upper sides.");
    if (f.wings) assembly.push("Sew wings to the back/sides.");
    if (f.spikes) assembly.push("Sew spikes along the back.");
    assembly.push("Sew the tail on last.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: stack,
      description:
        "Upright biped " +
        analysis.name +
        " (~" +
        headD.toFixed(1) +
        '" head on ' +
        H.toFixed(1) +
        '" tall).',
    };
  }

  /**
   * Dangling chibi deer — matches assets/reference-deer.webp
   * (big head, pear body, long thin arms/legs, sew-on muzzle, antlers).
   */
  function buildChibiDeer(analysis, H, photo) {
    const p = photo && photo.applied ? photo : null;
    const headScale = p ? p.headScale : 1;
    const bodyScale = p ? p.bodyThickScale : 1;
    const legScale = p ? p.legScale : 1;

    // Held upright ~10": head ~4.2", pear body ~3.0", dangling legs ~3.5", antlers ~1.2"
    const headD = balancedHeadDiameter(H, headScale, 0.42);
    const bodyH = headD * 0.72 * bodyScale;
    const bodyDia = headD * 0.62 * bodyScale;
    const legH = headD * 0.85 * legScale;
    const armH = headD * 0.7;
    const limbDia = headD * 0.14;
    const antlerH = headD * 0.32;
    const muzzleLen = headD * 0.18;
    const muzzleDia = headD * 0.38;

    const stack = [
      { label: "Dangling legs (below body)", inches: legH * 0.75 },
      { label: "Pear body + short neck", inches: bodyH },
      { label: "Head", inches: headD },
      { label: "Antlers above head", inches: antlerH * 0.7 },
    ];
    finishHeightStack(stack, H);

    const parts = [
      {
        key: "head",
        label: "Head",
        shape: "chibi-deer-head",
        geometry: "oversized sphere with cream lower face",
        diameterIn: headD,
        count: 1,
      },
      {
        key: "muzzle",
        label: "Muzzle",
        shape: "snout",
        geometry: "short oval / cylinder",
        lengthIn: muzzleLen,
        diameterIn: muzzleDia,
        count: 1,
        finishNotes: [
          "Cream/off-white. Sew centered on the lower face.",
          "Embroider a small dark horizontal nose + short vertical mouth line.",
        ],
      },
      {
        key: "ear",
        label: "Ear (outer)",
        shape: "dome",
        geometry: "flat round / leaf (do not stuff)",
        diameterIn: headD * 0.32,
        count: 2,
        finishNotes: [
          "Main color. Flatten — these are flat layered ears, not stuffed balls.",
          "Sew cream inner ear on before attaching to the head.",
        ],
      },
      {
        key: "ear-inner",
        label: "Ear (inner)",
        shape: "dome",
        geometry: "smaller flat oval",
        diameterIn: headD * 0.22,
        count: 2,
        finishNotes: ["Cream. Sew centered on each outer ear."],
      },
      {
        key: "antler",
        label: "Antler (main beam)",
        shape: "cone",
        geometry: "branched Y (beam + 1 tine)",
        diameterIn: headD * 0.1,
        heightIn: antlerH,
        count: 2,
        finishNotes: [
          "Cream. Stuff lightly.",
          "Sew one short tine onto each beam for a simple Y / heart fork.",
        ],
      },
      {
        key: "tine",
        label: "Antler tine",
        shape: "cone",
        geometry: "short cone",
        diameterIn: headD * 0.07,
        heightIn: antlerH * 0.45,
        count: 2,
        finishNotes: ["Cream. Attach mid-beam before sewing antlers on the head."],
      },
      {
        key: "body",
        label: "Body",
        shape: "pear-body",
        geometry: "vertical pear → short neck stump",
        diameterIn: bodyDia,
        heightIn: bodyH,
        count: 1,
        finishNotes: [
          "Main color. Wider at the belly, narrower at the shoulders.",
          "Leave the short neck open; sew the finished head onto that stump.",
        ],
      },
      {
        key: "arm",
        label: "Arm",
        shape: "cylinder",
        geometry: "long thin tube",
        diameterIn: limbDia,
        heightIn: armH,
        count: 2,
        finishNotes: [
          "Stuff lightly so arms stay soft and dangling.",
          "Sew to the upper sides of the body, just below the neck.",
        ],
      },
      {
        key: "leg",
        label: "Leg",
        shape: "cylinder",
        geometry: "long thin tube",
        diameterIn: limbDia * 1.05,
        heightIn: legH,
        count: 2,
        finishNotes: [
          "Slightly longer than the arms. Stuff lightly for a soft dangle.",
          "Sew to the bottom-front of the pear body so they hang below when held.",
        ],
      },
      {
        key: "tail",
        label: "Tail",
        shape: "cone",
        geometry: "tiny teardrop",
        diameterIn: headD * 0.12,
        heightIn: headD * 0.16,
        count: 1,
        finishNotes: ["Optional. Main color; sew low on the back."],
      },
    ];

    const assembly = [
      "QUALITY TARGET: match assets/reference-deer.webp — dangling chibi deer, not a 4-leg standing forest deer.",
      "Crochet head with cream lower face; sew on cream muzzle; add eyes + brows/lashes if desired.",
      "Layer cream inner ears onto outer ears; sew to the upper sides of the head.",
      "Join each tine to a beam; sew branched antlers between the ears.",
      "Crochet the pear body; sew the finished head onto the short neck stump.",
      "Sew two long thin arms at the shoulders so they dangle.",
      "Sew two longer thin legs at the bottom of the body so they hang when the deer is held.",
      "Sew a tiny tail on the lower back (optional).",
    ];

    return {
      parts: parts,
      assembly: assembly,
      heightStack: stack,
      description:
        "Dangling chibi deer: ~" +
        headD.toFixed(1) +
        '" head on ' +
        H.toFixed(1) +
        '" tall — pear body, long thin limbs, cream muzzle, branched antlers.',
      qualityNotes: [
        "Match assets/reference-deer.webp: head ~40–45% of height, vertical pear body, dangling arms & legs (2+2), sew-on cream muzzle.",
        "Colors: medium brown main; cream lower face, muzzle, ear inners, antlers; dark embroidered nose.",
        "Limbs are soft tubes that hang — not four stilts under a horizontal oval body.",
      ],
    };
  }

  function buildAmphibian(analysis, H) {
    const parts = [];
    const assembly = [];
    const headD = balancedHeadDiameter(H, 1, 0.42);
    const bodyD = headD * 0.85;
    const stack = [
      { label: "Body", inches: bodyD },
      { label: "Head", inches: headD },
    ];
    finishHeightStack(stack, H);

    parts.push({
      key: "body",
      label: "Body",
      shape: "sphere",
      diameterIn: bodyD,
      count: 1,
    });
    parts.push({
      key: "head",
      label: "Head",
      shape: "sphere",
      diameterIn: headD,
      count: 1,
    });
    parts.push({
      key: "eye",
      label: "Eye bump",
      shape: "sphere",
      diameterIn: headD * 0.12,
      count: 2,
    });
    parts.push({
      key: "front-leg",
      label: "Front leg",
      shape: "cylinder",
      diameterIn: headD * 0.1,
      heightIn: headD * 0.2,
      count: 2,
    });
    parts.push({
      key: "back-leg",
      label: "Back leg",
      shape: "cylinder",
      diameterIn: headD * 0.12,
      heightIn: headD * 0.25,
      count: 2,
    });

    assembly.push("Sew head to the front/top of the body.");
    assembly.push("Sew eye bumps on top of the head; embroider pupils.");
    assembly.push("Sew shorter front legs and stronger back legs under the body.");

    return {
      parts: parts,
      assembly: assembly,
      heightStack: stack,
      description:
        "Rounded head-dominant " +
        analysis.name +
        " (~" +
        headD.toFixed(1) +
        '" head on ' +
        H.toFixed(1) +
        '" tall).',
    };
  }

  /**
   * Main API: name + height → full animal recipe used by the pattern app.
   * options.photoMetrics — from AmigurumiPhoto.analyzePhoto (optional).
   */
  function generateAnimal(rawName, designedHeightIn, options) {
    options = options || {};
    const photo = options.photoMetrics || null;
    const H = designedHeightIn > 0 ? designedHeightIn : 10;
    const analysis = analyzeName(rawName);
    if (!String(rawName || "").trim()) {
      throw new Error("Type an animal name first (for example: deer, fox, octopus).");
    }

    // UI posture override (when not "auto") — patternRequest silhouette wins
    if (options.bodySilhouette === "CHUBBY_FLOPPY_SEATED") {
      analysis.plan = "sitting";
      analysis.features.sitting = true;
      analysis.features.floppyWaterMammal =
        analysis.features.floppyWaterMammal ||
        includesAny(analysis.name.toLowerCase(), ["otter", "beaver", "seal"]);
      options.shaping = options.shaping === "auto" ? "chubby" : options.shaping;
      options.posture = "sitting";
    } else if (options.bodySilhouette === "SITTING_UPRIGHT_WIDE_HIP") {
      analysis.plan = "sitting";
      analysis.features.sitting = true;
      options.posture = "sitting";
    } else if (options.bodySilhouette === "STANDING_QUADRUPED") {
      analysis.plan = "quadruped";
      options.posture = "quadruped";
    } else if (options.bodySilhouette === "SLENDER_PEAR_NECK_TUBE") {
      if (includesAny(analysis.name.toLowerCase(), ["deer", "fawn", "stag"])) {
        analysis.plan = "biped";
        analysis.features.antlers = true;
        options.posture = "dangling";
      } else {
        analysis.plan = "quadruped";
        options.posture = "quadruped";
      }
    } else if (options.posture === "sitting") {
      analysis.plan = "sitting";
      analysis.features.sitting = true;
    } else if (options.posture === "quadruped") {
      analysis.plan = "quadruped";
    } else if (options.posture === "dangling") {
      analysis.plan = "biped";
      analysis.features.antlers =
        analysis.features.antlers ||
        includesAny(analysis.name.toLowerCase(), ["deer", "fawn", "stag"]);
    }

    // Trunk animals must keep the quadruped recipe (trunk + big ears). Sitting
    // silhouette would silently drop those parts and 3D becomes a teddy blob.
    if (analysis.features.trunk) {
      analysis.plan = "quadruped";
      options.posture = "quadruped";
    }

    let built;
    switch (analysis.plan) {
      case "sitting":
        built = buildSitting(analysis, H, photo, options);
        break;
      case "bird":
        built = buildBird(analysis, H, photo);
        break;
      case "fish":
        built = buildFish(analysis, H);
        break;
      case "serpent":
        built = buildSerpent(analysis, H);
        break;
      case "shelled":
        built = buildShelled(analysis, H);
        break;
      case "insect":
        built = buildInsect(analysis, H);
        break;
      case "cephalopod":
        built = buildCephalopod(analysis, H);
        break;
      case "biped":
        built = buildBiped(analysis, H, photo);
        break;
      case "amphibian":
        built = buildAmphibian(analysis, H);
        break;
      case "quadruped":
      default:
        built = buildQuadruped(analysis, H, photo);
        break;
    }

    if (options.shaping === "chubby" && built.parts) {
      for (let i = 0; i < built.parts.length; i += 1) {
        if (
          built.parts[i].key === "body" ||
          (built.parts[i].shape &&
            String(built.parts[i].shape).indexOf("body") !== -1)
        ) {
          built.parts[i].chubbyBelly = true;
          built.parts[i].heightIn = (built.parts[i].heightIn || built.parts[i].diameterIn || 2) * 1.1;
        }
      }
    }

    if (options.assemblyStyle === "sew" && built.assembly) {
      built.assembly.unshift(
        "Assembly style: sew-on limbs (crochet pieces separately, then sew)."
      );
    } else if (options.assemblyStyle === "partial" && built.assembly) {
      built.assembly.unshift(
        "Assembly style: partial sew — join legs as-you-go when the pattern says; sew remaining pieces."
      );
    } else if (options.assemblyStyle === "jayg" && built.assembly) {
      built.assembly.unshift(
        "Assembly style: no-sew limbs where marked (join-as-you-go through both layers)."
      );
    }

    if (options.patternRequest && built.assembly) {
      built.assembly.unshift(
        "Locked request: " +
          options.patternRequest.animalSpecies +
          " · " +
          options.patternRequest.bodySilhouette +
          " · " +
          options.patternRequest.facialConstructionStyle +
          " · " +
          options.patternRequest.limbAttachmentStyle
      );
    }

    return {
      id: analysis.name.toLowerCase().replace(/\s+/g, "-"),
      name: analysis.name,
      plan: analysis.plan,
      features: analysis.features,
      description: built.description,
      designedHeightIn: H,
      heightStack: built.heightStack,
      parts: built.parts,
      assembly: built.assembly,
      artistNotes: artistConstruction(analysis),
      photoMetrics: photo && photo.applied ? photo : null,
      qualityNotes: built.qualityNotes || null,
      yarnProfile: options.yarnProfile || null,
      patternRequest: options.patternRequest || null,
      buildOptions: {
        posture: options.posture || "auto",
        shaping: options.shaping || "auto",
        assemblyStyle: options.assemblyStyle || "jayg",
        facialConstructionStyle: options.facialConstructionStyle || "auto",
        bodySilhouette: options.bodySilhouette || null,
        limbAttachmentStyle: options.limbAttachmentStyle || null,
      },
    };
  }

  const quickPicks = [
    "Otter",
    "Deer",
    "Unicorn",
    "Hippo",
    "Chinchilla",
    "Fox",
    "Cat",
    "Teddy Bear",
    "Elephant",
    "Giraffe",
    "Owl",
    "Shark",
    "Dragon",
    "Octopus",
    "Turtle",
    "Bunny",
  ];

  global.AmigurumiGenerator = {
    generateAnimal: generateAnimal,
    analyzeName: analyzeName,
    quickPicks: quickPicks,
    titleCase: titleCase,
  };
})(window);
