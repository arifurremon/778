export interface TourismSpot {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  location: string;
  entryFee: string;
  timing: string;
}

export interface HeritagePerson {
  id: string;
  name: string;
  role: string;
  lifespan: string;
  bio: string;
  image: string;
}

export interface BusRoute {
  id: string;
  number: string;
  origin: string;
  destination: string;
  route: string[];
}

export interface NewsOutlet {
  id: string;
  name: string;
  logo: string;
  url: string;
  description: string;
}

export const TOURISM_SPOTS: TourismSpot[] = [
  {
    id: 't1',
    name: 'Patenga Sea Beach',
    category: 'Scenic Spot',
    description: 'The most popular beach in the city, famous for its sunset and stone-lined shore.',
    image: '/city_background.png',
    location: 'Patenga',
    entryFee: 'Free',
    timing: '24/7'
  },
  {
    id: 't2',
    name: "Foy's Lake",
    category: 'Theme Park',
    description: 'An artificial lake surrounded by hills and home to a popular amusement park.',
    image: '/city_background.png',
    location: 'Pahartali',
    entryFee: '৳300+',
    timing: '10 AM - 7 PM'
  },
  {
    id: 't3',
    name: 'Naval Avenue',
    category: 'Scenic Spot',
    description: 'A beautiful riverside road perfect for evening walks and street food.',
    image: '/city_background.png',
    location: 'Patenga',
    entryFee: 'Free',
    timing: 'Best in evening'
  },
  {
    id: 't4',
    name: 'Guliakhali Beach',
    category: 'Nature',
    description: 'Known as the "Green Beach" for its unique swamp-like grass vegetation.',
    image: '/city_background.png',
    location: 'Sitakunda',
    entryFee: 'Free',
    timing: 'Best in daylight'
  },
  {
    id: 't5',
    name: 'Commonwealth War Cemetery',
    category: 'Heritage',
    description: 'A peaceful memorial honoring the soldiers of World War II.',
    image: '/city_background.png',
    location: 'Panchlaish',
    entryFee: 'Free',
    timing: '9 AM - 5 PM'
  },
  {
    id: 't6',
    name: 'Ethnological Museum',
    category: 'Museum',
    description: 'The only ethnological museum in Bangladesh showing tribal cultures.',
    image: '/city_background.png',
    location: 'Agrabad',
    entryFee: '৳20',
    timing: '10 AM - 5 PM'
  },
  {
    id: 't7',
    name: 'Chandranath Hill',
    category: 'Religious/Hiking',
    description: 'A famous pilgrimage site and the highest peak in Chittagong district.',
    image: '/city_background.png',
    location: 'Sitakunda',
    entryFee: 'Free',
    timing: 'Early morning hike recommended'
  },
  {
    id: 't8',
    name: 'DC Hill',
    category: 'Park',
    description: 'A central park and cultural hub where Pohela Boishakh is celebrated.',
    image: '/city_background.png',
    location: 'Kotwali',
    entryFee: 'Free',
    timing: '6 AM - 8 PM'
  }
];

export const HERITAGE_PEOPLE: HeritagePerson[] = [
  {
    id: 'h1',
    name: 'Masterda Surya Sen',
    role: 'Revolutionary Leader',
    lifespan: '1894 – 1934',
    bio: 'An Indian revolutionary who was influential in the Indian independence movement and best known for leading the 1930 Chittagong armoury raid.',
    image: '/city_background.png'
  },
  {
    id: 'h2',
    name: 'Pritilata Waddedar',
    role: 'Revolutionary Leader',
    lifespan: '1911 – 1932',
    bio: 'A Bengali revolutionary nationalist who was influential in the Indian independence movement. She was the first woman to lead a raid against British authorities.',
    image: '/city_background.png'
  },
  {
    id: 'h3',
    name: 'Mahbub Ul Alam Choudhury',
    role: 'Poet & Activist',
    lifespan: '1927 – 2007',
    bio: 'A Bangladeshi poet, journalist and activist. He was the author of the first poem of the Language Movement in 1952.',
    image: '/city_background.png'
  },
  {
    id: 'h4',
    name: 'Khan Bahadur Abdul Aziz',
    role: 'Educationist',
    lifespan: '1863 – 1926',
    bio: 'A prominent educationist and social worker who played a vital role in spreading modern education in Chittagong.',
    image: '/city_background.png'
  },
  {
    id: 'h5',
    name: 'Jatindra Mohan Sengupta',
    role: 'Political Leader',
    lifespan: '1885 – 1933',
    bio: 'Known as "Deshapriya", he was a prominent lawyer and freedom fighter who served as the Mayor of Calcutta and leader of Chittagong.',
    image: '/city_background.png'
  }
];

export const BUS_ROUTES: BusRoute[] = [
  { id: 'b1', number: 'No. 10', origin: 'Hathazari', destination: 'Laldighi', route: ['Hathazari', 'Oxygen', 'Bayezid', 'Muradpur', 'GEC', 'Laldighi'] },
  { id: 'b2', number: 'No. 6', origin: 'Kalurghat', destination: 'Sea Beach', route: ['Kalurghat', 'Bahaddarhat', 'Muradpur', 'GEC', 'Agrabad', 'Patenga'] },
  { id: 'b3', number: 'No. 1', origin: 'New Market', destination: 'Bandar', route: ['New Market', 'Kotwali', 'Firingi Bazar', 'Custom', 'Bandar'] },
  { id: 'b4', number: 'No. 7', origin: 'Chawkbazar', destination: 'Oxygen', route: ['Chawkbazar', 'Panchlaish', 'Muradpur', 'Oxygen'] },
  { id: 'b5', number: 'No. 8', origin: 'Bahaddarhat', destination: 'Kotwali', route: ['Bahaddarhat', 'Chawkbazar', 'Andarkilla', 'Kotwali'] },
  { id: 'b6', number: 'No. 3', origin: 'Agrabad', destination: 'Oxygen', route: ['Agrabad', 'Tiger Pass', 'GEC', 'Muradpur', 'Oxygen'] },
  { id: 'b7', number: 'No. 4', origin: 'Bandar', destination: 'EPZ', route: ['Bandar', 'Custom House', 'Free Port', 'EPZ'] },
  { id: 'b8', number: 'No. 11', origin: 'Bhatiari', destination: 'GEC', route: ['Bhatiari', 'Kumira', 'AK Khan', 'Pahartali', 'GEC'] },
  { id: 'b9', number: 'No. 13', origin: 'Oxygen', destination: 'Sea Beach', route: ['Oxygen', 'Muradpur', 'GEC', 'Tiger Pass', 'Agrabad', 'Patenga'] },
  { id: 'b10', number: 'No. 2', origin: 'New Market', destination: 'University', route: ['New Market', 'Station Road', 'Muradpur', 'CU Campus'] }
];

export const NEWS_OUTLETS: NewsOutlet[] = [
  { 
    id: 'n1', 
    name: 'Dainik Azadi', 
    logo: '/city_background.png', 
    url: 'https://dainikazadi.net/', 
    description: 'The oldest and most respected local newspaper of Chittagong.' 
  },
  { 
    id: 'n2', 
    name: 'Dainik Purbokone', 
    logo: '/city_background.png', 
    url: 'https://purbokone.com/', 
    description: 'A leading daily known for comprehensive local news coverage.' 
  },
  { 
    id: 'n3', 
    name: 'Chattogram Pratidin', 
    logo: '/city_background.png', 
    url: 'https://chattogrampratidin.com/', 
    description: 'Popular digital-first news outlet serving the port city.' 
  }
];