import TournamentBracket from '@/pages/Tools/TeamMatch/step3_draw_ccp';
import { Context, Player } from '@/pages/Tools/TeamMatch/types';
import { Button } from 'antd';
import React, { useState } from 'react';
import './step3_comps.css';

const seedPairs = [
  [1, 2],
  [3, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12],
  [13, 14],
  [15, 16],
];

type Props = {
  context: Context;
  setContext: React.Dispatch<React.SetStateAction<Context>>;
};

// 数组随机排序函数
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

//
// const distributePlayers = (context: Context) => {
//   // 创建玩家到原始分组的映射
//   const playerToGroupMap = new Map<Player, string>();
//   context.Step1TableData.forEach(group => {
//     group.players.forEach(player => {
//       playerToGroupMap.set(player, group.name);
//     });
//   });
//
//   // 获取所有玩家并分离种子和非种子
//   const allPlayers = context.Step1TableData.flatMap(g => g.players);
//   const seedPlayers = allPlayers.filter(p => p.seeded);
//   const nonSeedPlayers = allPlayers.filter(p => !p.seeded);
//
//   // 初始化四个分组（改进为对象数组方便后续排序）
//   const brackets = Array.from({ length: 4 }, () => ({
//     originalGroups: new Set<string>(),
//     players: [] as Player[],
//     get remaining() { return 4 - this.players.length }
//   }));
//
//   // 随机分配种子到四个分组
//   shuffleArray(seedPlayers).forEach((seed, index) => {
//     brackets[index].players.push(seed);
//     brackets[index].originalGroups.add(playerToGroupMap.get(seed)!);
//   });
//
//   // 按原始分组组织非种子选手（按分组人数降序排列）
//   const nonSeedByGroup = Object.entries(
//     nonSeedPlayers.reduce((acc, player) => {
//       const groupName = playerToGroupMap.get(player)!;
//       acc[groupName] = acc[groupName] || [];
//       acc[groupName].push(player);
//       return acc;
//     }, {} as { [key: string]: Player[] })
//   ).sort((a, b) => b[1].length - a[1].length); // 人数多的组优先处理
//
//   // 分配剩余非种子选手
//   nonSeedByGroup.forEach(([groupName, players]) => {
//     shuffleArray(players).forEach(player => {
//       // 按剩余容量排序（剩余少的在前），同时排除当前原始分组
//       const sortedBrackets = brackets
//         .filter(b => !b.originalGroups.has(groupName))
//         .sort((a, b) => a.remaining - b.remaining);
//
//       // 优先选择剩余容量最少且可用的分组
//       for (const bracket of sortedBrackets) {
//         if (bracket.players.length < 4) {
//           bracket.players.push(player);
//           bracket.originalGroups.add(groupName);
//           break;
//         }
//       }
//     });
//   });
//
//   // 二次平衡：处理可能的剩余空间
//   brackets.sort((a, b) => a.remaining - b.remaining).forEach(bracket => {
//     while (bracket.remaining > 0) {
//       // 寻找可转移的选手
//       const donorBracket = brackets
//         .filter(b => b !== bracket && b.remaining < 0)
//         .sort((a, b) => b.players.length - a.players.length)[0];
//
//       if (!donorBracket) break;
//
//       const transferPlayer = donorBracket.players.find(p =>
//         !bracket.originalGroups.has(playerToGroupMap.get(p)!)
//       );
//
//       if (transferPlayer) {
//         donorBracket.players.splice(donorBracket.players.indexOf(transferPlayer), 1);
//         bracket.players.push(transferPlayer);
//         bracket.originalGroups.add(playerToGroupMap.get(transferPlayer)!);
//       } else {
//         break;
//       }
//     }
//   });
//
//   // 生成最终结果（保持每个分组随机排序）
//   let curPlayers: Player[] = [];
//   brackets.forEach((bracket, bracketIndex) => {
//     const startSeed = bracketIndex * 4 + 1;
//     shuffleArray(bracket.players).forEach((player, idx) => {
//       curPlayers.push({
//         ...player,
//         seed: startSeed + idx,
//         id: `id_${startSeed + idx}`
//       });
//     });
//   });
//
//   return curPlayers;
// };
const distributePlayers = (context: Context) => {
  const playerToGroupMap = new Map<Player, string>();
  context.Step1TableData.forEach((group) => {
    group.players.forEach((player) => {
      playerToGroupMap.set(player, group.name);
    });
  });

  const allPlayers = context.Step1TableData.flatMap((g) => g.players);
  const seedPlayers = allPlayers.filter((p) => p.seeded);
  const nonSeedPlayers = allPlayers.filter((p) => !p.seeded);

  const brackets = Array.from({ length: 4 }, (_, i) => ({
    index: i,
    players: [] as Player[],
    originalGroups: new Set<string>(),
    get remaining() {
      return 4 - this.players.length;
    },
  }));

  // 随机分配一次
  shuffleArray(seedPlayers).forEach((seed, index) => {
    const targetBracket = brackets[index % 4];
    targetBracket.players.push(seed);
    targetBracket.originalGroups.add(playerToGroupMap.get(seed)!);
  });

  const nonSeedByGroup = Object.entries(
    nonSeedPlayers.reduce((acc, player) => {
      const groupName = playerToGroupMap.get(player)!;
      acc[groupName] = acc[groupName] || [];
      acc[groupName].push(player);
      return acc;
    }, {} as { [key: string]: Player[] }),
  ).sort((a, b) => b[1].length - a[1].length);

  // 对非种子选手进行随机分配，且不能来自同一个小组
  let groupAssignIndex = 0;
  nonSeedByGroup.forEach(([groupName, players]) => {
    shuffleArray(players).forEach((player, idx) => {
      let assigned = false;
      let attempts = 0;
      while (!assigned && attempts < 4) {
        const targetBracket = brackets[groupAssignIndex % 4];
        if (targetBracket.remaining > 0) {
          if (!targetBracket.originalGroups.has(groupName) || idx % 2 === 1) {
            targetBracket.players.push(player);
            targetBracket.originalGroups.add(groupName);
            assigned = true;
          }
        }
        groupAssignIndex = (groupAssignIndex + 1) % 4;
        attempts++;
      }
    });
  });

  // bracket.players长度为奇数时， 需要将人数多的组中一个选手， 转移到另外一个组上面去，不能转移种子选手。
  const oddBrackets = brackets.filter(bracket => bracket.players.length % 2 === 1);
  if (oddBrackets.length >= 2) {
    // 按人数降序排序
    oddBrackets.sort((a, b) => b.players.length - a.players.length);
    for (let i = 0; i < oddBrackets.length - 1; i++) {
      const sourceBracket = oddBrackets[i];
      const targetBracket = oddBrackets[i + 1];
      const nonSeedPlayers = sourceBracket.players.filter(player => !player.seeded);
      if (nonSeedPlayers.length > 0) {
        const playerToMove = nonSeedPlayers[0];
        sourceBracket.players = sourceBracket.players.filter(player => player!== playerToMove);
        targetBracket.players.push(playerToMove);
        const groupName = playerToGroupMap.get(playerToMove)!;
        targetBracket.originalGroups.add(groupName);
      }
    }
  }


  // 出现轮空数为1， 人数为3， 分配种子选手，优先让种子选手轮空
  brackets.forEach((bracket) => {
    if (bracket.players.length !== 3) {
      return;
    }

    // 找到种子选手
    const seedPlayer = bracket.players.find((p) => p.seeded);
    if (!seedPlayer) {
      return;
    }

    // 判断是否有来自同组的，如果有则不再修正
    const groupSet = new Set<string>();
    for (const player of bracket.players) {
      if (groupSet.has(player.groupName)) {
        return;
      }
      groupSet.add(player.groupName);
    }

    // 让 seeded 的 player 排到最后
    bracket.players.sort((a, b) => (a.seeded ? 1 : 0) - (b.seeded ? 1 : 0));
  });

  let curPlayers: Player[] = [];
  brackets.forEach((bracket, bracketIndex) => {
    const startSeed = bracketIndex * 4 + 1;
    bracket.players.forEach((player, idx) => {
      curPlayers.push({
        ...player,
        seed: startSeed + idx,
        id: `id_${startSeed + idx}`,
      });
    });
  });

  return curPlayers;
};

const Step2MatchNow: React.FC<Props> = ({ context }) => {
  const [players, setPlayers] = useState<(Player | null)[]>([]);
  const [winners, setWinners] = useState<Record<string, Player | null>>({});
  const [losers, setLosers] = useState<Record<string, Player>>({});
  const [randed, setRanded] = useState<boolean>(false);

  const handleButtonClick = () => {
    setWinners({});
    setLosers({});
    setPlayers(distributePlayers(context));
    setRanded(true);
  };

  return (
    <>
      {
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Button onClick={handleButtonClick} type="primary">
            随机分组并开始比赛
          </Button>
        </div>
      }
      {randed && (
        <TournamentBracket
          seedPairs={seedPairs}
          players={players}
          winners={winners}
          losers={losers}
          setLosers={setLosers}
          setWinners={setWinners}
        />
      )}
    </>
  );
};

export default Step2MatchNow;
