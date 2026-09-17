/**
 * Animal templates = lists of body parts with sizes in inches.
 *
 * `designedHeightIn` = the height these part sizes were drawn for.
 * `heightStack` = how those inches add up (for the pattern notes).
 * The app scales every part when you change Total height.
 */
(function (global) {
  const animals = [
    {
      id: "deer",
      name: "Deer",
      description:
        "Standing deer: long legs, horizontal body, tapered snout, and antlers — not a round teddy shape. Default 10 inches tall.",
      designedHeightIn: 10,
      // Vertical stack for a standing deer (inches at designed size).
      // Overlap is subtracted because sewn joints share space.
      heightStack: [
        { label: "Legs (ground to belly)", inches: 4.0 },
        { label: "Body thickness (belly to back)", inches: 2.5 },
        { label: "Neck", inches: 1.0 },
        { label: "Head", inches: 2.5 },
        { label: "Antlers above head", inches: 1.5 },
        { label: "Sewing overlaps (subtract)", inches: -1.5 },
      ],
      parts: [
        {
          key: "leg",
          label: "Leg",
          shape: "cylinder",
          diameterIn: 0.7,
          heightIn: 4.0,
          count: 4,
        },
        {
          key: "body",
          label: "Body",
          shape: "elongated",
          // Horizontal torso: long front-to-back, slim chest
          lengthIn: 4.75,
          diameterIn: 2.5,
          count: 1,
        },
        {
          key: "neck",
          label: "Neck",
          shape: "cylinder",
          diameterIn: 1.2,
          heightIn: 1.0,
          count: 1,
        },
        {
          key: "head",
          label: "Head",
          shape: "sphere",
          // ~1/4 of total height — readable features on a 10" deer
          diameterIn: 2.5,
          count: 1,
        },
        {
          key: "snout",
          label: "Snout",
          shape: "snout",
          lengthIn: 1.25,
          diameterIn: 1.15,
          count: 1,
        },
        {
          key: "ear",
          label: "Ear",
          shape: "dome",
          diameterIn: 1.0,
          count: 2,
        },
        {
          key: "antler",
          label: "Antler (main beam)",
          shape: "cylinder",
          diameterIn: 0.4,
          heightIn: 1.75,
          count: 2,
        },
        {
          key: "tine",
          label: "Antler tine",
          shape: "cylinder",
          diameterIn: 0.3,
          heightIn: 0.85,
          count: 4,
        },
        {
          key: "tail",
          label: "Tail",
          shape: "cylinder",
          diameterIn: 0.55,
          heightIn: 0.9,
          count: 1,
        },
      ],
      assembly: [
        "Stuff the elongated body firmly into a long oval (not a ball).",
        "Sew four legs under the body so the deer stands evenly. Legs should be about 4\" of the total height.",
        "Sew the neck to the front/top of the body, then sew the head on top of the neck.",
        "Sew the snout to the lower front of the head so it sticks out. Embroider nose and mouth.",
        "Add safety eyes (or embroider) on the sides of the head, above the snout.",
        "Sew ears to the top sides of the head.",
        "Sew two tines onto each antler beam (one near the top, one mid-beam). Sew antlers between the ears.",
        "Sew the short tail to the rear of the body.",
      ],
    },
    {
      id: "bear",
      name: "Teddy Bear",
      description:
        "Classic sitting bear: round head & body, short limbs, round ears. Designed for about 7 inches tall when sitting.",
      designedHeightIn: 7,
      heightStack: [
        { label: "Legs / lower body", inches: 2.2 },
        { label: "Body", inches: 3.0 },
        { label: "Head", inches: 2.5 },
        { label: "Sewing overlaps (subtract)", inches: -0.7 },
      ],
      parts: [
        {
          key: "head",
          label: "Head",
          shape: "sphere",
          diameterIn: 2.5,
          count: 1,
        },
        {
          key: "body",
          label: "Body",
          shape: "sphere",
          diameterIn: 3,
          count: 1,
        },
        {
          key: "ear",
          label: "Ear",
          shape: "dome",
          diameterIn: 0.9,
          count: 2,
        },
        {
          key: "muzzle",
          label: "Muzzle",
          shape: "sphere",
          diameterIn: 1,
          count: 1,
        },
        {
          key: "arm",
          label: "Arm",
          shape: "cylinder",
          diameterIn: 0.8,
          heightIn: 2,
          count: 2,
        },
        {
          key: "leg",
          label: "Leg",
          shape: "cylinder",
          diameterIn: 1,
          heightIn: 2.2,
          count: 2,
        },
      ],
      assembly: [
        "Sew muzzle to lower front of head. Embroider nose and mouth.",
        "Add safety eyes (or embroider) above the muzzle.",
        "Sew ears to top sides of head.",
        "Sew head to body.",
        "Sew arms to upper sides of body.",
        "Sew legs to bottom of body so the bear can sit.",
      ],
    },
    {
      id: "bunny",
      name: "Bunny",
      description:
        "Soft bunny with a round body, long ears, and a tiny cotton-tail. Designed for about 7.5 inches tall including ears.",
      designedHeightIn: 7.5,
      heightStack: [
        { label: "Lower body / legs", inches: 2.0 },
        { label: "Body", inches: 2.75 },
        { label: "Head", inches: 2.25 },
        { label: "Ears above head", inches: 2.0 },
        { label: "Sewing overlaps (subtract)", inches: -1.5 },
      ],
      parts: [
        {
          key: "head",
          label: "Head",
          shape: "sphere",
          diameterIn: 2.25,
          count: 1,
        },
        {
          key: "body",
          label: "Body",
          shape: "sphere",
          diameterIn: 2.75,
          count: 1,
        },
        {
          key: "ear",
          label: "Ear",
          shape: "cylinder",
          diameterIn: 0.7,
          heightIn: 2.5,
          count: 2,
        },
        {
          key: "arm",
          label: "Arm",
          shape: "cylinder",
          diameterIn: 0.7,
          heightIn: 1.75,
          count: 2,
        },
        {
          key: "leg",
          label: "Leg",
          shape: "cylinder",
          diameterIn: 0.85,
          heightIn: 2,
          count: 2,
        },
        {
          key: "tail",
          label: "Tail",
          shape: "sphere",
          diameterIn: 0.7,
          count: 1,
        },
      ],
      assembly: [
        "Flatten ears slightly and sew to top of head.",
        "Embroider or attach eyes and a small nose.",
        "Sew head to body.",
        "Sew arms to upper sides of body.",
        "Sew legs to bottom front of body.",
        "Sew tail to lower back of body.",
      ],
    },
  ];

  function getAnimal(id) {
    for (let i = 0; i < animals.length; i += 1) {
      if (animals[i].id === id) return animals[i];
    }
    return animals[0];
  }

  global.AmigurumiAnimals = {
    animals: animals,
    getAnimal: getAnimal,
  };
})(window);
