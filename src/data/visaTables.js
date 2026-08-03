import { bushfireTable, naturalDisasterTable, northernAustraliaTable, regionalAustraliaTable, remoteAustraliaTable, remoteVeryRemoteTable } from './tables/OfficialCsvTables';

export const visaTables = [remoteVeryRemoteTable, remoteAustraliaTable, northernAustraliaTable, regionalAustraliaTable, bushfireTable, naturalDisasterTable];
export const activeTable = remoteVeryRemoteTable;
