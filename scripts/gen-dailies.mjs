/* Generate more DAILY puzzles, appended after the ones already scheduled.
 *
 *   node scripts/gen-dailies.mjs --add 365 [--seed 1009]
 *
 * Appends to src/data/daily-extension.ts. Never rewrites what is already there.
 *
 * ⚠ APPEND ONLY. Entry k of the extension IS a day: it is served as puzzle
 * number FIRST_EXTENDED_PUZZLE + k (src/game/daily.ts). Regenerating or
 * reordering would change days already played, and a saved game
 * (`daily_<n>` in localStorage) restores by puzzle number with exact block
 * positions, so a changed puzzle under it breaks the restore.
 *
 * WHY THIS EXISTS. The original 91 dailies looped every 91 days, so from
 * 2026-10-14 a player who started on launch day would get puzzles they had
 * already solved. The extension starts on 2026-10-14 (#287), the first day
 * that would have repeated a puzzle served since launch.
 *
 * The rules, per new daily. puzzles.test.ts enforces every one a hand edit
 * could break.
 *  - no word that practice uses (practice must never preview a daily)
 *  - its 12 letters differ from every practice puzzle and every ORIGINAL daily
 *    by at least MIN_GAP (a puzzle is really its letter set: any valid split
 *    wins, and the tray shuffles)
 *  - no word from the original 91 dailies: returning players have seen them
 *  - differs from every other extension daily by at least 3 letters, and never
 *    shares two words with one
 *  - a word is used at most MAX_USES times, never within REUSE_GAP days
 *  - difficulty follows the week (WEEK below); Saturday is the hard one
 *  - at least one lively letter (J Q X Z K W Y V F B), like every daily so far
 *
 * Words: HAND-WRITTEN lists of concrete, family-friendly words (below), none of
 * which practice uses. All must be in the game's own dictionary; any that are
 * not are reported and skipped.
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i === -1 ? d : process.argv[i + 1]; };
const ADD = +arg("add", 0);
const SEED = +arg("seed", 1009);
const OUT = "src/data/daily-extension.ts";
const MIN_GAP = 4;
const MAX_USES = { 3: 3, 4: 2, 5: 2, 6: 1, 7: 1 };
const REUSE_GAP = 60;
const SPICE = new Set("JQXZKWYVFB");

// Sunday first, as Date.getUTCDay() counts. Easy early in the week, hard on
// Saturday when people have time, the same 3 easy / 3 medium / 1 hard mix as
// the original dailies (46 / 35 / 10).
const WEEK = ["easy", "easy", "easy", "medium", "medium", "medium", "hard"];
const SHAPES = { easy: [[6, 6], [6, 6], [7, 5]], medium: [[5, 4, 3], [5, 4, 3], [4, 4, 4]], hard: [[3, 3, 3, 3]] };

// ------------------------------------------------------------------ fixed inputs
const read = f => fs.readFileSync(f, "utf8");
const parseSets = text => [...text.matchAll(/\[([^\[\]]*"[A-Z]+"[^\[\]]*)\]/g)].map(m => [...m[1].matchAll(/"([A-Z]+)"/g)].map(x => x[1]));

const puzzlesSrc = read("src/data/puzzles.ts");
const origStart = puzzlesSrc.indexOf("const DAILY_SOLUTIONS");
const original = parseSets(puzzlesSrc.slice(origStart, puzzlesSrc.indexOf("];", origStart)));
const practice = parseSets(read("src/data/practice-solutions.ts").split("PRACTICE_SOLUTIONS")[1]);
const existing = fs.existsSync(OUT) ? parseSets(read(OUT).split("DAILY_EXTENSION")[1]) : [];

const dailySrc = read("src/game/daily.ts");
const LAUNCH = dailySrc.match(/LAUNCH_DATE = "(\d{4}-\d{2}-\d{2})"/)[1];
const FIRST = +dailySrc.match(/FIRST_EXTENDED_PUZZLE = (\d+)/)[1];
const dateOf = k => new Date(Date.parse(LAUNCH + "T00:00:00Z") + (FIRST - 1 + k) * 86400000);

if (original.length !== 91) throw new Error(`expected the 91 original dailies, parsed ${original.length}`);
if (practice.length < 100) throw new Error(`parsed only ${practice.length} practice puzzles`);

export function letterGap(a, b) {
  const count = s => { const m = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; };
  const ma = count(a), mb = count(b);
  let shared = 0;
  for (const c in ma) shared += Math.min(ma[c], mb[c] || 0);
  return Math.max(a.length, b.length) - shared;
}

// ------------------------------------------------------------------ words
/* Concrete, picturable nouns and a few lively adjectives, in the spirit of the
 * dailies (PLANET, WHISKY, JACKET; QUICK WOLF JAM). None is a practice word or
 * an original daily word; the script drops any that are, so the lists can be
 * extended freely. */
const SEVEN = `AVOCADO BAGPIPE BANDANA BLUEBELL BOBSLED CABOOSE CARDINAL CATFISH CHEETAH
COCONUT CURTAIN DOLPHIN DRIZZLE FIDDLER FIREFLY FLAMINGO FLIPPER GAZELLE GOLDFISH GRANOLA
HALIBUT HEDGEHOG HICKORY JASMINE JUGGLER KINGDOM LAVENDER LEOPARD MAGNOLIA MANATEE MARACAS
MEERKAT MONSOON MUSKRAT OATMEAL ORCHESTRA OSTRICH PANCAKE PAPRIKA PARSLEY PELICAN PIGLET
PINWHEEL PLATYPUS POSTCARD PUFFBALL QUILTER RACCOON RHUBARB SANDBOX SARDINE SCOOTER SEAGULL
SKILLET SLIPPER SNOWMAN SPATULA STENCIL STICKER SUNBEAM TADPOLE TEAKETTLE THICKET TOASTER
TRACTOR TRUFFLE VAMPIRE VULTURE WARTHOG WEATHER WILDCAT WINDMILL ZUCCHINI JUMPSUIT BUZZARD
KAZOO WHIPPET WAXWING JAYWALK
BISCUIT BLANKET BUFFALO CABBAGE CAPTAIN CHICKEN COMPASS CUSTARD DIAMOND GIRAFFE GLACIER
HAMSTER KITCHEN LANTERN LETTUCE MUSTARD OCTOPUS ORCHARD PANTHER PUMPKIN SPARROW TORNADO
TRUMPET UNICORN WHISTLE BALLOON HAMMOCK JUKEBOX KETCHUP POPCORN ANTENNA APRICOT BANQUET
BEEHIVE BLOSSOM BONFIRE BOUQUET BRISKET CANTEEN CAPSULE CARAMEL CARTOON CASCADE CHARIOT
CHIMNEY CHOWDER COCKPIT COWBELL CRUMPET CUPCAKE CUSHION DESSERT DOORWAY ECLIPSE FANFARE
FREIGHT GALLEON GHERKIN GOGGLES GRAVITY GRIFFIN GRIZZLY HARVEST HATCHET JACKPOT JAVELIN
JUNIPER KINGPIN KNUCKLE LATTICE LUGGAGE MONARCH MUSTANG ORIGAMI PADDOCK PAJAMAS PARKWAY
PARSNIP PICCOLO PILGRIM QUARTET RAVIOLI REPTILE ROOSTER SAFFRON SANDBAR SATCHEL SAWMILL
SHAMPOO SHERBET SNORKEL SPINDLE SUNDIAL SUNRISE TERMITE TOOLBOX TRELLIS TUGBOAT TURBINE
TWISTER UKULELE VANILLA WALLABY WARBLER WETSUIT WHISKER HAYRIDE BOXWOOD`.split(/\s+/).filter(Boolean);
const SIX = `ALMOND ANKLET ARCADE ARCHER BADGER BAKERY BALLET BAMBOO BANNER BARREL BEAVER
BEETLE BEACON BOBCAT BOTTLE BRANCH BREEZE BRIDGE BUBBLE BUCKLE BUNDLE BURGER BURROW CANARY
CANNON CARROT CELERY CHERRY CINDER CIRCUS CLOVER COBWEB CONDOR COPPER COUGAR COWBOY COYOTE
CRADLE CYMBAL DAHLIA DESERT DINGHY DOMINO DONKEY DYNAMO ENGINE FABRIC FERRET FIDDLE FUNNEL
GADGET GALLON GARAGE GARLIC GAZEBO GERBIL GEYSER GINGER GLIDER GOBLIN GOPHER GRAVEL GROTTO
HAMMER HAMLET HANGAR HARBOR HELMET HERMIT HOCKEY HORNET IGUANA INSECT ISLAND JAGUAR JERSEY
JESTER JIGSAW KENNEL KERNEL KITTEN KNIGHT LADDER LAGOON LAPTOP LENTIL LOCKET LOCUST MAGNET
MAMMAL MANTIS MARLIN MARMOT MASCOT MELODY MIRROR MITTEN MORTAR MOSAIC MUFFIN MUSSEL NAPKIN
NECTAR NEEDLE NOODLE NUTMEG OCELOT OSPREY OYSTER PADDLE PALACE PARADE PARCEL PARROT PASTRY
PEANUT PEBBLE PENCIL PICKLE PIGEON PODIUM POLLEN POODLE POTATO POWDER PUFFIN PUZZLE RABBIT
RACKET RADISH RAISIN RATTLE RAVINE RIDDLE SADDLE SAFARI SAILOR SALMON SANDAL SCHOOL SEQUIN
SHADOW SHIELD SKETCH SLEIGH SOCKET SPHINX SPIRAL SPROUT SQUASH STATUE STREAM SUMMIT TABLET
TEMPLE TICKET TINSEL TOFFEE TOMATO TOUCAN TUNNEL TURKEY TURNIP TURTLE VELVET VIOLIN VOYAGE
WAFFLE WEASEL WICKER WIZARD WOMBAT YOGURT ZEPHYR ZIGZAG FROSTY BREEZY JIGGLE JUMBLE GOBLET
JOVIAL BUZZER WIGGLE QUIVER SQUIRT DAZZLE FIZZLE PUZZLE SNOOZE KIMONO KETTLE
ABACUS ANORAK AUTUMN AVENUE BANYAN BARLEY BAZAAR BEAKER BEANIE BELFRY BINDER BISTRO
BLAZER BOXCAR BRONCO BUFFET BUNKER BUTLER CAMPER CANYON CARAFE CARBON CELLAR CEMENT
CHALET CHAPEL CHISEL CLOSET COLLAR CONVOY CORNER COSMOS CRATER CRUISE DINNER DOLLAR
DUFFEL EGGNOG ELIXIR EMBLEM EMPIRE FAUCET FIESTA FINGER FLAGON FLIGHT FLORAL FLURRY
FONDUE FREEZE FRIDGE FROLIC FUNGUS GALLEY GARNET HEARTH HICCUP HUMBUG ICICLE IMPALA
JACKAL JALOPY JINGLE JOYFUL KEYPAD KIBBLE KIDNEY LAUREL LEDGER LIQUID LOCKER MAGPIE
MARKER MEDLEY MELLOW MINNOW MOHAIR MOLTEN MUTTON NOZZLE NUGGET OXYGEN PAPAYA PELLET
PIGLET PILLAR PLAQUE POTTER PULLEY PUMICE RAFFLE RAPIDS RECIPE REFLEX ROOKIE ROSTER
RUBBLE RUDDER RUSSET SALAMI SARONG SATURN SAUCER SCROLL SHAKER SIERRA SKEWER SLEDGE
SONNET SPIGOT SPLASH SPRUCE SQUAWK STABLE STAPLE STEREO STUDIO SUBWAY SUNDAE SWIVEL
TANKER TARGET TENNIS THRONE TIMBER TINDER TOMCAT TONGUE TUNDRA VACUUM VIKING VORTEX
WALLET WARREN WEEVIL WHIMSY WIDGET WILLOW WRENCH YELLOW ZENITH ZINNIA TEACUP`.split(/\s+/).filter(Boolean);
const FIVE = `ACORN AMBER APRON ARROW ATLAS ATTIC BADGE BAGEL BANJO BARGE BASIL BATON BEECH
BIRCH BLIMP BLOOM BOOTH BOXER BRICK BROOM BUGLE BUNNY CABIN CABLE CANOE CARGO CEDAR CHALK
CHARM CHEST CHICK CHILI CHIMP CHIVE CIDER CLOAK CLOWN COBRA COCOA COMET COUCH CREEK CREPE
CRUMB CUMIN CURRY DAISY DINGO DONUT DRAKE DRILL EAGLE EBONY ELBOW EMBER FABLE FAIRY FERRY
FLASK FLOAT FLUTE FROST FUDGE GECKO GHOST GLAZE GLOBE GNOME GOOSE GOURD GRAVY GRILL GROVE
GUAVA GUPPY HAZEL HERON HINGE HIPPO HORSE HOTEL HOUND IGLOO IVORY JELLY JOKER JUICE KAYAK
KEBAB KNIFE KOALA LADLE LANCE LATCH LEMON LEMUR LINEN LLAMA LODGE LOTUS MACAW MANOR MARSH
MELON MOCHA MOOSE MOTEL MOTOR NUTTY OASIS ONION ORBIT OTTER PANDA PANSY PASTA PATIO PEACH
PEARL PEONY PERCH PILOT PLAID PLANK PLATE PLAZA POLKA POPPY PORCH PRISM PUPPY QUAIL QUILL
QUILT RAVEN RHINO RIVER ROBIN ROBOT RODEO ROVER SALAD SAUCE SCARF SCONE SCOUT SHEEP SHELF
SHELL SHIRT SHORE SIREN SKATE SKIFF SLATE SLOTH SNACK SNAIL SPADE SPICE SQUID STEAM STOOL
STORK STOVE STRAW SUGAR SWAMP SWING SWORD SYRUP TABLE TALON TAPIR THORN THYME TIARA TORCH
TOWER TRAIL TRUCK TRUNK TULIP TUNIC VAULT VIOLA VIPER WAFER WATCH WHALE WHEAT WHISK YACHT
YODEL YUCCA ZESTY JUMPY JAZZY FOGGY FLUFFY BUMPY LUMPY GOOFY WACKY ZIPPY BOXY`.split(/\s+/).filter(Boolean);
const FOUR = `ALOE ARCH BALL BARN BATH BEAK BEAM BEET BELT BIRD BOLT BOOK BULB BULL CALF
CAMP CAPE CARD CART CHEF CHIN CHIP CLAW CLAY CLUB COAL COMB CONE CORD COVE CUBE CURL DAWN
DECK DEER DIME DOCK DOLL DOME DUNE DUSK FARM FAWN FILM FIRE FLAX FLEA FOAL FOAM FORT FUEL
GALE GATE GOWN GULL HALO HELM HERB HERD HILL HOOF HOOP HOSE HUSK JADE JEEP JOEY KALE KELP
KILT KING KIWI LACE LAKE LAMB LARK LAWN LILY LOFT LOOM LUTE MANE MAZE MILL MOLE MOSS MULE
NAIL OATS OBOE OVAL OXEN PALM PAWN PEAK PIER PIPE PLOW POEM POLE POOL PUMA RAKE REED REEF
RING ROBE ROOF ROOT RUBY SAGE SALT SEED SILO SILK SINK SNOW SODA SOFA SPUD STEW TAIL TANK
TIDE TILE TOGA TOWN TRAY TUSK TWIG VEIL VEST VINE WALL WASP WELL WHIP WICK WING WOOD WOOL
WREN YETI ZEST JINX FIZZ BUZZ JAZZY HAZY LAZY COZY FOXY WAVY ZANY JOLT JUKE BIKE WAXY`.split(/\s+/).filter(Boolean);
const THREE = `ARK ASH AWL BAG BED BOG BUS CAR COD COG DIG DOT ELK ELM EWE FEZ GEL GEM HOE
HOG HOP HUG IMP JAY JUG KEG LID MIX MOB OAR OAT OIL ORB ORE PAL PAW PEG PEW POT PUN RAG RAT
RIM ROE SAX SOD SOW SUM TAN TOT TUG VOW WAD YAP YEN ZEN BUD JIG LAD MOM POP DUO GAP GAS JOY
FUN AIR ARM ART BAR BIT END INN LAW ODD PET RED RUN SET TAG TEN TIP TOP TRY TWO WAY WET BOX
FRY GUM BIN BUY CRY DAY DEW EBB FAR HOT ICY KIN LOG MAX NAB NOD OWN PAY RIP SIP SIT
TAB TOE TON WIZ YUM ZAG ZIG
ACE ARC AWE BOO BOP BYE COO COY DIM DRY FIB FLU GAB GOO GUY HIT HUE HUM JOB JUT LOW MOW NEW
ODE OLD ONE OUT OWE PEP PRO RAW RUB SAD SEW SHY SIX SLY TAX VEX WOO WOW WRY YES YET YIP`.split(/\s+/).filter(Boolean);

const dict = new Set(require("an-array-of-english-words").filter(w => w.length >= 3 && w.length <= 9).map(w => w.toUpperCase()));
const banned = new Set([...practice.flat(), ...original.flat()]);
const byLen = {};
const skipped = [];
for (const w of new Set([...SEVEN, ...SIX, ...FIVE, ...FOUR, ...THREE])) {
  if (!dict.has(w)) { skipped.push(w); continue; }
  if (banned.has(w) || w.length < 3 || w.length > 7) continue;
  (byLen[w.length] ||= []).push(w);
}
for (const k in byLen) byLen[k].sort();
if (skipped.length) console.warn("not in the game dictionary, skipped:", skipped.join(" "));
console.log("usable words by length:", Object.fromEntries(Object.entries(byLen).map(([k, v]) => [k, v.length])));

// ------------------------------------------------------------------ generate
let s = (SEED + existing.length) >>> 0;
const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = list => list[Math.floor(rnd() * list.length)];

const schedule = [...existing];
const lastUse = new Map();
const uses = new Map();
schedule.forEach((words, k) => words.forEach(w => { uses.set(w, (uses.get(w) || 0) + 1); lastUse.set(w, k); }));
const fixedSets = [...practice, ...original].map(p => p.join(""));

for (let k = existing.length; k < existing.length + ADD; k++) {
  const level = WEEK[dateOf(k).getUTCDay()];
  let found = null;
  for (let tries = 0; tries < 400000 && !found; tries++) {
    const words = pick(SHAPES[level]).map(n => pick(byLen[n]));
    if (new Set(words).size !== words.length) continue;
    if (words.some(w => (uses.get(w) || 0) >= MAX_USES[w.length] || (lastUse.has(w) && k - lastUse.get(w) < REUSE_GAP))) continue;
    const letters = words.join("");
    if (![...letters].some(c => SPICE.has(c))) continue;
    if (fixedSets.some(p => letterGap(letters, p) < MIN_GAP)) continue;
    if (schedule.some(p => letterGap(letters, p.join("")) < 3 || p.filter(w => words.includes(w)).length >= 2)) continue;
    found = words;
  }
  if (!found) throw new Error(`stuck at extension day ${k} (${level}); add words to the lists`);
  schedule.push(found);
  found.forEach(w => { uses.set(w, (uses.get(w) || 0) + 1); lastUse.set(w, k); });
}

// ------------------------------------------------------------------ write
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const line = (words, k) => {
  const d = dateOf(k);
  return `  [${words.map(x => `"${x}"`).join(", ")}], // #${FIRST + k} ${DAY[d.getUTCDay()]} ${d.toISOString().slice(0, 10)}`;
};
const body = `/* Daily puzzles from #${FIRST} (${dateOf(0).toISOString().slice(0, 10)}) on, GENERATED by
 * scripts/gen-dailies.mjs. Add more with \`node scripts/gen-dailies.mjs --add N\`.
 *
 * ⚠ APPEND ONLY. Each line IS a day (the comment says which). Editing,
 * reordering or regenerating a line changes a day that may already have been
 * played, and saved games restore by puzzle number with exact block positions.
 * Easy = 2 words, Medium = 3, Hard = 4; Saturday is the hard one. */
export const DAILY_EXTENSION: string[][] = [
${schedule.map(line).join("\n")}
];
`;
fs.writeFileSync(OUT, body);
const last = dateOf(schedule.length - 1).toISOString().slice(0, 10);
console.log(`wrote ${OUT}: ${schedule.length} dailies (${ADD} new), last one ${last}`);
const counts = {};
for (const w of schedule.flat()) counts[w.length] = (counts[w.length] || 0) + 1;
console.log("word uses by length:", counts, " distinct words:", new Set(schedule.flat()).size);
