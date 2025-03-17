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

const distributePlayers = (context: Context) => {
  // 创建玩家到原始分组的映射
  const playerToGroupMap = new Map<Player, string>();
  context.Step1TableData.forEach(group => {
    group.players.forEach(player => {
      playerToGroupMap.set(player, group.name);
    });
  });

  // 获取所有玩家并分离种子和非种子
  const allPlayers = context.Step1TableData.flatMap(g => g.players);
  const seedPlayers = allPlayers.filter(p => p.seeded);
  const nonSeedPlayers = allPlayers.filter(p => !p.seeded);

  // 初始化四个分组（改进为对象数组方便后续排序）
  const brackets = Array.from({ length: 4 }, () => ({
    originalGroups: new Set<string>(),
    players: [] as Player[],
    get remaining() { return 4 - this.players.length }
  }));

  // 随机分配种子到四个分组
  shuffleArray(seedPlayers).forEach((seed, index) => {
    brackets[index].players.push(seed);
    brackets[index].originalGroups.add(playerToGroupMap.get(seed)!);
  });

  // 按原始分组组织非种子选手（按分组人数降序排列）
  const nonSeedByGroup = Object.entries(
    nonSeedPlayers.reduce((acc, player) => {
      const groupName = playerToGroupMap.get(player)!;
      acc[groupName] = acc[groupName] || [];
      acc[groupName].push(player);
      return acc;
    }, {} as { [key: string]: Player[] })
  ).sort((a, b) => b[1].length - a[1].length);

  // 优化分配策略：优先填充接近满员的分组
  nonSeedByGroup.forEach(([groupName, players]) => {
    shuffleArray(players).forEach(player => {
      // 按剩余容量排序（剩余少的在前），同时排除当前原始分组
      const sortedBrackets = brackets
        .filter(b => !b.originalGroups.has(groupName))
        .sort((a, b) => a.remaining - b.remaining);

      // 优先选择剩余容量最少且可用的分组
      for (const bracket of sortedBrackets) {
        if (bracket.players.length < 4) {
          bracket.players.push(player);
          bracket.originalGroups.add(groupName);
          break;
        }
      }
    });
  });

  // 二次平衡：处理可能的剩余空间
  brackets.sort((a, b) => a.remaining - b.remaining).forEach(bracket => {
    while (bracket.remaining > 0) {
      // 寻找可转移的选手
      const donorBracket = brackets
        .filter(b => b !== bracket && b.remaining < 0)
        .sort((a, b) => b.players.length - a.players.length)[0];

      if (!donorBracket) break;

      const transferPlayer = donorBracket.players.find(p =>
        !bracket.originalGroups.has(playerToGroupMap.get(p)!)
      );

      if (transferPlayer) {
        donorBracket.players.splice(donorBracket.players.indexOf(transferPlayer), 1);
        bracket.players.push(transferPlayer);
        bracket.originalGroups.add(playerToGroupMap.get(transferPlayer)!);
      } else {
        break;
      }
    }
  });

  // 生成最终结果（保持每个分组随机排序）
  let curPlayers: Player[] = [];
  brackets.forEach((bracket, bracketIndex) => {
    const startSeed = bracketIndex * 4 + 1;
    shuffleArray(bracket.players).forEach((player, idx) => {
      curPlayers.push({
        ...player,
        seed: startSeed + idx,
        id: `id_${startSeed + idx}`
      });
    });
  });

  return curPlayers;
};




const Step2MatchNow: React.FC<Props> = ({ context, setContext }) => {
  const [players, setPlayers] = useState<(Player | null)[]>([]);
  const [winners, setWinners] = useState<Record<string, Player | null>>({});
  const [losers, setLosers] = useState<Record<string, Player>>({});
  const [randed, setRanded] = useState<boolean>(false);

  const handleButtonClick = () => {
    setWinners({})
    setLosers({})
    setPlayers(distributePlayers(context));
    setRanded(true);
  };

  return (
    <>
      { (
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
      )}
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
