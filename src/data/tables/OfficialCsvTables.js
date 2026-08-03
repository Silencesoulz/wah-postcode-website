import { CsvVisaWorkTable } from '../VisaWorkTable';
import table1Csv from '../source/table1.csv?raw';
import table2Csv from '../source/table2.csv?raw';
import table3Csv from '../source/table3.csv?raw';
import table4Csv from '../source/table4.csv?raw';
import table5Csv from '../source/table5.csv?raw';
import table6Csv from '../source/table6.csv?raw';

// Home Affairs specifies tourism and hospitality only for Tables 1–3.
const tourismJobs = ['Tourism & hospitality'];
const regionalJobs = [
  'Agriculture (plant & animal cultivation)',
  'Fishing & pearling',
  'Tree farming & felling',
  'Construction'
];

export const remoteVeryRemoteTable = new CsvVisaWorkTable({
  id: 'remote', number: 1, label: 'Remote & Very Remote Australia', shortLabel: 'Remote', color: '#e8e7fa', accent: '#5e5bae',
  description: 'Tourism and hospitality work in Table 1 Remote and Very Remote Australia postcodes.', jobs: tourismJobs, sourceCsv: table1Csv
});

export const remoteAustraliaTable = new CsvVisaWorkTable({
  id: 'remote-australia', number: 2, label: 'Remote & Very Remote Australia', shortLabel: 'Remote · AU', color: '#fce7c5', accent: '#a85e00',
  description: 'Table 2 tourism and hospitality postcodes.', jobs: tourismJobs, sourceCsv: table2Csv
});

export const northernAustraliaTable = new CsvVisaWorkTable({
  id: 'northern', number: 3, label: 'Northern Australia', shortLabel: 'Northern', color: '#fff3c2', accent: '#8b6800',
  description: 'Table 3 postcodes eligible for tourism and hospitality work.', jobs: tourismJobs, sourceCsv: table3Csv
});

export const regionalAustraliaTable = new CsvVisaWorkTable({
  id: 'regional', number: 4, label: 'Regional Australia', shortLabel: 'Regional', color: '#dff4df', accent: '#27724c',
  description: 'Table 4 postcodes for agriculture, fishing and pearling, tree farming and felling, and construction.', jobs: regionalJobs, sourceCsv: table4Csv
});

export const bushfireTable = new CsvVisaWorkTable({
  id: 'bushfire', number: 5, label: 'Bushfire declared areas', shortLabel: 'Bushfire', color: '#f9ddd8', accent: '#a64438',
  description: 'Declared bushfire-affected postcodes. Recovery work carried out after 31 July 2019 can count.', jobs: ['Bushfire recovery work'], sourceCsv: table5Csv
});

export const naturalDisasterTable = new CsvVisaWorkTable({
  id: 'disaster', number: 6, label: 'Natural disaster declared areas', shortLabel: 'Disaster', color: '#dfeefa', accent: '#2f6995',
  description: 'Declared flood, cyclone and severe-weather postcodes. Recovery work carried out from 31 December 2021 can count.', jobs: ['Natural disaster recovery work'], sourceCsv: table6Csv
});
