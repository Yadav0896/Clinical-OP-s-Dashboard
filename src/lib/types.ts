// Clinical Ops Manual Team Tracker - TypeScript Types

export interface DailyRecord {
  date: string;
  agent: string;
  clinic: string;
  shift: string;
  // Scheduling
  schedTotal: number;
  schedCancel: number;
  newPatients: number;
  followUp: number;
  adminBookings: number;
  botBookings: number;
  genderValidated: string;
  eAdded: number;
  duplicatesFound: number;
  hmoFlagged: number;
  // Insurance
  insuranceUpdated: number;
  cardsUploaded: number;
  insuranceNotes: number;
  insuranceDirect: number;
  manualVerifications: number;
  vobCsvUploaded: number;
  // Patient Intake
  prFormsCorrected: number;
  hhFormsCorrected: number;
  formsUploadedEcw: number;
  formsFailed: number;
  // Fax
  faxReceived: number;
  faxClassified: number;
  faxClassifFailed: number;
  faxForwarded: number;
  faxFwdFailed: number;
  faxRenamed: number;
  faxRenFailed: number;
  failedFaxIds: string;
  faxNotes: string;
  // VOB
  vobTotal: number;
  vobMatched: number;
  vobUnmatched: number;
  vobCreated: number;
  vobUpdated: number;
  vobFailed: number;
}

export interface AgentSummary {
  agent: string;
  totalTasks: number;
  schedulingTasks: number;
  insuranceTasks: number;
  patientIntakeTasks: number;
  faxTasks: number;
  vobTasks: number;
  avgTasksPerDay: number;
  activeDays: number;
  completionRate: number;
  clinic: string;
  shifts: string[];
}

export interface ModuleSummary {
  module: string;
  total: number;
  count: number;
}

export interface KPIData {
  totalTasks: number;
  totalRecords: number;
  activeAgents: number;
  activeDays: number;
  avgTasksPerDay: number;
  topPerformer: string;
  topPerformerCount: number;
  faxSuccessRate: number;
  vobMatchRate: number;
  patientIntakeTotal: number;
  insuranceTotal: number;
  schedulingTotal: number;
  faxTotal: number;
  vobTotal: number;
}

export type FilterState = {
  clinic: string;
  agent: string;
  dateFrom: string;
  dateTo: string;
};

export type TabId = 'dashboard' | 'agents' | 'eod' | 'fax-vob';

export const AGENTS = [
  'Mary Jenifar', 'Devadharshan', 'Sharomi', 'Goushic',
  'Padmavathi', 'Praveen', 'Usman', 'Vinith', 'Aryan Singh'
] as const;

export const CLINICS = [
  'Denver Allergy', 'Dallas Allergy', 'Mid Island Allergy',
  'St. Paul Allergy', 'Chacko Allergy'
] as const;
