import { CsvVisaWorkTable } from '../VisaWorkTable';

// Use our own route in every environment. In production Vercel fetches the CSV
// server-to-server, avoiding the CORS restriction on the source site.
const baseUrl = '/api/zone-data';
// Home Affairs specifies tourism and hospitality only for Tables 1–3.
const tourismJobs = ['Tourism & hospitality'];
const regionalJobs = [
  'Agriculture (plant & animal cultivation)',
  'Fishing & pearling',
  'Tree farming & felling',
  'Construction'
];

export const remoteAustraliaTable = new CsvVisaWorkTable({
  id: 'remote-australia', number: 2, label: 'Remote & Very Remote Australia', shortLabel: 'Remote · AU', color: '#fce7c5', accent: '#a85e00',
  description: 'Table 2 tourism and hospitality postcodes.', jobs: tourismJobs, sourceUrl: `${baseUrl}/table2.csv`
});

export const northernAustraliaTable = new CsvVisaWorkTable({
  id: 'northern', number: 3, label: 'Northern Australia', shortLabel: 'Northern', color: '#fff3c2', accent: '#8b6800',
  description: 'Table 3 postcodes eligible for tourism and hospitality work.', jobs: tourismJobs, sourceUrl: `${baseUrl}/table3.csv`
});

export const regionalAustraliaTable = new CsvVisaWorkTable({
  id: 'regional', number: 4, label: 'Regional Australia', shortLabel: 'Regional', color: '#dff4df', accent: '#27724c',
  description: 'Table 4 postcodes for agriculture, fishing and pearling, tree farming and felling, and construction.', jobs: regionalJobs, sourceUrl: `${baseUrl}/table4.csv`
});

export const bushfireTable = new CsvVisaWorkTable({
  id: 'bushfire', number: 5, label: 'Bushfire declared areas', shortLabel: 'Bushfire', color: '#f9ddd8', accent: '#a64438',
  description: 'Declared bushfire-affected postcodes. Recovery work carried out after 31 July 2019 can count.', jobs: ['Bushfire recovery work'], sourceUrl: `${baseUrl}/table5.csv`
});

export const naturalDisasterTable = new CsvVisaWorkTable({
  id: 'disaster', number: 6, label: 'Natural disaster declared areas', shortLabel: 'Disaster', color: '#dfeefa', accent: '#2f6995',
  description: 'Declared flood, cyclone and severe-weather postcodes. Recovery work carried out from 31 December 2021 can count.', jobs: ['Natural disaster recovery work'], sourceUrl: `${baseUrl}/table6.csv`
});
