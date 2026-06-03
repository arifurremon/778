export interface EmergencyContactDto {
  id: string;
  name: string;
  phone: string;
  category: string;
  address?: string;
}

export function mapEmergencyContact(row: {
  id: string;
  name: string;
  phone: string;
  category: string;
  location: string | null;
}): EmergencyContactDto {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    category: row.category,
    address: row.location ?? undefined,
  };
}
