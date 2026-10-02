export interface RackZone {
  groupCode: string; // e.g. "101", "102", "114", "201", "CONT-GET"
  groupLabel: string; // e.g. "Rak 101", "Kontainer GET"
  binCode: string;
}

export function normalizeRackCode(rawRack: string): RackZone {
  let clean = (rawRack || '').trim();
  if (!clean) return { groupCode: 'OTHER', groupLabel: 'Tanpa Rak', binCode: 'Unassigned' };

  // Handle scientific notation from spreadsheet export e.g. 1.01E+03, 1.14E+07
  const sciMatch = clean.match(/^1\.(\d{2})E\+(\d{2})$/i);
  if (sciMatch) {
    const middle = sciMatch[1]; // e.g. "01" -> 101, "14" -> 114
    const exp = parseInt(sciMatch[2], 10);
    clean = `1${middle}E${exp.toString().padStart(2, '0')}`;
  }

  // 3 initial digits (e.g. 101, 102, 103, ..., 114, 201)
  const digitMatch = clean.match(/^(\d{3})/);
  if (digitMatch) {
    const code = digitMatch[1];
    return {
      groupCode: code,
      groupLabel: `Rak ${code}`,
      binCode: clean,
    };
  }

  // Special containers and areas
  const upper = clean.toUpperCase();
  if (upper.includes('CONTAINER') || upper.includes('COUNTAINER')) {
    if (upper.includes('GET')) {
      return { groupCode: 'CONT-GET', groupLabel: 'Kontainer GET', binCode: clean };
    }
    if (upper.includes('TYRE')) {
      return { groupCode: 'CONT-TYRE', groupLabel: 'Kontainer Tyre', binCode: clean };
    }
    if (upper.includes('B3')) {
      return { groupCode: 'CONT-B3', groupLabel: 'Kontainer B3', binCode: clean };
    }
    return { groupCode: 'CONT-WHS', groupLabel: 'Kontainer WHS Baru', binCode: clean };
  }

  if (upper.includes('AMPLAS')) {
    return { groupCode: 'AMPLAS', groupLabel: 'Rak Amplas', binCode: clean };
  }
  if (upper.includes('RADIATOR')) {
    return { groupCode: 'RADIATOR', groupLabel: 'Area Radiator', binCode: clean };
  }
  if (upper.includes('OFFICE')) {
    return { groupCode: 'OFFICE', groupLabel: 'Office Logistik', binCode: clean };
  }

  return { groupCode: 'OTHER', groupLabel: clean, binCode: clean };
}

// Compare two rack strings for natural alphanumeric sort order
export function compareRacks(a: string, b: string): number {
  const normA = (a || '').trim();
  const normB = (b || '').trim();

  // If both start with numbers, sort numerically by the initial digits first
  const numA = normA.match(/^(\d+)/);
  const numB = normB.match(/^(\d+)/);

  if (numA && numB) {
    const valA = parseInt(numA[1], 10);
    const valB = parseInt(numB[1], 10);
    if (valA !== valB) {
      return valA - valB;
    }
    return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' });
  }

  if (numA && !numB) return -1;
  if (!numA && numB) return 1;

  return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' });
}
