import { InventoryItem, ItemType, MovementStatus, StockRemark } from '../types/warehouse';

export function generate3000Items(baseItems: InventoryItem[]): InventoryItem[] {
  const result: InventoryItem[] = [];
  const existingCodes = new Set<string>();

  // Add all existing items first
  baseItems.forEach(item => {
    result.push(item);
    existingCodes.add(item.itemCode);
  });

  const targetCount = 3000;
  let currentNo = result.length > 0 ? Math.max(...result.map(i => i.no)) + 1 : 1;

  // Equipment Fleet models
  const fleets = [
    { model: 'Hino 260 JD', codeUnit: 'DT', brands: ['HINO GENUINE PARTS', 'HINO ORIGINAL PART (HOP)', 'WABCO'] },
    { model: 'Hino 260 TI', codeUnit: 'DT', brands: ['HINO GENUINE PARTS', 'SEIKEN GENUINE', 'KDK'] },
    { model: 'Hino 500 Euro 4', codeUnit: 'DT', brands: ['HINO GENUINE PARTS', 'HINO ORIGINAL PART (HOP)', 'DENSO'] },
    { model: 'Scania P360 XT', codeUnit: 'SC', brands: ['Scania Genuine Parts', 'DT Spare Part', 'United Tractor'] },
    { model: 'Scania P410 XT', codeUnit: 'SC', brands: ['Scania Genuine Parts', 'MAS', 'Power Teect'] },
    { model: 'Komatsu PC 200-8', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'United Tractor', 'DONALDSON'] },
    { model: 'Komatsu PC 300-8', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'DONALDSON', 'SKF'] },
    { model: 'Komatsu PC 400-8', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'United Tractor', 'DONALDSON'] },
    { model: 'Komatsu PC 500LC', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'United Tractor'] },
    { model: 'Komatsu D85ESS-2', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'United Tractor', 'DONALDSON'] },
    { model: 'Komatsu GD535-5', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'United Tractor', 'MITSUBOSHI'] },
    { model: 'Komatsu GD705-5', codeUnit: 'A2B', brands: ['KOMATSU GENUINE PARTS', 'United Tractor'] },
    { model: 'Komatsu WA320-5', codeUnit: 'Support', brands: ['KOMATSU GENUINE PARTS', 'DONALDSON', 'FHAS'] },
    { model: 'Komatsu WA 500', codeUnit: 'Support', brands: ['KOMATSU GENUINE PARTS', 'United Tractor'] },
    { model: 'Hitachi ZX470', codeUnit: 'A2B', brands: ['HITACHI GENUINE PARTS', 'Hexindo', 'DONALDSON'] },
    { model: 'Hitachi 490LC-7G', codeUnit: 'A2B', brands: ['HITACHI GENUINE PARTS', 'Hexindo'] },
    { model: 'Mitsubishi Triton HDX', codeUnit: 'LVM', brands: ['MITSUBISHI MOTORS', 'Barito Berlian Motor', 'DENSO'] },
    { model: 'Mitsubishi Triton GLS', codeUnit: 'LVM', brands: ['MITSUBISHI MOTORS', 'Aneka Motor'] },
    { model: 'Toyota Hilux 2.4E', codeUnit: 'LVM', brands: ['Toyota Genuine Part', 'Jaya Putra Mandiri', 'DENSO'] },
    { model: 'XCMG Hanvan G7', codeUnit: 'XCMG', brands: ['Gaya Makmur Mobil', 'Genuine Parts'] },
    { model: 'XCMG DH400T', codeUnit: 'XCMG', brands: ['Gaya Makmur Mobil', 'Genuine Parts'] },
    { model: 'Genset Cummins / Liebherr', codeUnit: 'Support', brands: ['DONALDSON', 'FLEETGUARD', 'Jaya Putra Mandiri'] },
    { model: 'Pompa Water Filling', codeUnit: 'Support', brands: ['FLEETGUARD', 'MITSUBISHI FUSO', 'KITZ'] },
    { model: 'Sakai SV526 Vibro', codeUnit: 'Support', brands: ['SAKAI GENUINE PARTS', 'Traktor Nusantara', 'DONALDSON'] },
  ];

  // Part templates by category
  const partTemplates: {
    type: ItemType;
    names: string[];
    pnPrefix: string;
    uom: string;
    rackGroup: string;
    priceRange: [number, number];
    minRange: [number, number];
    maxRange: [number, number];
  }[] = [
    // Bolts & Fasteners
    {
      type: 'CNU',
      names: [
        'Bolt Baja M6x20', 'Bolt Baja M6x30', 'Bolt Baja M8x25', 'Bolt Baja M8x40', 'Bolt Baja M8x60',
        'Bolt Baja M10x30', 'Bolt Baja M10x45', 'Bolt Baja M10x70', 'Bolt Baja M12x35', 'Bolt Baja M12x60',
        'Bolt Baja M12x90', 'Bolt Baja M14x40', 'Bolt Baja M14x60', 'Bolt Baja M14x90', 'Bolt Baja M16x45',
        'Bolt Baja M16x75', 'Bolt Baja M16x110', 'Bolt Baja M18x50', 'Bolt Baja M18x80', 'Bolt Baja M20x60',
        'Bolt Baja M20x90', 'Bolt Baja M20x140', 'Bolt Baja M22x70', 'Bolt Baja M22x100', 'Bolt Baja M24x80',
        'Bolt Baja M24x120', 'Bolt Baja M27x100', 'Bolt Baja M30x120', 'Bolt Baja M36x150', 'Bolt Hex Flange 10.9',
        'Nut Baja M8', 'Nut Baja M10', 'Nut Baja M12', 'Nut Baja M14', 'Nut Baja M16', 'Nut Baja M18', 'Nut Baja M20',
        'Nut Baja M22', 'Nut Baja M24', 'Nut Lock Nylon M12', 'Nut Lock Nylon M16', 'Nut Lock Slotted M24',
        'Washer Baja Plat M8', 'Washer Baja Plat M10', 'Washer Baja Plat M12', 'Washer Baja Plat M14', 'Washer Baja Plat M16',
        'Washer Spring Ring M10', 'Washer Spring Ring M12', 'Washer Spring Ring M14', 'Washer Spring Ring M16',
        'U-Bolt Chasis M20', 'U-Bolt Chasis M24', 'U-Bolt Spring Depan', 'U-Bolt Spring Belakang M27',
      ],
      pnPrefix: 'ZMME-FST',
      uom: 'Pcs',
      rackGroup: '101',
      priceRange: [2500, 185000],
      minRange: [10, 25],
      maxRange: [20, 50],
    },
    // Filters (Oli, Solar, Udara, Hydraulic, AC)
    {
      type: 'SPT',
      names: [
        'Oil Filter Primary', 'Oil Filter Secondary', 'Oil Filter Cartridge', 'Fuel Filter Main', 'Fuel Filter Pre-Filter',
        'Water Separator Element', 'Water Separator With Bowl', 'Air Cleaner Outer Element', 'Air Cleaner Inner Safety',
        'Air Cleaner Complete Set', 'Hydraulic Return Filter', 'Hydraulic Suction Strainer', 'Hydraulic Pilot Filter',
        'Hydraulic Tank Breather Element', 'Transmission Oil Filter Element', 'Steering Hydraulic Filter',
        'Corrosion Resistor Water Filter', 'Cabin Air Filter Fresh', 'Cabin Air Filter Recirc', 'Racor Fuel Filter Element 10Micron',
        'Racor Fuel Filter Element 30Micron', 'Bypass Lube Oil Filter', 'Coolant Filter Water Treatment',
      ],
      pnPrefix: 'P55',
      uom: 'Pcs',
      rackGroup: '103',
      priceRange: [65000, 3200000],
      minRange: [2, 6],
      maxRange: [4, 12],
    },
    // Bearings
    {
      type: 'SPT',
      names: [
        'Deep Groove Ball Bearing 6004-2RS', 'Deep Groove Ball Bearing 6205-2RS', 'Deep Groove Ball Bearing 6206-2RS',
        'Deep Groove Ball Bearing 6305-2Z', 'Deep Groove Ball Bearing 6307-2RS', 'Deep Groove Ball Bearing 6308-2RS',
        'Tapered Roller Bearing 30208-JR', 'Tapered Roller Bearing 30305-JR', 'Tapered Roller Bearing 32208-JR',
        'Tapered Roller Bearing 32210-JR', 'Tapered Roller Bearing 32212-JR', 'Tapered Roller Bearing 32310-JR',
        'Tapered Roller Bearing 32313-JR', 'Clutch Release Bearing Assy', 'Center Bearing Propeller Shaft',
        'Needle Roller Bearing King Pin', 'Idler Tensioner Bearing AC', 'Tensioner Pulley Bearing Alternator',
        'Wheel Hub Bearing Front In', 'Wheel Hub Bearing Front Out', 'Wheel Hub Bearing Rear Double',
      ],
      pnPrefix: 'BRG-KY',
      uom: 'Pcs',
      rackGroup: '111',
      priceRange: [55000, 1850000],
      minRange: [1, 3],
      maxRange: [3, 8],
    },
    // Seals, O-Rings & Gaskets
    {
      type: 'SPT',
      names: [
        'Oil Seal Crankshaft Front', 'Oil Seal Crankshaft Rear', 'Oil Seal Pinion Gardan', 'Oil Seal Hub Roda Depan',
        'Oil Seal Hub Roda Belakang', 'Oil Seal Transmisi Output', 'Oil Seal PTO Transfer Case', 'Seal Dust Swivel Joint',
        'O-Ring Hydraulic Tank 110x5', 'O-Ring Hydraulic Tank 140x5', 'O-Ring Main Pump Flange', 'O-Ring Control Valve Valve',
        'O-Ring Turbocharger Return', 'O-Ring Water Pump Housing', 'O-Ring Final Drive Cover', 'Gasket Cylinder Head Metal',
        'Gasket Rocker Cover Rubber', 'Gasket Exhaust Manifold Muffler', 'Gasket Intake Manifold', 'Gasket Oil Pan Carter',
        'Seal Kit Hydraulic Cylinder Boom', 'Seal Kit Hydraulic Cylinder Arm', 'Seal Kit Hydraulic Cylinder Bucket',
        'Seal Kit Track Adjuster', 'Seal Kit Master Rem Atas', 'Seal Kit Wheel Brake Caliper',
      ],
      pnPrefix: '07000',
      uom: 'Pcs',
      rackGroup: '107',
      priceRange: [18000, 2450000],
      minRange: [2, 5],
      maxRange: [5, 15],
    },
    // Brake & Suspension Components
    {
      type: 'SPT',
      names: [
        'Kampas Rem Depan (Brake Shoe Fr)', 'Kampas Rem Belakang (Brake Shoe Rr)', 'Brake Pad Kit Front Disc',
        'Brake Lining Roll High Friction', 'Brake Chamber Single 24V', 'Brake Chamber Double Tristop',
        'Brake Slack Adjuster Manual LH', 'Brake Slack Adjuster Manual RH', 'Brake Slack Adjuster Auto',
        'Brake Diaphragm Type 24', 'Brake Diaphragm Type 30', 'Brake Air Dryer Desiccant Cartridge',
        'Relay Valve Air Brake 4-Port', 'Protection 4-Circuit Valve', 'Spring Leaf Depan No.1 Master',
        'Spring Leaf Depan No.2 Helper', 'Spring Leaf Belakang Main', 'Spring Shackle Pin Depan',
        'Spring Shackle Pin Belakang', 'Bushing Trunnion Bronze 100mm', 'Bushing Torque Rod Heavy Duty',
        'Torque Rod Assembly 550mm', 'Shock Absorber Heavy Duty Front', 'Shock Absorber Heavy Duty Rear',
      ],
      pnPrefix: '47400',
      uom: 'Pcs',
      rackGroup: '108',
      priceRange: [95000, 3850000],
      minRange: [2, 4],
      maxRange: [4, 10],
    },
    // V-Belts, Pulleys & Hoses
    {
      type: 'CNU',
      names: [
        'V-Belt Gigi RECMF-6350', 'V-Belt Gigi RECMF-6370', 'V-Belt Gigi RECMF-6380', 'V-Belt Gigi RECMF-6400',
        'V-Belt Gigi RECMF-6410', 'V-Belt Gigi RECMF-8420', 'V-Belt Gigi RECMF-8460', 'V-Belt Gigi RECMF-8540',
        'V-Belt Gigi 8PK1230 Serpentine', 'V-Belt Gigi 8PK1710 Serpentine', 'V-Belt Gigi 6PK1098 Alternator',
        'V-Belt Polos A-32 Industrial', 'V-Belt Polos A-38 Industrial', 'V-Belt Polos A-42 Industrial',
        'V-Belt Polos B-45 Heavy', 'V-Belt Polos B-50 Heavy', 'V-Belt Polos B-56 Heavy', 'V-Belt Polos C-100 Crusher',
        'V-Belt Polos C-110 Crusher', 'Hose Hydraulic 2-Wire 1/2" 3000PSI', 'Hose Hydraulic 4-Spiral 3/4" 4000PSI',
        'Hose Hydraulic High Pressure 1" 5000PSI', 'Hose Radiator Silicone EPDM Upper', 'Hose Radiator Silicone EPDM Lower',
        'Hose Air Compressor Braided 1/2"', 'Hose Suction Water 3" Spiral Wire',
      ],
      pnPrefix: 'VBLT',
      uom: 'Pcs',
      rackGroup: '201',
      priceRange: [45000, 1650000],
      minRange: [2, 6],
      maxRange: [4, 12],
    },
    // Electrical, Sensors & AC
    {
      type: 'SPT',
      names: [
        'Alternator Assembly 24V 60A', 'Starter Motor Assembly 24V 7.5kW', 'Relay 24V 5-Pin Heavy Duty Bosch',
        'Relay 12V 4-Pin 40A Denso', 'Magnetic Switch Solenoid Starter', 'Oil Pressure Sensor Switch 0-10Bar',
        'Water Temperature Sensor Sender', 'Boost Pressure Sensor Sensor', 'Speed Sensor Flywheel Magnetic',
        'Air Circuit Pressure Switch Dual', 'Head Lamp Assembly Halogen 24V LH', 'Head Lamp Assembly Halogen 24V RH',
        'Work Light LED Heavy Duty 16-Mata 48W', 'Work Light LED Spot Light 9-Mata 27W', 'Rotary Warning Beacon Lamp 24V Amber',
        'Rotary Warning Beacon Lamp 24V Blue', 'Back Up Alarm Warning Horn 24V 112dB', 'Compressor AC SD7H15 24V Sanden',
        'Compressor AC Denso 10S15C 24V', 'Condenser AC Heavy Duty Tube-Fin', 'Evaporator Core Blower Assembly',
        'Receiver Drier Bottle Filter 134a', 'Expansion Valve Block Type 2.5Ton', 'Blower Motor AC Fan 24V Double Wheel',
      ],
      pnPrefix: 'ELC-SN',
      uom: 'Pcs',
      rackGroup: '112',
      priceRange: [35000, 4850000],
      minRange: [1, 3],
      maxRange: [3, 8],
    },
    // Ground Engaging Tools (GET) & Undercarriage
    {
      type: 'SPT',
      names: [
        'Tooth Bucket Standard Tiger V51T', 'Tooth Bucket Heavy Rock XS50TV', 'Tooth Bucket Excavator 205-70-19570',
        'Tooth Bucket Loader Flare Tip', 'Pin Lock Tooth Bucket V51P', 'Pin Lock Tooth Bucket Vertical XS50PC',
        'Rubber Lock Damper Retainer SBQD', 'Cutting Edge Grader 13-Hole 7Ft', 'Cutting Edge Grader 15-Hole 8Ft',
        'End Bit Cutting Left Hand Dozer', 'End Bit Cutting Right Hand Dozer', 'Track Roller Single Flange D85',
        'Track Roller Double Flange PC500', 'Carrier Top Roller Assembly PC200', 'Idler Wheel Tension Assembly 3-Hole',
        'Drive Sprocket Segment Bolt-On', 'Shoe Track Link Track Bolt & Nut M20', 'Segment Bolt Master Link D85',
      ],
      pnPrefix: 'GET-HD',
      uom: 'Pcs',
      rackGroup: 'CONT-GET',
      priceRange: [150000, 6800000],
      minRange: [4, 10],
      maxRange: [10, 30],
    },
    // Tyres, Batteries & Fluids
    {
      type: 'SPT',
      names: [
        'Tyre 12.00R24 Radial Mining Maxxam', 'Tyre 12.00R20 Advance All Steel', 'Tyre 11.00R20 Westlake Dump Truck',
        'Tyre 14.00R24 Grader E3/L3 Radial', 'Tyre 265/75R16 Bridgestone Dueler M/T', 'Tyre 245/70R16 All Terrain LVM',
        'Tyre Inner Tube 12.00R24 Heavy Flap', 'Accu Battery N70 Solite Maintenance Free', 'Accu Battery N100 Heavy Fleet 12V',
        'Accu Battery N120 Mining Excavator 12V', 'Accu Battery N150 Heavy Haul 12V 150Ah', 'Accu Battery N200 Heavy Power 200Ah',
        'Hydraulic Oil ISO VG 46 Drum 209L', 'Engine Oil SAE 15W-40 CI-4 Pail 20L', 'Gear Oil SAE 85W-140 GL-5 Pail 20L',
        'Automatic Transmission Fluid ATF 1L', 'Brake Fluid DOT-4 High Temp 1L', 'Heavy Duty Grease EP-2 NLGI Lithium 15kg',
        'Refrigerant R134a Pure Freon 13.6kg', 'WD-40 Penetrant Anti Karat Spray 412ml', 'Contact Cleaner Non-Residue 450ml',
      ],
      pnPrefix: 'TYR-LUB',
      uom: 'Pcs',
      rackGroup: 'CONT-TYRE',
      priceRange: [85000, 18500000],
      minRange: [2, 6],
      maxRange: [4, 12],
    },
    // Fittings, Valves & Piping
    {
      type: 'CNU',
      names: [
        'Ball Valve 1/2" Stainless 1000WOG', 'Ball Valve 3/4" Brass Heavy Duty', 'Ball Valve 1" Full Bore Kitz',
        'Ball Valve 1-1/2" Flange Class 150', 'Ball Valve 2" Flanged Fuel Station', 'Double Nipple 1/2" Galvanized Schedule 80',
        'Double Nipple 3/4" Galvanized Schedule 80', 'Double Nipple 1" High Pressure NPT', 'Double Nipple 2" Industrial Pipe',
        'Elbow Pipe 90 Degree 1/2" Threaded', 'Elbow Pipe 90 Degree 1" Heavy Galvanized', 'King Nipple Hose Barb 1" Steel',
        'King Nipple Hose Barb 2" Camlock', 'King Nipple Hose Barb 3" Tanker Dispenser', 'Pneumatic Quick Coupler SH-20',
        'Pneumatic Quick Coupler PH-20', 'Air Hose Fitting Push-In 6mm Brass', 'Air Hose Fitting Push-In 8mm Brass',
        'Air Hose Fitting Push-In 10mm Brass', 'Air Hose Fitting Push-In 12mm Brass', 'Grease Nipple M6x1 Straight Hardened',
        'Grease Nipple M8x1 90-Degree Angle', 'Grease Nipple M10x1 45-Degree Angle', 'Hose Grease Gun Flexible 4500PSI 18"',
      ],
      pnPrefix: 'VAL-FIT',
      uom: 'Pcs',
      rackGroup: '114',
      priceRange: [12000, 850000],
      minRange: [5, 15],
      maxRange: [15, 40],
    },
  ];

  const movements: MovementStatus[] = ['Fast Moving', 'Slow Moving', 'Dead Moving', 'Warning', 'Fast Moving'];
  const dates = [
    '30-Sep-26', '29-Sep-26', '28-Sep-26', '27-Sep-26', '25-Sep-26', 
    '22-Sep-26', '18-Sep-26', '14-Sep-26', '10-Sep-26', '5-Sep-26', 
    '28-Aug-26', '20-Aug-26', '15-Aug-26', '10-Aug-26', '25-Jul-26'
  ];

  // Distribute across racks
  const subLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  let catIdx = 0;
  let fleetIdx = 0;

  while (result.length < targetCount) {
    const template = partTemplates[catIdx % partTemplates.length];
    const fleet = fleets[fleetIdx % fleets.length];
    const nameIndex = (result.length) % template.names.length;
    const baseName = template.names[nameIndex];
    
    // Add specification variance to ensure realism
    const varSeed = Math.floor(result.length / template.names.length) + 1;
    let partName = baseName;
    if (varSeed > 1) {
      if (template.type === 'CNU' && baseName.includes('Bolt')) {
        partName = `${baseName} (Grade 8.8 Var-${varSeed})`;
      } else if (baseName.includes('Bearing')) {
        partName = `${baseName} C3 Heavy Var-${varSeed}`;
      } else {
        partName = `${baseName} Type-${varSeed}`;
      }
    }

    const itemCode = `DPS-${1000 + currentNo}`;
    if (existingCodes.has(itemCode)) {
      currentNo++;
      continue;
    }
    existingCodes.add(itemCode);

    // Compute rack bin following 3 digits rule (e.g. 101A01 - 101G25 or 114G07)
    let rack = '';
    if (template.rackGroup.startsWith('CONT')) {
      rack = template.rackGroup === 'CONT-GET' ? 'COUNTAINER GET' :
             template.rackGroup === 'CONT-TYRE' ? 'COUNTAINER TYRE' :
             template.rackGroup === 'CONT-B3' ? 'COUNTAINER B3' : 'Container WHS Baru';
    } else {
      // Numerical 3-digit rack (101 - 114, 201)
      const groupNum = template.rackGroup;
      const letter = subLetters[(currentNo) % subLetters.length];
      const slot = ((currentNo * 3) % 24) + 1;
      rack = `${groupNum}${letter}${slot.toString().padStart(2, '0')}`;
    }

    // Part number
    const partNumber = `${template.pnPrefix}-${(currentNo * 17).toString().padStart(6, '0')}`;

    // Price
    const minP = template.priceRange[0];
    const maxP = template.priceRange[1];
    const price = Math.round((minP + ((currentNo * 1234) % (maxP - minP))) / 500) * 500;

    // Stock quantities
    const minStock = template.minRange[0] + (currentNo % (template.minRange[1] - template.minRange[0] + 1));
    const maxStock = template.maxRange[0] + (currentNo % (template.maxRange[1] - template.maxRange[0] + 1));
    
    // Simulate stock distribution: 70% normal, 15% order/low, 10% overstock, 5% zero/out
    const stockDice = (currentNo * 7) % 100;
    let currentQty = minStock + 2;
    let remark: StockRemark = 'AMAN';

    if (stockDice < 6) {
      currentQty = 0;
      remark = 'HABIS';
    } else if (stockDice < 22) {
      currentQty = Math.max(1, minStock - 1);
      remark = 'ORDER';
    } else if (stockDice > 88) {
      currentQty = maxStock + 5;
      remark = 'OVER';
    } else {
      currentQty = minStock + ((currentNo * 3) % (maxStock - minStock + 1));
      remark = 'AMAN';
    }

    const inQty = (currentNo % 10 > 7) ? (currentNo % 15) : 0;
    const outQty = (currentNo % 10 > 5) ? (currentNo % 8) : 0;
    const initialQty = Math.max(0, currentQty - inQty + outQty);
    const totalValue = currentQty > 0 ? currentQty * price : 0;

    const movement = movements[(currentNo * 11) % movements.length];
    const brand = fleet.brands[(currentNo * 3) % fleet.brands.length];
    const dateStr = dates[(currentNo * 5) % dates.length];

    result.push({
      id: `${itemCode}-${currentNo}`,
      no: currentNo,
      itemCode,
      rack,
      type: template.type,
      modelUnit: fleet.model,
      partNumber,
      partName,
      unitCode: fleet.codeUnit,
      lastUpdateDate: dateStr,
      lastInDate: dateStr,
      lastOutDate: dateStr,
      supplier: (currentNo % 2 === 0) ? 'Jaya Putra Mandiri' : 'Mitra Gunawan',
      brand,
      initialQty,
      uom: template.uom,
      inQty,
      adjustPlusQty: 0,
      outQty,
      adjustMinusQty: 0,
      currentQty,
      minStock,
      maxStock,
      remark,
      movement,
      price,
      totalValue,
      status1th: movement,
    });

    currentNo++;
    catIdx++;
    if (catIdx % partTemplates.length === 0) {
      fleetIdx++;
    }
  }

  return result;
}
