/**
 * Pattern construction preview — drawn FROM the recipe (not AI).
 * Uses Pattern Request + animal parts so the picture matches what you will crochet.
 */
(function (global) {
  function stitchFill(ctx, x, y, w, h, color, stitchColor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    // Fake single-crochet ridges
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = stitchColor || "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    const step = 5;
    for (let yy = y - h; yy < y + h; yy += step) {
      ctx.beginPath();
      ctx.moveTo(x - w, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
    }
    for (let xx = x - w; xx < x + w; xx += step) {
      ctx.beginPath();
      ctx.moveTo(xx, y - h);
      ctx.lineTo(xx, y + h);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function colorsFor(req) {
    const mat = (req.yarnMetric && req.yarnMetric.materialType) || "chenille";
    // Main browns / creams for water mammals; soft neutrals otherwise
    const species = req.animalSpecies || "custom";
    if (species === "otter" || species === "bear") {
      return {
        main: "#6b4423",
        mainDeep: "#4a2f18",
        cream: "#f3e6d0",
        stitch: "rgba(40,20,8,0.2)",
        desk: "#d4c4a8",
      };
    }
    if (species === "cat") {
      return {
        main: "#c4a574",
        mainDeep: "#8a7048",
        cream: "#f5efe4",
        stitch: "rgba(60,40,20,0.18)",
        desk: "#d4c4a8",
      };
    }
    if (species === "hippo") {
      return {
        main: "#8a8f99",
        mainDeep: "#5c616a",
        cream: "#e8e4dc",
        stitch: "rgba(30,30,40,0.18)",
        desk: "#d4c4a8",
      };
    }
    if (species === "deer") {
      return {
        main: "#a67c52",
        mainDeep: "#7a5535",
        cream: "#f0e6d6",
        stitch: "rgba(50,30,15,0.18)",
        desk: "#d4c4a8",
      };
    }
    return {
      main: mat === "cotton" ? "#5b8c5a" : "#6b4423",
      mainDeep: "#3d2918",
      cream: "#f3e6d0",
      stitch: "rgba(40,20,8,0.2)",
      desk: "#d4c4a8",
    };
  }

  function drawSafetyEye(ctx, x, y, r) {
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOtterFloppy(ctx, W, H, c, face) {
    // Desk
    ctx.fillStyle = c.desk;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = "#ece7df";
    ctx.fillRect(0, 0, W, H * 0.78);

    const cx = W * 0.5;
    // Tail backrest (thick cone)
    stitchFill(ctx, cx + W * 0.22, H * 0.58, W * 0.1, H * 0.2, c.mainDeep, c.stitch);
    // Body egg
    stitchFill(ctx, cx, H * 0.58, W * 0.22, H * 0.2, c.main, c.stitch);
    // Paddle feet (wide flat, forward/up)
    stitchFill(ctx, cx - W * 0.14, H * 0.74, W * 0.12, H * 0.045, c.main, c.stitch);
    stitchFill(ctx, cx + W * 0.14, H * 0.74, W * 0.12, H * 0.045, c.main, c.stitch);
    // cream pads on paddles
    ctx.fillStyle = c.cream;
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.14, H * 0.74, W * 0.06, H * 0.02, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + W * 0.14, H * 0.74, W * 0.06, H * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    // Narrow arms on upper chest, inward
    stitchFill(ctx, cx - W * 0.1, H * 0.5, W * 0.045, H * 0.07, c.main, c.stitch);
    stitchFill(ctx, cx + W * 0.1, H * 0.5, W * 0.045, H * 0.07, c.main, c.stitch);

    // Head
    const hx = cx;
    const hy = H * 0.32;
    const hr = W * 0.16;
    if (face === "CONTINUOUS_NOSE_FIRST") {
      // Main-color upper head
      stitchFill(ctx, hx, hy, hr, hr * 0.95, c.main, c.stitch);
      // Cream snout band (lower face) — round-switch look
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hx, hy, hr, hr * 0.95, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = c.cream;
      ctx.fillRect(hx - hr, hy + hr * 0.05, hr * 2, hr * 1.2);
      // stitch lines on cream
      ctx.strokeStyle = "rgba(80,60,40,0.15)";
      for (let y = hy + hr * 0.1; y < hy + hr; y += 5) {
        ctx.beginPath();
        ctx.moveTo(hx - hr, y);
        ctx.lineTo(hx + hr, y);
        ctx.stroke();
      }
      ctx.restore();
      // horizontal switch line
      ctx.strokeStyle = c.mainDeep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.85, hy + hr * 0.08);
      ctx.lineTo(hx + hr * 0.85, hy + hr * 0.08);
      ctx.stroke();
      // eyes on the switch line
      drawSafetyEye(ctx, hx - hr * 0.35, hy + hr * 0.05, 5);
      drawSafetyEye(ctx, hx + hr * 0.35, hy + hr * 0.05, 5);
      // nose on cream
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(hx, hy + hr * 0.45, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      stitchFill(ctx, hx, hy, hr, hr * 0.95, c.main, c.stitch);
      // sew-on cream muzzle patch
      stitchFill(ctx, hx, hy + hr * 0.35, hr * 0.45, hr * 0.32, c.cream, "rgba(80,60,40,0.12)");
      drawSafetyEye(ctx, hx - hr * 0.35, hy - hr * 0.05, 5);
      drawSafetyEye(ctx, hx + hr * 0.35, hy - hr * 0.05, 5);
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(hx, hy + hr * 0.38, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // tiny ear bumps
    stitchFill(ctx, hx - hr * 0.7, hy - hr * 0.55, 10, 8, c.main, c.stitch);
    stitchFill(ctx, hx + hr * 0.7, hy - hr * 0.55, 10, 8, c.main, c.stitch);
  }

  function drawSittingUpright(ctx, W, H, c, face, species) {
    ctx.fillStyle = c.desk;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = "#ece7df";
    ctx.fillRect(0, 0, W, H * 0.78);
    const cx = W * 0.5;
    stitchFill(ctx, cx, H * 0.58, W * 0.2, H * 0.18, c.main, c.stitch);
    stitchFill(ctx, cx - W * 0.16, H * 0.7, W * 0.07, H * 0.1, c.main, c.stitch);
    stitchFill(ctx, cx + W * 0.16, H * 0.7, W * 0.07, H * 0.1, c.main, c.stitch);
    stitchFill(ctx, cx - W * 0.18, H * 0.48, W * 0.06, H * 0.1, c.main, c.stitch);
    stitchFill(ctx, cx + W * 0.18, H * 0.48, W * 0.06, H * 0.1, c.main, c.stitch);
    const hx = cx;
    const hy = H * 0.3;
    const hr = W * 0.17;
    stitchFill(ctx, hx, hy, hr, hr, c.main, c.stitch);
    if (face === "CONTINUOUS_NOSE_FIRST") {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hx, hy, hr, hr, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = c.cream;
      ctx.fillRect(hx - hr, hy + hr * 0.05, hr * 2, hr);
      ctx.restore();
      drawSafetyEye(ctx, hx - hr * 0.35, hy + hr * 0.05, 5);
      drawSafetyEye(ctx, hx + hr * 0.35, hy + hr * 0.05, 5);
    } else {
      stitchFill(ctx, hx, hy + hr * 0.35, hr * 0.4, hr * 0.28, c.cream, "rgba(80,60,40,0.12)");
      drawSafetyEye(ctx, hx - hr * 0.35, hy - hr * 0.1, 5);
      drawSafetyEye(ctx, hx + hr * 0.35, hy - hr * 0.1, 5);
    }
    if (species === "cat") {
      // cone ears
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.55, hy - hr * 0.5);
      ctx.lineTo(hx - hr * 0.25, hy - hr * 1.15);
      ctx.lineTo(hx - hr * 0.05, hy - hr * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + hr * 0.55, hy - hr * 0.5);
      ctx.lineTo(hx + hr * 0.25, hy - hr * 1.15);
      ctx.lineTo(hx + hr * 0.05, hy - hr * 0.45);
      ctx.closePath();
      ctx.fill();
    } else {
      stitchFill(ctx, hx - hr * 0.65, hy - hr * 0.65, 12, 10, c.main, c.stitch);
      stitchFill(ctx, hx + hr * 0.65, hy - hr * 0.65, 12, 10, c.main, c.stitch);
    }
  }

  function drawDeerDangling(ctx, W, H, c) {
    ctx.fillStyle = "#ece7df";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c.desk;
    ctx.fillRect(0, H * 0.85, W, H * 0.15);
    const cx = W * 0.5;
    stitchFill(ctx, cx, H * 0.42, W * 0.12, H * 0.16, c.main, c.stitch); // pear body
    stitchFill(ctx, cx, H * 0.22, W * 0.15, W * 0.15, c.main, c.stitch); // head
    stitchFill(ctx, cx, H * 0.28, W * 0.07, H * 0.04, c.cream, "rgba(80,60,40,0.12)");
    drawSafetyEye(ctx, cx - 18, H * 0.2, 4);
    drawSafetyEye(ctx, cx + 18, H * 0.2, 4);
    // thin limbs
    stitchFill(ctx, cx - 40, H * 0.55, 8, 55, c.main, c.stitch);
    stitchFill(ctx, cx + 40, H * 0.55, 8, 55, c.main, c.stitch);
    stitchFill(ctx, cx - 22, H * 0.62, 8, 70, c.main, c.stitch);
    stitchFill(ctx, cx + 22, H * 0.62, 8, 70, c.main, c.stitch);
    // antlers
    ctx.strokeStyle = c.mainDeep;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 20, H * 0.1);
    ctx.lineTo(cx - 35, H * 0.02);
    ctx.moveTo(cx - 28, H * 0.06);
    ctx.lineTo(cx - 40, H * 0.06);
    ctx.moveTo(cx + 20, H * 0.1);
    ctx.lineTo(cx + 35, H * 0.02);
    ctx.moveTo(cx + 28, H * 0.06);
    ctx.lineTo(cx + 40, H * 0.06);
    ctx.stroke();
  }

  function drawLabels(ctx, W, H, req, animal) {
    ctx.fillStyle = "#1c1917";
    ctx.font = "600 14px Segoe UI, sans-serif";
    const title =
      (animal && animal.name) ||
      (req._displayName || req.animalSpecies || "Plush");
    ctx.fillText(title + " — pattern construction preview", 16, 24);
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.fillStyle = "#57534e";
    const face = req.facialConstructionStyle || "SEPARATE_PATCH";
    const sil = req.bodySilhouette || "auto";
    ctx.fillText(
      "Face: " + face + " · Silhouette: " + sil + " · Drawn from your recipe (not AI)",
      16,
      42
    );
    if (animal && animal.parts && animal.parts.length) {
      const parts = animal.parts
        .slice(0, 6)
        .map(function (p) {
          return p.label || p.key;
        })
        .join(" · ");
      ctx.fillText("Pieces: " + parts, 16, H - 16);
    }
  }

  /**
   * Render construction preview onto a canvas element.
   * Returns data URL.
   */
  function renderPatternPreview(canvas, patternRequest, animal) {
    const req = patternRequest || {};
    const W = canvas.width || 512;
    const H = canvas.height || 512;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const c = colorsFor(req);
    const species = req.animalSpecies || "custom";
    const sil = req.bodySilhouette || "";
    const face = req.facialConstructionStyle || "SEPARATE_PATCH";

    if (
      species === "otter" ||
      sil === "CHUBBY_FLOPPY_SEATED" ||
      (animal && animal.features && animal.features.floppyWaterMammal)
    ) {
      drawOtterFloppy(ctx, W, H, c, face);
    } else if (species === "deer" || sil === "SLENDER_PEAR_NECK_TUBE") {
      drawDeerDangling(ctx, W, H, c);
    } else {
      drawSittingUpright(ctx, W, H, c, face, species);
    }

    drawLabels(ctx, W, H, req, animal);
    return canvas.toDataURL("image/png");
  }

  global.AmigurumiPatternPreview = {
    renderPatternPreview: renderPatternPreview,
  };
})(window);
