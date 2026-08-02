export class VisaWorkTable {
  constructor({ id, number, label, shortLabel, color, accent, description, jobs, ranges, namedPostcodes = [] }) {
    this.id = id;
    this.number = number;
    this.label = label;
    this.shortLabel = shortLabel;
    this.color = color;
    this.accent = accent;
    this.description = description;
    this.jobs = jobs;
    this.ranges = ranges;
    this.namedPostcodes = namedPostcodes;
    this._postcodes = null;
  }

  get area() {
    return { label: this.label, short: this.shortLabel, color: this.color, accent: this.accent, description: this.description, jobs: this.jobs };
  }

  get postcodes() {
    if (this._postcodes) return this._postcodes;
    const generated = this.ranges.flatMap(([state, start, end]) => Array.from({ length: end - start + 1 }, (_, index) => ({
      code: String(start + index).padStart(4, '0'), town: 'Eligible postcode', state, areas: [this.id], jobs: this.jobs
    })));
    this._postcodes = Array.from(new Map([...generated, ...this.namedPostcodes].map(item => [item.code, item])).values()).sort((a, b) => a.code.localeCompare(b.code));
    return this._postcodes;
  }

  findPostcode(code) {
    return this.postcodes.find(item => item.code === String(code).padStart(4, '0'));
  }

  boundaryChunks(size = 70) {
    return Array.from({ length: Math.ceil(this.postcodes.length / size) }, (_, index) => this.postcodes.slice(index * size, index * size + size));
  }

  async load() {
    return this.postcodes;
  }
}

export class CsvVisaWorkTable extends VisaWorkTable {
  constructor({ sourceUrl, allPostcodeStates = [], ...config }) {
    super({ ...config, ranges: [] });
    this.sourceUrl = sourceUrl;
    this.allPostcodeStates = allPostcodeStates;
  }

  async load() {
    if (this._loaded) return this.postcodes;
    const response = await fetch(this.sourceUrl);
    if (!response.ok) throw new Error(`Could not load ${this.id} postcodes`);
    const rows = (await response.text()).trim().split(/\r?\n/).slice(1);
    const entries = rows.flatMap(row => {
      const commaIndex = row.indexOf(',');
      if (commaIndex < 0) return [];
      const stateName = row.slice(0, commaIndex).trim();
      const codes = row.slice(commaIndex + 1).trim().replace(/^"|"$/g, '');
      const state = this.stateCode(stateName);
      if (/all postcodes|all areas/i.test(codes)) return this.expandAll(stateName, state);
      return codes.split(',').map(code => this.createPostcode(code.trim(), state));
    });
    this._postcodes = Array.from(new Map(entries.map(item => [item.code, item])).values()).sort((a, b) => a.code.localeCompare(b.code));
    this._loaded = true;
    return this.postcodes;
  }

  stateCode(name) {
    const states = { 'New South Wales': 'NSW', 'Northern Territory': 'NT', Queensland: 'QLD', Victoria: 'VIC', 'South Australia': 'SA', Tasmania: 'TAS', 'Western Australia': 'WA', 'Australian Capital Territory (ACT)': 'ACT', 'Norfolk Island': 'NI' };
    return states[name] || name.slice(0, 3).toUpperCase();
  }

  createPostcode(code, state) {
    return { code: String(code).padStart(4, '0'), town: 'Eligible postcode', state, areas: [this.id], jobs: this.jobs };
  }

  expandAll(stateName, state) {
    const ranges = { NT: [800, 999], ACT: [200, 299], SA: [5000, 5999], TAS: [7000, 7999], NI: [2899, 2899] };
    const range = ranges[state];
    if (!range) return [];
    return Array.from({ length: range[1] - range[0] + 1 }, (_, index) => this.createPostcode(range[0] + index, state));
  }
}
