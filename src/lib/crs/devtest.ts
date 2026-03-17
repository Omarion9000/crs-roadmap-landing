import { simulateTop } from "./optimize";
import type { Lang, Profile } from "./types";

const lang: Lang = "en";

const profile: Profile = {
  baseCrs: 472,
  ieltsClb: 8,
  frenchClb: 0,
  canExpYears: 0,
  hasJobOffer: false,
  hasPnp: false,
};

const result = simulateTop(profile, lang, 5);
console.log(JSON.stringify(result, null, 2));