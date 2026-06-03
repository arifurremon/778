import { db } from "../src/lib/db";
import {
  BUS_ROUTES,
  HERITAGE_PEOPLE,
  NEWS_OUTLETS,
  TOURISM_SPOTS,
} from "../src/lib/directory-data";
import { EMERGENCY_CONTACTS } from "../src/lib/emergency-data";

export async function seedEmergencyContacts() {
  for (const contact of EMERGENCY_CONTACTS) {
    await db.emergencyContact.upsert({
      where: { id: contact.id },
      create: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        category: contact.category,
        location: contact.address ?? null,
      },
      update: {
        name: contact.name,
        phone: contact.phone,
        category: contact.category,
        location: contact.address ?? null,
      },
    });
  }
}

export async function seedDirectoryEntries() {
  for (const spot of TOURISM_SPOTS) {
    await db.directoryEntry.upsert({
      where: { id: spot.id },
      create: {
        id: spot.id,
        type: "tourism",
        name: spot.name,
        category: spot.category,
        address: spot.location,
        description: spot.description,
        metadata: {
          image: spot.image,
          entryFee: spot.entryFee,
          timing: spot.timing,
          location: spot.location,
        },
      },
      update: {
        name: spot.name,
        category: spot.category,
        address: spot.location,
        description: spot.description,
        metadata: {
          image: spot.image,
          entryFee: spot.entryFee,
          timing: spot.timing,
          location: spot.location,
        },
      },
    });
  }

  for (const person of HERITAGE_PEOPLE) {
    await db.directoryEntry.upsert({
      where: { id: person.id },
      create: {
        id: person.id,
        type: "heritage",
        name: person.name,
        category: person.role,
        description: person.bio,
        metadata: {
          lifespan: person.lifespan,
          image: person.image,
        },
      },
      update: {
        name: person.name,
        category: person.role,
        description: person.bio,
        metadata: {
          lifespan: person.lifespan,
          image: person.image,
        },
      },
    });
  }

  for (const route of BUS_ROUTES) {
    await db.directoryEntry.upsert({
      where: { id: route.id },
      create: {
        id: route.id,
        type: "transport",
        name: route.number,
        category: "Bus Route",
        description: `${route.origin} to ${route.destination}`,
        metadata: {
          number: route.number,
          origin: route.origin,
          destination: route.destination,
          route: route.route,
        },
      },
      update: {
        name: route.number,
        description: `${route.origin} to ${route.destination}`,
        metadata: {
          number: route.number,
          origin: route.origin,
          destination: route.destination,
          route: route.route,
        },
      },
    });
  }

  for (const outlet of NEWS_OUTLETS) {
    await db.directoryEntry.upsert({
      where: { id: outlet.id },
      create: {
        id: outlet.id,
        type: "news",
        name: outlet.name,
        category: "News Outlet",
        website: outlet.url,
        description: outlet.description,
        metadata: {
          logo: outlet.logo,
          url: outlet.url,
        },
      },
      update: {
        name: outlet.name,
        website: outlet.url,
        description: outlet.description,
        metadata: {
          logo: outlet.logo,
          url: outlet.url,
        },
      },
    });
  }
}

async function main() {
  await seedEmergencyContacts();
  await seedDirectoryEntries();
  console.log("Phase 3 directory/emergency content seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
