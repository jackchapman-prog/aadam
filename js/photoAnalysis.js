/**
 * Photo → math signals for amigurumi.
 *
 * Accurate rule:
 * - A photo CANNOT set absolute inches (no ruler in frame).
 * - Total height still comes from the user.
 * - A photo CAN set animal identity + proportions when detection is confident.
 *
 * Uses TensorFlow.js COCO-SSD (loaded only when a photo is uploaded).
 */
(function (global) {
  const ANIMAL_CLASSES = {
    bird: "Bird",
    cat: "Cat",
    dog: "Dog",
    horse: "Horse",
    sheep: "Sheep",
    cow: "Cow",
    elephant: "Elephant",
    bear: "Bear",
    zebra: "Zebra",
    giraffe: "Giraffe",
  };

  const MIN_SCORE = 0.55;

  let modelPromise = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "1") resolve();
        else existing.addEventListener("load", function () { resolve(); });
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        s.dataset.loaded = "1";
        resolve();
      };
      s.onerror = function () {
        reject(new Error("Could not load photo analysis library. Check your internet connection."));
      };
      document.head.appendChild(s);
    });
  }

  async function ensureModel() {
    if (!modelPromise) {
      modelPromise = (async function () {
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"
        );
        // mobilenet_v2 = better accuracy than the lite default
        return cocoSsd.load({ base: "mobilenet_v2" });
      })();
    }
    return modelPromise;
  }

  function waitForImage(img) {
    return new Promise(function (resolve, reject) {
      if (img.complete && img.naturalWidth > 0) {
        resolve(img);
        return;
      }
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("Could not read the photo."));
      };
    });
  }

  /**
   * Map bbox aspect ratio (height / width) → proportion multipliers.
   * Tall animals (giraffe side view) get longer legs/neck; wide/sitting get shorter legs.
   */
  function proportionsFromAspect(aspectRatio) {
    // aspectRatio = bboxHeight / bboxWidth
    let legScale = 1;
    let neckScale = 1;
    let bodyThickScale = 1;
    let headScale = 1;
    let bodyLengthScale = 1;
    let posture = "balanced";

    if (aspectRatio >= 1.8) {
      posture = "very tall";
      legScale = 1.2;
      neckScale = 1.35;
      bodyThickScale = 0.85;
      headScale = 0.9;
      bodyLengthScale = 0.9;
    } else if (aspectRatio >= 1.35) {
      posture = "tall standing";
      legScale = 1.1;
      neckScale = 1.15;
      bodyThickScale = 0.92;
      headScale = 0.95;
      bodyLengthScale = 0.95;
    } else if (aspectRatio >= 1.05) {
      posture = "standing";
      legScale = 1.05;
      neckScale = 1.05;
      bodyThickScale = 1;
      headScale = 1;
      bodyLengthScale = 1;
    } else if (aspectRatio >= 0.85) {
      posture = "compact";
      legScale = 0.95;
      neckScale = 0.95;
      bodyThickScale = 1.05;
      headScale = 1.05;
      bodyLengthScale = 1.05;
    } else {
      posture = "wide / low";
      legScale = 0.8;
      neckScale = 0.85;
      bodyThickScale = 1.15;
      headScale = 1.08;
      bodyLengthScale = 1.12;
    }

    return {
      posture: posture,
      legScale: legScale,
      neckScale: neckScale,
      bodyThickScale: bodyThickScale,
      headScale: headScale,
      bodyLengthScale: bodyLengthScale,
    };
  }

  function pickBestAnimal(predictions) {
    let best = null;
    for (let i = 0; i < predictions.length; i += 1) {
      const p = predictions[i];
      if (!ANIMAL_CLASSES[p.class]) continue;
      if (p.score < MIN_SCORE) continue;
      if (!best || p.score > best.score) best = p;
    }
    return best;
  }

  /**
   * Analyze an HTMLImageElement. Returns metrics for the pattern generator.
   */
  async function analyzePhoto(imgEl) {
    await waitForImage(imgEl);
    const model = await ensureModel();
    const predictions = await model.detect(imgEl, 20, MIN_SCORE);
    const best = pickBestAnimal(predictions);

    if (!best) {
      return {
        applied: false,
        reason:
          "No animal detected with enough confidence. Photo kept as visual reference only — math unchanged.",
        predictions: predictions,
      };
    }

    const bbox = best.bbox; // [x, y, width, height]
    const boxW = Math.max(1, bbox[2]);
    const boxH = Math.max(1, bbox[3]);
    const aspectRatio = boxH / boxW;
    const props = proportionsFromAspect(aspectRatio);
    const animalName = ANIMAL_CLASSES[best.class];

    return {
      applied: true,
      reason:
        "Photo math applied from detected " +
        animalName.toLowerCase() +
        " (" +
        Math.round(best.score * 100) +
        "% confidence, " +
        props.posture +
        " proportions).",
      detectedClass: best.class,
      animalName: animalName,
      confidence: best.score,
      aspectRatio: aspectRatio,
      bbox: bbox,
      posture: props.posture,
      legScale: props.legScale,
      neckScale: props.neckScale,
      bodyThickScale: props.bodyThickScale,
      headScale: props.headScale,
      bodyLengthScale: props.bodyLengthScale,
      // Absolute inches still come from the height field — photo has no scale.
      absoluteSizeFromPhoto: false,
    };
  }

  function drawBBoxOverlay(imgEl, canvasEl, metrics) {
    if (!canvasEl || !metrics || !metrics.bbox) {
      if (canvasEl) canvasEl.hidden = true;
      return;
    }
    const rect = imgEl.getBoundingClientRect();
    const displayW = imgEl.clientWidth;
    const displayH = imgEl.clientHeight;
    if (!displayW || !displayH) return;

    canvasEl.width = displayW;
    canvasEl.height = displayH;
    canvasEl.style.width = displayW + "px";
    canvasEl.style.height = displayH + "px";
    canvasEl.hidden = false;

    const scaleX = displayW / imgEl.naturalWidth;
    const scaleY = displayH / imgEl.naturalHeight;
    const b = metrics.bbox;
    const ctx = canvasEl.getContext("2d");
    ctx.clearRect(0, 0, displayW, displayH);
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 2;
    ctx.strokeRect(b[0] * scaleX, b[1] * scaleY, b[2] * scaleX, b[3] * scaleY);
    ctx.fillStyle = "rgba(15, 118, 110, 0.85)";
    ctx.font = "12px sans-serif";
    const label =
      metrics.animalName +
      " " +
      Math.round(metrics.confidence * 100) +
      "%";
    ctx.fillRect(b[0] * scaleX, Math.max(0, b[1] * scaleY - 18), ctx.measureText(label).width + 8, 18);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, b[0] * scaleX + 4, Math.max(12, b[1] * scaleY - 5));
  }

  global.AmigurumiPhoto = {
    analyzePhoto: analyzePhoto,
    drawBBoxOverlay: drawBBoxOverlay,
    ANIMAL_CLASSES: ANIMAL_CLASSES,
    MIN_SCORE: MIN_SCORE,
  };
})(window);
