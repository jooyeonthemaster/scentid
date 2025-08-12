import { ScentCategoryScores, PerfumeCategory } from "@/app/types/perfume";
import perfumePersonasData from '@/app/data/perfumePersonas';

// 향료 ID에서 카테고리 추정
export const getScentCategory = (id: string): string => {
  // AC'SCENT 형식의 경우 persona 데이터를 사용
  if (id.startsWith("AC'SCENT")) {
    const persona = perfumePersonasData.personas.find(p => p.id === id);
    if (persona && persona.categories) {
      const categories = persona.categories as ScentCategoryScores;
      let mainCategoryKey: keyof ScentCategoryScores | undefined = undefined;
      let maxScore = -1;

      (Object.keys(categories) as Array<keyof ScentCategoryScores>).forEach(categoryKey => {
        if (categories[categoryKey] > maxScore) {
          maxScore = categories[categoryKey];
          mainCategoryKey = categoryKey;
        }
      });

      if (mainCategoryKey) {
        return mainCategoryKey;
      }
    }
  }
  
  // 기존 ID 형식에 따른 카테고리 매핑 (호환성을 위해 유지)
  if (id.startsWith('CI-')) return 'citrus';
  if (id.startsWith('FL-')) return 'floral';
  if (id.startsWith('WD-')) return 'woody';
  if (id.startsWith('MU-')) return 'musky';
  if (id.startsWith('FR-')) return 'fruity';
  if (id.startsWith('SP-')) return 'spicy';
  
  const idLower = id.toLowerCase();
  if (idLower.includes('wood') || idLower.includes('sand')) return 'woody';
  if (idLower.includes('rose') || idLower.includes('jas')) return 'floral';
  if (idLower.includes('orange') || idLower.includes('lemon')) return 'citrus';
  if (idLower.includes('musk') || idLower.includes('amber')) return 'musky';
  if (idLower.includes('peach') || idLower.includes('berry')) return 'fruity';
  if (idLower.includes('pepper') || idLower.includes('spice')) return 'spicy';
  
  return 'unknown';
};

// 향료 이름에 따른 카테고리 접두사 결정
export const getScentCategoryPrefix = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (/레몬|오렌지|베르가못|라임|자몽|시트러스/.test(lowerName)) return 'CI';
  if (/장미|로즈|자스민|라벤더|튤립|꽃|플로럴/.test(lowerName)) return 'FL';
  if (/우디|샌달우드|시더|나무|흙|이끼|파인|베티버/.test(lowerName)) return 'WD';
  if (/머스크|앰버|바닐라|통카|따뜻/.test(lowerName)) return 'MU';
  if (/복숭아|딸기|베리|과일|망고|프루티/.test(lowerName)) return 'FR';
  if (/페퍼|시나몬|진저|카다멈|스파이시|후추/.test(lowerName)) return 'SP';
  return 'UN';
};

// 향료 ID에서 주요 카테고리 결정
export const getScentMainCategory = (id: string): string => {
  const persona = perfumePersonasData.personas.find(p => p.id === id);

  if (persona && persona.categories) {
    const categories = persona.categories as ScentCategoryScores;
    let mainCategoryKey: keyof ScentCategoryScores | undefined = undefined;
    let maxScore = -1;

    (Object.keys(categories) as Array<keyof ScentCategoryScores>).forEach(categoryKey => {
      if (categories[categoryKey] > maxScore) {
        maxScore = categories[categoryKey];
        mainCategoryKey = categoryKey;
      }
    });

    if (mainCategoryKey) {
      const keyAsPerfumeCategory = mainCategoryKey as PerfumeCategory;
      switch (keyAsPerfumeCategory) {
        case 'citrus': return '시트러스';
        case 'floral': return '플로럴';
        case 'woody': return '우디';
        case 'musky': return '머스크';
        case 'fruity': return '프루티';
        case 'spicy': return '스파이시';
      }
    }
  }

  // AC'SCENT 형식의 경우는 이미 위에서 처리됨
  if (id.startsWith('CI-')) return '시트러스';
  if (id.startsWith('FL-')) return '플로럴';
  if (id.startsWith('WD-')) return '우디';
  if (id.startsWith('MU-')) return '머스크';
  if (id.startsWith('FR-')) return '프루티';
  if (id.startsWith('SP-')) return '스파이시';
  
  return '기타';
};

// 카테고리 색상 결정 함수
export const getCategoryColor = (category: string): { bg: string; text: string; progressBg: string; progressFrom: string; progressTo: string; } => {
  switch (category) {
    case '시트러스':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', progressBg: 'bg-yellow-200', progressFrom: 'from-yellow-300', progressTo: 'to-yellow-500' };
    case '플로럴':
      return { bg: 'bg-purple-100', text: 'text-purple-700', progressBg: 'bg-purple-200', progressFrom: 'from-purple-300', progressTo: 'to-purple-500' };
    case '우디':
      return { bg: 'bg-green-100', text: 'text-green-700', progressBg: 'bg-green-200', progressFrom: 'from-green-300', progressTo: 'to-green-500' };
    case '머스크':
      return { bg: 'bg-indigo-100', text: 'text-indigo-700', progressBg: 'bg-indigo-200', progressFrom: 'from-indigo-300', progressTo: 'to-indigo-500' };
    case '프루티':
      return { bg: 'bg-pink-100', text: 'text-pink-700', progressBg: 'bg-pink-200', progressFrom: 'from-pink-300', progressTo: 'to-pink-500' };
    case '스파이시':
      return { bg: 'bg-teal-100', text: 'text-teal-700', progressBg: 'bg-teal-200', progressFrom: 'from-teal-300', progressTo: 'to-teal-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', progressBg: 'bg-gray-200', progressFrom: 'from-gray-300', progressTo: 'to-gray-400' };
  }
}; 