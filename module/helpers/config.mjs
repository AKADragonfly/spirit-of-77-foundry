export const SPIRIT77 = {};

/**
 * The set of Ability Scores used within the sytem.
 * @type {Object}
 */
SPIRIT77.stats = {
  "might": "SPIRIT77.StatMight",
  "hustle": "SPIRIT77.StatHustle", 
  "brains": "SPIRIT77.StatBrains",
  "smooth": "SPIRIT77.StatSmooth",
  "soul": "SPIRIT77.StatSoul"
};

SPIRIT77.statAbbreviations = {
  "might": "SPIRIT77.StatMightAbbr",
  "hustle": "SPIRIT77.StatHustleAbbr",
  "brains": "SPIRIT77.StatBrainsAbbr", 
  "smooth": "SPIRIT77.StatSmoothAbbr",
  "soul": "SPIRIT77.StatSoulAbbr"
};

/**
 * Harm levels and their descriptions
 * @type {Object}
 */
SPIRIT77.harmLevels = {
  0: "SPIRIT77.HarmHealthy",
  1: "SPIRIT77.HarmBruised",
  2: "SPIRIT77.HarmBloodied", 
  3: "SPIRIT77.HarmBruisedBloodied",
  4: "SPIRIT77.HarmBroken",
  5: "SPIRIT77.HarmDown",
  6: "SPIRIT77.HarmDying",
  7: "SPIRIT77.HarmDead",
  8: "SPIRIT77.HarmDestroyed"
};

/**
 * Buzz motivations
 * @type {Object}
 */
SPIRIT77.buzzTypes = {
  "adventure": "SPIRIT77.BuzzAdventure",
  "cash": "SPIRIT77.BuzzCash",
  "crown": "SPIRIT77.BuzzCrown",
  "escape": "SPIRIT77.BuzzEscape", 
  "fame": "SPIRIT77.BuzzFame",
  "honor": "SPIRIT77.BuzzHonor",
  "justice": "SPIRIT77.BuzzJustice",
  "love": "SPIRIT77.BuzzLove",
  "payback": "SPIRIT77.BuzzPayback",
  "peace": "SPIRIT77.BuzzPeace",
  "redemption": "SPIRIT77.BuzzRedemption",
  "respect": "SPIRIT77.BuzzRespect",
  "thrills": "SPIRIT77.BuzzThrills",
  "truth": "SPIRIT77.BuzzTruth",
  "vindication": "SPIRIT77.BuzzVindication"
};

/**
 * Thang types
 * @type {Object}
 */
SPIRIT77.thangTypes = {
  "animal": "SPIRIT77.ThangAnimal",
  "aptitude": "SPIRIT77.ThangAptitude",
  "assistant": "SPIRIT77.ThangAssistant",
  "bidness": "SPIRIT77.ThangBidness",
  "connections": "SPIRIT77.ThangConnections",
  "credentials": "SPIRIT77.ThangCredentials",
  "fame": "SPIRIT77.ThangFame",
  "lab": "SPIRIT77.ThangLab",
  "sidekick": "SPIRIT77.ThangSidekick",
  "weapon": "SPIRIT77.ThangWeapon",
  "professional": "SPIRIT77.ThangProfessional",
  "instrument": "SPIRIT77.ThangInstrument",
  "sweetride": "SPIRIT77.ThangSweetRide",
  "wealth": "SPIRIT77.ThangWealth"
};

/**
 * Vehicle types
 * @type {Object}
 */
SPIRIT77.vehicleTypes = {
  "compact": "SPIRIT77.VehicleCompact",
  "sedan": "SPIRIT77.VehicleSedan",
  "sports": "SPIRIT77.VehicleSports",
  "muscle": "SPIRIT77.VehicleMuscle",
  "luxury": "SPIRIT77.VehicleLuxury",
  "truck": "SPIRIT77.VehicleTruck",
  "offroad": "SPIRIT77.VehicleOffroad",
  "race": "SPIRIT77.VehicleRace",
  "bigrig": "SPIRIT77.VehicleBigRig",
  "roadbike": "SPIRIT77.VehicleRoadBike",
  "dirtbike": "SPIRIT77.VehicleDirtBike",
  "powerboat": "SPIRIT77.VehiclePowerBoat",
  "swampboat": "SPIRIT77.VehicleSwampBoat"
};

/**
 * Vehicle traits
 * @type {Object}
 */
SPIRIT77.vehicleTraits = {
  "amphibious": "SPIRIT77.TraitAmphibious",
  "cramped": "SPIRIT77.TraitCramped",
  "fragile": "SPIRIT77.TraitFragile",
  "guzzler": "SPIRIT77.TraitGuzzler",
  "huge": "SPIRIT77.TraitHuge",
  "inconspicuous": "SPIRIT77.TraitInconspicuous",
  "loud": "SPIRIT77.TraitLoud",
  "mobile": "SPIRIT77.TraitMobile",
  "offroad": "SPIRIT77.TraitOffroad",
  "quick": "SPIRIT77.TraitQuick",
  "sluggish": "SPIRIT77.TraitSluggish",
  "sturdy": "SPIRIT77.TraitSturdy",
  "unlicensed": "SPIRIT77.TraitUnlicensed",
  "unreliable": "SPIRIT77.TraitUnreliable",
  "valuable": "SPIRIT77.TraitValuable"
};

/**
 * Weapon traits  
 * @type {Object}
 */
SPIRIT77.weaponTraits = {
  "area": "SPIRIT77.WeaponArea",
  "armor-piercing": "SPIRIT77.WeaponArmorPiercing",
  "autofire": "SPIRIT77.WeaponAutofire",
  "concealed": "SPIRIT77.WeaponConcealed",
  "clumsy": "SPIRIT77.WeaponClumsy",
  "dangerous": "SPIRIT77.WeaponDangerous",
  "fire": "SPIRIT77.WeaponFire",
  "fireproof": "SPIRIT77.WeaponFireproof",
  "finite": "SPIRIT77.WeaponFinite",
  "fragile": "SPIRIT77.WeaponFragile",
  "forceful": "SPIRIT77.WeaponForceful",
  "heavy": "SPIRIT77.WeaponHeavy",
  "infinite": "SPIRIT77.WeaponInfinite",
  "loud": "SPIRIT77.WeaponLoud",
  "messy": "SPIRIT77.WeaponMessy",
  "precise": "SPIRIT77.WeaponPrecise",
  "reload": "SPIRIT77.WeaponReload",
  "stun": "SPIRIT77.WeaponStun",
  "two-handed": "SPIRIT77.WeaponTwoHanded",
  "unique": "SPIRIT77.WeaponUnique",
  "valuable": "SPIRIT77.WeaponValuable"
};

/**
 * Move types
 * @type {Object}
 */
SPIRIT77.moveTypes = {
  "basic": "SPIRIT77.MoveBasic",
  "role": "SPIRIT77.MoveRole", 
  "story": "SPIRIT77.MoveStory"
};

/**
 * Weapon ranges
 * @type {Object}
 */
SPIRIT77.weaponRanges = {
  "close": "SPIRIT77.RangeClose",
  "near": "SPIRIT77.RangeNear",
  "far": "SPIRIT77.RangeFar"
};

/**
 * Scar types and their affected stats
 * @type {Object}
 */
SPIRIT77.scarTypes = {
  "broken": {
    "label": "SPIRIT77.ScarBroken", 
    "stat": "might"
  },
  "gimped": {
    "label": "SPIRIT77.ScarGimped",
    "stat": "hustle"
  },
  "ugly": {
    "label": "SPIRIT77.ScarUgly",
    "stat": "smooth"
  },
  "punchy": {
    "label": "SPIRIT77.ScarPunchy",
    "stat": "brains"
  },
  "whitebread": {
    "label": "SPIRIT77.ScarWhitebread",
    "stat": "soul"
  }
};