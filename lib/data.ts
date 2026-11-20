// Real figures: U.S. Census American Community Survey (ACS) 2020-2024. Everything else in the app is demo data.
export const US = { income: 80734, poverty: 12.5, bachelors: 35.7 };

export type County = {
  id: string;
  name: string;
  place: string;
  zip: string;
  zipInferred?: boolean;
  operator: string;
  pop: number;
  income: number;
  poverty: number;
  bachelors: number;
  race: [string, number][];
};

export const COUNTIES: County[] = [
  { id: "shelby", name: "Shelby County, TN", place: "Memphis (Southwest / Boxtown)", zip: "38109", operator: "xAI / SpaceX (Colossus 1 & 2)", pop: 42452, income: 37496, poverty: 32.1, bachelors: 14.2, race: [["Black", 94.9], ["White", 1.8], ["Hispanic", 0.8]] },
  { id: "richland", name: "Richland Parish, LA", place: "Holly Ridge / Rayville", zip: "71269", zipInferred: true, operator: "Meta (Hyperion)", pop: 12318, income: 49668, poverty: 27.3, bachelors: 17.4, race: [["White", 60.9], ["Black", 35.3], ["Hispanic", 2.1]] },
  { id: "taylor", name: "Taylor County, TX", place: "Abilene (north)", zip: "79601", operator: "OpenAI / Oracle / Crusoe (Stargate)", pop: 28050, income: 53631, poverty: 26.5, bachelors: 23.0, race: [["White", 51.6], ["Hispanic", 28.9], ["Black", 12.0], ["Asian", 3.1]] },
  { id: "laramie", name: "Laramie County, WY", place: "Cheyenne", zip: "82007", zipInferred: true, operator: "Microsoft", pop: 21704, income: 58745, poverty: 15.1, bachelors: 18.9, race: [["White", 66.0], ["Hispanic", 24.8]] },
  { id: "pottawattamie", name: "Pottawattamie County, IA", place: "Council Bluffs", zip: "51501", operator: "Google", pop: 34618, income: 59843, poverty: 16.3, bachelors: 16.0, race: [["White", 77.4], ["Hispanic", 16.0]] },
  { id: "wasco", name: "Wasco County, OR", place: "The Dalles", zip: "97058", operator: "Google", pop: 20360, income: 62181, poverty: 11.4, bachelors: 21.7, race: [["White", 69.7], ["Hispanic", 22.4]] },
];

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Community Vulnerability Score, 0 to 100: the average of poverty, income and education need. */
export function vulnerability(c: County) {
  const poverty = clamp((c.poverty / 25) * 100); // 25% or more = 100
  const income = clamp((1 - c.income / US.income / 1.5) * 100); // 150% of the U.S. median or more = 0
  const education = clamp((1 - c.bachelors / (2 * US.bachelors)) * 100); // twice the U.S. rate or more = 0
  return Math.round((poverty + income + education) / 3);
}

export type Level = "ok" | "warn" | "bad";
export const LEVEL_WORD: Record<Level, string> = { ok: "Within limit", warn: "Near limit", bad: "Over limit" };
export const levelOf = (value: number, limit: number): Level => (value > limit ? "bad" : value >= limit * 0.9 ? "warn" : "ok");

export const RECS = [
  { id: "setpoint", action: "Raise chilled-water supply temperature 2°F on cool nights", why: "Nights below 60°F need less cooling", mw: 0.6, gal: 9000 },
  { id: "economizer", action: "Switch to outside-air cooling when wet-bulb temperature is under 55°F", why: "Forecast shows 31 such hours this week", mw: 1.1, gal: 21000 },
  { id: "precool", action: "Pre-cool the halls before Thursday's 4 pm grid peak, then ease cooling for 2 hours", why: "Moves cooling out of the peak", mw: 1.8, gal: 0 },
  { id: "coils", action: "Clean condenser coils on cooling bank 3", why: "Pump energy is 9% above its baseline", mw: 0.4, gal: 3000 },
  { id: "effluent", action: "Use treated wastewater instead of drinking water while the aquifer is stressed", why: "Aquifer stress is high this month", mw: 0, gal: 64000 },
] as const;

export const PAST_EVENTS = [
  { date: "Nov 12", reason: "Evening peak", asked: 26.9, delivered: 27.4, ramp: 4, met: true },
  { date: "Oct 29", reason: "Line outage", asked: 26.5, delivered: 27.1, ramp: 4, met: true },
  { date: "Sep 18", reason: "Heat advisory", asked: 27.1, delivered: 27.6, ramp: 3, met: true },
  { date: "Aug 30", reason: "Heat advisory", asked: 27.0, delivered: 23.8, ramp: 12, met: false },
  { date: "Aug 14", reason: "Heat advisory", asked: 26.8, delivered: 27.2, ramp: 4, met: true },
  { date: "Jul 22", reason: "Evening peak", asked: 26.9, delivered: 27.4, ramp: 4, met: true },
  { date: "Jul 08", reason: "Heat advisory", asked: 26.4, delivered: 27.0, ramp: 5, met: true },
  { date: "Jun 25", reason: "Evening peak", asked: 26.6, delivered: 26.9, ramp: 4, met: true },
];

export const COMMITMENTS: { name: string; detail: string; status: "Met" | "Pending" | "At risk" | "Breached"; evidence: string }[] = [
  { name: "Payment in place of taxes", detail: "$4.2M of $4.2M paid for 2026", status: "Met", evidence: "County treasurer receipt" },
  { name: "Water cap and reclaimed water", detail: "0.41 of 0.50 million gallons a day, 38% reclaimed", status: "Met", evidence: "Water meter data" },
  { name: "Backup generator limit", detail: "92 of 100 permitted hours used", status: "At risk", evidence: "Air permit run log" },
  { name: "Local hires", detail: "184 of 300 by the end of 2027", status: "Pending", evidence: "Quarterly hiring filing" },
  { name: "Energy efficiency target", detail: "1.12 against a target of 1.40 or lower", status: "Met", evidence: "Power meter data" },
  { name: "Community battery funding", detail: "$14.4M paid in full", status: "Met", evidence: "Escrow statement" },
];

export const REPORT_KINDS = [
  { id: "noise", en: "Noise at night", es: "Ruido de noche" },
  { id: "exhaust", en: "Generator exhaust or smell", es: "Humo u olor de generadores" },
  { id: "water", en: "Low water pressure", es: "Baja presión de agua" },
  { id: "traffic", en: "Construction traffic", es: "Tráfico de construcción" },
  { id: "power", en: "Flickering power", es: "Parpadeo de la luz" },
] as const;
