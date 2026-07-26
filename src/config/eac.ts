export interface EACRegion {
  id: string;
  name: string;
  country: string;
  counties?: string[];
  biodiversityZones?: string[];
  carbonProjectTypes?: string[];
  isShowcase?: boolean;
  showcaseDescription?: string;
}

export interface EACCountry {
  code: string;
  name: string;
  capital: string;
  regions: EACRegion[];
}

export const EAC_COUNTRIES: EACCountry[] = [
  {
    code: 'TZ',
    name: 'Tanzania',
    capital: 'Dodoma',
    regions: [
      {
        id: 'tz-znz-north',
        name: 'Unguja Kaskazini (Zanzibar)',
        country: 'Tanzania',
        counties: ['Kaskazini A', 'Kaskazini B'],
        biodiversityZones: ['Misitu ya Mikoko', 'Miamba ya Matumbawe', 'Majani ya Bahari'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'agroforestry'],
        isShowcase: true,
        showcaseDescription: 'Zanzibar ina historia tajiri ya uhifadhi wa mazingira, ikijumuisha misitu ya mikoko, miamba ya matumbawe, na kilimo cha mwani.',
      },
      {
        id: 'tz-znz-south',
        name: 'Unguja Kusini (Zanzibar)',
        country: 'Tanzania',
        counties: ['Kusini', 'Kati'],
        biodiversityZones: ['Hifadhi ya Jozani', 'Miamba ya Matumbawe', 'Misitu ya Mvuli'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'reforestation'],
        isShowcase: true,
        showcaseDescription: 'Hifadhi ya Jozani ni makazi ya Colobus mwekundu wa Zanzibar na msitu muhimu wa kaboni.',
      },
      {
        id: 'tz-znz-town',
        name: 'Mjini Magharibi (Zanzibar)',
        country: 'Tanzania',
        counties: ['Mjini', 'Magharibi'],
        biodiversityZones: ['Miamba ya Matumbawe', 'Misitu ya Pwani'],
        carbonProjectTypes: ['blue_carbon', 'renewable_energy', 'conservation'],
        isShowcase: true,
        showcaseDescription: 'Eneo la mji mkuu wa Zanzibar lenye fursa za nishati mbadala na uhifadhi wa pwani.',
      },
      {
        id: 'tz-znz-pemba-north',
        name: 'Pemba Kaskazini (Zanzibar)',
        country: 'Tanzania',
        counties: ['Wete', 'Micheweni'],
        biodiversityZones: ['Misitu ya Mikoko', 'Miamba ya Matumbawe', 'Vishamba vya Mwani'],
        carbonProjectTypes: ['blue_carbon', 'agroforestry', 'soil_carbon'],
        isShowcase: true,
        showcaseDescription: 'Pemba inajulikana kwa kilimo cha karafuu na mwani, na misitu mizito ya mikoko.',
      },
      {
        id: 'tz-znz-pemba-south',
        name: 'Pemba Kusini (Zanzibar)',
        country: 'Tanzania',
        counties: ['Chake Chake', 'Mkoani'],
        biodiversityZones: ['Miamba ya Matumbawe', 'Misitu ya Mikoko', 'Vishamba vya Mwani'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'agroforestry'],
        isShowcase: true,
        showcaseDescription: 'Pemba Kusini ina miamba ya matumbawe yenye bioanuwai kubwa na fursa za kaboni ya buluu.',
      },
      {
        id: 'tz-arusha',
        name: 'Arusha',
        country: 'Tanzania',
        counties: ['Arusha Mji', 'Arusha Vijijini', 'Karatu', 'Monduli', 'Ngorongoro'],
        biodiversityZones: ['Mlima Meru', 'Ngorongoro', 'Mbuga ya Serengeti', 'Hifadhi ya Arusha'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'tz-kilimanjaro',
        name: 'Kilimanjaro',
        country: 'Tanzania',
        counties: ['Moshi', 'Hai', 'Siha', 'Rombo', 'Mwanga', 'Same'],
        biodiversityZones: ['Mlima Kilimanjaro', 'Misitu ya Mvuli', 'Hifadhi za Mlimani'],
        carbonProjectTypes: ['reforestation', 'afforestation', 'conservation'],
      },
      {
        id: 'tz-dar',
        name: 'Dar es Salaam',
        country: 'Tanzania',
        counties: ['Kinondoni', 'Ilala', 'Temeke', 'Kigamboni', 'Ubungo'],
        biodiversityZones: ['Pwani ya Bahari Hindi', 'Miamba ya Matumbawe', 'Misitu ya Pwani'],
        carbonProjectTypes: ['blue_carbon', 'renewable_energy', 'conservation'],
      },
      {
        id: 'tz-morogoro',
        name: 'Morogoro',
        country: 'Tanzania',
        counties: ['Morogoro Mji', 'Morogoro Vijijini', 'Kilosa', 'Mvomero', 'Ulanga'],
        biodiversityZones: ['Milima ya Uluguru', 'Mikondo ya Udzungwa', 'Misitu ya Mvuli'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'tz-mtwara',
        name: 'Mtwara',
        country: 'Tanzania',
        counties: ['Mtwara Mji', 'Mtwara Vijijini', 'Masasi', 'Nanyumbu', 'Tandahimba', 'Newala'],
        biodiversityZones: ['Pwani ya Kusini', 'Misitu ya Mikoko', 'Miamba ya Matumbawe'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'agroforestry'],
      },
      {
        id: 'tz-tanga',
        name: 'Tanga',
        country: 'Tanzania',
        counties: ['Tanga', 'Muheza', 'Korogwe', 'Lushoto', 'Handeni', 'Kilindi'],
        biodiversityZones: ['Milima ya Usambara', 'Pwani ya Kaskazini', 'Misitu ya Mvuli'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    capital: 'Nairobi',
    regions: [
      {
        id: 'ke-nairobi',
        name: 'Nairobi',
        country: 'Kenya',
        counties: ['Nairobi'],
        biodiversityZones: ['Hifadhi ya Nairobi', 'Karura', 'Ngong'],
        carbonProjectTypes: ['reforestation', 'renewable_energy', 'conservation'],
      },
      {
        id: 'ke-mombasa',
        name: 'Mombasa',
        country: 'Kenya',
        counties: ['Mombasa', 'Kwale', 'Kilifi', 'Taita Taveta', 'Lamu'],
        biodiversityZones: ['Pwani ya Kenya', 'Miamba ya Matumbawe', 'Misitu ya Mikoko'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'agroforestry'],
      },
      {
        id: 'ke-kakamega',
        name: 'Kakamega',
        country: 'Kenya',
        counties: ['Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya'],
        biodiversityZones: ['Msitu wa Kakamega', 'Msitu wa Nandi', 'Vichochoro vya Maziwa Makuu'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'ke-laikipia',
        name: 'Laikipia',
        country: 'Kenya',
        counties: ['Laikipia', 'Nyeri', 'Meru', 'Embu', 'Isiolo'],
        biodiversityZones: ['Mlima Kenya', 'Mbuga za Laikipia', 'Nyanda za Juu za Kati'],
        carbonProjectTypes: ['reforestation', 'afforestation', 'conservation'],
      },
      {
        id: 'ke-kisumu',
        name: 'Kisumu',
        country: 'Kenya',
        counties: ['Kisumu', 'Homa Bay', 'Migori', 'Siaya', 'Nyamira'],
        biodiversityZones: ['Ziwa Victoria', 'Vichochoro vya Dongo', 'Miamba'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'agroforestry'],
      },
    ],
  },
  {
    code: 'UG',
    name: 'Uganda',
    capital: 'Kampala',
    regions: [
      {
        id: 'ug-central',
        name: 'Central Uganda',
        country: 'Uganda',
        counties: ['Kampala', 'Wakiso', 'Mukono', 'Kayunga', 'Luwero'],
        biodiversityZones: ['Ziwa Victoria', 'Misitu ya Mabira', 'Vichochoro vya Mzunguko'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'ug-western',
        name: 'Western Uganda',
        country: 'Uganda',
        counties: ['Kabarole', 'Kasese', 'Bundibugyo', 'Bushenyi', 'Ntungamo', 'Rukungiri'],
        biodiversityZones: ['Mlima Rwenzori', 'Msitu wa Bwindi', 'Ziwa Edward', 'Mbuga za Mwezi'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'ug-eastern',
        name: 'Eastern Uganda',
        country: 'Uganda',
        counties: ['Mbale', 'Tororo', 'Busia', 'Kapchorwa', 'Bukedea'],
        biodiversityZones: ['Mlima Elgon', 'Msitu wa Mount Elgon', 'Bonde la Kidepo'],
        carbonProjectTypes: ['reforestation', 'afforestation', 'soil_carbon'],
      },
      {
        id: 'ug-northern',
        name: 'Northern Uganda',
        country: 'Uganda',
        counties: ['Gulu', 'Lira', 'Kitgum', 'Pader', 'Apac', 'Adjumani'],
        biodiversityZones: ['Mbuga za Murchison', 'Mto Nile', 'Misitu ya Savana'],
        carbonProjectTypes: ['conservation', 'reforestation', 'renewable_energy'],
      },
    ],
  },
  {
    code: 'RW',
    name: 'Rwanda',
    capital: 'Kigali',
    regions: [
      {
        id: 'rw-kigali',
        name: 'Kigali',
        country: 'Rwanda',
        counties: ['Nyarugenge', 'Gasabo', 'Kicukiro'],
        biodiversityZones: ['Milima ya Kigali', 'Vichochoro'],
        carbonProjectTypes: ['reforestation', 'renewable_energy', 'conservation'],
      },
      {
        id: 'rw-western',
        name: 'Western Province',
        country: 'Rwanda',
        counties: ['Rubavu', 'Nyamasheke', 'Karongi', 'Rusizi', 'Ngororero', 'Nyabihu'],
        biodiversityZones: ['Msitu wa Nyungwe', 'Ziwa Kivu', 'Msitu wa Gishwati'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'rw-northern',
        name: 'Northern Province',
        country: 'Rwanda',
        counties: ['Musanze', 'Burera', 'Gakenke', 'Rulindo', 'Gicumbi'],
        biodiversityZones: ['Volkano za Virunga', 'Msitu wa Mukura', 'Misitu ya Mvuli'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
    ],
  },
  {
    code: 'BI',
    name: 'Burundi',
    capital: 'Gitega',
    regions: [
      {
        id: 'bi-bujumbura',
        name: 'Bujumbura',
        country: 'Burundi',
        counties: ['Bujumbura Mji', 'Bujumbura Vijijini'],
        biodiversityZones: ['Ziwa Tanganyika', 'Milima ya Miombo'],
        carbonProjectTypes: ['conservation', 'reforestation', 'soil_carbon'],
      },
      {
        id: 'bi-gitega',
        name: 'Gitega',
        country: 'Burundi',
        counties: ['Gitega', 'Karusi', 'Ruyigi', 'Cankuzo'],
        biodiversityZones: ['Milima ya Kati', 'Hifadhi ya Ruvubu', 'Misitu ya Miombo'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'bi-rumonge',
        name: 'Rumonge',
        country: 'Burundi',
        counties: ['Rumonge', 'Makamba', 'Bururi', 'Rutana'],
        biodiversityZones: ['Ziwa Tanganyika', 'Milima ya Kusini', 'Hifadhi ya Kigwena'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'agroforestry'],
      },
    ],
  },
  {
    code: 'CD',
    name: 'Jamhuri ya Kidemokrasia ya Kongo',
    capital: 'Kinshasa',
    regions: [
      {
        id: 'cd-north-kivu',
        name: 'North Kivu',
        country: 'Jamhuri ya Kidemokrasia ya Kongo',
        counties: ['Goma', 'Beni', 'Butembo', 'Lubero', 'Rutshuru'],
        biodiversityZones: ['Msitu wa Virunga', 'Mlima Nyiragongo', 'Hifadhi ya Virunga', 'Misitu ya Mvuli'],
        carbonProjectTypes: ['reforestation', 'conservation', 'agroforestry'],
      },
      {
        id: 'cd-south-kivu',
        name: 'South Kivu',
        country: 'Jamhuri ya Kidemokrasia ya Kongo',
        counties: ['Bukavu', 'Uvira', 'Kabare', 'Walungu', 'Mwenga'],
        biodiversityZones: ['Ziwa Kivu', 'Msitu wa Kahuzi-Biega', 'Milima ya Itombwe'],
        carbonProjectTypes: ['reforestation', 'conservation', 'soil_carbon'],
      },
      {
        id: 'cd-kinshasa',
        name: 'Kinshasa',
        country: 'Jamhuri ya Kidemokrasia ya Kongo',
        counties: ['Kinshasa'],
        biodiversityZones: ['Mto Kongo', 'Misitu ya Mvuli', 'Vichochoro'],
        carbonProjectTypes: ['conservation', 'reforestation', 'renewable_energy'],
      },
    ],
  },
  {
    code: 'SS',
    name: 'Sudan Kusini',
    capital: 'Juba',
    regions: [
      {
        id: 'ss-central',
        name: 'Central Equatoria',
        country: 'Sudan Kusini',
        counties: ['Juba', 'Yei', 'Kajo Keji', 'Lainya', 'Morobo'],
        biodiversityZones: ['Mto Nile', 'Misitu ya Savana', 'Vichochoro vya Imatong'],
        carbonProjectTypes: ['conservation', 'reforestation', 'soil_carbon'],
      },
      {
        id: 'ss-upper-nile',
        name: 'Upper Nile',
        country: 'Sudan Kusini',
        counties: ['Malakal', 'Renk', 'Maban', 'Melut', 'Nasir'],
        biodiversityZones: ['Mto Nile Mweupe', 'Mabwawa ya Sudd', 'Nyanda za Savana'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'soil_carbon'],
      },
    ],
  },
  {
    code: 'SO',
    name: 'Somalia',
    capital: 'Mogadishu',
    regions: [
      {
        id: 'so-benadir',
        name: 'Benadir',
        country: 'Somalia',
        counties: ['Mogadishu', 'Warsheikh', 'Jowhar', 'Afgooye'],
        biodiversityZones: ['Pwani ya Bahari Hindi', 'Miamba ya Matumbawe', 'Nyanda za Savana'],
        carbonProjectTypes: ['blue_carbon', 'conservation', 'renewable_energy'],
      },
      {
        id: 'so-puntland',
        name: 'Puntland',
        country: 'Somalia',
        counties: ['Bosaso', 'Galkayo', 'Garowe', 'Qardho'],
        biodiversityZones: ['Pwani ya Kaskazini', 'Miamba ya Matumbawe', 'Milima ya Golis'],
        carbonProjectTypes: ['conservation', 'blue_carbon', 'agroforestry'],
      },
    ],
  },
];

export function getShowcaseLocales(): EACRegion[] {
  return EAC_COUNTRIES.flatMap(c => c.regions).filter(r => r.isShowcase);
}

export function getRegionById(id: string): EACRegion | undefined {
  for (const country of EAC_COUNTRIES) {
    const region = country.regions.find(r => r.id === id);
    if (region) return region;
  }
  return undefined;
}

export function getCountries(): { code: string; name: string }[] {
  return EAC_COUNTRIES.map(c => ({ code: c.code, name: c.name }));
}

export function getRegionsForCountry(countryCode: string): EACRegion[] {
  return EAC_COUNTRIES.find(c => c.code === countryCode)?.regions ?? [];
}
