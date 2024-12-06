import { P404 } from '@/components/Status/404';
import UpdateTitle from '@/components/Title/Title';
import PlayerDetail from '@/pages/Player/PlayerComponents/PlayerDetail';
import PlayerResults from '@/pages/Player/PlayerComponents/PlayerResults';
import { apiPlayer } from '@/services/cubing-pro/players/players';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { useParams } from '@@/exports';
import React, { useEffect, useState } from 'react';

const Player: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [player, setPlayer] = useState<PlayersAPI.Player>();

  const fetchPlayer = () => {
    if (id === undefined) {
      setLoading(true);
      return;
    }
    apiPlayer(id)
      .then((value) => {
        setPlayer(value.data);
        setIs404(false);
        setLoading(false);
      })
      .catch(() => {
        setIs404(true);
        setLoading(true);
      });
  };

  // 动态加载数据
  useEffect(() => {
    fetchPlayer();
  }, [id]);
  return (
    <>
      {is404 && P404('玩家不存在')}
      {!is404 && (
        <>
          {loading ? (
            <div>加载中...</div>
          ) : (
            <div>
              <UpdateTitle title={player?.Name} />
              <PlayerDetail player={player} key={'player_detail'} />
              <PlayerResults player={player} />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Player;
