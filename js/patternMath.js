/**
 * Pattern math compiler — audits round lines before the crocheter sees them.
 *
 * Rule D / absolute repeat expansion: every structured repeat is expanded into
 * base stitch costs (sc=1, inc=1, dec=2 from the prior round). The sum MUST
 * equal the previous round's total — no rounding.
 */
(function (global) {
  function parseEndCount(line) {
    const m = String(line).match(/\((\d+)\s*(?:sts?)?\)\s*$/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function isRoundLine(line) {
    return /^\s*\d+(?:\s*-\s*\d+)?\.\s+/.test(String(line));
  }

  function stripPrefix(line) {
    return String(line)
      .replace(/^\s*\d+(?:\s*-\s*\d+)?\.\s+/, "")
      .replace(/\s*\(\d+\s*(?:sts?)?\)\s*$/i, "")
      .trim();
  }

  /** Base cost of one stitch token from the PREVIOUS round. */
  function tokenBaseCost(tok) {
    const t = String(tok).toLowerCase().replace(/\s+/g, " ").trim();
    if (!t) return null;
    if (t === "inc") return { consume: 1, produce: 2 };
    if (t === "dec" || t === "sc2tog") return { consume: 2, produce: 1 };
    // "sc N" (count after) or "N sc" (count before) or bare "sc"
    let m = t.match(/^sc\s+(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n, produce: n };
    }
    m = t.match(/^(\d+)\s*sc$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n, produce: n };
    }
    if (t === "sc" || t === "1 sc") return { consume: 1, produce: 1 };
    m = t.match(/^(\d+)\s*inc$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n, produce: n * 2 };
    }
    m = t.match(/^(\d+)\s*dec$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n * 2, produce: n };
    }
    return null;
  }

  /**
   * Expand one parenthetical group into base consume/produce.
   * e.g. "1 sc, inc" → consume 2, produce 3; "3 inc, 3 sc" → consume 6, produce 9
   */
  function expandGroupBody(body) {
    const parts = String(body)
      .split(",")
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    let consume = 0;
    let produce = 0;
    for (let i = 0; i < parts.length; i += 1) {
      const cost = tokenBaseCost(parts[i]);
      if (!cost) return null;
      consume += cost.consume;
      produce += cost.produce;
    }
    return { consume: consume, produce: produce, parts: parts };
  }

  /**
   * Absolute repeat expansion: find (... ) xN groups and plain tokens;
   * sum of base stitches used MUST be computed with integer arithmetic only.
   */
  function expandAbsoluteRepeats(instruction) {
    const text = String(instruction || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return null;

    // Strip trailing "(N)" if still present
    // Also strip placement labels like (back)/(front) so they are not mistaken for counts
    const cleaned = text
      .replace(/\s*\(\d+\s*(?:sts?)?\)\s*$/i, "")
      .replace(/\(\s*(?:back|front|chest|butt|tail|hip)\s*\)/gi, "")
      .trim();

    let consume = 0;
    let produce = 0;
    const expansion = [];
    let rest = cleaned;
    let guard = 0;

    while (rest && guard < 40) {
      guard += 1;
      rest = rest.replace(/^[,;\s]+/, "");
      if (!rest) break;

      // Structured repeat: ( ... ) xN
      let m = rest.match(/^\(([^)]+)\)\s*x\s*(\d+)/);
      if (m) {
        const group = expandGroupBody(m[1]);
        const times = parseInt(m[2], 10);
        if (!group || times < 1) return null;
        const c = group.consume * times;
        const p = group.produce * times;
        consume += c;
        produce += p;
        expansion.push({
          kind: "repeat",
          body: m[1],
          times: times,
          perConsume: group.consume,
          perProduce: group.produce,
          consume: c,
          produce: p,
        });
        rest = rest.slice(m[0].length);
        continue;
      }

      // Bare "inc xN" / "dec xN"
      m = rest.match(/^(inc)\s*x\s*(\d+)/);
      if (m) {
        const times = parseInt(m[2], 10);
        consume += times;
        produce += times * 2;
        expansion.push({
          kind: "repeat",
          body: "inc",
          times: times,
          perConsume: 1,
          perProduce: 2,
          consume: times,
          produce: times * 2,
        });
        rest = rest.slice(m[0].length);
        continue;
      }
      m = rest.match(/^(dec)\s*x\s*(\d+)/);
      if (m) {
        const times = parseInt(m[2], 10);
        consume += times * 2;
        produce += times;
        expansion.push({
          kind: "repeat",
          body: "dec",
          times: times,
          perConsume: 2,
          perProduce: 1,
          consume: times * 2,
          produce: times,
        });
        rest = rest.slice(m[0].length);
        continue;
      }

      // Leading plain token up to next comma or "("
      m = rest.match(
        /^(\d+\s*sc(?:\s+blo)?|\d+\s*dec|\d+\s*inc|\d+\s*sc with (?:the )?(?:leg|arm|foreleg|hind)\b|dec|inc|sc)(?=,|\(|$)/i
      );
      if (!m) {
        m = rest.match(/^(\d+\s*sc with (?:the )?(?:leg|arm)[^,]*)/);
      }
      if (m) {
        const rawTok = m[1].trim();
        if (/with/i.test(rawTok)) {
          const wm = rawTok.match(/^(\d+)\s*sc with/);
          const n = wm ? parseInt(wm[1], 10) : 0;
          consume += n;
          produce += n;
          expansion.push({ kind: "plain", body: rawTok, consume: n, produce: n });
        } else if (/blo$/i.test(rawTok)) {
          const n = parseInt(rawTok, 10);
          consume += n;
          produce += n;
          expansion.push({ kind: "plain", body: rawTok, consume: n, produce: n });
        } else {
          const cost = tokenBaseCost(rawTok);
          if (!cost) return null;
          consume += cost.consume;
          produce += cost.produce;
          expansion.push({
            kind: "plain",
            body: rawTok,
            consume: cost.consume,
            produce: cost.produce,
          });
        }
        rest = rest.slice(m[0].length);
        continue;
      }

      // "N sc, dec" already partially handled; try "N sc" alone at end
      m = rest.match(/^(\d+)\s*sc\b/);
      if (m) {
        const n = parseInt(m[1], 10);
        consume += n;
        produce += n;
        expansion.push({ kind: "plain", body: m[0], consume: n, produce: n });
        rest = rest.slice(m[0].length);
        continue;
      }

      // Unknown residue — cannot expand absolutely
      return null;
    }

    return {
      consume: consume,
      produce: produce,
      expansion: expansion,
    };
  }

  /**
   * Foundation-chain oval R1 boundary audit.
   * Linear sc before each tip ≤ (ch − 2). Prefer the verified Ch6 form.
   */
  function auditFoundationChainOval(instruction) {
    const text = String(instruction || "");
    const chM = text.match(/\bch\s+(\d+)\b/i) || text.match(/^(\d+)\s*ch\b/i);
    if (!chM) return null;
    const ch = parseInt(chM[1], 10);
    const maxLinear = ch - 2;
    const issues = [];

    // Symmetrical form: both passes = (ch − 2), tips are 3 sc in last / 3 sc in first
    let first = null;
    let ret = null;
    const symmetric = text.match(
      /2nd ch from hook:\s*(\d+)\s*sc,\s*3 sc in the last ch[\s\S]*?foundation chain:\s*(\d+)\s*sc,\s*3 sc in the first/i
    );
    if (symmetric) {
      first = parseInt(symmetric[1], 10);
      ret = parseInt(symmetric[2], 10);
    } else {
      // Legacy asymmetric: return side + inc
      const preferred = text.match(
        /2nd ch from hook:\s*(\d+)\s*sc,\s*3 sc in the last ch[\s\S]*?foundation chain:\s*(\d+)\s*sc,\s*inc/i
      );
      if (preferred) {
        first = parseInt(preferred[1], 10);
        ret = parseInt(preferred[2], 10);
      } else {
        const legacy = text.match(
          /2nd ch from hook:\s*(\d+)\s*sc[\s\S]*?,\s*(\d+)\s*sc along/i
        );
        if (legacy) {
          first = parseInt(legacy[1], 10);
          ret = parseInt(legacy[2], 10);
        }
      }
    }

    if (first == null || ret == null) {
      issues.push(
        "Foundation oval R1 could not parse first/return side stitch counts."
      );
      return { ok: false, ch: ch, maxLinear: maxLinear, issues: issues };
    }
    if (first > maxLinear) {
      issues.push(
        "First-pass linear sc (" + first + ") exceeds ch−2 (" + maxLinear + ")."
      );
    }
    if (ret > maxLinear) {
      issues.push(
        "Return-pass linear sc (" + ret + ") exceeds ch−2 (" + maxLinear + ")."
      );
    }
    // Symmetrical axis: both straight sides should equal (ch − 2)
    if (first !== ret) {
      issues.push(
        "Straight sides must match (got " +
          first +
          " and " +
          ret +
          "); both should be ch−2 (" +
          maxLinear +
          ")."
      );
    } else if (first !== maxLinear) {
      issues.push(
        "Straight side length should be ch−2 (" +
          maxLinear +
          "), got " +
          first +
          "."
      );
    }
    return {
      ok: issues.length === 0,
      ch: ch,
      maxLinear: maxLinear,
      firstPassLoops: first,
      returnPassLoops: ret,
      issues: issues,
    };
  }

  /** How many stitches one instruction consumes / produces. */
  function consumeAndProduce(instruction, prevSts) {
    const text = instruction.toLowerCase().replace(/\s+/g, " ").trim();
    if (!text || prevSts == null) return null;

    // Grouped even: "sc around (5 rounds)"
    if (/^sc around/.test(text) && !/\binc\b|\bdec\b/.test(text)) {
      return { consume: prevSts, produce: prevSts };
    }

    // 6 sc in MR / N sc in MR
    let m = text.match(/^(\d+)\s*sc in mr$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: 0, produce: n };
    }

    // Foundation-chain oval start
    if (/^\d+\s*ch\b/.test(text)) {
      return { consume: 0, produce: null, foundation: true };
    }

    // Prefer absolute repeat expansion whenever the line has "(...) xN" or inc/dec xN
    if (/\(.*\)\s*x\s*\d+/i.test(text) || /\b(?:inc|dec)\s*x\s*\d+/i.test(text)) {
      const abs = expandAbsoluteRepeats(text);
      if (abs) {
        return {
          consume: abs.consume,
          produce: abs.produce,
          expansion: abs.expansion,
          absolute: true,
        };
      }
    }

    // Plain absolute expansion for mixed token lines
    const absAll = expandAbsoluteRepeats(text);
    if (absAll && absAll.expansion && absAll.expansion.length) {
      return {
        consume: absAll.consume,
        produce: absAll.produce,
        expansion: absAll.expansion,
        absolute: true,
      };
    }

    // N sc blo / N sc (plain)
    m = text.match(/^(\d+)\s*sc(?:\s+blo)?$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n, produce: n };
    }

    // Simple "N sc, dec"
    m = text.match(/^(\d+)\s*sc,\s*dec$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n + 2, produce: n + 1 };
    }

    // "dec, N sc"
    m = text.match(/^dec,\s*(\d+)\s*sc$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return { consume: n + 2, produce: n + 1 };
    }

    return null;
  }

  /**
   * Audit pattern text. Returns { ok, issues[] }.
   * issues: { line, message, prev, claimed, expectedConsume, expectedProduce }
   */
  function auditPatternText(text) {
    const lines = String(text || "").split(/\r?\n/);
    const issues = [];
    let prev = null;

    for (let i = 0; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!isRoundLine(raw)) continue;

      // Grouped range "10-14. sc around (5 rounds) (48)" — treat as even
      const range = raw.match(
        /^\s*(\d+)\s*-\s*(\d+)\.\s*(.+)\((\d+)\s*(?:sts?)?\)\s*$/i
      );
      if (range) {
        const claimed = parseInt(range[4], 10);
        const instr = range[3].replace(/\(\d+\s*rounds?\)\s*/i, "").trim();
        if (/^sc around/i.test(instr)) {
          if (prev != null && claimed !== prev) {
            issues.push({
              line: i + 1,
              text: raw,
              message:
                "Even rounds claim (" +
                claimed +
                ") but previous round was (" +
                prev +
                ").",
              prev: prev,
              claimed: claimed,
            });
          }
          prev = claimed;
          continue;
        }
      }

      const claimed = parseEndCount(raw);
      if (claimed == null) continue;
      const instr = stripPrefix(raw);

      // Starting round (new piece: MR or foundation chain)
      if (/mr/i.test(instr) || /^\d+\s*ch\b/i.test(instr) || prev == null) {
        if (/^\d+\s*ch\b/i.test(instr)) {
          const ovalCheck = auditFoundationChainOval(instr);
          if (ovalCheck && !ovalCheck.ok) {
            for (let oi = 0; oi < ovalCheck.issues.length; oi += 1) {
              issues.push({
                line: i + 1,
                text: raw,
                message: "Foundation chain: " + ovalCheck.issues[oi],
              });
            }
          }
        }
        const check = consumeAndProduce(instr, 0);
        if (
          check &&
          check.produce != null &&
          check.produce !== claimed
        ) {
          issues.push({
            line: i + 1,
            text: raw,
            message:
              "Start round claims (" +
              claimed +
              ") but instruction produces " +
              check.produce +
              ".",
            claimed: claimed,
            expectedProduce: check.produce,
          });
        }
        prev = claimed;
        continue;
      }

      const result = consumeAndProduce(instr, prev);
      if (!result) {
        // Cannot parse — soft skip (notes, face-shaping custom rounds)
        prev = claimed;
        continue;
      }

      // Foundation chain / MR-style start with no prior consume
      if (result.foundation || (result.consume === 0 && prev == null)) {
        if (result.produce != null && result.produce !== claimed) {
          issues.push({
            line: i + 1,
            text: raw,
            message:
              "Start round claims (" +
              claimed +
              ") but instruction produces " +
              result.produce +
              ".",
            claimed: claimed,
            expectedProduce: result.produce,
          });
        }
        prev = claimed;
        continue;
      }

      if (result.consume !== prev) {
        issues.push({
          line: i + 1,
          text: raw,
          message:
            (result.absolute
              ? "Absolute repeat expansion: base stitches used = " +
                result.consume +
                " but previous round had (" +
                prev +
                ")."
              : "Rule D: instruction consumes " +
                result.consume +
                " sts but previous round had (" +
                prev +
                ")."),
          prev: prev,
          claimed: claimed,
          expectedConsume: result.consume,
          expansion: result.expansion || null,
        });
      }

      // CRITICAL MULTIPLIER COUPLING: every xN must divide previous round total
      if (result.expansion && prev != null) {
        for (let ei = 0; ei < result.expansion.length; ei += 1) {
          const ex = result.expansion[ei];
          if (ex.kind === "repeat" && ex.times > 1 && prev % ex.times !== 0) {
            issues.push({
              line: i + 1,
              text: raw,
              message:
                "Multiplier coupling: x" +
                ex.times +
                " is not a factor of previous round (" +
                prev +
                "). Use a multiplier that divides " +
                prev +
                " (e.g. factors of " +
                prev +
                ").",
              prev: prev,
              multiplier: ex.times,
            });
          }
        }
      }
      if (result.produce != null && result.produce !== claimed) {
        issues.push({
          line: i + 1,
          text: raw,
          message:
            "Rule D: instruction produces " +
            result.produce +
            " sts but line claims (" +
            claimed +
            ").",
          prev: prev,
          claimed: claimed,
          expectedProduce: result.produce,
        });
      }
      prev = claimed;
    }

    return { ok: issues.length === 0, issues: issues };
  }

  /**
   * Rule D — rewrite printed (N) when consume matches prev but produce claim is wrong.
   * Returns { text, fixes[] }.
   */
  function enforceRowStepValidation(text) {
    const lines = String(text || "").split(/\r?\n/);
    const fixes = [];
    let prev = null;

    for (let i = 0; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!isRoundLine(raw)) continue;

      const range = raw.match(
        /^\s*(\d+)\s*-\s*(\d+)\.\s*(.+)\((\d+)\s*(?:sts?)?\)\s*$/i
      );
      if (range) {
        const claimed = parseInt(range[4], 10);
        const instr = range[3].replace(/\(\d+\s*rounds?\)\s*/i, "").trim();
        if (/^sc around/i.test(instr)) {
          if (prev != null && claimed !== prev) {
            const fixed =
              range[1] +
              "-" +
              range[2] +
              ". " +
              range[3].replace(/\(\d+\s*(?:sts?)?\)\s*$/i, "").trim() +
              " (" +
              prev +
              ")";
            // keep rounds phrase
            lines[i] = raw.replace(/\((\d+)\s*(?:sts?)?\)\s*$/, "(" + prev + ")");
            fixes.push({ line: i + 1, from: claimed, to: prev });
          }
          prev = prev != null ? prev : claimed;
          continue;
        }
      }

      const claimed = parseEndCount(raw);
      if (claimed == null) continue;
      const instr = stripPrefix(raw);

      if (/mr/i.test(instr) || /^\d+\s*ch\b/i.test(instr) || prev == null) {
        const check = consumeAndProduce(instr, 0);
        if (check && check.produce != null && check.produce !== claimed) {
          lines[i] = raw.replace(
            /\((\d+)\s*(?:sts?)?\)\s*$/,
            "(" + check.produce + ")"
          );
          fixes.push({ line: i + 1, from: claimed, to: check.produce });
          prev = check.produce;
        } else {
          prev = claimed;
        }
        continue;
      }

      const result = consumeAndProduce(instr, prev);
      if (!result || result.produce == null) {
        prev = claimed;
        continue;
      }

      // Only auto-fix the printed total when consume is correct
      if (result.consume === prev && result.produce !== claimed) {
        lines[i] = raw.replace(
          /\((\d+)\s*(?:sts?)?\)\s*$/,
          "(" + result.produce + ")"
        );
        fixes.push({ line: i + 1, from: claimed, to: result.produce });
        prev = result.produce;
      } else {
        prev = claimed;
      }
    }

    return { text: lines.join("\n"), fixes: fixes };
  }

  /**
   * Yarn/hook scale profile for max-stitch caps on ~10" toys.
   */
  function yarnScaleProfile(yarnWeight, yarnType, heightIn) {
    const h = heightIn > 0 ? heightIn : 10;
    const scale = h / 10;
    const fiber = String(yarnType || "").toLowerCase();
    const isChenille =
      fiber.indexOf("chenille") !== -1 ||
      fiber.indexOf("velvet") !== -1 ||
      fiber.indexOf("plush") !== -1;
    const weight = String(yarnWeight || "");

    let maxStitchCap = Math.round(48 * scale);
    let preferCh2Start = false;
    let minBellyEven = 3;

    if (isChenille || weight === "bulky" || weight === "super-bulky") {
      maxStitchCap = Math.round(36 * scale);
      preferCh2Start = true;
      minBellyEven = 3;
    } else if (weight === "medium" || weight === "light") {
      maxStitchCap = Math.round(48 * scale);
      minBellyEven = 4;
    } else if (weight === "fine" || weight === "super-fine") {
      maxStitchCap = Math.round(54 * scale);
      minBellyEven = 5;
    }

    return {
      maxStitchCap: snap6(maxStitchCap),
      preferCh2Start: preferCh2Start,
      minBellyEven: minBellyEven,
      isChenille: isChenille,
    };
  }

  function snap6(n) {
    const step = 6;
    if (n < step) return step;
    return Math.max(step, Math.round(n / step) * step);
  }

  /** Minimum even rounds at max width (Depth Profile Guardrail). */
  function minVolumeEvenRounds(maxStitches, rpi, minFloor) {
    const n = Math.round(maxStitches || 0);
    let bracketMin;
    let bracketMax;
    if (n <= 18) {
      bracketMin = 2;
      bracketMax = 3;
    } else if (n <= 36) {
      bracketMin = 4;
      bracketMax = 6;
    } else {
      bracketMin = 6;
      bracketMax = 8;
    }
    const floor = minFloor != null ? minFloor : bracketMin;
    const fromGauge = Math.max(bracketMin, Math.round((rpi || 4) * 0.85));
    return Math.max(floor, Math.min(bracketMax, Math.max(bracketMin, fromGauge)));
  }

  /**
   * Rule A audit: when text says "Fold in half and crochet N sc",
   * the previous numbered round's stitch count must be even and N must equal half.
   */
  function auditFlatFoldClosures(text) {
    const lines = String(text || "").split(/\r?\n/);
    const issues = [];
    let lastCount = null;

    for (let i = 0; i < lines.length; i += 1) {
      const raw = lines[i];
      if (isRoundLine(raw)) {
        const range = raw.match(
          /^\s*\d+\s*-\s*\d+\.\s*.+\((\d+)\s*(?:sts?)?\)\s*$/i
        );
        if (range) {
          lastCount = parseInt(range[1], 10);
          continue;
        }
        const claimed = parseEndCount(raw);
        if (claimed != null) lastCount = claimed;
        continue;
      }

      const fold = raw.match(
        /fold(?: the \w+)? in half and (?:crochet|make)\s+(\d+)\s+sc/i
      );
      if (!fold) continue;
      const foldSc = parseInt(fold[1], 10);
      if (lastCount == null) {
        issues.push({
          line: i + 1,
          text: raw,
          message:
            "Rule A: fold closure of " +
            foldSc +
            " sc has no prior round stitch count to check.",
        });
        continue;
      }
      if (lastCount % 2 === 1) {
        issues.push({
          line: i + 1,
          text: raw,
          message:
            "Rule A: last round before fold is odd (" +
            lastCount +
            "); decrease to even before folding.",
          lastCount: lastCount,
          foldSc: foldSc,
        });
      }
      const expected = lastCount / 2;
      if (foldSc !== expected) {
        issues.push({
          line: i + 1,
          text: raw,
          message:
            "Rule A: fold uses " +
            foldSc +
            " sc but last round was (" +
            lastCount +
            "); fold must be exactly " +
            expected +
            ".",
          lastCount: lastCount,
          foldSc: foldSc,
          expected: expected,
        });
      }
    }

    return { ok: issues.length === 0, issues: issues };
  }

  global.AmigurumiPatternMath = {
    auditPatternText: auditPatternText,
    auditFlatFoldClosures: auditFlatFoldClosures,
    auditFoundationChainOval: auditFoundationChainOval,
    expandAbsoluteRepeats: expandAbsoluteRepeats,
    enforceRowStepValidation: enforceRowStepValidation,
    yarnScaleProfile: yarnScaleProfile,
    minVolumeEvenRounds: minVolumeEvenRounds,
    consumeAndProduce: consumeAndProduce,
  };
})(window);
