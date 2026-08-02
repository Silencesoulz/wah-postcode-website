import { VisaWorkTable } from '../VisaWorkTable';

// Home Affairs: Table 1 — Remote and Very Remote Australia.
const ranges = [
  ['NSW', 2356, 2356], ['NSW', 2386, 2387], ['NSW', 2396, 2396], ['NSW', 2405, 2406], ['NSW', 2672, 2672], ['NSW', 2675, 2675], ['NSW', 2825, 2826], ['NSW', 2829, 2829], ['NSW', 2832, 2836], ['NSW', 2838, 2840], ['NSW', 2873, 2873], ['NSW', 2878, 2879], ['NSW', 2898, 2899],
  ['NT', 800, 999],
  ['QLD', 4025, 4025], ['QLD', 4183, 4183], ['QLD', 4417, 4420], ['QLD', 4422, 4423], ['QLD', 4426, 4428], ['QLD', 4454, 4454], ['QLD', 4461, 4462], ['QLD', 4465, 4465], ['QLD', 4467, 4468], ['QLD', 4470, 4470], ['QLD', 4474, 4475], ['QLD', 4477, 4482], ['QLD', 4486, 4494], ['QLD', 4496, 4497], ['QLD', 4680, 4680], ['QLD', 4694, 4695], ['QLD', 4697, 4697], ['QLD', 4699, 4707], ['QLD', 4709, 4714], ['QLD', 4717, 4717], ['QLD', 4720, 4728], ['QLD', 4730, 4733], ['QLD', 4735, 4746], ['QLD', 4750, 4751], ['QLD', 4753, 4754], ['QLD', 4756, 4757], ['QLD', 4798, 4812], ['QLD', 4814, 4825], ['QLD', 4828, 4830], ['QLD', 4849, 4850], ['QLD', 4852, 4852], ['QLD', 4854, 4856], ['QLD', 4858, 4861], ['QLD', 4865, 4865], ['QLD', 4868, 4888], ['QLD', 4890, 4892], ['QLD', 4895, 4895],
  ['VIC', 3424, 3424], ['VIC', 3506, 3506], ['VIC', 3509, 3509], ['VIC', 3512, 3512], ['VIC', 3889, 3892],
  ['SA', 5220, 5223], ['SA', 5302, 5304], ['SA', 5440, 5440], ['SA', 5576, 5577], ['SA', 5582, 5583], ['SA', 5602, 5607], ['SA', 5611, 5611], ['SA', 5630, 5633], ['SA', 5640, 5642], ['SA', 5650, 5655], ['SA', 5660, 5661], ['SA', 5670, 5671], ['SA', 5680, 5680], ['SA', 5690, 5690], ['SA', 5713, 5713], ['SA', 5715, 5715], ['SA', 5717, 5717], ['SA', 5719, 5720], ['SA', 5722, 5725], ['SA', 5730, 5734],
  ['TAS', 7139, 7139], ['TAS', 7255, 7257], ['TAS', 7466, 7470],
  ['WA', 6161, 6161], ['WA', 6335, 6338], ['WA', 6341, 6341], ['WA', 6343, 6343], ['WA', 6346, 6346], ['WA', 6348, 6348], ['WA', 6350, 6353], ['WA', 6355, 6359], ['WA', 6361, 6361], ['WA', 6363, 6363], ['WA', 6365, 6365], ['WA', 6367, 6369], ['WA', 6373, 6373], ['WA', 6375, 6375], ['WA', 6385, 6386], ['WA', 6418, 6429], ['WA', 6431, 6431], ['WA', 6434, 6434], ['WA', 6436, 6438], ['WA', 6440, 6440], ['WA', 6443, 6443], ['WA', 6445, 6448], ['WA', 6450, 6450], ['WA', 6452, 6452], ['WA', 6466, 6468], ['WA', 6470, 6470], ['WA', 6472, 6473], ['WA', 6475, 6477], ['WA', 6479, 6480], ['WA', 6484, 6484], ['WA', 6487, 6490], ['WA', 6515, 6515], ['WA', 6517, 6519], ['WA', 6536, 6536], ['WA', 6605, 6606], ['WA', 6608, 6609], ['WA', 6612, 6614], ['WA', 6616, 6616], ['WA', 6620, 6620], ['WA', 6623, 6623], ['WA', 6625, 6625], ['WA', 6627, 6628], ['WA', 6630, 6632], ['WA', 6635, 6635], ['WA', 6638, 6640], ['WA', 6731, 6731], ['WA', 6733, 6733], ['WA', 6798, 6799]
];

export const remoteVeryRemoteTable = new VisaWorkTable({
  id: 'remote', number: 1, label: 'Remote & Very Remote Australia', shortLabel: 'Remote', color: '#e8e7fa', accent: '#5e5bae',
  description: 'Tourism and hospitality work in Table 1 Remote and Very Remote Australia postcodes.', jobs: ['Tourism & hospitality'], ranges,
  namedPostcodes: [
    { code: '4810', town: 'Townsville', state: 'QLD', areas: ['remote'], jobs: ['Tourism & hospitality'] },
    { code: '4870', town: 'Cairns', state: 'QLD', areas: ['remote'], jobs: ['Tourism & hospitality'] },
    { code: '4740', town: 'Mackay', state: 'QLD', areas: ['remote'], jobs: ['Tourism & hospitality'] },
    { code: '4700', town: 'Rockhampton', state: 'QLD', areas: ['remote'], jobs: ['Tourism & hospitality'] },
    { code: '6536', town: 'Geraldton', state: 'WA', areas: ['remote'], jobs: ['Tourism & hospitality'] },
    { code: '0870', town: 'Alice Springs', state: 'NT', areas: ['remote'], jobs: ['Tourism & hospitality'] }
  ]
});
