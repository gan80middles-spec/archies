
export enum Category {
  CREATURE = '万灵图谱',   // Biology, Species
  ITEM = '万器图鉴',       // Weapons, Items, Relics, Vehicles
  LAW = '界律源典',        // World Rules, Magic Systems, Physics
  CHRONICLE = '纪元长卷',  // History, Timeline, Events
  CHARACTER = '群像名录',  // Characters, Gods, Personas
  FACTION = '阵营势力',    // Nations, Guilds, Organizations
  GEOGRAPHY = '地理图志',  // Locations, Maps, Dimensions
  SKILL = '技艺典籍',      // Spells, Techniques, Crafting
  CULTURE = '文明谱系'     // Religion, Society, Economy, Art
}

export interface User {
  id: string;
  username: string;
  email: string;
  joinDate: number;
  avatar?: string; // URL or Base64 string
  headerImage?: string; // URL or Base64 string for profile banner
  backgroundImage?: string; // URL or Base64 string for full page background
  bio?: string;
  favorites: string[]; // List of Entry IDs
}

export interface Entry {
  id: string;
  title: string;
  author: string; // Username
  authorId?: string; 
  category: Category;
  content: string; // Markdown content
  createdAt: number;
  likes: number;
  tags: string[];
  // New Dimensions
  realism: number;   // 1-5
  risk: number;      // 1-8
  anomalous: number; // 1-7
}

export type BlockType = 'h1' | 'h2' | 'h3' | 'paragraph' | 'quote' | 'code' | 'li' | 'hr' | 'image';

// Recursive Tree Node Definition - Discriminated Union
interface BaseBlock {
  id: string;
  children: EditorBlockNode[];
  isCollapsed?: boolean; // For future folding features
}

export interface TextBlock extends BaseBlock {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'quote' | 'code';
  content: string;
  // Compatibility optional fields to ease union usage
  listStyle?: never;
  checked?: never;
  src?: never;
  alt?: never;
}

export interface ListBlock extends BaseBlock {
  type: 'li';
  content: string;
  listStyle: 'bullet' | 'number' | 'task';
  checked?: boolean;
  src?: never;
  alt?: never;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src?: string;
  alt?: string;
  content?: string; // Optional for compatibility/alt text storage
  listStyle?: never;
  checked?: never;
}

export interface HrBlock extends BaseBlock {
  type: 'hr';
  content?: string; // Usually empty
  listStyle?: never;
  checked?: never;
  src?: never;
  alt?: never;
}

export type EditorBlockNode = TextBlock | ListBlock | ImageBlock | HrBlock;

// Updated to Jewel Tones / Muted Alchemical Colors
export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.CREATURE]: 'from-emerald-900/50 to-emerald-950',      // Deep Forest
  [Category.ITEM]: 'from-amber-900/50 to-orange-950',             // Molten Iron
  [Category.LAW]: 'from-slate-800 to-slate-950',                  // Stone Tablet
  [Category.CHRONICLE]: 'from-stone-800 to-stone-950',            // Old Parchment
  [Category.CHARACTER]: 'from-rose-900/50 to-red-950',            // Blood/Nobility
  [Category.FACTION]: 'from-blue-900/50 to-slate-900',            // Deep Ocean/Banner
  [Category.GEOGRAPHY]: 'from-teal-900/50 to-cyan-950',           // Abyssal
  [Category.SKILL]: 'from-violet-900/50 to-purple-950',           // Arcane
  [Category.CULTURE]: 'from-fuchsia-900/50 to-pink-950',          // Ceremony
};

export const CATEGORY_ICONS: Record<Category, string> = {
  [Category.CREATURE]: 'dna',
  [Category.ITEM]: 'sword',
  [Category.LAW]: 'scale',
  [Category.CHRONICLE]: 'scroll',
  [Category.CHARACTER]: 'users',
  [Category.FACTION]: 'flag',
  [Category.GEOGRAPHY]: 'map',
  [Category.SKILL]: 'zap',
  [Category.CULTURE]: 'landmark',
};

// Narrative, evocative descriptions for the dashboard cards
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  [Category.CREATURE]: '收录一切在世界中留下痕迹的生命——无论它们诞生于血肉、符文，还是概念本身。',
  [Category.ITEM]: '从断剑到歼星舰，从诅咒护符到生活义肢。不仅是物品的列表，更是文明技术与神秘学造诣的切片。',
  [Category.LAW]: '解析世界运转的底层逻辑。魔法粒子如何排列？物理法则在何处扭曲？这是世界的源代码说明书。',
  [Category.CHRONICLE]: '时间是唯一的度量。记录纪元的兴衰、文明的更迭，以及那些被刻意遗忘在历史尘埃中的真相。',
  [Category.CHARACTER]: '凝视众生相。神明、暴君、英雄与路人。他们的欲望、恐惧与命运交织成了这个世界的灵魂。',
  [Category.FACTION]: '世界是一盘棋，而这里记录着执棋者与棋子。国家、教会、财团与秘密结社的权力版图。',
  [Category.GEOGRAPHY]: '丈量脚下的土地。绘制大陆、海洋、浮空岛与深渊的地图。探索那些未被标记的异度空间。',
  [Category.SKILL]: '知识就是力量。详尽记录战斗流派、施法手势、炼金配方与古老仪式。传承或禁忌，皆在于此。',
  [Category.CULTURE]: '文明的血肉。货币、语言、节日与审美。了解他们如何生活，才能真正理解他们为何而战。',
};

// --- New Dimension Descriptions ---

export const REALISM_DESCRIPTIONS: Record<number, string> = {
  1: "脑洞碎片 / 梗：只有一句话或几句浮在空中的设定，几乎没有解释。",
  2: "粗略点子：有一点补充，但很多大坑没填，推进剧情容易出bug。",
  3: "合理草案：基本信息齐了，和世界里某些地区/阵营有联系，可跑团。",
  4: "高完成度设定：生态/社会/历史演化详细，有明确弱点和限制。",
  5: "硬核自洽 / 世界核心：逻辑严密，连接大量条目，可作为独立作品基石。"
};

export const RISK_DESCRIPTIONS: Record<number, string> = {
  1: "无害 / 装饰级：几乎没有负面效果，最多带来轻微不便。",
  2: "轻微风险：带来疼痛、不适，但完全可控。",
  3: "个人致命级：对单个角色致死，不至于扩散。",
  4: "小队 / 聚落危机级：能杀光小队或毁掉村庄，需组织处理。",
  5: "城镇 / 城市毁灭级：能摧毁城市，重大历史事件。",
  6: "国家 / 大陆改变级：导致国家灭亡，改变地理气候。",
  7: "世界级毁灭 / 重构级：使世界失衡，法则崩塌。",
  8: "宇宙 / 多世界级灾厄：影响多世界集合，重写时间线。"
};

export const ANOMALOUS_DESCRIPTIONS: Record<number, string> = {
  1: "日常·无异：符合常识，普通人见怪不怪。",
  2: "轻异·可解：有点特别，但能用现有知识解释。",
  3: "逸闻·传说：流言/故事，听起来“像是有可能存在”。",
  4: "异象·难解：超出主流理论，解释互相矛盾。",
  5: "诡秘·失真：描述自相矛盾，记录容易失真，无法绘图。",
  6: "禁知·侵蚀：理解本身伤害认知，导致精神污染。",
  7: "超认·绝对他者：超出认知框架，不可名状的终极秘密。"
};
