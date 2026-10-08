/* Generate the PRACTICE puzzles so they can never preview a daily.
 *
 *   node scripts/gen-practice.mjs [--easy 40] [--medium 40] [--hard 40] [--seed 912]
 *
 * Writes src/data/practice-solutions.ts. src/data/puzzles.test.ts holds the
 * same rules, so a hand edit that breaks them fails the build.
 *
 * ⚠ WHY THIS EXISTS. Practice was hand-written from the same words as the
 * dailies: 40 of 41 practice puzzles shared all but one word with some daily,
 * and seven were one letter away. On the one-page-toys feeder it was worse:
 * that page bundled every daily and its answer, so most rounds WERE dailies
 * and the hint gave the solution. Practice is unlimited, so anything it shares
 * with the dailies is something a keen player can learn ahead of time.
 *
 * The rules, per practice puzzle:
 *  - no word that appears in ANY daily solution
 *  - its 12 letters differ from every daily's 12 letters by at least MIN_GAP
 *    (a puzzle is really its letter set: any valid split wins, the tray shuffles)
 *  - different enough from the other practice puzzles to feel new
 *  - the same shapes as the dailies: Easy 6+6 or 7+5, Medium 5+4+3, Hard 3+3+3+3
 *  - at least one lively letter (J Q X Z K W Y V F B), like the dailies have
 *
 * Words: hand-written lists of concrete, family-friendly words (below), so the
 * practice set reads like the dailies. All must be in the game's own dictionary.
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i === -1 ? d : process.argv[i + 1]; };
const COUNTS = { easy: +arg("easy", 40), medium: +arg("medium", 40), hard: +arg("hard", 40) };
const SEED = +arg("seed", 912);
const OUT = arg("out", "src/data/practice-solutions.ts");
export const MIN_GAP = 4;
const SPICE = new Set("JQXZKWYVFB");

// ------------------------------------------------------------------ dailies
const src = fs.readFileSync("src/data/puzzles.ts", "utf8");
const dailyBlock = src.slice(src.indexOf("const DAILY_SOLUTIONS"), src.indexOf("];", src.indexOf("const DAILY_SOLUTIONS")));
const parseSets = text => [...text.matchAll(/\[([^\[\]]+)\]/g)].map(m => [...m[1].matchAll(/"([A-Z]+)"/g)].map(x => x[1])).filter(x => x.length);
// The appended dailies (scripts/gen-dailies.mjs) count too: practice must not preview them either.
const dailies = [...parseSets(dailyBlock), ...parseSets(fs.readFileSync("src/data/daily-extension.ts", "utf8").split("DAILY_EXTENSION")[1])];
const dailyWords = new Set(dailies.flat());

export function letterGap(a, b) {
  const count = s => { const m = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; };
  const ma = count(a), mb = count(b);
  let shared = 0;
  for (const c in ma) shared += Math.min(ma[c], mb[c] || 0);
  return Math.max(a.length, b.length) - shared;
}

// ------------------------------------------------------------------ words
const dict = new Set(require("an-array-of-english-words").filter(w => w.length >= 3 && w.length <= 9).map(w => w.toUpperCase()));

/* 6-7 letter words: a HAND-WRITTEN list of concrete, picturable nouns in the
 * spirit of the dailies (PLANET, WHISKY, JACKET). The first attempt pulled them
 * from web frequency and got PYTHON, SERVICE, INSIDER, a city (BOSTON) and a
 * trademark (BATMAN): legal, and nothing like the game. */
const LONG = `ANCHOR BUCKET CACTUS CARPET CASHEW COBALT COFFEE COOKIE COTTON DONKEY FALCON
FOSSIL GALAXY GARLIC GINGER GOBLET HAMMER HELMET INSECT JIGSAW KETTLE KITTEN LAPTOP LIZARD
MAGNET MEADOW MITTEN MUFFIN NAPKIN NUTMEG OYSTER PADDLE PARROT PENCIL PEPPER PICKLE PILLOW
PIRATE POTATO PUPPET QUARTZ RABBIT RACKET RADISH RIBBON SADDLE SALMON SHOVEL SPONGE SQUASH
SUNSET TEAPOT TICKET TOMATO TURKEY TURNIP VELVET VIOLIN WAFFLE WALNUT WALRUS WIZARD YOGURT
ZIPPER TROPHY TUXEDO WINDOW BASKET BONNET BREEZE BRIDGE BUTTON CANVAS CASTLE CELERY CHERRY
COCOON CRADLE DRAGON FLANNEL GUITAR HAMLET HOCKEY IGLOO JERSEY KAYAK LAGOON LOCKET MARBLE
MOSAIC ORCHID PARCEL PEANUT PEBBLE PLUNGE POODLE PRETZEL QUIVER ROCKET SAFARI SCHOOL SHRIMP
SPIRAL STRIPE SUMMIT TABLET TEMPLE THIMBLE TOFFEE TUNNEL VALLEY VORTEX WAGON ZEPHYR
BISCUIT BLANKET BUFFALO CABBAGE CAPTAIN CARAVAN CHICKEN COMPASS CRYSTAL CUSTARD DIAMOND
FEATHER GIRAFFE GLACIER HAMSTER KITCHEN LANTERN LETTUCE MUSTARD OCTOPUS ORCHARD PANTHER
PEACOCK PENGUIN PUMPKIN PYRAMID RAINBOW SPINACH SPARROW TRUMPET TORNADO UNICORN VOLCANO
WHISTLE WOMBAT BALLOON CAMPFIRE HAMMOCK JUKEBOX KETCHUP LOBSTER MAILBOX MUSHROOM NECKLACE
POPCORN SAWDUST SEASHELL SKYLINE TEACUP BACKPACK`.split(/\s+/).filter(Boolean);

/* 3-5 letter words: also HAND-WRITTEN, in the shape of the dailies' short words
 * (QUICK WOLF JAM, FIG JAR OWL PUB): lively adjectives and picturable nouns.
 * Drawing them from a general word bank, even a screened one, produced AND,
 * HAD, GOD, JAIL and DIE: fine words, dull puzzles. */
const FIVE = `CRISP DIZZY FUZZY JOLLY LUCKY MISTY NOBLE PERKY QUIET RUSTY SHINY SILKY SNOWY SUNNY
TANGY WITTY ZESTY BRISK DUSTY HONEY LEMON MANGO MAPLE OLIVE PEACH PECAN PIZZA SALAD SAUCE TOAST
BACON CLOVE CREAM FLAME GHOST HORSE KOALA LLAMA MOOSE OTTER PANDA SHARK SKUNK SNAIL ZEBRA BENCH
CHAIR CROWN DAISY FENCE GLOVE JEWEL LADLE MEDAL PEARL QUILT RADIO ROBOT SCARF SKATE SPOON STOOL
TORCH TOWEL WHEEL YACHT BERRY BISON CAMEL COMET CORAL CRANE EAGLE FAIRY GUAVA HIPPO LILAC MOCHA
NACHO PLAID RAVEN SALSA TULIP VIPER WALTZ`.split(/\s+/).filter(Boolean);
const FOUR = `BEAR BELL BOAT BOOT BOWL CAKE CAVE COAT CORN CRAB DESK DISH DOOR DRUM DUCK FERN FISH FLAG
FORK FROG GIFT GOLF HARP HAWK HIVE HOOK HORN KITE KNOT LAMP LEAF LIME LION LOAF MASK MINT MOON NEST
PARK PEAR PLUM ROPE ROSE SAIL SEAL SHIP SHOE SOAP SOCK SOUP STAR SWAN TENT TOAD TREE TUBA VASE WAND
WORM YARN ZINC BEAN BIKE BONE BUSH CLAM COIN CROW DART DOVE FAWN GLUE JADE KIWI LAVA MOTH MULE PINE
POND QUIZ RAFT SAND SLED TACO TUNA YOLK WAVY COZY FOXY BUSY GLOW`.split(/\s+/).filter(Boolean);
const THREE = `ANT BAT BEE BUG CAT DOG EEL ELK EMU HEN HOG KOI YAK RAM GNU BUN CAN CAP CUP EGG GUM HAM HAT
INK JUG KEG KEY KIT LID MUG NET OAK OAR PAN PEA PEN POT RAG RUG SAW TAP TEA TIN TOY TUB URN VAN WAX
WEB YAM ZIP SUN SEA AXE BIB COT DEW FAN FIN FIR GEM HAY HUT IVY JET LOG MOP NUT PAD PEG ROD HUB
BAY BOW COB DOE EAR EYE GYM HIP JAW LAP LEG LIP PIT RIB ROW SOY VET YEW ZOO BOA COD DAM FOG LAB
RYE SPA SUB TAR TEE TIE VAT WOK BAG CAB CAR DIP FLY FRY FUR ICY JOT KID LEI NAP NIB PIN PUP RAY
SAP SKI SPY TAB TOW WAG ZAP`.split(/\s+/).filter(w => w.length === 3);

const byLen = {};
const add = w => { (byLen[w.length] ||= []).push(w); };
const missing = [...LONG, ...FIVE, ...FOUR, ...THREE].filter(w => !dict.has(w));
if (missing.length) console.warn("not in the game dictionary, skipped:", missing.join(" "));
for (const w of new Set([...LONG, ...FIVE, ...FOUR, ...THREE])) if (dict.has(w) && !dailyWords.has(w)) add(w);
for (const k in byLen) byLen[k].sort();

// ------------------------------------------------------------------ generate
let s = SEED >>> 0;
const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = list => list[Math.floor(rnd() * list.length)];

const SHAPES = { easy: [[6, 6], [7, 5]], medium: [[5, 4, 3]], hard: [[3, 3, 3, 3]] };
const chosen = { easy: [], medium: [], hard: [] };
const letterSets = [];
const wordUse = new Map();

for (const level of ["easy", "medium", "hard"]) {
  let tries = 0;
  while (chosen[level].length < COUNTS[level] && tries++ < 400000) {
    const shape = pick(SHAPES[level]);
    const words = shape.map(n => pick(byLen[n]));
    if (new Set(words).size !== words.length) continue;
    if (words.some(w => (wordUse.get(w) || 0) >= 2)) continue;      // no word more than twice across practice
    const letters = words.join("");
    if (![...letters].some(c => SPICE.has(c))) continue;
    if (dailies.some(d => letterGap(letters, d.join("")) < MIN_GAP)) continue;
    if (letterSets.some(p => letterGap(letters, p) < 3)) continue;
    // two practice puzzles may share one word, never two (FLAME+DRUM+HAT and
    // LUCKY+DRUM+HAT read as the same puzzle)
    if ([...chosen.easy, ...chosen.medium, ...chosen.hard].some(c => c.filter(w => words.includes(w)).length >= 2)) continue;
    chosen[level].push(words);
    letterSets.push(letters);
    words.forEach(w => wordUse.set(w, (wordUse.get(w) || 0) + 1));
  }
  if (chosen[level].length < COUNTS[level]) throw new Error(`only found ${chosen[level].length} ${level} puzzles`);
}

const all = [...chosen.easy, ...chosen.medium, ...chosen.hard];
const body = `/* Practice puzzles, GENERATED by scripts/gen-practice.mjs. Edit there, not here.
 *
 * ⚠ Practice must never preview a daily: no practice puzzle uses any word from a
 * daily solution, and every practice letter set differs from every daily's by
 * at least ${MIN_GAP} letters. src/data/puzzles.test.ts enforces both.
 * Easy = 2 words, Medium = 3, Hard = 4. */
export const PRACTICE_SOLUTIONS: string[][] = [
${all.map(w => `  [${w.map(x => `"${x}"`).join(", ")}],`).join("\n")}
];
`;
fs.writeFileSync(OUT, body);
console.log(`wrote ${OUT}: ${chosen.easy.length} easy, ${chosen.medium.length} medium, ${chosen.hard.length} hard`);
console.log("words:", all.map(w => w.join("+")).join("  "));
