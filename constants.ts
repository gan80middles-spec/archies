

import { Entry, Category, Term, TermType } from './types';

export const INITIAL_ENTRIES: Entry[] = [
  {
    id: '1',
    title: '低语真菌',
    author: '生物学家_42',
    category: Category.CREATURE,
    content: `
**低语真菌** (*Myco susurrus*) 是在第九扇区洞穴中发现的一种具有感知能力的真菌网络。

# 生物学特征
与标准植物群不同，这些真菌拥有初步的蜂巢思维。它们通过类似人类低语的低频声波振动进行交流。

## 危险等级：中等
如果没有适当的音频阻尼装备，长时间暴露在 [[低语]] 中会导致探险者产生幻觉或暂时性失忆。

> “我发誓，它知道我母亲的名字。” —— 侦察报告 #899
    `,
    createdAt: Date.now() - 10000000,
    likes: 42,
    tags: ['植物', '灵能', '洞穴'],
    realism: 3,
    risk: 3,
    anomalous: 2
  },
  {
    id: '2',
    title: '等离子长矛 Mk. IV',
    author: '铸造大师',
    category: Category.ITEM,
    content: `
[[余烬核心]] 皇家卫队的标准制式长柄武器。

- **长度**: 2.5 米
- **能源**: 压缩太阳能电池
- **输出**: 5000K 热能尖端

Mk. IV 改进了 Mk. III 的不稳定性，增加了一个磁性约束场，防止使用者在长时间战斗中意外融化自己的手。
    `,
    createdAt: Date.now() - 5000000,
    likes: 128,
    tags: ['近战', '等离子', '科技'],
    realism: 4,
    risk: 3,
    anomalous: 1
  },
  {
    id: '3',
    title: '琉璃沙漠',
    author: '制图师_Zero',
    category: Category.GEOGRAPHY,
    content: `
**硅基星**上的一片广阔区域。由于古代 [[轨道轰炸]]，整个地表由熔融玻璃构成。

# 环境
地表无摩擦且极具反射性。白天温度飙升至 80°C。土著生命进化出了基于吸盘的移动方式或反射性甲壳。

## 兴趣点
1. **碎片尖塔**：高达 2 公里的天然锯齿状玻璃结构。
2. **倒影池**：液态水银湖。
    `,
    createdAt: Date.now() - 200000,
    likes: 350,
    tags: ['沙漠', '危险', '行星'],
    realism: 4,
    risk: 2,
    anomalous: 1
  }
];

export const INITIAL_TERMS: Term[] = [
  {
    id: 'term-1',
    name: '余烬核心',
    type: TermType.FACTION,
    description: '掌控着旧世界地热能源网络的古老行会，崇尚机械飞升。',
    entryId: undefined,
    status: 'term_only'
  },
  {
    id: 'term-2',
    name: '低语',
    type: TermType.CONCEPT,
    description: '一种通过次声波传递的精神污染现象，常见于地下生态圈。',
    entryId: '1', // Links to "低语真菌" entry
    status: 'with_entry'
  },
  {
    id: 'term-3',
    name: '轨道轰炸',
    type: TermType.OTHER,
    description: '大崩塌纪元时期的终极武器打击事件，直接导致了地表玻璃化。',
    status: 'pending' 
  }
];
