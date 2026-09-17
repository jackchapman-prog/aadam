/**
 * Amigurumi notebook geometry → round-by-round sc / inc / dec.
 *
 * Designers sketch animals as basic solids (sphere, cylinder, cone, oval),
 * then map size with gauge:
 *   circumference = π × diameter
 *   max stitches  = snap(circumference × SPI, multiple of 6)
 *
 * Classic 6-point schedule (almost every amigurumi notebook):
 *   R1: 6 sc in magic ring
 *   each increase round: +6 sts → 12, 18, 24, 30, 36…
 *   even rounds: sc around at max
 *   decrease rounds: mirror (−6 per round) back toward 6
 *
 * Sphere “round ball” rule (common notebook shortcut):
 *   even rounds ≈ (increase rounds) + 1, then mirror decreases.
 */
(function (global) {
  function snapToMultiple(value, step) {
    step = step || 6;
    if (value < step) return step;
    return Math.max(step, Math.round(value / step) * step);
  }

  function stitchesForDiameter(diameterIn, spi) {
    const circumference = Math.PI * diameterIn;
    return snapToMultiple(circumference * spi, 6);
  }

  function roundsForHeight(heightIn, rpi) {
    return Math.max(1, Math.round(heightIn * rpi));
  }

  function actualDiameterIn(stitches, spi) {
    return stitches / (Math.PI * spi);
  }

  /** Notebook sketch card printed above each piece. */
  function sketchLines(sketch) {
    const lines = [];
    lines.push("📐 Notebook sketch: " + sketch.solid);
    if (sketch.formula) lines.push("   Math: " + sketch.formula);
    if (sketch.schedule) lines.push("   Schedule: " + sketch.schedule);
    if (sketch.notes) lines.push("   Note: " + sketch.notes);
    lines.push("");
    return lines;
  }

  function attachSketch(result, sketch, options) {
    options = options || {};
    result.sketch = sketch;
    if (!options.skip) {
      result.lines = sketchLines(sketch).concat(result.lines);
    }
    return result;
  }

  /** Designer-pattern helpers (All From Jade / Harry-quality write-up). */

  /**
   * CRITICAL MULTIPLIER COUPLING:
   * Repeat multiplier (x6, x8, …) MUST divide the previous round's stitch total.
   * Prefer classic amigurumi 6, then 8, 5, 4, 3, 2.
   */
  function chooseRepeatMultiplier(prevSts, preferred) {
    const n = Math.max(2, Math.round(prevSts));
    const prefs = preferred || [6, 8, 5, 4, 3, 2];
    for (let i = 0; i < prefs.length; i += 1) {
      const m = prefs[i];
      if (m <= n && n % m === 0) return m;
    }
    for (let d = Math.min(8, n); d >= 2; d -= 1) {
      if (n % d === 0) return d;
    }
    return n;
  }

  function planIncAround(prevSts) {
    const prev = Math.round(prevSts);
    const m = chooseRepeatMultiplier(prev);
    const between = prev / m - 1;
    const next = prev + m;
    let instruction;
    if (between <= 0) instruction = "inc x" + m + " (" + next + ")";
    else if (between === 1) instruction = "(sc, inc) x" + m + " (" + next + ")";
    else instruction = "(sc " + between + ", inc) x" + m + " (" + next + ")";
    return {
      prev: prev,
      multiplier: m,
      between: between,
      next: next,
      instruction: instruction,
    };
  }

  function planDecAround(prevSts) {
    const prev = Math.round(prevSts);
    const m = chooseRepeatMultiplier(prev);
    // (sc k, dec) x m consumes m*(k+2) = prev → k = prev/m - 2
    const between = prev / m - 2;
    const next = prev - m;
    let instruction;
    if (between < 0) {
      // Cannot place m decreases evenly — fall back to smaller multiplier
      const m2 = chooseRepeatMultiplier(prev, [4, 3, 2]);
      const b2 = prev / m2 - 2;
      const n2 = prev - m2;
      if (b2 < 0) {
        return {
          prev: prev,
          multiplier: 1,
          between: prev - 2,
          next: prev - 1,
          instruction: Math.max(0, prev - 2) + " sc, dec (" + (prev - 1) + ")",
        };
      }
      const instr =
        b2 <= 0
          ? "dec x" + m2 + " (" + n2 + ")"
          : b2 === 1
            ? "(sc, dec) x" + m2 + " (" + n2 + ")"
            : "(sc " + b2 + ", dec) x" + m2 + " (" + n2 + ")";
      return {
        prev: prev,
        multiplier: m2,
        between: b2,
        next: n2,
        instruction: instr,
      };
    }
    if (between === 0) instruction = "dec x" + m + " (" + next + ")";
    else if (between === 1) instruction = "(sc, dec) x" + m + " (" + next + ")";
    else instruction = "(sc " + between + ", dec) x" + m + " (" + next + ")";
    return {
      prev: prev,
      multiplier: m,
      between: between,
      next: next,
      instruction: instruction,
    };
  }

  /** @deprecated Prefer planIncAround(prev). Kept for call sites that pass (between, next) with implied x6. */
  function scIncAround(scBetween, next) {
    if (arguments.length < 2) {
      return planIncAround(scBetween).instruction;
    }
    // Legacy x6 form — only valid when previous = 6*(scBetween+1)
    if (scBetween <= 0) return "inc x6 (" + next + ")";
    if (scBetween === 1) return "(sc, inc) x6 (" + next + ")";
    return "(sc " + scBetween + ", inc) x6 (" + next + ")";
  }

  function scDecAround(scBetween, next) {
    if (arguments.length < 2) {
      return planDecAround(scBetween).instruction;
    }
    if (scBetween <= 0) return "dec x6 (" + next + ")";
    if (scBetween === 1) return "(sc, dec) x6 (" + next + ")";
    return "(sc " + scBetween + ", dec) x6 (" + next + ")";
  }

  function evenRoundsLine(startRound, count, stitches) {
    if (count <= 1) {
      return startRound + ". sc around (" + stitches + ")";
    }
    const end = startRound + count - 1;
    return (
      startRound +
      "-" +
      end +
      ". sc around (" +
      count +
      " rounds) (" +
      stitches +
      ")"
    );
  }

  /**
   * Rule A — flat-fold limb closure.
   * Last tube round must be even; fold sc = exactly half; optional prep dec if odd.
   */
  function flatFoldPlan(lastRoundSts) {
    let sts = Math.max(4, Math.round(lastRoundSts));
    let prepLine = null;
    if (sts % 2 === 1) {
      const next = sts - 1;
      // One dec (2 sts → 1) + (sts-2) sc uses all sts and yields even next
      prepLine =
        Math.max(0, sts - 2) +
        " sc, dec (" +
        next +
        ")";
      sts = next;
    }
    return {
      lastSts: sts,
      foldSc: sts / 2,
      prepLine: prepLine,
    };
  }

  /**
   * Rule B — oval sole from a foundation chain.
   * R1 uses verified crochet geometry (no math commentary in the instruction).
   * Default Ch 6 → 12 sts form: 4 sc, 3 sc in last, 3 sc return, inc.
   */
  function symmetricOvalFromChain(chLen) {
    let ch = Math.max(5, Math.round(chLen));
    // Prefer even chain length so (ch−2)/(ch−3) tip form stays clean
    if (ch < 6) ch = 6;

    const firstPass = ch - 2; // ≤ ch−2 (exact max)
    const returnPass = ch - 3; // opposite side before tip inc
    if (firstPass > ch - 2 || returnPass > ch - 2) {
      throw new Error("Oval foundation: linear side exceeds ch−2");
    }
    // Produce: firstPass + 3 + returnPass + 2 (inc) = 2*ch
    const r1 = firstPass + 3 + returnPass + 2;
    const rounds = [];

    rounds.push({
      produce: r1,
      consume: 0,
      ch: ch,
      firstPassLoops: firstPass,
      returnPassLoops: returnPass,
      instruction:
        "Ch " +
        ch +
        ". Starting in 2nd ch from hook: " +
        firstPass +
        " sc, 3 sc in the last ch. Working along the opposite side of the foundation chain: " +
        returnPass +
        " sc, inc (" +
        r1 +
        ")",
    });

    // R2–R4: +6 each on the tip radiuses (consume prior total exactly)
    const side2 = Math.floor((r1 - 6) / 2); // for r1=12 → side 3
    const r2 = r1 + 6;
    rounds.push({
      produce: r2,
      consume: r1,
      instruction: "(3 inc, " + side2 + " sc) x2 (" + r2 + ")",
    });
    const side3 = side2 + 3;
    const r3 = r2 + 6;
    rounds.push({
      produce: r3,
      consume: r2,
      instruction: "(3 inc, " + side3 + " sc) x2 (" + r3 + ")",
    });
    const side4 = side2 + 6;
    const r4 = r3 + 6;
    rounds.push({
      produce: r4,
      consume: r3,
      instruction: "(3 inc, " + side4 + " sc) x2 (" + r4 + ")",
    });

    return {
      ch: ch,
      side: side2,
      firstPassLoops: firstPass,
      returnPassLoops: returnPass,
      soleMax: r4,
      rounds: rounds,
    };
  }

  /**
   * Sitting body leg JAYG — legs on hips; wide back, medium front.
   * Identity: backGap + legA + frontGap + legB === totalSts.
   * Instruction text is crochet-only (no equation commentary).
   */
  function sittingHipLegJoinPlan(totalSts, legJoinSts) {
    let total = Math.round(totalSts);
    let leg = Math.round(legJoinSts);
    while (leg * 2 + 8 > total && leg > 4) {
      leg -= 1;
    }
    const remain = total - leg * 2;
    let frontGap = Math.floor(remain / 2);
    let backGap = remain - frontGap;
    if (frontGap >= 8 && backGap <= frontGap) {
      const shift = Math.max(2, Math.round(frontGap * 0.2));
      if (frontGap - shift >= 6) {
        frontGap -= shift;
        backGap += shift;
      }
    }
    if (total === 36 && leg === 8) {
      backGap = 12;
      frontGap = 8;
    }
    const sum = backGap + leg + frontGap + leg;
    if (sum !== total) {
      backGap += total - sum;
    }
    return {
      total: total,
      legJoin: leg,
      backGap: backGap,
      frontGap: frontGap,
      instruction:
        backGap +
        " sc, " +
        leg +
        " sc with leg, " +
        frontGap +
        " sc, " +
        leg +
        " sc with leg (" +
        total +
        ")",
      placement:
        "Start this round at the back (wider gap for the tail). Legs sit on the outer hips; the smaller gap is the front chest.",
    };
  }

  /**
   * Face-shaping round on a sphere: consume == produce == stitches.
   * Kaya form: back sc, (1 sc, inc) xN, N dec, mid sc, N dec, (inc, 1 sc) xN, back sc.
   */
  function faceShapingRoundPlan(stitches, scale) {
    const s = scale != null ? scale : stitches / 48;
    let backSc = Math.max(4, Math.round(6 * s));
    let groups = Math.max(2, Math.round(4 * s));
    // groups == decs keeps produce == consume when mid is solved for consume
    let mid = stitches - 2 * backSc - 8 * groups;
    let guard = 0;
    while ((mid < 1 || mid > stitches / 2) && guard < 12) {
      guard += 1;
      if (mid < 1 && groups > 2) {
        groups -= 1;
      } else if (mid < 1 && backSc > 3) {
        backSc -= 1;
      } else if (mid > stitches / 2 && backSc < stitches / 4) {
        backSc += 1;
      } else {
        break;
      }
      mid = stitches - 2 * backSc - 8 * groups;
    }
    if (stitches === 36) {
      backSc = 5;
      groups = 3;
      mid = 2;
    }
    if (stitches === 48) {
      backSc = 6;
      groups = 4;
      mid = 4;
    }
    if (mid < 1) mid = 1;
    const decs = groups;
    return {
      instruction:
        backSc +
        " sc, (1 sc, inc) x" +
        groups +
        ", " +
        decs +
        " dec, " +
        mid +
        " sc, " +
        decs +
        " dec, (inc, 1 sc) x" +
        groups +
        ", " +
        backSc +
        " sc (" +
        stitches +
        ")",
      backSc: backSc,
      groups: groups,
      decs: decs,
      mid: mid,
    };
  }

  /**
   * Chain-bridge two-leg join (Harry hippo style).
   * Total_Body_Sts = (Limbs_Final_Round_Sts * 2) + (Chain_Bridge_Count * 2).
   * Every stitch of each limb final round is worked — no leftover unworked sts.
   */
  function chainBridgeJoinPlan(limbFinalSts, chainBridge) {
    const L = Math.max(4, Math.round(limbFinalSts));
    const B = Math.max(1, Math.round(chainBridge != null ? chainBridge : 2));
    const total = L * 2 + B * 2;
    return {
      limbFinal: L,
      chainBridge: B,
      total: total,
      instruction:
        "sc in each st around leg 2 (" +
        L +
        "), ch " +
        B +
        ", sc in each st around leg 1 (" +
        L +
        "), sc in each of the " +
        B +
        " chains (" +
        total +
        ")",
      placement:
        "Work every stitch of each leg's last round. Do not skip limb stitches on the join.",
    };
  }

  /**
   * Rule C — hollow 3D spiral cone ear (+3 or +6 per round from MR).
   */
  function buildConeEarPlan(scale, options) {
    options = options || {};
    const step = options.incStep === 3 ? 3 : 6;
    let tip = options.startMr != null ? options.startMr : step === 3 ? 4 : 6;
    if (step === 6 && tip % 6 !== 0) tip = 6;
    if (step === 3 && tip !== 4 && tip !== 6) tip = 4;

    const targetBase = Math.max(
      tip + step,
      Math.round((options.baseSts != null ? options.baseSts : 12) * (scale || 1))
    );
    const rounds = [];
    let sts = tip;
    rounds.push({
      produce: sts,
      instruction: sts + " sc in MR (" + sts + ")",
    });

    while (sts + step <= targetBase + step - 1 && sts < targetBase) {
      if (step === 6) {
        // Multiplier must divide previous count (tip forced to multiple of 6 above)
        const inc = planIncAround(sts);
        let next = inc.next;
        if (next > targetBase) {
          const add = targetBase - sts;
          next = targetBase;
          rounds.push({
            produce: next,
            instruction:
              "sc around, placing " + add + " evenly spaced inc (" + next + ")",
          });
        } else {
          rounds.push({
            produce: next,
            instruction: inc.instruction,
          });
        }
        sts = next;
      } else {
        // +3: three increase points — consume must equal sts
        const group = Math.floor(sts / 3);
        const between = group - 1;
        const next = sts + 3;
        if (between <= 0) {
          // e.g. from 3: (inc) x3; from 4–5 use mixed — we start at 6
          rounds.push({
            produce: next,
            instruction: "(inc) x3 (" + next + ")",
          });
        } else {
          rounds.push({
            produce: next,
            instruction:
              between === 1
                ? "(sc, inc) x3 (" + next + ")"
                : "(sc " + between + ", inc) x3 (" + next + ")",
          });
        }
        sts = next;
      }
      if (sts >= targetBase) break;
    }

    const even = Math.max(1, Math.round(2 * (scale || 1)));
    return { tip: tip, base: sts, even: even, step: step, rounds: rounds };
  }

  /**
   * Even rounds at max stitch count = vertical height of the belly.
   * Increase→decrease with almost no even rounds makes a flat pancake.
   * Notebook “round ball” floor: about (inc rounds) even rounds at the widest.
   * Sitting bodies can be a bit squatter, but never starve the belly of height.
   */
  function sittingBellyEvenRounds(maxStitches, gauge, options) {
    options = options || {};
    const incRounds = Math.max(2, maxStitches / 6);
    const sphereFloor = Math.round(incRounds + 1);
    const sittingFloor = Math.max(3, Math.round(sphereFloor * 0.85));
    const heightIn =
      options.heightIn ||
      (options.diameterIn ? options.diameterIn * 0.78 : 0);
    let fromHeight = sittingFloor;
    if (heightIn > 0 && gauge.rpi) {
      const total = roundsForHeight(heightIn, gauge.rpi);
      fromHeight = Math.max(sittingFloor, Math.round(total * 0.45));
    }
    // Engine rule: never fewer than 3–6 volume rounds (anti-pancake)
    const minVol =
      typeof global.AmigurumiPatternMath !== "undefined" &&
      global.AmigurumiPatternMath.minVolumeEvenRounds
        ? global.AmigurumiPatternMath.minVolumeEvenRounds(
            maxStitches,
            gauge.rpi,
            options.minBellyEven || 3
          )
        : Math.max(3, options.minBellyEven || 3);
    const n = Math.max(sittingFloor, Math.min(sphereFloor + 2, fromHeight));
    return Math.max(minVol, n);
  }

  /**
   * Build increase ladder from 6 using coupled multipliers (xN must divide previous count).
   * Optional stagger on later rounds reduces the hex look.
   */
  function buildIncreaseRounds(maxStitches) {
    const rounds = [];
    let stitches = 6;
    let roundNum = 1;

    rounds.push({
      round: roundNum,
      stitches: stitches,
      instruction: "R" + roundNum + ": Magic ring, 6 sc. (" + stitches + ")",
    });

    while (stitches < maxStitches) {
      roundNum += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      let instruction;
      if (next > maxStitches) {
        const add = maxStitches - stitches;
        next = maxStitches;
        instruction =
          "R" +
          roundNum +
          ": Sc around, placing " +
          add +
          " evenly spaced inc. (" +
          next +
          ")";
      } else if (inc.between <= 0) {
        instruction =
          "R" + roundNum + ": Inc in each st around. (" + next + ")";
      } else if (inc.between === 1) {
        instruction = "R" + roundNum + ": (Sc, inc) around. (" + next + ")";
      } else if (inc.between >= 4 && inc.multiplier === 6) {
        // Stagger only for classic x6 (smoother sphere; still consumes prev)
        const half = Math.floor(inc.between / 2);
        instruction =
          "R" +
          roundNum +
          ": " +
          half +
          " sc, inc, (" +
          inc.between +
          " sc, inc) 5 times, " +
          (inc.between - half) +
          " sc. (" +
          next +
          ")";
      } else {
        instruction =
          "R" +
          roundNum +
          ": " +
          inc.instruction.replace(/ \(\d+\)$/, "") +
          ". (" +
          next +
          ")";
      }
      stitches = next;
      rounds.push({ round: roundNum, stitches: stitches, instruction: instruction });
    }

    return rounds;
  }

  function buildDecreaseRounds(startStitches, startRoundNum) {
    const rounds = [];
    let stitches = startStitches;
    let roundNum = startRoundNum;

    while (stitches > 6) {
      roundNum += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      let instruction;
      if (next < 6) {
        next = 6;
        instruction =
          "R" + roundNum + ": Decrease evenly to 6. (" + next + ")";
      } else if (dec.between <= 0) {
        instruction = "R" + roundNum + ": Dec around. (" + next + ")";
      } else if (dec.between === 1) {
        instruction = "R" + roundNum + ": (Sc, dec) around. (" + next + ")";
      } else if (dec.between >= 4 && dec.multiplier === 6) {
        const half = Math.floor(dec.between / 2);
        instruction =
          "R" +
          roundNum +
          ": " +
          half +
          " sc, dec, (" +
          dec.between +
          " sc, dec) 5 times, " +
          (dec.between - half) +
          " sc. (" +
          next +
          ")";
      } else {
        instruction =
          "R" +
          roundNum +
          ": " +
          dec.instruction.replace(/ \(\d+\)$/, "") +
          ". (" +
          next +
          ")";
      }
      stitches = next;
      rounds.push({ round: roundNum, stitches: stitches, instruction: instruction });
    }

    return rounds;
  }

  function buildSpherePattern(name, diameterIn, gauge, options) {
    options = options || {};
    const close = options.close !== false;
    const stuffNote = options.stuffNote !== false;
    const maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    const increases = buildIncreaseRounds(maxStitches);
    const decreaseCount = close ? Math.max(0, increases.length - 1) : 0;
    // Size from YOUR gauge: total rounds ≈ diameter × rounds-per-inch
    const totalRoundsTarget = roundsForHeight(diameterIn, gauge.rpi);
    const evenFromGauge = Math.max(
      1,
      totalRoundsTarget - increases.length - decreaseCount
    );
    // Notebook “round ball” hint (inc rounds + 1) — use the larger so the ball isn’t flat
    const evenNeeded = Math.max(evenFromGauge, increases.length + 1);

    const lines = [];
    let roundNum = 0;

    lines.push("### " + name);
    lines.push(
      "Target ~" +
        diameterIn.toFixed(2) +
        " in diameter · " +
        maxStitches +
        " sts at widest (about " +
        actualDiameterIn(maxStitches, gauge.spi).toFixed(2) +
        " in at " +
        gauge.spi +
        " spi / " +
        gauge.rpi +
        " rpi)"
    );
    lines.push("");

    for (let i = 0; i < increases.length; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
    }

    for (let i = 0; i < evenNeeded; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + maxStitches + ")");
    }

    if (stuffNote) {
      lines.push("");
      lines.push("Stuff firmly as you close.");
      lines.push("");
    }

    if (close) {
      const decreases = buildDecreaseRounds(maxStitches, roundNum);
      for (let i = 0; i < decreases.length; i += 1) {
        lines.push(decreases[i].instruction);
        roundNum = decreases[i].round;
      }
      roundNum += 1;
      lines.push(
        "R" +
          roundNum +
          ": Dec around until closed (or fasten off and weave opening shut)."
      );
    }

    lines.push("");
    lines.push("Fasten off. Weave in ends.");
    lines.push("");

    return attachSketch(
      {
        name: name,
        maxStitches: maxStitches,
        lines: lines,
        lastRound: roundNum,
        geometry: "sphere",
      },
      {
        solid: "Sphere (ball)",
        formula:
          "max sts = round(pi x " +
          diameterIn.toFixed(2) +
          " in x " +
          gauge.spi +
          " spi) -> " +
          maxStitches +
          " (multiple of 6); even rounds from " +
          gauge.rpi +
          " rpi",
        schedule:
          "6 sc MR -> +6/round to " +
          maxStitches +
          " -> " +
          evenNeeded +
          " even rounds -> mirror -6/round",
        notes: "Widest stitch count follows SPI; round count follows RPI.",
      }
    );
  }

  /**
   * Cone: increase by 6 each round (or slower) with NO decrease — horns, snouts tip, spikes.
   */
  function buildConePattern(name, baseDiameterIn, heightIn, gauge) {
    const baseStitches = stitchesForDiameter(baseDiameterIn, gauge.spi);
    const heightRounds = Math.max(3, roundsForHeight(heightIn, gauge.rpi));
    // Spread increases across height so it tapers instead of making a flat circle then tube
    const increaseRounds = Math.max(2, baseStitches / 6);
    const evenAfter = Math.max(0, heightRounds - increaseRounds);

    const increases = buildIncreaseRounds(baseStitches);
    const lines = [];
    let roundNum = 0;

    lines.push("### " + name);
    lines.push(
      "Cone · base ~" +
        baseDiameterIn.toFixed(2) +
        " in · height ~" +
        heightIn.toFixed(2) +
        " in · " +
        baseStitches +
        " sts at base"
    );
    lines.push("");

    // Use only as many early increase rounds as fit the height, then even
    const useInc = Math.min(increases.length, Math.max(2, Math.round(increaseRounds)));
    for (let i = 0; i < useInc; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
    }
    let stitches = increases[useInc - 1].stitches;

    // If we stopped early, jump remaining incs with a note, or work even at current then one jump
    while (stitches < baseStitches) {
      roundNum += 1;
      const next = Math.min(baseStitches, stitches + 6);
      lines.push(
        "R" +
          roundNum +
          ": Sc around, placing " +
          (next - stitches) +
          " evenly spaced inc. (" +
          next +
          ")"
      );
      stitches = next;
    }

    for (let i = 0; i < evenAfter; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push(
      "Lightly stuff. Fasten off, leaving a long tail for sewing. (Cone = increases, little or no decrease.)"
    );
    lines.push("");

    return attachSketch(
      {
        name: name,
        maxStitches: stitches,
        lines: lines,
        lastRound: roundNum,
        geometry: "cone",
      },
      {
        solid: "Cone",
        formula:
          "base sts = pi x " +
          baseDiameterIn.toFixed(2) +
          " in x spi -> " +
          baseStitches +
          "; height rounds ~ " +
          heightIn.toFixed(2) +
          " in x rpi",
        schedule: "6 sc MR -> +6/round toward base width -> even rounds for length (no close)",
        notes: "Use for horns, spikes, tapered snout tips, ear tips.",
      }
    );
  }

  /**
   * Head worked from the nose tip back (nose is NOT a separate sew-on piece).
   * Geometry: small cone/cylinder snout → sphere head (one continuous piece).
   */
  function buildHeadFromNosePattern(
    name,
    headDiameterIn,
    snoutLengthIn,
    gauge
  ) {
    const headStitches = stitchesForDiameter(headDiameterIn, gauge.spi);
    const snoutStitches = snapToMultiple(
      Math.max(6, Math.round(headStitches * 0.4)),
      6
    );
    const snoutRounds = Math.max(2, roundsForHeight(snoutLengthIn, gauge.rpi));
    const headEven = Math.max(
      2,
      roundsForHeight(headDiameterIn * 0.45, gauge.rpi)
    );

    const lines = [];
    let roundNum = 0;
    let stitches = 0;

    lines.push("### " + name);
    lines.push(
      "Worked nose → snout → head as ONE piece (no separate muzzle to sew on)."
    );
    lines.push(
      "Target head ~" +
        headDiameterIn.toFixed(2) +
        '" · snout ~' +
        snoutLengthIn.toFixed(2) +
        '" long'
    );
    lines.push("");

    // Nose tip
    const noseStart = buildIncreaseRounds(snoutStitches);
    for (let i = 0; i < noseStart.length; i += 1) {
      lines.push(noseStart[i].instruction);
      roundNum = noseStart[i].round;
      stitches = noseStart[i].stitches;
    }

    lines.push("");
    lines.push("Snout:");
    lines.push("");
    for (let i = 0; i < snoutRounds; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push("Widen into the head:");
    lines.push("");

    while (stitches < headStitches) {
      roundNum += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > headStitches) {
        const add = headStitches - stitches;
        next = headStitches;
        lines.push(
          "R" +
            roundNum +
            ": Sc around, placing " +
            add +
            " evenly spaced inc. (" +
            next +
            ")"
        );
      } else {
        lines.push(
          "R" +
            roundNum +
            ": " +
            inc.instruction.replace(/ \(\d+\)$/, "") +
            ". (" +
            next +
            ")"
        );
      }
      stitches = next;
    }

    for (let i = 0; i < headEven; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push("Stuff the snout and head firmly. Close the back of the head:");
    lines.push("");

    const decreases = buildDecreaseRounds(stitches, roundNum);
    for (let i = 0; i < decreases.length; i += 1) {
      lines.push(decreases[i].instruction);
      roundNum = decreases[i].round;
    }
    roundNum += 1;
    lines.push(
      "R" +
        roundNum +
        ": Dec around until closed (or fasten off and weave opening shut)."
    );
    lines.push("");
    lines.push(
      "Fasten off. Embroider nostrils / nose tip on the front if desired. Weave in ends."
    );
    lines.push("");

    return {
      name: name,
      maxStitches: headStitches,
      lines: lines,
      lastRound: roundNum,
    };
  }

  /**
   * Body + neck as ONE piece, with a separate closed head sewn on later.
   * Common for deer/horse/dog: finish a round head on its own, sew it onto the neck stump.
   */
  function buildBodyWithNeckPattern(
    name,
    bodyLengthIn,
    bodyDiameterIn,
    neckLengthIn,
    gauge
  ) {
    const bodyStitches = stitchesForDiameter(bodyDiameterIn, gauge.spi);
    const neckStitches = snapToMultiple(
      Math.max(12, Math.round(bodyStitches * 0.5)),
      6
    );
    const bodyRounds = Math.max(4, roundsForHeight(bodyLengthIn, gauge.rpi));
    const neckRounds = Math.max(2, roundsForHeight(neckLengthIn, gauge.rpi));

    const increases = buildIncreaseRounds(bodyStitches);
    const lines = [];
    let roundNum = 0;
    let stitches = 0;

    lines.push("### " + name);
    lines.push(
      "Target body ~" +
        bodyLengthIn.toFixed(2) +
        '" long × ' +
        bodyDiameterIn.toFixed(2) +
        '" thick · neck ~' +
        neckLengthIn.toFixed(2) +
        '" (one piece)'
    );
    lines.push(
      "Start at the rear, work the body, then continue into the neck. Leave the neck open and sew a separate closed head on top."
    );
    lines.push("");

    for (let i = 0; i < increases.length; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
      stitches = increases[i].stitches;
    }

    lines.push("");
    lines.push("Body (work even — keep the shape long, not round):");
    lines.push("");

    for (let i = 0; i < bodyRounds; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push("Stuff the body firmly as you go. Begin neck (still attached — do not fasten off):");
    lines.push("");

    while (stitches > neckStitches) {
      roundNum += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < neckStitches) {
        next = neckStitches;
        lines.push(
          "R" +
            roundNum +
            ": Decrease evenly to " +
            next +
            ". (" +
            next +
            ")"
        );
      } else {
        lines.push(
          "R" +
            roundNum +
            ": " +
            dec.instruction.replace(/ \(\d+\)$/, "") +
            ". (" +
            next +
            ")"
        );
      }
      stitches = next;
    }

    for (let i = 0; i < neckRounds; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push(
      "Do not close the neck. Lightly stuff the neck. Fasten off, leaving a long tail to sew the separate head onto this opening."
    );
    lines.push("");

    return {
      name: name,
      maxStitches: bodyStitches,
      lines: lines,
      lastRound: roundNum,
    };
  }

  function buildCylinderPattern(name, diameterIn, heightIn, gauge, options) {
    options = options || {};
    const closeBottom = options.closeBottom !== false;
    const stuffNote = options.stuffNote !== false;
    const maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    const evenRounds = roundsForHeight(heightIn, gauge.rpi);

    const increases = buildIncreaseRounds(maxStitches);
    const lines = [];
    let roundNum = 0;

    lines.push("### " + name);
    lines.push(
      "Target ~" +
        diameterIn.toFixed(2) +
        '" wide × ' +
        heightIn.toFixed(2) +
        '" tall · ' +
        maxStitches +
        " sts"
    );
    lines.push("");

    for (let i = 0; i < increases.length; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
    }

    if (closeBottom && increases.length > 1) {
      lines.push("");
      lines.push(
        "(Optional: work into back loops only on next round for a flat base.)"
      );
      lines.push("");
    }

    for (let i = 0; i < evenRounds; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + maxStitches + ")");
    }

    if (stuffNote) {
      lines.push("");
      lines.push("Lightly stuff before fastening off.");
    }

    lines.push("");
    lines.push("Fasten off, leaving a long tail for sewing.");
    lines.push("");

    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: roundNum,
    };
  }

  function buildDomePattern(name, diameterIn, gauge) {
    const maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    const increases = buildIncreaseRounds(maxStitches);
    const evenRounds = Math.max(1, Math.round(increases.length * 0.35));
    const lines = [];
    let roundNum = 0;

    lines.push("### " + name);
    lines.push(
      "Target ~" + diameterIn.toFixed(2) + '" across · ' + maxStitches + " sts"
    );
    lines.push("");

    for (let i = 0; i < increases.length; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
    }

    for (let i = 0; i < evenRounds; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + maxStitches + ")");
    }

    lines.push("");
    lines.push("Do not stuff. Flatten and sew to head.");
    lines.push("Fasten off, leaving a long tail for sewing.");
    lines.push("");

    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: roundNum,
    };
  }

  /**
   * Elongated body (deer/horse torso): oval tube worked from a foundation chain.
   * `lengthIn` = nose-to-hip length, `diameterIn` = chest thickness/height.
   */
  function buildElongatedBodyPattern(name, lengthIn, diameterIn, gauge) {
    const around = stitchesForDiameter(diameterIn, gauge.spi);
    // Foundation chain covers roughly half the oval; must be at least 4.
    const chainLen = Math.max(4, Math.round(around / 2) - 1);
    // After working both sides + end bumps, stitch count is about 2*(chainLen-1) + 6
    // Adjust even work to the snapped `around` count with a plain sc round if needed.
    const lengthRounds = roundsForHeight(lengthIn, gauge.rpi);
    const lines = [];
    let roundNum = 1;
    let stitches = around;

    lines.push("### " + name);
    lines.push(
      "Target ~" +
        lengthIn.toFixed(2) +
        '" long × ' +
        diameterIn.toFixed(2) +
        '" thick · ~' +
        around +
        " sts around"
    );
    lines.push(
      "(This is an elongated torso — not a ball. Worked from a chain, not a magic ring.)"
    );
    lines.push("");

    lines.push(
      "R" +
        roundNum +
        ": Ch " +
        chainLen +
        ". Sc in 2nd ch from hook and in each ch across (" +
        (chainLen - 1) +
        " sc). Work 3 more sc in last ch. Working along the opposite side of the chain, sc in each ch (" +
        (chainLen - 2) +
        " sc), 2 sc in first ch. (" +
        (2 * (chainLen - 1) + 4) +
        ")"
    );

    const afterFoundation = 2 * (chainLen - 1) + 4;
    roundNum += 1;

    // Nudge to target stitch count with evenly spaced incs/decs if needed
    if (afterFoundation !== around) {
      const diff = around - afterFoundation;
      if (diff > 0) {
        lines.push(
          "R" +
            roundNum +
            ": Sc around, placing " +
            diff +
            " evenly spaced inc. (" +
            around +
            ")"
        );
      } else {
        lines.push(
          "R" +
            roundNum +
            ": Sc around, placing " +
            Math.abs(diff) +
            " evenly spaced dec. (" +
            around +
            ")"
        );
      }
      stitches = around;
    } else {
      lines.push("R" + roundNum + ": Sc around. (" + around + ")");
      stitches = around;
    }

    const evenCount = Math.max(lengthRounds - 1, 3);
    for (let i = 0; i < evenCount; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push(
      "Stuff firmly as you go, keeping the shape long (sausage-like), not round."
    );
    lines.push("");
    lines.push(
      "Next rounds — close one end: dec evenly until 6–8 sts remain, fasten off, and weave shut."
    );
    lines.push("Leave a long tail if you will sew this end to the neck.");
    lines.push("");

    return {
      name: name,
      maxStitches: stitches,
      lines: lines,
      lastRound: roundNum,
    };
  }

  /**
   * Short protruding snout: small start, quick increases, few even rounds.
   */
  function buildSnoutPattern(name, lengthIn, diameterIn, gauge) {
    const maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    const startStitches = Math.max(6, snapToMultiple(maxStitches / 2, 6));
    const evenRounds = Math.max(2, roundsForHeight(lengthIn, gauge.rpi));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push("Cream / contrast color. Sew-on muzzle — lightly stuffed.");
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < startStitches) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    while (stitches < maxStitches) {
      r += 1;
      const next = Math.min(maxStitches, stitches + 6);
      const add = next - stitches;
      lines.push(
        r +
          ". sc around, placing " +
          add +
          " evenly spaced inc (" +
          next +
          ")"
      );
      stitches = next;
    }
    lines.push(evenRoundsLine(r + 1, evenRounds, stitches));
    r = r + evenRounds;
    lines.push(
      "Lightly stuff. Fasten off, leaving a long sewing tail. Sew centered on the lower face; embroider a small dark horizontal nose + short vertical mouth line."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: stitches,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  /**
   * Bird: head and body as ONE piece (start at crown, continue into body, close at bottom).
   * Beak is embroidered later — not a separate crochet snout.
   */
  function buildBirdHeadBodyPattern(name, headDiameterIn, bodyDiameterIn, gauge) {
    const headStitches = stitchesForDiameter(headDiameterIn, gauge.spi);
    const bodyStitches = stitchesForDiameter(bodyDiameterIn, gauge.spi);
    const headEven = Math.max(2, roundsForHeight(headDiameterIn * 0.5, gauge.rpi));
    const bodyEven = Math.max(3, roundsForHeight(bodyDiameterIn * 0.65, gauge.rpi));

    const increases = buildIncreaseRounds(headStitches);
    const lines = [];
    let roundNum = 0;
    let stitches = 0;

    lines.push("### " + name);
    lines.push(
      "Head & body as ONE piece. Embroider the beak on the face when finishing — do not crochet a separate snout."
    );
    lines.push(
      "Target head ~" +
        headDiameterIn.toFixed(2) +
        '" · body ~' +
        bodyDiameterIn.toFixed(2) +
        '"'
    );
    lines.push("");

    for (let i = 0; i < increases.length; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
      stitches = increases[i].stitches;
    }

    for (let i = 0; i < headEven; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push("Continue into the body (do not fasten off):");
    lines.push("");

    while (stitches < bodyStitches) {
      roundNum += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > bodyStitches) {
        const add = bodyStitches - stitches;
        next = bodyStitches;
        lines.push(
          "R" +
            roundNum +
            ": Sc around, placing " +
            add +
            " evenly spaced inc. (" +
            next +
            ")"
        );
      } else {
        lines.push(
          "R" +
            roundNum +
            ": " +
            inc.instruction.replace(/ \(\d+\)$/, "") +
            ". (" +
            next +
            ")"
        );
      }
      stitches = next;
    }

    for (let i = 0; i < bodyEven; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push("Stuff firmly. Close the bottom of the body:");
    lines.push("");

    const decreases = buildDecreaseRounds(stitches, roundNum);
    for (let i = 0; i < decreases.length; i += 1) {
      lines.push(decreases[i].instruction);
      roundNum = decreases[i].round;
    }
    roundNum += 1;
    lines.push(
      "R" +
        roundNum +
        ": Dec around until closed (or fasten off and weave opening shut)."
    );
    lines.push("");
    lines.push("Fasten off. Weave in ends.");
    lines.push("");

    return {
      name: name,
      maxStitches: bodyStitches,
      lines: lines,
      lastRound: roundNum,
    };
  }

  /**
   * Flat triangle ear (turning rows) — cats/kittens, not a stuffed dome.
   */
  function buildFlatEarPattern(name, baseWidthIn, gauge, options) {
    options = options || {};
    const dualColor = options.dualColor !== false;
    const baseSts = Math.max(5, Math.round(baseWidthIn * gauge.spi));
    const rows = Math.max(4, baseSts - 1);
    const lines = [];

    lines.push("### " + name);
    lines.push(
      "Flat ear (turning rows) · base ~" +
        baseWidthIn.toFixed(2) +
        " in · ~" +
        baseSts +
        " sts — NOT a stuffed sphere/dome."
    );
    lines.push("");

    if (dualColor) {
      lines.push("Make 4 panels: 2 main color + 2 contrasting inner color.");
      lines.push("Crochet each panel in turning rows:");
    } else {
      lines.push("Make 2. Crochet in turning rows:");
    }
    lines.push("");
    lines.push(
      "R1: Ch " +
        (baseSts + 1) +
        ", turn, " +
        baseSts +
        " sc across. (" +
        baseSts +
        ")"
    );
    let sts = baseSts;
    for (let r = 2; r <= rows; r += 1) {
      sts = Math.max(2, sts - 1);
      lines.push("R" + r + ": Ch 1, turn, " + sts + " sc. (" + sts + ")");
    }
    lines.push("Fasten off.");
    lines.push("");
    if (dualColor) {
      lines.push(
        "Stack inner color on main color. Sc around through both layers to join (leave a long tail for sewing)."
      );
    } else {
      lines.push("Leave a long tail for sewing. Do not stuff.");
    }
    lines.push("");

    return attachSketch(
      {
        name: name,
        maxStitches: baseSts,
        lines: lines,
        lastRound: rows,
        geometry: "flat triangle (turning rows)",
      },
      {
        solid: "Flat ear",
        formula: "Turning-row triangle from a short chain — not MR increases.",
        schedule: "Chain base → sc rows decreasing to a tip → join two panels",
        notes: "Designer cats use flat layered ears, not dome balls.",
      }
    );
  }

  /**
   * Sitting-animal leg: oval foot from a chain, then tube, Rule A fold-close.
   */
  function buildSittingLegPattern(name, footLenIn, heightIn, gauge, options) {
    options = options || {};
    const ch = Math.max(6, Math.round(Math.max(4, footLenIn * gauge.spi)));
    const oval = symmetricOvalFromChain(ch);
    let tube = Math.max(12, Math.min(18, snapToMultiple(Math.round(oval.soleMax * 0.55), 2)));
    if (tube % 2 === 1) tube -= 1;
    const tubeRounds = Math.max(4, roundsForHeight(heightIn * 0.65, gauge.rpi));
    const taper = taperStsToTube(oval.soleMax, tube);
    const fold = flatFoldPlan(tube);
    const lines = [];
    let r = 0;

    lines.push(name + (options.countNote || " (make 2)"));
    lines.push("Start from a chain oval sole, then work the leg tube.");
    lines.push("");
    for (let i = 0; i < oval.rounds.length; i += 1) {
      r = i + 1;
      lines.push(r + ". " + oval.rounds[i].instruction);
    }
    r += 1;
    lines.push(r + ". " + oval.soleMax + " sc blo (" + oval.soleMax + ")");
    lines.push("Change to main color here if using a contrasting sole.");
    lines.push(evenRoundsLine(r + 1, 2, oval.soleMax));
    r = r + 2;
    for (let i = 0; i < taper.steps.length; i += 1) {
      r += 1;
      lines.push(r + ". " + taper.steps[i].instruction);
    }
    lines.push(evenRoundsLine(r + 1, tubeRounds, tube));
    r = r + tubeRounds;
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold in half and crochet " +
        fold.foldSc +
        " sc through both sides. Stuff the foot firmly; leave ready to join into the body."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: oval.soleMax,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: fold.foldSc,
      lastTubeStitches: fold.lastSts,
      geometry: "oval foot + tube",
    };
  }

  /**
   * Round MR foot + tube (teddy / classic sitting bear) — Rule A fold-close.
   */
  function buildRoundFootLegPattern(name, footDiameterIn, heightIn, gauge) {
    let footSts = stitchesForDiameter(footDiameterIn, gauge.spi);
    footSts = snapToMultiple(Math.max(18, footSts), 6);
    let tubeSts = snapToMultiple(Math.max(12, Math.round(footSts * 0.5)), 2);
    if (tubeSts % 2 === 1) tubeSts -= 1;
    const tubeRounds = Math.max(5, roundsForHeight(heightIn * 0.55, gauge.rpi));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name + " (make 2)");
    lines.push("Round-foot sitting leg — MR foot (teddy style).");
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < footSts) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    lines.push(evenRoundsLine(r + 1, 2, stitches));
    r = r + 2;

    while (stitches > tubeSts) {
      r += 1;
      const dec = planDecAround(stitches);
      if (dec.next >= tubeSts) {
        lines.push(r + ". " + dec.instruction);
        stitches = dec.next;
      } else {
        const taper = taperStsToTube(stitches, tubeSts);
        for (let i = 0; i < taper.steps.length; i += 1) {
          if (i > 0) r += 1;
          lines.push(r + ". " + taper.steps[i].instruction);
        }
        stitches = tubeSts;
        break;
      }
    }

    lines.push(evenRoundsLine(r + 1, tubeRounds, stitches));
    r = r + tubeRounds;
    const fold = flatFoldPlan(stitches);
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold in half and crochet " +
        fold.foldSc +
        " sc through both sides. Stuff firmly; leave ready to join into the body."
    );
    lines.push("");

    return {
      name: name,
      maxStitches: footSts,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: fold.foldSc,
      lastTubeStitches: fold.lastSts,
      geometry: "round foot + tube",
    };
  }

  function buildSittingArmPattern(name, diameterIn, heightIn, gauge) {
    let around = snapToMultiple(
      Math.max(12, Math.min(18, stitchesForDiameter(diameterIn, gauge.spi))),
      6
    );
    const evenRounds = Math.max(6, roundsForHeight(heightIn, gauge.rpi));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name + " (make 2)");
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < around) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    const midEven = Math.max(3, Math.floor(evenRounds / 2));
    lines.push(evenRoundsLine(r + 1, midEven, stitches));
    r = r + midEven;
    if (stitches >= 18) {
      r += 1;
      const dec = planDecAround(stitches);
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
    }
    const fold = flatFoldPlan(stitches);
    const restEven = Math.max(3, evenRounds - midEven);
    lines.push(evenRoundsLine(r + 1, restEven, fold.lastSts));
    r = r + restEven;
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold in half and crochet " +
        fold.foldSc +
        " sc through both sides. Stuff lightly; leave ready to join into the body."
    );
    lines.push("");

    return {
      name: name,
      maxStitches: around,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: fold.foldSc,
      lastTubeStitches: fold.lastSts,
      geometry: "arm tube",
    };
  }

  function buildSittingBodyJAYGPattern(name, diameterIn, gauge, options) {
    options = options || {};
    let maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    if (options.maxStitchCap && maxStitches > options.maxStitchCap) {
      maxStitches = options.maxStitchCap;
    }
    const evenMid = sittingBellyEvenRounds(maxStitches, gauge, {
      diameterIn: diameterIn,
      heightIn: options.heightIn || diameterIn * 0.75,
    });
    let legJoin =
      options.legFoldSts != null
        ? options.legFoldSts
        : Math.max(4, Math.round(maxStitches / 6));
    let armJoin =
      options.armFoldSts != null
        ? options.armFoldSts
        : Math.max(3, Math.round(maxStitches / 10));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Join legs (and later arms) while crocheting — do not sew four long standing legs under a necked torso."
    );
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxStitches) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");
    const hip = sittingHipLegJoinPlan(stitches, legJoin);
    legJoin = hip.legJoin;
    r += 1;
    lines.push(r + ". " + hip.instruction);
    if (hip.placement) lines.push(hip.placement);
    lines.push(
      "Work through both layers of each folded leg top. Use " +
        legJoin +
        " sc per leg."
    );
    lines.push(evenRoundsLine(r + 1, evenMid, stitches));
    r = r + evenMid;

    const openSts = Math.max(18, snapToMultiple(maxStitches * 0.5, 6));
    while (stitches > openSts) {
      r += 1;
      const dec = planDecAround(stitches);
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      if (stitches > openSts) {
        r += 1;
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }

    r += 1;
    let armJoinUse = armJoin;
    let remain = stitches - armJoinUse * 2;
    while (remain < 4 && armJoinUse > 3) {
      armJoinUse -= 1;
      remain = stitches - armJoinUse * 2;
    }
    const gapA = Math.floor(remain / 2);
    const gapB = remain - gapA;
    lines.push(
      r +
        ". " +
        gapA +
        " sc, " +
        armJoinUse +
        " sc with arm, " +
        gapB +
        " sc, " +
        armJoinUse +
        " sc with arm (" +
        stitches +
        ")"
    );
    lines.push(
      "Work through both layers of each folded arm top. Use " +
        armJoinUse +
        " sc per arm."
    );
    lines.push(
      "Stuff firmly. Leave a long tail to sew the head on (no separate neck tube)."
    );
    lines.push("");

    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: r,
      designer: true,
      legJoinStitches: legJoin,
      armJoinStitches: armJoinUse,
      geometry: "sitting body (JAYG limbs)",
    };
  }

  /**
   * Head with on-round muzzle shaping + eye placement (sitting animals / cats).
   */
  function buildSculptedHeadPattern(name, diameterIn, gauge) {
    const maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    const evenRounds = Math.max(
      3,
      Math.round(gauge.rpi * diameterIn * 0.28)
    );
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Face is shaped on the sphere (no sew-on snout). Work in a spiral."
    );
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxStitches) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    r += 1;
    const face = faceShapingRoundPlan(stitches, stitches / 48);
    lines.push(r + ". " + face.instruction);
    lines.push(
      "The second sc after the first decrease group is the center of the muzzle — mark it."
    );

    lines.push(evenRoundsLine(r + 1, evenRounds, stitches));
    r = r + evenRounds;

    lines.push(
      "Insert safety eyes between rounds " +
        (r - Math.max(1, Math.floor(evenRounds * 0.5))) +
        " and " +
        r +
        ", " +
        Math.max(6, Math.round(maxStitches / 6)) +
        " stitches apart."
    );
    lines.push("Add safety nose on the marked muzzle center if using one.");
    lines.push("Stuff the head firmly.");

    while (stitches > 6) {
      r += 1;
      if (stitches <= 6) break;
      const dec = planDecAround(stitches);
      if (dec.next < 6 && stitches > 6) {
        // Land on target when a full multiplier step would undershoot
        const land = 6;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }
    lines.push("Fasten off and close the opening. Hide the yarn tail.");
    lines.push("");

    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: r,
      designer: true,
      geometry: "sculpted sphere head",
    };
  }

  /**
   * Vertical pear body with a short neck stump (dangling chibi deer / plush).
   * Worked bottom → top; leave neck open for a separate head.
   */
  function buildThinTailPattern(name, diameterIn, lengthIn, gauge) {
    let around = stitchesForDiameter(diameterIn, gauge.spi);
    around = Math.max(6, Math.min(12, around));
    if (around % 2 === 1) around += 1;
    const evenRounds = Math.max(8, roundsForHeight(lengthIn, gauge.rpi));
    const lines = [];
    let r = 0;

    lines.push(name);
    lines.push(
      "Thin tube tail — not a bushy ball. Light stuffing only."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". " + around + " sc in MR (" + around + ")");
    lines.push(evenRoundsLine(2, evenRounds, around));
    r = 1 + evenRounds;
    lines.push(
      "Do not overstuff. Fasten off, leaving a long sewing tail. Sew to the lower back of the body."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: around,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  function buildPearBodyPattern(name, heightIn, maxDiameterIn, gauge) {
    const maxStitches = stitchesForDiameter(maxDiameterIn, gauge.spi);
    const neckStitches = snapToMultiple(
      Math.max(12, Math.round(maxStitches * 0.55)),
      6
    );
    const totalRounds = Math.max(8, roundsForHeight(heightIn, gauge.rpi));
    const evenRounds = Math.max(3, Math.round(totalRounds * 0.45));
    const neckRounds = Math.max(2, Math.round(totalRounds * 0.15));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Vertical pear body — wider belly, narrower shoulders, short open neck stump for the head."
    );
    lines.push("Work bottom → top. Stuff fuller at the belly.");
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxStitches) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    const bellyStart = r + 1;
    lines.push(evenRoundsLine(bellyStart, evenRounds, stitches));
    r = bellyStart + evenRounds - 1;
    lines.push("Belly is plump here — keep stuffing as you taper.");

    while (stitches > neckStitches) {
      r += 1;
      if (stitches <= neckStitches) break;
      const dec = planDecAround(stitches);
      if (dec.next < neckStitches && stitches > neckStitches) {
        // Land on target when a full multiplier step would undershoot
        const land = neckStitches;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }

    const neckStart = r + 1;
    lines.push(evenRoundsLine(neckStart, neckRounds, stitches));
    r = neckStart + neckRounds - 1;
    lines.push(
      "Do not close. Fasten off, leaving a long tail to sew the finished head onto this neck opening."
    );
    lines.push(
      "Arm placement: sew dangling arms just below the neck on each side. Leg placement: sew longer thin legs at the bottom-front so they hang when held."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  /**
   * Unicorn head (Molly family): early taper, then rebuild for face, then close.
   * No sew-on snout — shaping is in the rounds; needle-sculpt eyes after.
   */
  function buildUnicornHeadPattern(name, diameterIn, gauge) {
    // Molly head: +6 to 30 → (3sc,dec)×6 =24 → even → front rebuild 30/36/42/48 → even ×5 → close
    const maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    const scale = maxSts / 48;
    let peakEarly = snapToMultiple(Math.max(24, Math.round(30 * scale)), 6);
    let afterTaper = snapToMultiple(Math.max(18, Math.round(24 * scale)), 6);
    if (peakEarly <= afterTaper) peakEarly = afterTaper + 6;
    if (peakEarly > maxSts) {
      peakEarly = maxSts;
      afterTaper = Math.min(afterTaper, Math.max(18, maxSts - 6));
    }
    const evenFace = Math.max(4, Math.round(5 * Math.max(0.7, gauge.rpi / 4)));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Face is shaped in the rounds (no sew-on snout). Nose tip first, brief taper, then rebuild the face wider."
    );
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < peakEarly) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    if (stitches > afterTaper) {
      r += 1;
      lines.push(r + ". " + planDecAround(stitches).instruction);
      stitches = afterTaper;
    }
    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");

    // Front-weighted rebuild — Molly R8–R11 forms, scaled
    // Each +6 step: work 6 increase groups on the face front, sc the remaining back sts.
    const rebuildStart = r + 1;
    let step = 0;
    while (stitches < maxSts) {
      r += 1;
      step += 1;
      const next = Math.min(maxSts, stitches + 6);
      const add = next - stitches;
      if (add < 6) {
        lines.push(
          r +
            ". " +
            add +
            " inc across the face front, sc the back (" +
            next +
            ")"
        );
      } else if (step === 1) {
        // Molly R8: 6 inc, then sc the rest
        lines.push(
          r + ". 6 inc, " + (stitches - 6) + " sc (" + next + ")"
        );
      } else {
        // Molly R9+: (N sc, inc) x6 on the front, sc the remaining back
        // Front uses 6*(N+1) of current stitches; N grows as we rebuild.
        const scBetween = Math.max(1, step - 1);
        const frontUses = 6 * (scBetween + 1);
        if (frontUses >= stitches) {
          lines.push(r + ". " + planIncAround(stitches).instruction);
        } else {
          const backKeep = stitches - frontUses;
          lines.push(
            r +
              ". (" +
              (scBetween === 1 ? "sc, inc" : scBetween + " sc, inc") +
              ") x6, " +
              backKeep +
              " sc (" +
              next +
              ")"
          );
        }
      }
      stitches = next;
    }

    const evenStart = r + 1;
    lines.push(evenRoundsLine(evenStart, evenFace, stitches));
    r = evenStart + evenFace - 1;

    lines.push(
      "Eye sculpting (Molly): points A–D sit between rounds " +
        rebuildStart +
        " and " +
        (rebuildStart + 1) +
        ". Point A = 1 sc after the last face increase of that rebuild step; B = 3 sc to the left of A. Point C = 1 sc before the first face increase; D = 3 sc to the right of C."
    );
    lines.push(
      "From the neck opening, exit at A, enter at B, return to the opening; gently tighten, knot, hide ends. Mirror for C–D."
    );
    lines.push(
      "Sew or insert safety eyes in the sculpted sockets. Embroider lower eyelids with white yarn. Embroider nostrils on the early tip (about 5–6 rounds down from the magic ring)."
    );
    lines.push("Stuff the head firmly as you close.");

    while (stitches > 6) {
      r += 1;
      if (stitches <= 6) break;
      const dec = planDecAround(stitches);
      if (dec.next < 6 && stitches > 6) {
        // Land on target when a full multiplier step would undershoot
        const land = 6;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }
    lines.push("Fasten off and close the opening. Hide the yarn tail.");
    lines.push("");
    lines.push(
      "Sew the thin horn on the forehead between the ears after the head is decorated."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  /**
   * Thin unicorn horn (often thinner yarn than the body).
   */
  function buildHornPattern(name, baseDiameterIn, heightIn, gauge) {
    const baseSts = Math.max(
      8,
      snapToMultiple(stitchesForDiameter(baseDiameterIn, gauge.spi), 2)
    );
    const tipSts = 4;
    const totalRounds = Math.max(6, roundsForHeight(heightIn, gauge.rpi));
    const lines = [];
    let stitches = tipSts;
    let r = 0;

    lines.push(name);
    lines.push(
      "Thin horn — use thinner yarn / a smaller hook if the body is chenille."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". " + tipSts + " sc in MR (" + tipSts + ")");

    while (stitches < baseSts && r < totalRounds) {
      r += 1;
      const next = Math.min(baseSts, stitches + 2);
      if (next > stitches) {
        lines.push(r + ". (sc, inc) as needed to grow, sc around (" + next + ")");
        stitches = next;
      } else {
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }
    while (r < totalRounds) {
      r += 1;
      lines.push(r + ". sc around (" + stitches + ")");
    }
    lines.push(
      "Stuff lightly. Fasten off, leaving a long tail. Sew on the forehead between the ears after the head is decorated."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: baseSts,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  function buildSpiralLockPattern(name, chainLengthIn, scPerChain, gauge) {
    const chains = Math.max(12, Math.round(chainLengthIn * gauge.spi));
    const per = Math.max(2, scPerChain || 2);
    const lines = [];

    lines.push("### " + name);
    lines.push(
      "Spiral lock · ch " +
        chains +
        " (~" +
        chainLengthIn.toFixed(1) +
        '"), then ' +
        per +
        " sc in each chain from the 2nd ch — curls into a spiral."
    );
    lines.push("");
    lines.push("R1: Ch " + chains + ".");
    lines.push(
      "R2: Starting in the 2nd ch from the hook, work " +
        per +
        " sc in each ch across. Fasten off, leaving a tail for sewing."
    );
    lines.push("");
    lines.push(
      "Make several locks in different colors if desired. Bundle tail locks together before sewing to the body."
    );
    lines.push("");

    return attachSketch(
      {
        name: name,
        maxStitches: chains,
        lines: lines,
        lastRound: 2,
        geometry: "spiral fringe lock",
      },
      {
        solid: "Spiral lock",
        formula: "ch ≈ length × SPI; " + per + " sc per ch creates the curl",
        schedule: "Chain → multi-sc back = mane/tail spiral",
        notes: "Molly-family mane & tail.",
      }
    );
  }

  /**
   * Sitting body for jointed/sewn limbs (Molly unicorn) — attach legs/arms between rounds.
   */
  function buildSittingBodyJointedPattern(name, diameterIn, gauge, options) {
    options = options || {};
    const maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    const increases = buildIncreaseRounds(maxStitches);
    const bellyEven = sittingBellyEvenRounds(maxStitches, gauge, {
      diameterIn: diameterIn,
      heightIn: options.heightIn || diameterIn * 0.8,
    });
    const lines = [];
    let roundNum = 0;
    let stitches = 0;

    lines.push("### " + name);
    lines.push(
      "Sitting body · ~" +
        diameterIn.toFixed(2) +
        '" · ' +
        maxStitches +
        " sts at widest"
    );
    lines.push(
      "Attach finished legs (joints or sew) at the widest section; attach arms higher up as you taper. Leave the top ready to sew the head."
    );
    lines.push("");

    for (let i = 0; i < increases.length; i += 1) {
      lines.push(increases[i].instruction);
      roundNum = increases[i].round;
      stitches = increases[i].stitches;
    }

    for (let i = 0; i < bellyEven; i += 1) {
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }
    lines.push(
      "These even rounds build belly height — without them the body is a flat pancake."
    );
    lines.push(
      "→ Attach both legs here (plastic joints through the fabric, or sew the closed tops to the sides)."
    );

    while (stitches > 24) {
      roundNum += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < 24) {
        next = 24;
        lines.push(
          "R" + roundNum + ": Decrease evenly to 24. (" + next + ")"
        );
      } else {
        lines.push(
          "R" +
            roundNum +
            ": " +
            dec.instruction.replace(/ \(\d+\)$/, "") +
            ". (" +
            next +
            ")"
        );
      }
      stitches = next;
      for (let e = 0; e < 2; e += 1) {
        roundNum += 1;
        lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
      }
    }

    lines.push(
      "→ Attach both arms here (joints or sew), then continue tapering."
    );

    while (stitches > 12) {
      roundNum += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < 12) {
        next = 12;
        lines.push(
          "R" + roundNum + ": Decrease evenly to 12. (" + next + ")"
        );
      } else {
        lines.push(
          "R" +
            roundNum +
            ": " +
            dec.instruction.replace(/ \(\d+\)$/, "") +
            ". (" +
            next +
            ")"
        );
      }
      stitches = next;
      roundNum += 1;
      lines.push("R" + roundNum + ": Sc around. (" + stitches + ")");
    }

    lines.push("");
    lines.push(
      "Stuff firmly. Fasten off leaving a long tail, or leave a small opening to sew the finished head on."
    );
    lines.push("");

    return attachSketch(
      {
        name: name,
        maxStitches: maxStitches,
        lines: lines,
        lastRound: roundNum,
        geometry: "sitting body (jointed limbs)",
      },
      {
        solid: "Sitting body (joints)",
        formula:
          "max sts = round(pi x " +
          diameterIn.toFixed(2) +
          " x " +
          gauge.spi +
          ") → " +
          maxStitches,
        schedule: "Increase → attach legs → taper → attach arms → close/open for head",
        notes: "Molly unicorn: limbs made separately (often with plastic joints).",
      }
    );
  }

  /**
   * Chinchilla head+body one piece (feet up): oval base → join feet/tail →
   * body → neck dec → head inc → close.
   */
  /**
   * Hippo muzzle+head — Harry (All From Jade) write-up quality.
   * Exact round language, grouped even rounds, placement + stuffing cues.
   * Stitch counts scale from Harry’s 42-st head using the user’s gauge/size.
   */
  function buildHippoHeadPattern(name, headDiameterIn, muzzleLengthIn, gauge) {
    const headSts = stitchesForDiameter(headDiameterIn, gauge.spi);
    // Continuous muzzle→head slope: never decrease then rebuild (no hourglass)
    const scale = headSts / 42;
    const ch = Math.max(6, Math.round(6 * Math.max(1, scale)));
    const oval = symmetricOvalFromChain(ch);
    // Muzzle plateau is at or below head width; only increase (or hold) after that
    let muzzlePlateau = snapToMultiple(Math.round(36 * scale), 6);
    if (muzzlePlateau > headSts) muzzlePlateau = headSts;
    if (muzzlePlateau < oval.soleMax) muzzlePlateau = Math.min(headSts, oval.soleMax);
    if (muzzlePlateau < 24) muzzlePlateau = Math.min(24, headSts);
    const muzzleEven = Math.max(
      4,
      Math.round(
        (muzzleLengthIn > 0 ? muzzleLengthIn : headDiameterIn * 0.45) *
          Math.max(0.75, gauge.rpi)
      )
    );
    const headEven = Math.max(5, Math.round(7 * Math.max(0.75, gauge.rpi / 4)));

    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Muzzle and head are ONE continuous piece. Keep or increase width only — do not taper to a neck then rebuild."
    );
    lines.push("");

    for (let i = 0; i < oval.rounds.length && stitches < muzzlePlateau; i += 1) {
      r = i + 1;
      lines.push(r + ". " + oval.rounds[i].instruction);
      stitches = oval.rounds[i].produce;
    }

    while (stitches < muzzlePlateau) {
      r += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > muzzlePlateau) {
        const add = muzzlePlateau - stitches;
        next = muzzlePlateau;
        lines.push(r + ". sc around, placing " + add + " evenly spaced inc (" + next + ")");
      } else {
        lines.push(r + ". " + inc.instruction);
      }
      stitches = next;
      }

    lines.push(evenRoundsLine(r + 1, muzzleEven, stitches));
    r = r + muzzleEven;
    lines.push("Stuff the muzzle firmly and keep stuffing as you go.");

    // Profile transition: maintain width or gradual increases only
    while (stitches < headSts) {
      r += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > headSts) {
        const add = headSts - stitches;
        next = headSts;
        lines.push(r + ". sc around, placing " + add + " evenly spaced inc (" + next + ")");
      } else {
        lines.push(r + ". " + inc.instruction);
      }
      stitches = next;
      }

    const headEvenStart = r + 1;
    lines.push(evenRoundsLine(headEvenStart, headEven, stitches));
    r = headEvenStart + headEven - 1;

    const eyeRoundA = headEvenStart + Math.max(0, Math.floor(headEven * 0.15));
    const eyeRoundB = eyeRoundA + 1;
    lines.push(
      "Secure the eyes between rounds " +
        eyeRoundA +
        "-" +
        eyeRoundB +
        ", about 7 sts apart. Place a sewing pin centered with the muzzle to identify the middle of the face. Then place the eyes on both sides."
    );
    lines.push(
      "Embroider the cheeks with a strand of pink yarn. Tie a knot inside the head after each embroidery."
    );
    lines.push(
      "Embroider the eyebrows with a strand of dark grey (or black) yarn."
    );

    while (stitches > 6) {
      r += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < 6) {
        next = 6;
        lines.push(r + ". Decrease evenly to 6 (" + next + ")");
      } else {
        lines.push(r + ". " + dec.instruction);
      }
      stitches = next;
      }
    lines.push(
      "Close the opening at the back of the head and hide the yarn tail."
    );
    lines.push(
      "Deepen the eyes with needle sculpting if desired. Optional: embroider a white line on the outer side of each eye."
    );
    lines.push("");
    lines.push("Nostrils | Teeth");
    lines.push(
      "On top of the muzzle (about mid-muzzle rounds), mark 4 points — two pairs about 6 stitch holes apart, centered on the face. For each nostril: join main-color yarn, ch 3, sl st into the next marked stitch. Hide ends."
    );
    lines.push(
      "Optional teeth: same method under the muzzle with white yarn, closer together (about 3 stitch holes apart)."
    );
    lines.push("");

    return {
      name: name,
      maxStitches: headSts,
      lines: lines,
      lastRound: r,
      geometry: "hippo muzzle-head",
      designer: true,
    };
  }

  /**
   * Harry hippo ears — short dome, fold, sew.
   */
  function buildHarryHippoEarPattern(name, diameterIn, gauge) {
    const maxSts = Math.max(12, Math.min(18, stitchesForDiameter(diameterIn, gauge.spi)));
    const even = Math.max(2, Math.round(3 * Math.max(0.7, gauge.rpi / 4)));
    const lines = [];
    let r = 0;
    lines.push(name + " (make 2)");
    lines.push("");
    r = 1;
    lines.push(r + ". mr of 6 sc (6)");
    r = 2;
    lines.push(r + ". inc x6 (" + Math.min(12, maxSts) + ")");
    let stitches = Math.min(12, maxSts);
    if (maxSts > 12) {
      r = 3;
      lines.push(r + ". " + scIncAround(1, maxSts));
      stitches = maxSts;
    }
    const evenStart = r + 1;
    lines.push(evenRoundsLine(evenStart, even, stitches));
    lines.push(
      "Fasten off, leave a long tail for sewing. Fold the ear in half and secure by going twice under the same 2 stitches on both sides of the last round."
    );
    lines.push(
      "Sew the ears to the head on the upper head rounds, about 8 sts apart."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: stitches,
      lines: lines,
      lastRound: evenStart + even - 1,
      designer: true,
    };
  }

  /**
   * Harry hippo arms — short, stuff tip only, fold-close for JAYG.
   */
  function buildHarryHippoArmPattern(name, diameterIn, heightIn, gauge) {
    let tip = Math.max(12, Math.min(18, stitchesForDiameter(diameterIn, gauge.spi)));
    tip = snapToMultiple(tip, 6);
    let tube = Math.max(6, Math.min(12, snapToMultiple(Math.round(tip * 0.5), 2)));
    if (tube % 2 === 1) tube -= 1;
    const tubeRounds = Math.max(5, roundsForHeight(heightIn * 0.7, gauge.rpi));
    const lines = [];
    let r = 0;
    lines.push(name + " (make 2)");
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    r = 2;
    lines.push(r + ". (inc) x6 (12)");
    let stitches = 12;
    while (stitches < tip) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    lines.push(evenRoundsLine(r + 1, 2, stitches));
    r = r + 2;
    while (stitches > tube) {
      r += 1;
      const dec = planDecAround(stitches);
      if (dec.next >= tube) {
        lines.push(r + ". " + dec.instruction);
        stitches = dec.next;
      } else {
        const taper = taperStsToTube(stitches, tube);
        for (let i = 0; i < taper.steps.length; i += 1) {
          if (i > 0) r += 1;
          lines.push(r + ". " + taper.steps[i].instruction);
        }
        stitches = tube;
        break;
      }
    }
    lines.push("Stuff until this round only. Do not stuff the rest of the arm.");
    lines.push(evenRoundsLine(r + 1, tubeRounds, stitches));
    r = r + tubeRounds;
    const armFold = flatFoldPlan(stitches);
    if (armFold.prepLine) {
      r += 1;
      lines.push(r + ". " + armFold.prepLine);
    }
    lines.push(
      "Fold the arm in half and make " +
        armFold.foldSc +
        " sc crocheting through both sides. Cut the yarn and weave in the end (you will join the arms into the body — no sewing)."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: tip,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: armFold.foldSc,
    };
  }

  /**
   * Harry hippo legs — oval chain foot; 2nd leg continues into body.
   */
  function buildHarryHippoLegPattern(name, footLenIn, heightIn, gauge) {
    const ch = Math.max(6, Math.round(6 * (footLenIn / 0.9)));
    const oval = symmetricOvalFromChain(ch);
    let tubeSts = Math.max(10, Math.min(16, snapToMultiple(Math.round(oval.soleMax * 0.5), 2)));
    if (tubeSts % 2 === 1) tubeSts -= 1;
    const taper = taperStsToTube(oval.soleMax, tubeSts);
    const lines = [];
    let r = 0;
    lines.push(name + " (make 2)");
    lines.push("Start by working around the foundation chain for the foot.");
    lines.push("");
    for (let i = 0; i < oval.rounds.length; i += 1) {
      r = i + 1;
      lines.push(r + ". " + oval.rounds[i].instruction);
    }
    r += 1;
    lines.push(r + ". " + oval.soleMax + " sc blo (" + oval.soleMax + ")");
    for (let i = 0; i < taper.steps.length; i += 1) {
      r += 1;
      lines.push(r + ". " + taper.steps[i].instruction);
    }
    const tubeEven = Math.max(3, roundsForHeight(heightIn * 0.45, gauge.rpi || 4));
    lines.push(evenRoundsLine(r + 1, tubeEven, tubeSts));
    r = r + tubeEven;
    lines.push("Stuff the legs.");
    lines.push(
      "*For the 1st leg only: place a stitch marker near the middle of this last round. Leave a short yarn tail and make an invisible fasten off."
    );
    lines.push(
      "*For the 2nd leg only: do NOT cut the yarn — continue to the Body section."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: oval.soleMax,
      lines: lines,
      lastRound: r,
      designer: true,
      joinStitches: tubeSts,
      foldStitches: Math.floor(tubeSts / 2),
    };
  }

  /**
   * Harry hippo body — continues from 2nd leg; JAYG arms; sew head on.
   */
  function buildHarryHippoBodyPattern(name, diameterIn, gauge, options) {
    options = options || {};
    let maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    if (options.maxStitchCap && maxSts > options.maxStitchCap) {
      maxSts = options.maxStitchCap;
    }
    const bodyEven = sittingBellyEvenRounds(maxSts, gauge, {
      diameterIn: diameterIn,
      heightIn: options.heightIn || diameterIn * 0.85,
    });
    const legJoin =
      options.limbFinalSts != null
        ? options.limbFinalSts
        : options.legJoinSts != null
          ? options.legJoinSts
          : Math.max(10, Math.round(maxSts * 0.35));
    const armJoin =
      options.armFoldSts != null ? options.armFoldSts : Math.max(3, 4);
    const chBridge = options.chainBridge != null ? options.chainBridge : 2;
    const bridge = chainBridgeJoinPlan(legJoin, chBridge);
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push("Still with the 2nd leg on your hook…");
    lines.push("");

    r = 1;
    lines.push(r + ". " + bridge.instruction);
    if (bridge.placement) lines.push(bridge.placement);
    lines.push("Remove the stitch marker from leg 1.");
    stitches = bridge.total;

    while (stitches < maxSts) {
      r += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > maxSts) {
        const add = maxSts - stitches;
        next = maxSts;
        lines.push(r + ". sc around, placing " + add + " evenly spaced inc (" + next + ")");
      } else {
        lines.push(r + ". " + inc.instruction);
      }
      stitches = next;
      }
    if (stitches === bridge.total) {
      r += 1;
      lines.push(r + ". sc around (" + stitches + ")");
    }
    if (stitches > maxSts) maxSts = stitches;

    lines.push(evenRoundsLine(r + 1, bodyEven, stitches));
    r = r + bodyEven;

    while (stitches > 24) {
      r += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < 24) {
        next = 24;
        lines.push(r + ". Decrease evenly to " + next + " (" + next + ")");
      } else {
        lines.push(r + ". " + dec.instruction);
      }
      stitches = next;
      if (stitches > 24) {
        r += 1;
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }

    lines.push("Keep stuffing.");
    r += 1;
    let armJoinUse = armJoin;
    let remain = stitches - 1 - armJoinUse * 2;
    while (remain < 4 && armJoinUse > 3) {
      armJoinUse -= 1;
      remain = stitches - 1 - armJoinUse * 2;
    }
    const gapMid = Math.max(2, Math.floor(remain / 2));
    const gapEnd = Math.max(2, remain - gapMid);
    lines.push(
      r +
        ". 1 sc, " +
        armJoinUse +
        " sc with arm, " +
        gapMid +
        " sc, " +
        armJoinUse +
        " sc with arm, " +
        gapEnd +
        " sc (" +
        stitches +
        ")"
    );
    lines.push(
      "Work through both layers of each folded arm top. Use " +
        armJoinUse +
        " sc per arm."
    );

    while (stitches > 18) {
      r += 1;
      if (stitches <= 18) break;
      const dec = planDecAround(stitches);
      if (dec.next < 18 && stitches > 18) {
        // Land on target when a full multiplier step would undershoot
        const land = 18;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }

    lines.push(
      "Finish stuffing. Leave a long yarn tail and make an invisible fasten off."
    );
    lines.push(
      "Sew the body to the head and add stuffing to the neck before closing."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
      armJoinStitches: armJoinUse,
      legJoinStitches: bridge.limbFinal,
      bodyJoinStitches: bridge.total,
      chainBridge: bridge.chainBridge,
    };
  }

  /**
   * Tiny chain tail worked onto the body (Harry hippo).
   */
  function buildChainTailPattern(name, lengthIn, gauge) {
    const chains = Math.max(4, Math.round(lengthIn * gauge.spi));
    const lines = [];
    lines.push(name);
    lines.push("");
    lines.push(
      "Place 2 sewing pins at the back of the body on the mid-body rounds."
    );
    lines.push(
      "Insert the hook next to the 1st pin and out through that pin. Join yarn, ch " +
        chains +
        ", starting in the 2nd ch from the hook: sc " +
        (chains - 1) +
        ". Sl st into the next st of the body (out through pin 2). Hide the yarn tails."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: chains,
      lines: lines,
      lastRound: 1,
      designer: true,
    };
  }

  function buildChinchillaBodyHeadPattern(
    name,
    bodyDiameterIn,
    headDiameterIn,
    heightIn,
    gauge,
    options
  ) {
    options = options || {};
    const bodySts = stitchesForDiameter(bodyDiameterIn, gauge.spi);
    const headSts = stitchesForDiameter(
      headDiameterIn || bodyDiameterIn * 1.15,
      gauge.spi
    );
    const neckSts = snapToMultiple(
      Math.max(18, Math.round(Math.min(bodySts, headSts) * 0.55)),
      6
    );
    const chainBase = Math.max(6, Math.round(bodyDiameterIn * gauge.spi * 0.35));
    const footJoinSc = Math.max(4, Math.min(6, Math.round(bodySts / 8)));
    const bodyEven = Math.max(4, roundsForHeight(heightIn * 0.28, gauge.rpi));
    const headEven = Math.max(
      3,
      roundsForHeight((headDiameterIn || bodyDiameterIn) * 0.28, gauge.rpi)
    );
    const eyeGap = Math.max(5, Math.round(7 * (headSts / 42)));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Head and body are ONE piece — work from the feet up. Join finished feet and bushy tail as-you-go; sew arms later."
    );
    lines.push("");

    r = 1;
    const oval = symmetricOvalFromChain(Math.max(6, chainBase));
    lines.push(r + ". " + oval.rounds[0].instruction);
    stitches = oval.rounds[0].produce;
    // Continue oval tip growth if needed toward body width
    for (let i = 1; i < oval.rounds.length && stitches < bodySts; i += 1) {
      r += 1;
      lines.push(r + ". " + oval.rounds[i].instruction);
      stitches = oval.rounds[i].produce;
    }

    while (stitches < bodySts) {
      r += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > bodySts) {
        const add = bodySts - stitches;
        next = bodySts;
        lines.push(r + ". sc around, placing " + add + " evenly spaced inc (" + next + ")");
      } else {
        lines.push(r + ". " + inc.instruction);
      }
      stitches = next;
    }

    const footJoin =
      options.footFoldSts != null ? options.footFoldSts : footJoinSc;
    r += 1;
    const hipish = sittingHipLegJoinPlan(stitches, footJoin);
    lines.push(
      r +
        ". " +
        hipish.instruction.replace(/sc with leg/g, "sc with foot")
    );
    lines.push(
      "Work through both layers of each flattened foot top. Use " +
        hipish.legJoin +
        " sc per foot."
    );
    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");
    r += 1;
    lines.push(
      r +
        ". sc around, joining the bushy fur tail at the center back for " +
        Math.max(4, footJoinSc) +
        " sc (" +
        stitches +
        ")"
    );

    const bodyEvenStart = r + 1;
    lines.push(evenRoundsLine(bodyEvenStart, bodyEven, stitches));
    r = bodyEvenStart + bodyEven - 1;

    lines.push("Neck (decrease toward the shoulders):");
    while (stitches > neckSts) {
      r += 1;
      if (stitches <= neckSts) break;
      const dec = planDecAround(stitches);
      if (dec.next < neckSts && stitches > neckSts) {
        // Land on target when a full multiplier step would undershoot
        const land = neckSts;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }
    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");

    lines.push("Head (increase):");
    while (stitches < headSts) {
      r += 1;
      const inc = planIncAround(stitches);
      let next = inc.next;
      if (next > headSts) {
        const add = headSts - stitches;
        next = headSts;
        lines.push(r + ". sc around, placing " + add + " evenly spaced inc (" + next + ")");
      } else {
        lines.push(r + ". " + inc.instruction);
      }
      stitches = next;
    }

    const headEvenStart = r + 1;
    lines.push(evenRoundsLine(headEvenStart, headEven, stitches));
    r = headEvenStart + headEven - 1;

    const eyeA = headEvenStart + Math.max(0, Math.floor(headEven * 0.35));
    lines.push(
      "Insert safety nose on the lower face (just above the neck). Insert safety eyes between rounds " +
        eyeA +
        " and " +
        (eyeA + 1) +
        ", " +
        eyeGap +
        " stitches apart."
    );
    lines.push(
      "Stuff the body firmly; shape the cheeks and nose while stuffing the head."
    );

    while (stitches > 6) {
      r += 1;
      if (stitches <= 6) break;
      const dec = planDecAround(stitches);
      if (dec.next < 6 && stitches > 6) {
        // Land on target when a full multiplier step would undershoot
        const land = 6;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }
    lines.push("Fasten off and close the opening. Hide the yarn tail.");
    lines.push("");
    lines.push("Face");
    lines.push(
      "Embroider thin brows / eyeliner with dark cotton. Sew large ears high on the sides; sew small unstuffed arms to the upper body."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: headSts,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  function buildChinchillaEarPattern(name, widthIn, gauge) {
    const baseCh = Math.max(4, Math.round(widthIn * gauge.spi * 0.35));
    let sts = baseCh * 2 - 1;
    if (sts < 9) sts = 9;
    const lines = [];
    let r = 0;

    lines.push(name + " (make 2)");
    lines.push(
      "Large flat oval ears — turning rows, not stuffed balls. Optional fur edging."
    );
    lines.push("");
    r = 1;
    lines.push(
      r +
        ". Ch " +
        baseCh +
        ", work sc around both sides of the chain to form an oval (" +
        sts +
        ")"
    );
    for (r = 2; r <= 4; r += 1) {
      sts += 3;
      lines.push(
        r +
          ". Ch 1, turn, sc around with incs at both tips to widen (" +
          sts +
          ")"
      );
    }
    lines.push(
      "5 (optional fur yarn). Sl st around the outer edge for a fuzzy trim. Fasten off; leave a long sewing tail."
    );
    lines.push(
      "Fold one ear slightly toward center; mirror the other. Sew high on the sides of the head after the face is finished."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: sts,
      lines: lines,
      lastRound: 5,
      designer: true,
    };
  }

  function buildFurTailPattern(name, diameterIn, lengthIn, gauge) {
    const around = Math.max(
      8,
      snapToMultiple(stitchesForDiameter(diameterIn * 0.55, gauge.spi), 2)
    );
    const evenRounds = Math.max(4, roundsForHeight(lengthIn, gauge.rpi));
    const lines = [];
    let r = 0;

    lines.push(name);
    lines.push(
      "Bushy fur / eyelash-yarn tail — join into the chinchilla body as-you-go (preferred)."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". " + around + " sc in MR (" + around + ")");
    lines.push(evenRoundsLine(2, evenRounds, around));
    r = 1 + evenRounds;
    lines.push(
      "Lightly stuff or leave soft. Leave open — join into the body back for " +
        Math.max(4, Math.round(around / 2)) +
        " sc when the body pattern calls for the tail join."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: around,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  /**
   * Kitten Kaya–quality cat pieces (owned ref). Exact round language,
   * grouped even rounds, precise JAYG joins, face-shaping + sculpting cues.
   * Stitch counts scale from Kaya’s head≈48 / body≈36 schedule.
   */
  /**
   * Kitten Kaya (owned ref) — schedules from assets/KittenKaya.txt.
   * Scale stitch counts from Kaya's head=48 / body=36 skeleton; keep the same
   * round structure, joins, eye/nose placement, and assembly notes.
   */
  function kayaSnap(n) {
    return Math.max(6, snapToMultiple(Math.round(n), 6));
  }

  function buildKayaCatEarPattern(name, widthIn, gauge, options) {
    options = options || {};
    // Rule C: 3D spiral cone (not flat turning rows unless explicitly requested)
    if (options.flatEars === true) {
      return buildKayaCatFlatEarPattern(name, widthIn, gauge, options);
    }
    const scale = options.kayaSizeScale != null ? options.kayaSizeScale : 1;
    const baseTarget = Math.max(9, Math.round(12 * scale));
    const plan = buildConeEarPlan(scale, {
      incStep: 3,
      startMr: 6,
      baseSts: baseTarget,
    });
    const lines = [];
    lines.push(name + " (make 2)");
    lines.push("Hollow cone from a magic ring. Do not stuff firmly.");
    lines.push("");
    for (let i = 0; i < plan.rounds.length; i += 1) {
      lines.push(i + 1 + ". " + plan.rounds[i].instruction);
    }
    let r = plan.rounds.length;
    if (plan.even > 0) {
      lines.push(evenRoundsLine(r + 1, plan.even, plan.base));
      r = r + plan.even;
    }
    lines.push(
      "Fasten off, leaving a long tail. Pinch the base slightly into a curve and sew to the head."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: plan.base,
      lines: lines,
      lastRound: r,
      designer: true,
      geometry: "3D spiral cone",
    };
  }

  /** Flat dual-panel ear — only when options.flatEars === true. */
  function buildKayaCatFlatEarPattern(name, widthIn, gauge, options) {
    options = options || {};
    const scale = options.kayaSizeScale != null ? options.kayaSizeScale : 1;
    const startSc = Math.max(4, Math.round(7 * scale));
    const joinSc = Math.max(8, Math.round(12 * scale));
    const lines = [];
    lines.push(name);
    lines.push(
      "Flat turning-row ears (explicit flatEars request)."
    );
    lines.push("Make 4 details: 2 with main color, 2 with contrasting color (pink/cream).");
    lines.push("Crochet with turning rows:");
    lines.push("");
    lines.push("1. " + (startSc + 1) + " ch, turn, " + startSc + " sc, turn");
    let sts = startSc;
    let r = 1;
    while (sts > 2) {
      r += 1;
      sts -= 1;
      lines.push(r + ". " + sts + " sc, turn");
    }
    lines.push(r + 1 + ". 2 sc, fo");
    lines.push("");
    lines.push("Put two parts together: put the contrasting color on top.");
    lines.push("Crochet with turning rows through both details.");
    lines.push("1. " + joinSc + " sc, turn");
    lines.push("2. " + joinSc + " sc");
    lines.push("Leave a long tail for sewing.");
    lines.push("");
    return {
      name: name,
      maxStitches: joinSc,
      lines: lines,
      lastRound: 2,
      designer: true,
      geometry: "flat triangle (turning rows)",
    };
  }

  /** Shared Kaya leg tube count (even) so body JAYG can match the fold. */
  function kayaCatLegTubeSts(scale) {
    let tube = Math.max(10, Math.round(16 * scale));
    if (tube % 2 === 1) tube += 1;
    return tube;
  }

  /** Shared Kaya arm last-round count before fold (even via Rule A). */
  function kayaCatArmEndSts(scale) {
    const tip = Math.max(10, Math.round(12 * scale));
    return Math.max(8, tip - 2);
  }

  /** Taper an oval sole down to an even tube count (Rule D consume-safe). */
  function taperStsToTube(fromSts, tubeSts) {
    const steps = [];
    let sts = fromSts;
    while (sts > tubeSts) {
      let times = Math.min(4, sts - tubeSts);
      if (times < 1) break;
      // Prefer (dec, 1 sc) clusters so consume math stays clear
      while (times > 0 && sts - times * 3 < 0) {
        times -= 1;
      }
      if (times < 1) {
        // Fallback single dec rounds
        const next = sts - 1;
        steps.push({
          instruction: "dec, " + (sts - 2) + " sc (" + next + ")",
          produce: next,
        });
        sts = next;
        continue;
      }
      const remain = sts - times * 3;
      const left = Math.floor(remain / 2);
      const right = remain - left;
      const next = sts - times;
      steps.push({
        instruction:
          left +
          " sc, (dec, 1 sc) x" +
          times +
          ", " +
          right +
          " sc (" +
          next +
          ")",
        produce: next,
      });
      sts = next;
    }
    if (sts !== tubeSts && sts > tubeSts) {
      // Final adjustment with single decs
      while (sts > tubeSts) {
        const next = sts - 1;
        steps.push({
          instruction: "dec, " + (sts - 2) + " sc (" + next + ")",
          produce: next,
        });
        sts = next;
      }
    }
    return { steps: steps, sts: sts };
  }

  function buildKayaCatLegPattern(name, footLenIn, heightIn, gauge, options) {
    options = options || {};
    // Oval sole → tube → fold (instruction text is crochet-only)
    const scale = options.kayaSizeScale != null ? options.kayaSizeScale : 1;
    const ch = Math.max(6, Math.round(6 * scale));
    const oval = symmetricOvalFromChain(ch);
    const soleMax = oval.soleMax;
    const tube = kayaCatLegTubeSts(scale);
    const fold = flatFoldPlan(tube);
    const foldSc = fold.foldSc;
    const taper = taperStsToTube(soleMax, tube);
    const lines = [];
    let r = 0;

    lines.push(name + " (make 2)");
    lines.push("Start with contrasting sole color (pink/cream).");
    lines.push("");
    for (let i = 0; i < oval.rounds.length; i += 1) {
      r = i + 1;
      lines.push(r + ". " + oval.rounds[i].instruction);
    }
    lines.push(
      "Make an additional 6 sc so that the beginning is in the middle of the foot. Mark the new start. Change to main color."
    );
    r += 1;
    lines.push(r + ". " + soleMax + " sc blo (" + soleMax + ")");
    lines.push(evenRoundsLine(r + 1, 2, soleMax));
    r = r + 2;

    for (let i = 0; i < taper.steps.length; i += 1) {
      r += 1;
      lines.push(r + ". " + taper.steps[i].instruction);
    }
    const tubeEven = 6;
    lines.push(evenRoundsLine(r + 1, tubeEven, tube));
    r = r + tubeEven;
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold in half and crochet " +
        foldSc +
        " sc through both sides. Stuff the foot firmly; leave the top ready to join into the body."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: soleMax,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: foldSc,
      lastTubeStitches: fold.lastSts,
    };
  }

  function buildKayaCatArmPattern(name, diameterIn, heightIn, gauge, options) {
    options = options || {};
    // 6→tip; taper to tip-2; Rule A: last count even, fold = half
    const scale = options.kayaSizeScale != null ? options.kayaSizeScale : 1;
    const tip = Math.max(10, Math.round(12 * scale));
    const s11 = Math.max(9, tip - 1);
    const rawEnd = kayaCatArmEndSts(scale);
    const fold = flatFoldPlan(rawEnd);
    const foldSc = fold.foldSc;
    const lines = [];

    lines.push(name + " (make 2)");
    lines.push("");
    lines.push("1. 6 sc in MR (6)");
    lines.push("2. (inc) x6 (" + tip + ")");
    lines.push(evenRoundsLine(3, 2, tip));
    // Rule D: N sc, dec consumes N+2 and produces N+1
    lines.push("5. " + (tip - 2) + " sc, dec (" + s11 + ")");
    lines.push("6. " + (s11 - 2) + " sc, dec (" + rawEnd + ")");
    let r = 7;
    if (fold.prepLine) {
      lines.push(r + ". " + fold.prepLine);
      r += 1;
    }
    const evenCount = Math.max(4, 15 - r);
    lines.push(evenRoundsLine(r, evenCount, fold.lastSts));
    r = r + evenCount - 1;
    lines.push(
      "Fold in half and crochet " +
        foldSc +
        " sc through both sides. Stuff lightly. Ready to join into the body."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: tip,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: foldSc,
      lastTubeStitches: fold.lastSts,
    };
  }

  function buildKayaCatTailPattern(name, diameterIn, lengthIn, gauge, options) {
    options = options || {};
    // Kaya exact: 8 sc MR, rounds 2-15 even (14 rounds)
    const scale = options.kayaSizeScale != null ? options.kayaSizeScale : 1;
    let around = Math.max(6, Math.round(8 * scale));
    if (around % 2 === 1) around += 1;
    const even = 14;
    const lines = [];
    lines.push(name);
    lines.push("");
    lines.push("1. " + around + " sc in MR (" + around + ")");
    lines.push(evenRoundsLine(2, even, around));
    lines.push("Do not overstuff. Fasten off, leaving a long tail for sewing.");
    lines.push("");
    return {
      name: name,
      maxStitches: around,
      lines: lines,
      lastRound: 1 + even,
      designer: true,
    };
  }

  function buildKayaCatBodyPattern(name, diameterIn, gauge, options) {
    options = options || {};
    // Stitch width from YOUR gauge × body diameter. Round structure from Kaya.
    let maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    if (options.maxStitchCap && maxSts > options.maxStitchCap) {
      maxSts = options.maxStitchCap;
    }
    const scale =
      options.kayaSizeScale != null ? options.kayaSizeScale : maxSts / 36;
    // Rule A: body JAYG join counts MUST equal limb fold-closure counts
    const legFold = flatFoldPlan(kayaCatLegTubeSts(scale));
    const armFold = flatFoldPlan(kayaCatArmEndSts(scale));
    let legJoin =
      options.legFoldSts != null ? options.legFoldSts : legFold.foldSc;
    let armJoin =
      options.armFoldSts != null ? options.armFoldSts : armFold.foldSc;
    // Belly height from RPI (anti-pancake)
    const bellyHeightIn = Math.max(
      0.85,
      (options.heightIn || diameterIn * 0.85) * 0.42
    );
    let midEven = Math.max(3, roundsForHeight(bellyHeightIn, gauge.rpi));
    if (options.minBellyEven) {
      midEven = Math.max(midEven, options.minBellyEven);
    }
    if (
      typeof global !== "undefined" &&
      global.AmigurumiPatternMath &&
      global.AmigurumiPatternMath.minVolumeEvenRounds
    ) {
      midEven = Math.max(
        midEven,
        global.AmigurumiPatternMath.minVolumeEvenRounds(
          maxSts,
          gauge.rpi,
          options.minBellyEven || 3
        )
      );
    }
    const openSts = 18;
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Crochet legs first. Join them into this body as-you-go (Kitten Kaya construction)."
    );
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxSts) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");

    // Legs on hips: Back + Leg + Front + Leg = total (wide back, medium front)
    while (legJoin * 2 + 8 > stitches && legJoin > 4) {
      legJoin -= 1;
    }
    const hip = sittingHipLegJoinPlan(stitches, legJoin);
    legJoin = hip.legJoin;
    r += 1;
    lines.push(r + ". " + hip.instruction);
    if (hip.placement) lines.push(hip.placement);
    lines.push(
      "Work through both layers of each folded leg top. Use " +
        legJoin +
        " sc per leg."
    );
    lines.push(evenRoundsLine(r + 1, midEven, stitches));
    r = r + midEven;
    lines.push(
      "Belly even rounds above give the body its length at your gauge (" +
        gauge.rpi +
        " rpi)."
    );

    while (stitches > openSts) {
      r += 1;
      const dec = planDecAround(stitches);
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      if (stitches > openSts) {
        r += 1;
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }

    r += 1;
    // Exact placement: 1 + armJoin + mid + armJoin + end = openSts
    let armJoinUse = armJoin;
    let remain = openSts - 1 - armJoinUse * 2;
    while (remain < 4 && armJoinUse > 3) {
      armJoinUse -= 1;
      remain = openSts - 1 - armJoinUse * 2;
    }
    const gapMid = Math.max(2, Math.floor(remain / 2));
    const gapEnd = Math.max(2, remain - gapMid);
    lines.push(
      r +
        ". 1 sc, " +
        armJoinUse +
        " sc with arm, " +
        gapMid +
        " sc, " +
        armJoinUse +
        " sc with arm, " +
        gapEnd +
        " sc (" +
        stitches +
        ")"
    );
    lines.push(
      "Check that the arms sit symmetrically above the legs. Front gap is " +
        gapMid +
        " sc."
    );
    lines.push("Leave a long tail for sewing. Stuff firmly.");
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
      legJoinStitches: legJoin,
      armJoinStitches: armJoinUse,
      backGapStitches: hip.backGap,
      frontGapStitches: hip.frontGap,
    };
  }

  function buildKayaCatHeadPattern(name, diameterIn, gauge, options) {
    options = options || {};
    // Width from YOUR gauge × head diameter. Face schedule from Kaya.
    let maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    if (options.maxStitchCap && maxSts > options.maxStitchCap) {
      maxSts = options.maxStitchCap;
    }
    if (options.preferCh2Start) {
      // note added after title
    }
    const scale = maxSts / 48;
    const eyeGap = Math.max(6, Math.round(8 * scale));
    // Head height from diameter × RPI (sphere), not a flat "always 5"
    const evenAfterFace = Math.max(
      3,
      Math.round(gauge.rpi * diameterIn * 0.28)
    );
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Face is shaped on the sphere (no sew-on snout). Work in a spiral — Kitten Kaya construction."
    );
    if (options.preferCh2Start) {
      lines.push(
        "Chenille tip: if the magic ring snaps, ch 2 and work 6 sc into the 2nd ch from the hook instead (same stitch count)."
      );
    }
    lines.push("");

    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxSts) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    r += 1;
    const face = faceShapingRoundPlan(stitches, scale);
    lines.push(r + ". " + face.instruction);
    lines.push(
      "The second sc after the first decrease group is the center of the muzzle — mark it."
    );

    const evenStart = r + 1;
    lines.push(evenRoundsLine(evenStart, evenAfterFace, stitches));
    r = evenStart + evenAfterFace - 1;

    const eyeA = evenStart + Math.max(0, Math.floor(evenAfterFace * 0.2));
    const eyeB = eyeA + 1;
    lines.push(
      "Insert safety eyes between rounds " +
        eyeA +
        " and " +
        eyeB +
        ", " +
        eyeGap +
        " stitches apart."
    );
    lines.push(
      "Insert safety nose between rounds " +
        Math.max(1, evenStart - 1) +
        " and " +
        evenStart +
        " on the marked muzzle center (or embroider)."
    );

    lines.push("Stuff the head firmly as you close.");
    const evenAt36 = snapToMultiple(Math.round(36 * scale), 6);
    while (stitches > 6) {
      r += 1;
      const dec = planDecAround(stitches);
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      if (stitches === evenAt36 && evenAt36 > 6) {
        r += 1;
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }
    lines.push("Fasten off and close the opening. Hide the yarn tail.");
    lines.push("");
    lines.push("Head sculpting");
    lines.push(
      "With strong thread: from the neck opening (point 1), exit beside one eye (point 2), enter at point 3 beside the same eye, return to point 1, and gently tighten to sink the socket. Repeat for the other eye. Then from point 1 through point 4 (between the eyes / muzzle) and back; knot securely and hide ends."
    );
    lines.push("");
    lines.push("Head decoration");
    lines.push(
      "With thin black cotton: embroider eyebrows and eyelashes. With pink cotton: embroider the muzzle blush. Sew the ears to the head. Sew the finished head to the body. Sew the tail to the body on the belly even rounds. Optional: cut monofilament 13–15 cm and knot into the muzzle as whiskers."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  function buildMartyTeddyHeadPattern(name, diameterIn, gauge) {
    const maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    const preCheek = snapToMultiple(
      Math.max(30, Math.round(maxSts * (42 / 48))),
      6
    );
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < preCheek) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");

    if (stitches < maxSts) {
      r += 1;
      const side = Math.max(5, Math.round(stitches / 6));
      lines.push(
        r +
          ". " +
          side +
          " sc, (1 sc, inc) x3, " +
          Math.max(10, Math.round(stitches / 3)) +
          " sc, (1 sc, inc) x3, sc to end (" +
          maxSts +
          ")"
      );
      stitches = maxSts;
      lines.push(
        "From the third cheek increase — about 3 sc to each eye placement; mirror left/right."
      );
    }

    const evenStart = r + 1;
    const evenN = Math.max(3, Math.round(4 * Math.max(0.7, gauge.rpi / 4)));
    lines.push(evenRoundsLine(evenStart, evenN, stitches));
    r = evenStart + evenN - 1;

    lines.push(
      "Insert safety eyes between rounds " +
        evenStart +
        " and " +
        (evenStart + 1) +
        ". Distance between the eyes (from the EDGE of each eye) — about " +
        Math.max(5, Math.round(stitches / 8)) +
        " sc in the middle."
    );
    lines.push(
      "Stuff the cheeks well by pushing fiberfill from the center of the head to the edges."
    );

    if (stitches > preCheek) {
      r += 1;
      const side = Math.max(5, Math.round(stitches / 6));
      lines.push(
        r +
          ". " +
          side +
          " sc, (1 sc, dec) x3, sc across, (1 sc, dec) x3, sc to end (" +
          preCheek +
          ")"
      );
      stitches = preCheek;
    }
    while (stitches > 6) {
      r += 1;
      if (stitches <= 6) break;
      const dec = planDecAround(stitches);
      if (dec.next < 6 && stitches > 6) {
        // Land on target when a full multiplier step would undershoot
        const land = 6;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }
    lines.push(
      "Add 1–2 extra sc + 1 sl st to align. Cut yarn; leave a long sewing tail. Decorate fully before sewing to the body."
    );
    lines.push("");
    lines.push("Design / sculpting");
    lines.push(
      "After sewing the snout: needle-sculpt from the neck opening through points beside the snout and back, gently tighten, knot, and hide ends. Embroider brows if desired. Embroider upper eyelids and eye whites with thin yarn."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }

  function buildMartyTeddySnoutPattern(name, lengthIn, diameterIn, gauge) {
    const maxSts = Math.max(
      12,
      snapToMultiple(stitchesForDiameter(diameterIn, gauge.spi), 6)
    );
    const even = Math.max(1, roundsForHeight(lengthIn * 0.5, gauge.rpi));
    const lines = [];
    let r = 0;
    let stitches = 0;
    lines.push(name);
    lines.push("Cream / contrast color.");
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxSts) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    lines.push(evenRoundsLine(r + 1, even, stitches));
    lines.push(
      "Add 1–2 extra sc + 1 sl st to align. Leave a long end for sewing."
    );
    lines.push(
      "Insert safety/velvet nose between the last two rounds before sewing. Sew the snout to the lower face, then needle-sculpt to pull it into the cheeks."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r + even,
      designer: true,
    };
  }

  function buildMartyTeddyEarPattern(name, diameterIn, gauge) {
    let maxSts = Math.max(12, Math.min(18, stitchesForDiameter(diameterIn, gauge.spi)));
    if (maxSts % 2 === 1) maxSts += 1;
    const lines = [];
    let r = 0;
    let stitches = 0;
    lines.push(name + " (make 2)");
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    r = 2;
    lines.push(r + ". (inc) x6 (12)");
    stitches = 12;
    if (maxSts > 12) {
      r = 3;
      lines.push(r + ". " + scIncAround(1, maxSts));
      stitches = maxSts;
      lines.push(evenRoundsLine(4, 2, maxSts));
      r = 5;
    } else {
      lines.push(evenRoundsLine(3, 2, 12));
      r = 4;
    }
    const fold = flatFoldPlan(stitches);
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold in half and crochet " +
        fold.foldSc +
        " sc through both sides. Leave a long end for sewing. Sew between the upper head rounds."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: fold.foldSc,
    };
  }

  function buildMartyTeddyBodyPattern(name, diameterIn, gauge, options) {
    options = options || {};
    let maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    if (options.maxStitchCap && maxSts > options.maxStitchCap) {
      maxSts = options.maxStitchCap;
    }
    let legJoin =
      options.legFoldSts != null
        ? options.legFoldSts
        : Math.max(5, Math.round(maxSts / 7));
    let armJoin =
      options.armFoldSts != null
        ? options.armFoldSts
        : Math.max(3, Math.round(maxSts / 10));
    const midEven = sittingBellyEvenRounds(maxSts, gauge, {
      diameterIn: diameterIn,
      heightIn: options.heightIn || diameterIn * 0.8,
    });
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Crochet hind legs and arms first. Join them into the body as-you-go."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxSts) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }
    r += 1;
    lines.push(r + ". sc around (" + stitches + ")");
    const hip = sittingHipLegJoinPlan(stitches, legJoin);
    legJoin = hip.legJoin;
    r += 1;
    lines.push(r + ". " + hip.instruction);
    if (hip.placement) lines.push(hip.placement);
    lines.push(
      "Work through both layers of each folded hind-leg top. Use " +
        legJoin +
        " sc per leg."
    );
    lines.push(evenRoundsLine(r + 1, midEven, stitches));
    r = r + midEven;

    while (stitches > 18) {
      r += 1;
      const dec = planDecAround(stitches);
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      if (stitches > 18) {
        r += 1;
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }

    r += 1;
    let armJoinUse = armJoin;
    let remain = stitches - armJoinUse * 2;
    while (remain < 4 && armJoinUse > 3) {
      armJoinUse -= 1;
      remain = stitches - armJoinUse * 2;
    }
    const gapA = Math.floor(remain / 2);
    const gapB = remain - gapA;
    lines.push(
      r +
        ". " +
        gapA +
        " sc, " +
        armJoinUse +
        " sc with arm, " +
        gapB +
        " sc, " +
        armJoinUse +
        " sc with arm (" +
        stitches +
        ")"
    );
    lines.push(
      "Work through both layers of each folded foreleg top. Use " +
        armJoinUse +
        " sc per arm."
    );
    lines.push(
      "sc around once more. Cut the yarn and hide inside. Sew on the finished head."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
      legJoinStitches: legJoin,
      armJoinStitches: armJoinUse,
    };
  }

  function buildChibiDeerHeadPattern(name, diameterIn, gauge) {
    const maxSts = stitchesForDiameter(diameterIn, gauge.spi);
    const evenN = Math.max(3, Math.round(4 * Math.max(0.7, gauge.rpi / 4)));
    const eyeGap = Math.max(6, Math.round(maxSts / 6));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Oversized dangling-chibi head. Main color on the upper face; change to cream on the lower third (cheeks/chin)."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxSts) {
      r += 1;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      }

    const evenStart = r + 1;
    const creamRound = evenStart + Math.max(1, Math.floor(evenN * 0.45));
    if (creamRound > evenStart) {
      lines.push(evenRoundsLine(evenStart, creamRound - evenStart, stitches));
    }
    r = creamRound;
    lines.push(
      r +
        ". Change to cream. sc around (" +
        stitches +
        ") — this is the cheek/chin color-change line"
    );
    const afterCream = evenN - (creamRound - evenStart);
    if (afterCream > 1) {
      lines.push(evenRoundsLine(r + 1, afterCream - 1, stitches));
      r = r + (afterCream - 1);
    }

    lines.push(
      "Insert large safety eyes on the color-change line, " +
        eyeGap +
        " stitches apart (edge to edge)."
    );
    lines.push(
      "Optional: embroider 2–3 tiny cream V spots on the forehead (main-color area)."
    );
    lines.push(
      "Stuff firmly as you close. Leave a small opening if you prefer to sew onto a neck stump first."
    );

    while (stitches > 6) {
      r += 1;
      if (stitches <= 6) break;
      const dec = planDecAround(stitches);
      if (dec.next < 6 && stitches > 6) {
        // Land on target when a full multiplier step would undershoot
        const land = 6;
        lines.push(r + ". Decrease evenly (" + land + ")");
        stitches = land;
        break;
      }
      lines.push(r + ". " + dec.instruction);
      stitches = dec.next;
      }
    lines.push(
      "Fasten off and close (or leave a few sts open for the neck join). Hide ends."
    );
    lines.push("");
    lines.push("Decoration");
    lines.push(
      "Sew the cream muzzle on the lower face. Layer cream inner ears onto outer ears; sew high on the sides. Join each antler tine to a beam; sew branched antlers between the ears."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxSts,
      lines: lines,
      lastRound: r,
      designer: true,
    };
  }


  /**
   * Small foundation oval for sew-on patches (Ch 4–6).
   * Same tip form as Rule B; allows shorter chains than sole ovals.
   */
  function flatOvalPatchFromChain(chLen) {
    let ch = Math.max(4, Math.round(chLen || 5));
    if (ch > 6) ch = 6;
    const firstPass = ch - 2;
    const returnPass = Math.max(1, ch - 3);
    const r1 = firstPass + 3 + returnPass + 2;
    return {
      ch: ch,
      firstPassLoops: firstPass,
      returnPassLoops: returnPass,
      produce: r1,
      instruction:
        "Ch " +
        ch +
        ". Starting in 2nd ch from hook: " +
        firstPass +
        " sc, 3 sc in the last ch. Working along the opposite side of the foundation chain: " +
        returnPass +
        " sc, inc (" +
        r1 +
        ")",
    };
  }

  /**
   * Otter — clean solid sphere head (no continuous snout). Cap 36 (chenille) or 42 (worsted).
   */
  function buildOtterHeadPattern(name, diameterIn, gauge, options) {
    options = options || {};
    const chenille = (gauge.spi || 4) <= 3.5;
    const cap = options.maxStitchCap || (chenille ? 36 : 42);
    let maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    if (maxStitches > cap) maxStitches = cap;
    maxStitches = snapToMultiple(Math.max(24, maxStitches), 6);

    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Solid-colored sphere head — no continuous snout. Sew the cream muzzle on later."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxStitches) {
      r += 1;
      const inc = planIncAround(stitches);
      if (inc.next > maxStitches) {
        const add = maxStitches - stitches;
        lines.push(
          r +
            ". sc around, placing " +
            add +
            " evenly spaced inc (" +
            maxStitches +
            ")"
        );
        stitches = maxStitches;
      } else {
        lines.push(r + ". " + inc.instruction);
        stitches = inc.next;
      }
    }

    const even = Math.max(
      3,
      Math.min(6, roundsForHeight(diameterIn * 0.45, gauge.rpi))
    );
    lines.push(evenRoundsLine(r + 1, even, stitches));
    r = r + even;
    lines.push(
      "Insert safety eyes on the upper half of the face, spaced for a chibi look. Stuff firmly."
    );

    while (stitches > 6) {
      r += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < 6) {
        next = 6;
        lines.push(r + ". Decrease evenly to 6 (" + next + ")");
      } else {
        lines.push(r + ". " + dec.instruction);
      }
      stitches = next;
    }
    lines.push("Close the opening and hide the yarn tail.");
    lines.push("");
    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: r,
      designer: true,
      geometry: "otter sphere head",
    };
  }

  /**
   * Otter muzzle — separate cream oval patch, 3–4 rounds, sew-on (not continuous with head).
   */
  function buildOtterMuzzlePattern(name, gauge, options) {
    options = options || {};
    const oval = flatOvalPatchFromChain(options.chLen || 5);
    const lines = [];
    let r = 0;
    let stitches = oval.produce;

    lines.push(name);
    lines.push(
      "Cream / white contrast. Separate sew-on muzzle — do not work continuous with the head."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". " + oval.instruction);

    // R2: tip increases (+4) so consume matches and patch stays oval
    r = 2;
    const r2 = stitches + 4;
    const sideExact = stitches / 2 - 2;
    if (stitches % 2 === 0 && sideExact >= 1) {
      lines.push(
        r + ". (2 inc, " + sideExact + " sc) x2 (" + r2 + ")"
      );
      stitches = r2;
    } else {
      lines.push(
        r +
          ". sc around, placing 4 evenly spaced inc (" +
          r2 +
          ")"
      );
      stitches = r2;
    }

    r = 3;
    lines.push(r + ". sc around (" + stitches + ")");

    // Optional 4th round for a slightly deeper patch
    r = 4;
    lines.push(r + ". sc around (" + stitches + ")");

    lines.push(
      "Lightly stuff. Fasten off, leaving a long sewing tail. Keep the patch flat — do not close to a point."
    );
    lines.push(
      "Sew centered on the lower face between the eyes. Embroider a dark nose + short mouth line on the muzzle."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: stitches,
      lines: lines,
      lastRound: r,
      designer: true,
      geometry: "otter sew-on oval muzzle",
    };
  }

  /**
   * Otter forelimbs — narrow tubes (8–10 sts), fold-close for chest sewing.
   */
  function buildOtterNarrowArmPattern(name, heightIn, gauge) {
    let around = Math.max(8, Math.min(10, stitchesForDiameter(0.7, gauge.spi)));
    if (around % 2 === 1) around += 1;
    if (around > 10) around = 10;
    if (around < 8) around = 8;
    const evenRounds = Math.max(5, roundsForHeight(heightIn || 1.4, gauge.rpi));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name + " (make 2)");
    lines.push(
      "Narrow tube arms — flatten and close the top for sewing to the upper chest."
    );
    lines.push("");
    r = 1;
    if (around === 8) {
      lines.push(r + ". 4 sc in MR (4)");
      stitches = 4;
      r = 2;
      const inc = planIncAround(stitches);
      lines.push(r + ". " + inc.instruction);
      stitches = inc.next;
      if (stitches < around) {
        r += 1;
        lines.push(
          r +
            ". sc around, placing " +
            (around - stitches) +
            " evenly spaced inc (" +
            around +
            ")"
        );
        stitches = around;
      }
    } else {
      lines.push(r + ". 5 sc in MR (5)");
      stitches = 5;
      r = 2;
      lines.push(
        r + ". sc around, placing 5 evenly spaced inc (10)"
      );
      stitches = 10;
    }

    lines.push(evenRoundsLine(r + 1, evenRounds, stitches));
    r = r + evenRounds;
    const fold = flatFoldPlan(stitches);
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold flat and crochet " +
        fold.foldSc +
        " sc through both layers. Stuff lightly."
    );
    lines.push(
      "Assembly: sew both arms close together on the upper chest, angling the paws inward so they can hold a small accessory (shell, stone, etc.)."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: around,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: fold.foldSc,
      lastTubeStitches: fold.lastSts,
      geometry: "otter narrow arm",
    };
  }

  /**
   * Otter hindlimbs — wide flat paddle paws from oval sole; short height; fold-close.
   */
  function buildOtterPaddleFootPattern(name, gauge, options) {
    options = options || {};
    const oval = symmetricOvalFromChain(options.chLen || 6);
    const totalBudget = Math.max(6, Math.min(8, options.maxRounds || 7));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name + " (make 2)");
    lines.push(
      "Wide flat paddle feet — floppy seated look. Fold-close the top so feet stick up/forward on the body."
    );
    lines.push("");

    // Use first 2–3 oval rounds for a dramatic flat sole, then short walls
    const soleRounds = Math.min(3, oval.rounds.length);
    for (let i = 0; i < soleRounds; i += 1) {
      r += 1;
      lines.push(r + ". " + oval.rounds[i].instruction);
      stitches = oval.rounds[i].produce;
    }

    // One more widen if we still have round budget
    let used = soleRounds;
    if (used < totalBudget - 2 && stitches % 2 === 0) {
      r += 1;
      used += 1;
      const next = stitches + 4;
      const side = stitches / 2 - 2;
      if (side >= 1) {
        lines.push(r + ". (2 inc, " + side + " sc) x2 (" + next + ")");
        stitches = next;
      } else {
        lines.push(
          r +
            ". sc around, placing 4 evenly spaced inc (" +
            next +
            ")"
        );
        stitches = next;
      }
    }

    const wallRounds = Math.max(2, totalBudget - used - 1);
    lines.push(evenRoundsLine(r + 1, wallRounds, stitches));
    r = r + wallRounds;
    lines.push("Stuff the sole firmly; keep the paddle flat.");

    const fold = flatFoldPlan(stitches);
    if (fold.prepLine) {
      r += 1;
      lines.push(r + ". " + fold.prepLine);
    }
    lines.push(
      "Fold the opening flat (horizontal) and crochet " +
        fold.foldSc +
        " sc through both layers."
    );
    lines.push(
      "Assembly: sew to the lower front/base of the body so the paddles face up and forward in a floppy seated pose."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: stitches,
      lines: lines,
      lastRound: r,
      designer: true,
      foldStitches: fold.foldSc,
      lastTubeStitches: fold.lastSts,
      geometry: "otter paddle foot",
    };
  }

  /**
   * Otter tail — thick tapered cone from tip up; base ≈ half body width (backrest).
   */
  function buildOtterThickTailPattern(name, lengthIn, gauge, options) {
    options = options || {};
    const bodyMax =
      options.bodyMaxStitches != null
        ? options.bodyMaxStitches
        : stitchesForDiameter(options.bodyDiameterIn || 3.2, gauge.spi);
    let baseTarget = Math.max(12, Math.round(bodyMax * 0.5));
    if (baseTarget % 2 === 1) baseTarget += 1;
    const totalRounds = Math.max(8, roundsForHeight(lengthIn || 2.5, gauge.rpi));
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Thick tapered tail worked tip → base. Stuff firmly — it acts as a backrest for the floppy body."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;

    let sinceInc = 0;
    const gap = 2; // increase every 2–3 rows
    while (stitches < baseTarget && r < totalRounds + 6) {
      r += 1;
      sinceInc += 1;
      if (sinceInc >= gap && stitches < baseTarget) {
        const inc = planIncAround(stitches);
        if (inc.next > baseTarget) {
          const add = baseTarget - stitches;
          lines.push(
            r +
              ". sc around, placing " +
              add +
              " evenly spaced inc (" +
              baseTarget +
              ")"
          );
          stitches = baseTarget;
        } else {
          lines.push(r + ". " + inc.instruction);
          stitches = inc.next;
        }
        sinceInc = 0;
      } else {
        lines.push(r + ". sc around (" + stitches + ")");
      }
    }

    const baseEven = Math.max(2, Math.round(totalRounds * 0.15));
    lines.push(evenRoundsLine(r + 1, baseEven, stitches));
    r = r + baseEven;
    lines.push(
      "Stuff firmly toward the base. Fasten off, leaving a long sewing tail. Sew low on the back so the thick base props the body upright."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: stitches,
      lines: lines,
      lastRound: r,
      designer: true,
      geometry: "otter thick cone tail",
    };
  }

  /**
   * Otter floppy body — plump egg/pear; sew-on limbs (not JAYG); open top for head.
   */
  function buildOtterBodyPattern(name, diameterIn, heightIn, gauge, options) {
    options = options || {};
    const chenille = (gauge.spi || 4) <= 3.5;
    const cap = options.maxStitchCap || (chenille ? 36 : 48);
    let maxStitches = stitchesForDiameter(diameterIn, gauge.spi);
    if (maxStitches > cap) maxStitches = cap;
    maxStitches = snapToMultiple(Math.max(30, maxStitches), 6);
    const neck = snapToMultiple(
      Math.max(18, Math.round(maxStitches * 0.55)),
      6
    );
    const bellyEven = Math.max(
      4,
      roundsForHeight((heightIn || diameterIn) * 0.55, gauge.rpi)
    );
    const lines = [];
    let r = 0;
    let stitches = 0;

    lines.push(name);
    lines.push(
      "Chibi floppy body — plump belly, sew-on paddle feet, narrow arms, and thick tail backrest. Leave the top open for the head."
    );
    lines.push("");
    r = 1;
    lines.push(r + ". 6 sc in MR (6)");
    stitches = 6;
    while (stitches < maxStitches) {
      r += 1;
      const inc = planIncAround(stitches);
      if (inc.next > maxStitches) {
        const add = maxStitches - stitches;
        lines.push(
          r +
            ". sc around, placing " +
            add +
            " evenly spaced inc (" +
            maxStitches +
            ")"
        );
        stitches = maxStitches;
      } else {
        lines.push(r + ". " + inc.instruction);
        stitches = inc.next;
      }
    }

    lines.push(evenRoundsLine(r + 1, bellyEven, stitches));
    r = r + bellyEven;
    lines.push(
      "Mark lower-front for paddle feet and lower-back for the thick tail. Stuff the belly firmly."
    );

    while (stitches > neck) {
      r += 1;
      const dec = planDecAround(stitches);
      let next = dec.next;
      if (next < neck) {
        next = neck;
        lines.push(r + ". Decrease evenly to " + next + " (" + next + ")");
      } else {
        lines.push(r + ". " + dec.instruction);
      }
      stitches = next;
    }

    const topEven = Math.max(2, roundsForHeight(0.6, gauge.rpi));
    lines.push(evenRoundsLine(r + 1, topEven, stitches));
    r = r + topEven;
    lines.push(
      "Do not close. Fasten off, leaving a long tail to sew the finished head onto this opening."
    );
    lines.push(
      "Arm placement: upper chest, close together, paws angled inward. Foot placement: lower front base, paddles up/forward."
    );
    lines.push("");
    return {
      name: name,
      maxStitches: maxStitches,
      lines: lines,
      lastRound: r,
      designer: true,
      geometry: "otter floppy body",
    };
  }

  global.AmigurumiShapes = {
    buildSpherePattern: buildSpherePattern,
    buildCylinderPattern: buildCylinderPattern,
    buildDomePattern: buildDomePattern,
    buildElongatedBodyPattern: buildElongatedBodyPattern,
    buildSnoutPattern: buildSnoutPattern,
    buildBodyWithNeckPattern: buildBodyWithNeckPattern,
    buildHeadFromNosePattern: buildHeadFromNosePattern,
    buildBirdHeadBodyPattern: buildBirdHeadBodyPattern,
    buildConePattern: buildConePattern,
    buildFlatEarPattern: buildFlatEarPattern,
    buildSittingLegPattern: buildSittingLegPattern,
    buildRoundFootLegPattern: buildRoundFootLegPattern,
    buildSittingArmPattern: buildSittingArmPattern,
    buildSittingBodyJAYGPattern: buildSittingBodyJAYGPattern,
    buildSculptedHeadPattern: buildSculptedHeadPattern,
    buildThinTailPattern: buildThinTailPattern,
    buildPearBodyPattern: buildPearBodyPattern,
    buildUnicornHeadPattern: buildUnicornHeadPattern,
    buildHornPattern: buildHornPattern,
    buildSpiralLockPattern: buildSpiralLockPattern,
    buildSittingBodyJointedPattern: buildSittingBodyJointedPattern,
    buildHippoHeadPattern: buildHippoHeadPattern,
    buildHarryHippoEarPattern: buildHarryHippoEarPattern,
    buildHarryHippoArmPattern: buildHarryHippoArmPattern,
    buildHarryHippoLegPattern: buildHarryHippoLegPattern,
    buildHarryHippoBodyPattern: buildHarryHippoBodyPattern,
    buildChainTailPattern: buildChainTailPattern,
    buildChinchillaBodyHeadPattern: buildChinchillaBodyHeadPattern,
    buildChinchillaEarPattern: buildChinchillaEarPattern,
    buildFurTailPattern: buildFurTailPattern,
    buildKayaCatEarPattern: buildKayaCatEarPattern,
    buildKayaCatLegPattern: buildKayaCatLegPattern,
    buildKayaCatArmPattern: buildKayaCatArmPattern,
    buildKayaCatTailPattern: buildKayaCatTailPattern,
    buildKayaCatBodyPattern: buildKayaCatBodyPattern,
    buildKayaCatHeadPattern: buildKayaCatHeadPattern,
    buildMartyTeddyHeadPattern: buildMartyTeddyHeadPattern,
    buildMartyTeddySnoutPattern: buildMartyTeddySnoutPattern,
    buildMartyTeddyEarPattern: buildMartyTeddyEarPattern,
    buildMartyTeddyBodyPattern: buildMartyTeddyBodyPattern,
    buildChibiDeerHeadPattern: buildChibiDeerHeadPattern,
    buildOtterHeadPattern: buildOtterHeadPattern,
    buildOtterMuzzlePattern: buildOtterMuzzlePattern,
    buildOtterNarrowArmPattern: buildOtterNarrowArmPattern,
    buildOtterPaddleFootPattern: buildOtterPaddleFootPattern,
    buildOtterThickTailPattern: buildOtterThickTailPattern,
    buildOtterBodyPattern: buildOtterBodyPattern,
    stitchesForDiameter: stitchesForDiameter,
    chooseRepeatMultiplier: chooseRepeatMultiplier,
    planIncAround: planIncAround,
    planDecAround: planDecAround,
    flatFoldPlan: flatFoldPlan,
    symmetricOvalFromChain: symmetricOvalFromChain,
    faceShapingRoundPlan: faceShapingRoundPlan,
    sittingHipLegJoinPlan: sittingHipLegJoinPlan,
    chainBridgeJoinPlan: chainBridgeJoinPlan,
    buildConeEarPlan: buildConeEarPlan,
  };
})(window);
