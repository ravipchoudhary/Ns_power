export type FsrCheckItem = {
  key: string;
  label: string;
  options: string[];
};

export const FSR_BEFORE_START: FsrCheckItem[] = [
  { key: "nutsBolts", label: "All nuts & bolts", options: ["Proper", "Tightened"] },
  {
    key: "batteryCondition",
    label: "Battery condition",
    options: ["Charged", "Discharged"],
  },
  {
    key: "batteryTerminal",
    label: "Battery terminal / Leads",
    options: ["Proper", "Damaged", "Replaced"],
  },
  {
    key: "electrolyte",
    label: "Electrolyte level",
    options: ["High", "Med", "Low", "Topped up"],
  },
  {
    key: "valveClearance",
    label: "Valve clearance",
    options: ["Proper", "Rectified"],
  },
  {
    key: "vBeltFailure",
    label: "V belt failure system",
    options: ["Functioning", "Not proper", "Absent"],
  },
  {
    key: "lubOilLevel",
    label: "Lub oil level",
    options: ["High", "Med", "Low", "Topped up"],
  },
  {
    key: "lubOilCondition",
    label: "Lub oil condition",
    options: ["Normal", "Dirty"],
  },
  {
    key: "dynamo",
    label: "Dynamo condition",
    options: ["Working", "Faulty", "Absent"],
  },
  { key: "autoMode", label: "Auto Mode", options: ["Working", "Faulty"] },
  {
    key: "airCleaner",
    label: "Air cleaner & button filter",
    options: ["Cleaned", "Not cleaned"],
  },
  {
    key: "radiatorWater",
    label: "Water level in radiator",
    options: ["High", "Topped up", "Air cooled"],
  },
  {
    key: "vBeltBlower",
    label: "V belt for blower",
    options: ["Proper", "Cracked", "Replaced"],
  },
  {
    key: "vBeltDynamo",
    label: "V belt for dynamo",
    options: ["Proper", "Cracked", "Replaced", "Missing"],
  },
  {
    key: "vBeltTension",
    label: "V belt tension",
    options: ["Proper", "Adjusted"],
  },
  {
    key: "carbonBrush",
    label: "Carbon brush",
    options: ["Proper", "Burnt", "Replaced"],
  },
  {
    key: "cableTerminal",
    label: "Cable terminal plate",
    options: ["Proper", "Burnt", "Replaced"],
  },
  {
    key: "alternatorCover",
    label: "Alternator back cover",
    options: ["Fitted", "Removed"],
  },
  {
    key: "exhaustPipe",
    label: "Exhaust pipe, flexible pipe, legging",
    options: ["Proper", "Damaged"],
  },
  {
    key: "radiatorCondition",
    label: "Radiator Condition",
    options: ["Normal", "Dirty"],
  },
];

export type FsrFormData = {
  reportNo?: string;
  engineNo?: string;
  model?: string;
  lastServiceDone?: string;
  nextServiceDue?: string;
  dgStartTime?: string;
  dgStopTime?: string;
  loadR?: string;
  loadY?: string;
  loadB?: string;
  voltage?: string;
  hoursMeter?: string;
  dgRpm?: string;
  visitType?: "GENERAL_CHECKUP" | "SERVICE" | "COMPLAINT";
  complaintNature?: string;
  averageRunning?: string;
  beforeStart?: Record<string, string>;
  oilPressure?: string;
  waterTemp?: string;
  engineSound?: "normal" | "abnormal";
  autoModeStatus?: "Starting" | "Stopping";
  exhaustSmoke?: "Normal" | "Abnormal" | "Leakage";
  breatherSmoke?: "Normal" | "Abnormal";
  dieselLeakage?: "Yes" | "No" | "Rectified";
  dieselLeakageFrom?: string;
  oilLeakage?: "Yes" | "No" | "Rectified";
  oilLeakageFrom?: string;
  actionTaken?: string;
  roomCleaned?: "Yes" | "No";
  componentsCleaned?: "Yes" | "No";
  otherAbnormality?: string;
  spareReplaced?: string;
  pendingActions?: string;
  customerRemarks?: string;
  customerEmail?: string;
  customerMobile?: string;
  inTime?: string;
  outTime?: string;
};

export function defaultFsrFormData(): FsrFormData {
  const beforeStart: Record<string, string> = {};
  for (const item of FSR_BEFORE_START) {
    beforeStart[item.key] = "";
  }
  return { beforeStart, visitType: "SERVICE" };
}

export function parseFsrFormData(json: string): FsrFormData {
  try {
    const data = JSON.parse(json || "{}") as FsrFormData;
    return { ...defaultFsrFormData(), ...data };
  } catch {
    return defaultFsrFormData();
  }
}

export function validateFsrForm(data: FsrFormData): string | null {
  if (!data.beforeStart) return "Complete pre-start checklist";
  for (const item of FSR_BEFORE_START) {
    if (!data.beforeStart[item.key]) {
      return `Please complete: ${item.label}`;
    }
  }
  if (!data.engineSound) return "Select engine / alternator sound status";
  if (!data.exhaustSmoke) return "Select exhaust smoke status";
  return null;
}
