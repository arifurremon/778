export type EmergencyCategory = 'Police' | 'Fire' | 'Ambulance' | 'Govt';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  category: EmergencyCategory;
  address?: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  // Police
  {
    id: 'p1',
    name: 'CMP Control Room',
    phone: '01676-123456',
    category: 'Police',
    address: 'Dampara, Chittagong',
  },
  {
    id: 'p2',
    name: 'CMP Traffic Control',
    phone: '01919-911911',
    category: 'Police',
    address: 'Chittagong',
  },
  // Fire Service
  {
    id: 'f1',
    name: 'Agrabad Fire Station',
    phone: '01901021541',
    category: 'Fire',
    address: 'Agrabad, Chittagong',
  },
  {
    id: 'f2',
    name: 'Bandar Fire Station',
    phone: '01901021555',
    category: 'Fire',
    address: 'Bandar, Chittagong',
  },
  {
    id: 'f3',
    name: 'Chandanpura Fire Station',
    phone: '01901021559',
    category: 'Fire',
    address: 'Chandanpura, Chittagong',
  },
  // Ambulance
  {
    id: 'a1',
    name: 'Sadia Ambulance Agrabad',
    phone: '01884959116',
    category: 'Ambulance',
    address: 'Agrabad, Chittagong',
  },
  {
    id: 'a2',
    name: 'Anjuman Mufidul Islam',
    phone: '+880-31619443',
    category: 'Ambulance',
    address: 'Chittagong',
  },
  {
    id: 'a3',
    name: 'CTG General Hospital Ambulance',
    phone: '01814480900',
    category: 'Ambulance',
    address: 'Anderkilla, Chittagong',
  },
  // Govt Offices
  {
    id: 'g1',
    name: 'Chittagong City Corporation (CCC)',
    phone: '031-616508',
    category: 'Govt',
    address: 'Tiger Pass, Chittagong',
  },
  {
    id: 'g2',
    name: 'Deputy Commissioner (DC) Office',
    phone: '031-619996',
    category: 'Govt',
    address: 'Court Hill, Chittagong',
  },
];
