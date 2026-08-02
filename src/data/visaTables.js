import { remoteVeryRemoteTable } from './tables/RemoteVeryRemoteTable';
import { bushfireTable, naturalDisasterTable, northernAustraliaTable, regionalAustraliaTable, remoteAustraliaTable } from './tables/OfficialCsvTables';

export const visaTables = [remoteVeryRemoteTable, remoteAustraliaTable, northernAustraliaTable, regionalAustraliaTable, bushfireTable, naturalDisasterTable];
export const activeTable = remoteVeryRemoteTable;
