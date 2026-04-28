// ─────────────────────────────────────────────────────────────────────────────
// MEDSYNC — City & Specialty Aliases
// Extracted from route.ts for easy scalability.
// To add a new city: add it to LOWER_BAVARIA_ALIASES or LARGE_CITY_ALIASES.
// To add a new specialty: add it to SPECIALTY_ALIASES.
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function withAsciiVariants(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(map)) {
    const key   = normalizeText(rawKey);
    const value = normalizeText(rawValue);
    out[key] = value;
    out[key.replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")] = value;
    out[key.replace(/ä/g,"a").replace(/ö/g,"o").replace(/ü/g,"u").replace(/ß/g,"ss")]   = value;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY ALIASES
// ─────────────────────────────────────────────────────────────────────────────

const LOWER_BAVARIA_ALIASES = withAsciiVariants({
  // Rottal-Inn
  "pfarrkirchen": "pfarrkirchen",
  "eggenfelden": "eggenfelden",
  "simbach": "simbach am inn",
  "simbach am inn": "simbach am inn",
  "bad birnbach": "bad birnbach",
  "bad griesbach": "bad griesbach im rottal",
  "bad griesbach im rottal": "bad griesbach im rottal",
  "gangkofen": "gangkofen",
  "triftern": "triftern",
  "arnstorf": "arnstorf",
  "rotthalmünster": "rotthalmünster",
  "ering": "ering",
  "massing": "massing",
  "wurmannsquick": "wurmannsquick",
  "unterdietfurt": "unterdietfurt",
  "sulzbach": "sulzbach",

  // Passau
  "passau": "passau",
  "vilshofen": "vilshofen an der donau",
  "vilshofen an der donau": "vilshofen an der donau",
  "pocking": "pocking",
  "hauzenberg": "hauzenberg",
  "wegscheid": "wegscheid",
  "obernzell": "obernzell",
  "tittling": "tittling",
  "kirchham": "kirchham",
  "neuburg am inn": "neuburg am inn",
  "thyrnau": "thyrnau",
  "untergriesbach": "untergriesbach",
  "aicha": "aicha vorm wald",
  "aicha vorm wald": "aicha vorm wald",
  "hofkirchen": "hofkirchen",
  "ruderting": "ruderting",

  // Deggendorf
  "deggendorf": "deggendorf",
  "plattling": "plattling",
  "hengersberg": "hengersberg",
  "osterhofen": "osterhofen",
  "metten": "metten",
  "niederalteich": "niederalteich",
  "wallersdorf": "wallersdorf",
  "stephansposching": "stephansposching",
  "außernzell": "außernzell",
  "lalling": "lalling",

  // Freyung-Grafenau
  "freyung": "freyung",
  "grafenau": "grafenau",
  "waldkirchen": "waldkirchen",
  "schönberg": "schönberg",
  "perlesreut": "perlesreut",
  "ringelai": "ringelai",
  "neuschönau": "neuschönau",
  "spiegelau": "spiegelau",
  "haidmühle": "haidmühle",

  // Regen
  "regen": "regen",
  "zwiesel": "zwiesel",
  "bodenmais": "bodenmais",
  "viechtach": "viechtach",
  "bayerisch eisenstein": "bayerisch eisenstein",
  "kirchdorf": "kirchdorf im wald",
  "kirchdorf im wald": "kirchdorf im wald",
  "teisnach": "teisnach",
  "prackenbach": "prackenbach",

  // Straubing-Bogen
  "straubing": "straubing",
  "bogen": "bogen",
  "mallersdorf": "mallersdorf-pfaffenberg",
  "mallersdorf-pfaffenberg": "mallersdorf-pfaffenberg",
  "pfaffenberg": "mallersdorf-pfaffenberg",
  "geiselhöring": "geiselhöring",
  "mitterfels": "mitterfels",
  "schwarzach": "schwarzach",
  "aiterhofen": "aiterhofen",
  "leiblfing": "leiblfing",
  "atting": "atting",
  "rattiszell": "rattiszell",

  // Landshut
  "landshut": "landshut",
  "ergolding": "ergolding",
  "essenbach": "essenbach",
  "ergoldsbach": "ergoldsbach",
  "vilsbiburg": "vilsbiburg",
  "rottenburg": "rottenburg an der laaber",
  "rottenburg an der laaber": "rottenburg an der laaber",
  "neufahrn": "neufahrn in niederbayern",
  "neufahrn in niederbayern": "neufahrn in niederbayern",
  "altdorf": "altdorf",
  "adlkofen": "adlkofen",
  "bruckberg": "bruckberg",
  "wurmsham": "wurmsham",
  "niederaichbach": "niederaichbach",
  "wörth": "wörth an der isar",
  "wörth an der isar": "wörth an der isar",
  "worth an der isar": "wörth an der isar",

  // Dingolfing-Landau
  "dingolfing": "dingolfing",
  "landau": "landau an der isar",
  "landau an der isar": "landau an der isar",
  "landau isar": "landau an der isar",
  "frontenhausen": "frontenhausen",
  "reisbach": "reisbach",
  "eichendorf": "eichendorf",
  "mamming": "mamming",
  "pilsting": "pilsting",
  "niederviehbach": "niederviehbach",
  "moosthenning": "moosthenning",

  // Kelheim
  "kelheim": "kelheim",
  "abensberg": "abensberg",
  "mainburg": "mainburg",
  "neustadt an der donau": "neustadt an der donau",
  "neustadt donau": "neustadt an der donau",
  "bad abbach": "bad abbach",
  "saal an der donau": "saal an der donau",
  "painten": "painten",
  "siegenburg": "siegenburg",

  // Bordering districts
  "altötting": "altötting",
  "neuötting": "neuötting",
  "burghausen": "burghausen",
  "garching an der alz": "garching an der alz",
  "tüßling": "tüßling",
  "mühldorf": "mühldorf am inn",
  "mühldorf am inn": "mühldorf am inn",
  "waldkraiburg": "waldkraiburg",
  "ampfing": "ampfing",
  "lohkirchen": "lohkirchen",
});

const TOP_CITY_ALIASES = withAsciiVariants({
  "berlin": "berlin",
  "hamburg": "hamburg",
  "münchen": "münchen",
  "munich": "münchen",
  "köln": "köln",
  "cologne": "köln",
  "frankfurt": "frankfurt am main",
  "frankfurt am main": "frankfurt am main",
  "stuttgart": "stuttgart",
  "düsseldorf": "düsseldorf",
  "dortmund": "dortmund",
  "essen": "essen",
  "leipzig": "leipzig",
  "bremen": "bremen",
  "dresden": "dresden",
  "hannover": "hannover",
  "hanover": "hannover",
  "nürnberg": "nürnberg",
  "nuremberg": "nürnberg",
  "duisburg": "duisburg",
  "bochum": "bochum",
  "wuppertal": "wuppertal",
  "bielefeld": "bielefeld",
});

const LARGE_CITY_ALIASES = withAsciiVariants({
  "bonn": "bonn",
  "münster": "münster",
  "karlsruhe": "karlsruhe",
  "mannheim": "mannheim",
  "augsburg": "augsburg",
  "wiesbaden": "wiesbaden",
  "mönchengladbach": "mönchengladbach",
  "gelsenkirchen": "gelsenkirchen",
  "aachen": "aachen",
  "braunschweig": "braunschweig",
  "brunswick": "braunschweig",
  "chemnitz": "chemnitz",
  "kiel": "kiel",
  "halle": "halle (saale)",
  "halle saale": "halle (saale)",
  "halle (saale)": "halle (saale)",
  "magdeburg": "magdeburg",
  "freiburg": "freiburg im breisgau",
  "freiburg im breisgau": "freiburg im breisgau",
  "krefeld": "krefeld",
  "lübeck": "lübeck",
  "oberhausen": "oberhausen",
  "erfurt": "erfurt",
  "mainz": "mainz",
  "rostock": "rostock",
  "kassel": "kassel",
  "hagen": "hagen",
  "potsdam": "potsdam",
  "saarbrücken": "saarbrücken",
  "hamm": "hamm",
  "mülheim": "mülheim an der ruhr",
  "mülheim an der ruhr": "mülheim an der ruhr",
  "ludwigshafen": "ludwigshafen am rhein",
  "ludwigshafen am rhein": "ludwigshafen am rhein",
  "leverkusen": "leverkusen",
  "osnabrück": "osnabrück",
  "solingen": "solingen",
  "heidelberg": "heidelberg",
  "herne": "herne",
  "neuss": "neuss",
  "darmstadt": "darmstadt",
  "paderborn": "paderborn",
  "regensburg": "regensburg",
  "ratisbon": "regensburg",
  "ingolstadt": "ingolstadt",
  "würzburg": "würzburg",
  "fürth": "fürth",
  "ulm": "ulm",
  "heilbronn": "heilbronn",
  "pforzheim": "pforzheim",
  "wolfsburg": "wolfsburg",
  "offenbach": "offenbach am main",
  "offenbach am main": "offenbach am main",
  "bottrop": "bottrop",
  "oldenburg": "oldenburg",
  "trier": "trier",
  "reutlingen": "reutlingen",
  "koblenz": "koblenz",
  "bremerhaven": "bremerhaven",
  "recklinghausen": "recklinghausen",
  "jena": "jena",
  "moers": "moers",
  "salzgitter": "salzgitter",
  "siegen": "siegen",
  "gütersloh": "gütersloh",
  "hildesheim": "hildesheim",
  "hanau": "hanau",
  "kaiserslautern": "kaiserslautern",
  "norderstedt": "norderstedt",
  "esslingen": "esslingen am neckar",
  "esslingen am neckar": "esslingen am neckar",
  "ludwigsburg": "ludwigsburg",
  "konstanz": "konstanz",
  "villingen-schwenningen": "villingen-schwenningen",
  "marburg": "marburg",
  "tübingen": "tübingen",
  "flensburg": "flensburg",
  "detmold": "detmold",
  "bamberg": "bamberg",
  "bayreuth": "bayreuth",
  "landau in der pfalz": "landau in der pfalz",
  "aschaffenburg": "aschaffenburg",
  "celle": "celle",
  "lünen": "lünen",
  "ravensburg": "ravensburg",
  "düren": "düren",
  "friedrichshafen": "friedrichshafen",
  "göppingen": "göppingen",
  "gießen": "gießen",
  "aalen": "aalen",
  "worms": "worms",
  "weimar": "weimar",
  "stralsund": "stralsund",
  "greifswald": "greifswald",
  "cottbus": "cottbus",
  "brandenburg": "brandenburg an der havel",
  "brandon an der havel": "brandenburg an der havel",
  "fulda": "fulda",
  "schwerin": "schwerin",
  "wilhelmshaven": "wilhelmshaven",
  "delmenhorst": "delmenhorst",
  "böblingen": "böblingen",
  "garbsen": "garbsen",
  "neu-ulm": "neu-ulm",
  "neu ulm": "neu-ulm",
  "rosenheim": "rosenheim",
  "neumünster": "neumünster",
  "hof": "hof",
  "zwickau": "zwickau",
  "plauen": "plauen",
  "dessau": "dessau-roßlau",
  "dessau-roßlau": "dessau-roßlau",
  "suhl": "suhl",
  "eisenach": "eisenach",
  "goslar": "goslar",
  "leer": "leer",
  "lippstadt": "lippstadt",
  "unna": "unna",
  "velbert": "velbert",
  "ratingen": "ratingen",
  "marl": "marl",
  "cloppenburg": "cloppenburg",
  "rastatt": "rastatt",
});

// Lower Bavaria takes priority
export const CITY_ALIASES: Record<string, string> = {
  ...TOP_CITY_ALIASES,
  ...LARGE_CITY_ALIASES,
  ...LOWER_BAVARIA_ALIASES,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALTY ALIASES
// ─────────────────────────────────────────────────────────────────────────────

export const SPECIALTY_ALIASES: Record<string, string> = {
  "cardiology": "kardiologie",
  "kardiology": "kardiologie",
  "kardiologie": "kardiologie",
  "neurology": "neurologie",
  "neurologie": "neurologie",
  "pediatrics": "pädiatrie",
  "paediatrics": "pädiatrie",
  "pädiatrie": "pädiatrie",
  "gynecology": "gynäkologie",
  "gynaecology": "gynäkologie",
  "gynäkologie": "gynäkologie",
  "orthopedics": "orthopädie",
  "orthopaedics": "orthopädie",
  "orthopädie": "orthopädie",
  "psychiatry": "psychiatrie",
  "psychiatrie": "psychiatrie",
  "dermatology": "dermatologie",
  "dermatologie": "dermatologie",
  "urology": "urologie",
  "urologie": "urologie",
  "gastroenterology": "gastroenterologie",
  "gastroenterologie": "gastroenterologie",
  "pulmonology": "pneumologie",
  "pneumology": "pneumologie",
  "pneumologie": "pneumologie",
  "general medicine": "allgemeinmedizin",
  "family medicine": "allgemeinmedizin",
  "allgemeinmedizin": "allgemeinmedizin",
  "internal medicine": "innere medizin",
  "innere medizin": "innere medizin",
  "surgery": "chirurgie",
  "chirurgie": "chirurgie",
  "ent": "hno",
  "ear nose throat": "hno",
  "hno": "hno",
  "ophthalmology": "augenheilkunde",
  "augenheilkunde": "augenheilkunde",
  "rheumatology": "rheumatologie",
  "rheumatologie": "rheumatologie",
  "obstetrics": "geburtshilfe",
  "geburtshilfe": "geburtshilfe",
  "emergency medicine": "notaufnahme",
  "emergency": "notaufnahme",
  "notaufnahme": "notaufnahme",
  "allergy / immunology": "allergologie",
  "allergy": "allergologie",
  "immunology": "allergologie",
  "allergologie": "allergologie",
  "nephrology": "nephrologie",
  "nephrologie": "nephrologie",
  "hematology": "hämatologie",
  "haematology": "hämatologie",
  "hämatologie": "hämatologie",
  "oncology": "onkologie",
  "onkologie": "onkologie",
  "radiology": "radiologie",
  "radiologie": "radiologie",
  "anesthesiology": "anästhesiologie",
  "anaesthesiology": "anästhesiologie",
  "anästhesiologie": "anästhesiologie",
  "endocrinology": "endokrinologie",
  "endokrinologie": "endokrinologie",
};

export const KNOWN_SPECIALTIES = Array.from(
  new Set(Object.keys(SPECIALTY_ALIASES))
).sort((a, b) => b.length - a.length);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeCity(city: string | null): string | null {
  if (!city) return null;
  const key = normalizeText(city);
  return CITY_ALIASES[key] || key;
}

export function normalizeSpecialty(specialty: string | null): string | null {
  if (!specialty) return null;
  const key = normalizeText(specialty);
  return SPECIALTY_ALIASES[key] || key;
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW PROVIDER TYPE + mapProviders
// Shared between route.ts (server) and page.tsx (client fetch handler)
// ─────────────────────────────────────────────────────────────────────────────

export interface RawProvider {
  id: string;
  name?: string;
  amenity?: string;
  addr_city?: string;
  addr_postcode?: string;
  addr_street?: string;
  state?: string;
  lat?: number;
  lon?: number;
  specialties?: string | string[];
  opening_hours?: string;
  accepts_gkv?: boolean;
  accepts_pkv?: boolean;
  nursing_ratio?: number;
  annual_cases?: number;
  load_score?: number;
  er_load?: string;
  phone?: string;
  website?: string;
  provider_source?: string;
}

export function mapProviders(data: RawProvider[]) {
  return data.map((p: RawProvider) => {
    const isHospital = p.amenity === "hospital";

    const occupancy: number =
      typeof p.load_score === "number"
        ? Math.min(95, Math.round(p.load_score))
        : p.annual_cases
          ? Math.min(95, Math.round(p.annual_cases / 300))
          : 50;

    const expertise: number =
      typeof p.nursing_ratio === "number"
        ? Math.min(100, Math.round(p.nursing_ratio))
        : 60;

    const ambulatory: number = isHospital ? 40 : 80;
    const wait: number = isHospital ? 45 : 20;

    return {
      id: p.id,
      name: p.name || "Unknown Provider",
      city: p.addr_city,
      state: p.state,
      zip: p.addr_postcode,
      lat: p.lat,
      lon: p.lon,
      providerType: isHospital ? "Hospital" : "Clinic",
      specialties: Array.isArray(p.specialties)
        ? p.specialties
        : p.specialties
          ? [p.specialties]
          : [],
      telemedicineAvailable: false,
      openingHours: p.opening_hours || "08:00 - 18:00",
      referralRequired: isHospital,
      insuranceAccepted: p.accepts_gkv
        ? ["AOK", "TK", "Barmer", "DAK", "IKK", "BKK"]
        : ["Private Insurance"],
      ambulatory,
      expertise,
      occupancy,
      wait,
      erLoad:
        p.er_load ??
        (occupancy > 85 ? "Crowded" : occupancy > 60 ? "Moderate" : "Normal"),
        phone: p.phone || undefined,
        website: p.website || undefined,
    };
  });
}