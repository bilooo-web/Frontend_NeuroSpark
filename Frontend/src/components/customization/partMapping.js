const PART_NUMBER_MAPPING = {
  // Standard bricks
  '3001': '3001',   // Brick 2x4
  '3002': '3002',   // Brick 2x3
  '3003': '3003',   // Brick 2x2
  '3004': '3004',   // Brick 1x2
  '3005': '3005',   // Brick 1x1
  '3006': '3006',   // Brick 2x10
  '3007': '3007',   // Brick 2x8
  '3008': '3008',   // Brick 1x8
  '3009': '3009',   // Brick 1x6
  '3010': '3010',   // Brick 1x4
  
  // Plates
  '3020': '3020',   // Plate 2x4
  '3021': '3021',   // Plate 2x3
  '3022': '3022',   // Plate 2x2
  '3023': '3023',   // Plate 1x2
  '3024': '3024',   // Plate 1x1
  '3710': '3710',   // Plate 1x4
  '3794': '3794',   // Plate 1x2 with clip
  
  // Special pieces (common in Angel set 43257)
  '4733': '4733',   // Brick 1x1 round
  '4073': '4073',   // Plate 1x1 round
  '6141': '6141',   // Plate 1x1 round with bar
  '4599': '4599',   // Tap 1x1
  '98138': '98138', // Flat tile 1x1 round
  
  // Technic pieces
  '2780': '2780',   // Technic pin
  '6558': '6558',   // Technic pin long
  '32054': '32054', // Technic pin with friction
  
  // Default fallback
  'default': '3004', // 1x2 brick as default
};

export function getLDrawPartNumber(rebrickablePartNum) {
  if (!rebrickablePartNum) return PART_NUMBER_MAPPING.default;

  const baseNum = rebrickablePartNum.split('-')[0];
  if (!baseNum) return PART_NUMBER_MAPPING.default;

  if (PART_NUMBER_MAPPING[baseNum]) return PART_NUMBER_MAPPING[baseNum];

  if (/^[0-9]+$/.test(baseNum)) return baseNum;

  return PART_NUMBER_MAPPING.default;
}

export function hasGoodLDrawModel(partNumber) {
  const baseNum = partNumber?.split('-')[0];
  if (!baseNum) return false;
  if (PART_NUMBER_MAPPING[baseNum]) return true;
  return /^[0-9]+$/.test(baseNum);
}