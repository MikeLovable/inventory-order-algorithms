
export const PERIODS_DEFAULT = 12;
export const SAMPLES_DEFAULT = 10;

// Global variables with getters and setters
let PERIODS = PERIODS_DEFAULT;
let SAMPLES = SAMPLES_DEFAULT;
let SELECTEDDATASOURCE: DataSource = {} as DataSource;
let SELECTEDALGORITHM: Algorithm = {} as Algorithm;

export const getPERIODS = (): number => PERIODS;
export const setPERIODS = (value: number): void => {
  PERIODS = Math.max(1, Math.min(20, value));
};

export const getSAMPLES = (): number => SAMPLES;
export const setSAMPLES = (value: number): void => {
  SAMPLES = Math.max(1, Math.min(30, value));
};

export const getSELECTEDDATASOURCE = (): DataSource => SELECTEDDATASOURCE;
export const setSELECTEDDATASOURCE = (value: DataSource): void => {
  SELECTEDDATASOURCE = value;
};

export const getSELECTEDALGORITHM = (): Algorithm => SELECTEDALGORITHM;
export const setSELECTEDALGORITHM = (value: Algorithm): void => {
  SELECTEDALGORITHM = value;
};

// Shared types
export type Rqt = number[]; // Manufacturing requirements array, minval=0, maxval=400
export type Rec = number[]; // Scheduled receipts array, minval=0, maxval=400
export type Inv = number[]; // Inventory array, minval=0, maxval=400
export type Ord = number[]; // Order array, minval=0, maxval=400

export interface ProductionScenario {
  Sel: boolean; // Whether scenario is selected
  MPN: string; // 7 character string (MPN_AAA, etc.)
  Inv: (number | "N/A")[]; // Expected inventory, where Inv[0] is starting inventory
  InvTgt: number; // Target inventory levels, minval=10, maxval=200
  SStok: number; // Safety stock levels, minval=0, maxval=5% of InvTgt
  LdTm: number; // Lead time in weeks, minval=1, maxval=5
  MOQ: number; // Minimum order quantity, minval=2, maxval=100
  PkQty: number; // Package quantity, minval=2, maxval=1/5 of MOQ
  Rqt: Rqt; // Requirements array
  Rec: Rec; // Receiving array
}

export interface OrderSchedule {
  MPN: string; // From ProductionScenario
  InInv: (number | "N/A")[]; // Copy of Inv from ProductionScenario
  InvTgt: number; // From ProductionScenario
  SStok: number; // From ProductionScenario
  LdTm: number; // From ProductionScenario
  MOQ: number; // From ProductionScenario
  PkQty: number; // From ProductionScenario
  Rqt: Rqt; // From ProductionScenario
  InRec: Rec; // Copy of Rec from ProductionScenario
  Ord: Ord; // Calculated order quantities
  Rec: Rec; // Calculated receiving quantities
  Inv: Inv; // Calculated inventory quantities
  Notes: string; // Notes about the OrderSchedule
}

export type ProductionScenarioArray = ProductionScenario[];
export type OrderScheduleArray = OrderSchedule[];

export interface DataSource {
  Name: string; // 10 character identifier
  Desc: string; // 20 character description
  ProductionScenarioArray: ProductionScenarioArray;
}

// Utility functions
export function generateRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generates values that comply with requirements
export function generateCompliantValues(): {
  ldTm: number;
  moq: number;
  invTgt: number;
  pkQty: number;
  sStok: number;
} {
  const ldTm = generateRandomInt(1, 5);
  const moq = generateRandomInt(2, 10) * 10; // Multiple of 10 between 20-100
  const invTgt = generateRandomInt(1, 20) * 10; // Multiple of 10 between 10-200
  
  // PkQty is a multiple of 5 and less than MOQ
  const pkQtyMax = Math.min(moq - 5, Math.floor(moq / 5) * 5);
  const pkQtyOptions = [];
  for (let i = 5; i <= pkQtyMax; i += 5) {
    pkQtyOptions.push(i);
  }
  const pkQty = pkQtyOptions[generateRandomInt(0, pkQtyOptions.length - 1)];
  
  // SStok is less than 20% of InvTgt
  const sStokMax = Math.floor(invTgt * 0.2);
  const sStok = generateRandomInt(0, sStokMax);
  
  return { ldTm, moq, invTgt, pkQty, sStok };
}

// Function to generate a random ProductionScenario
export function generateRandomProductionScenario(mpnBase: string = "MPN"): ProductionScenario {
  const periods = getPERIODS();
  const { ldTm, moq, invTgt, pkQty, sStok } = generateCompliantValues();
  
  const mpnSuffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  const rqt: number[] = Array(periods + 1).fill(0).map(() => generateRandomInt(0, 400));
  const rec: number[] = Array(periods + 1).fill(0).map(() => generateRandomInt(0, 400));
  const inv: (number | "N/A")[] = Array(periods + 1).fill("N/A");
  inv[0] = generateRandomInt(invTgt - sStok, invTgt + sStok);
  
  return {
    Sel: false,
    MPN: `${mpnBase}_${mpnSuffix}`,
    Inv: inv,
    InvTgt: invTgt,
    SStok: sStok,
    LdTm: ldTm,
    MOQ: moq,
    PkQty: pkQty,
    Rqt: rqt,
    Rec: rec
  };
}

// Function to generate a random ProductionScenarioArray
export function generateRandomProductionScenarioArray(): ProductionScenarioArray {
  const samples = getSAMPLES();
  const result: ProductionScenarioArray = [];
  
  for (let i = 0; i < samples; i++) {
    result.push(generateRandomProductionScenario());
  }
  
  return result;
}
