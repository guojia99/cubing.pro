// src/components/edges.ts
export const edges = [
  // Trigger路径（蓝色）
  { from: 'HTR', to: '正1逆1-A', color: '#1E88E5' },
  { from: '正1逆1-A', to: '4C8/0E-A', color: '#1E88E5' },

  // 推荐路径（黑色）
  { from: 'HTR', to: '正1逆1-B', color: 'black', width: 2 },
  { from: '正1逆1-B', to: '正2逆2-A', color: 'black', width: 2 },
  { from: '正2逆2-A', to: '4C', color: 'black', width: 2 },
  { from: '4C', to: '正1逆2', color: 'black', width: 2 },
  { from: '正1逆2', to: '4C-A', color: 'black', width: 2 },
  { from: '4C-A', to: '正2逆1-A', color: 'black', width: 2 },
  { from: '正2逆1-A', to: '4C6E-B', color: 'black', width: 2 },
  { from: '4C6E-B', to: '正2逆1-B', color: 'black', width: 2 },
  { from: '正2逆1-B', to: '4C-B', color: 'black', width: 2 },
  { from: '4C-B', to: '2/6C绿', color: 'black', width: 2 },

  // 可做路径（灰色）
  { from: '正1逆1-B', to: '正2逆2-B', color: '#BDBDBD' },
  { from: '正2逆2-B', to: '4C8/0E-B', color: '#BDBDBD' },
  { from: '4C8/0E-B', to: '4C4E', color: '#BDBDBD' },
  { from: '4C4E', to: '4C4E-R', color: '#BDBDBD' },

  // 熔通路径（红色）
  { from: 'HTR', to: '0/8C红-A', color: '#E53935' },
  { from: '正1逆2-B', to: '0/8C红-B', color: '#E53935' },
];
