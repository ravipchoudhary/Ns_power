export type ChecklistAnswer = "YES" | "NO" | "NA";

export interface FeedingOptions {
  automaticSprinkler: boolean;
  standpipe: boolean;
  fireHydrants: boolean;
  other: boolean;
  otherText: string;
}

export function mergeFeedingOptions(
  feeding?: Partial<FeedingOptions>
): FeedingOptions {
  return {
    automaticSprinkler: Boolean(feeding?.automaticSprinkler),
    standpipe: Boolean(feeding?.standpipe),
    fireHydrants: Boolean(feeding?.fireHydrants),
    other: Boolean(feeding?.other),
    otherText: feeding?.otherText ?? "",
  };
}

export interface ChecklistItem {
  key: string;
  label: string;
  dieselOnly?: boolean;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: "lubrication",
    label:
      "Lubricate bearings (if applicable) using the recommended lubricant",
  },
  {
    key: "seals_gaskets",
    label:
      "Inspect seals and gaskets for wear, cracks, or leaks; replace if necessary",
  },
  {
    key: "electrical",
    label:
      "Check electrical connections for loose, damaged, or corroded wires; tighten/repair",
  },
  {
    key: "motor_performance",
    label: "Test motor performance (voltage, amperage, load)",
  },
  {
    key: "housing_piping",
    label:
      "Inspect pump housing and piping for corrosion, leaks, or damage",
  },
  {
    key: "calibration",
    label: "Recalibrate sensors, pressure gauges, and flow meters",
  },
  {
    key: "corrosion_protection",
    label: "Apply corrosion protection coatings to metal parts",
  },
  {
    key: "grease_bearings",
    label: "Apply appropriate grease to bearings if required",
  },
  {
    key: "relief_valve",
    label: "Circulating relief valve functions properly",
  },
  {
    key: "diesel_battery",
    label: "For diesel engine driver: storage battery units maintained",
    dieselOnly: true,
  },
  {
    key: "diesel_charger",
    label: "For diesel engine driver: battery charger units maintained",
    dieselOnly: true,
  },
  {
    key: "diesel_cooling",
    label:
      "For diesel heat-exchanger cooled: cooling water discharges through waste cone; bypass valves closed; strainer maintained",
    dieselOnly: true,
  },
  {
    key: "diesel_fuel",
    label: "For diesel driven pumps: fuel level appropriate",
    dieselOnly: true,
  },
  {
    key: "alarms",
    label: "All alarms functional",
  },
];

export interface ChecklistEntry {
  key: string;
  answer: ChecklistAnswer | "";
  comment?: string;
}

/** Ensures every checklist row exists so radio buttons can update state. */
export function normalizeChecklist(
  saved?: Array<{ key: string; answer?: string | null }> | null
): ChecklistEntry[] {
  return CHECKLIST_ITEMS.map((item) => {
    const existing = saved?.find((c) => c.key === item.key);
    const ans = existing?.answer;
    const answer: ChecklistAnswer | "" =
      ans === "YES" || ans === "NO" || ans === "NA" ? ans : "";
    return { key: item.key, answer };
  });
}

export const COMPANY = {
  name: "NS POWER SOLUTION",
  tagline:
    "Registered Office & Plant — Sale & Service Dealer Kirloskar & Cummins Genset up to 2250 KVA",
  address:
    "Office No.-B-164 Phase-II, Near Old District Court Complex, Gautam Budh Nagar, Noida-201305 (U.P.) India",
  landline: "0120-4360636",
  mobile: "+91-9899647757, 9899648857, 8559900088, 9625284489",
  email: "info@nspowersolution.com",
  website: "www.nspowersolution.com",
  primaryColor: "#76B900",
};
