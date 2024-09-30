import { apiPlayer } from '@/services/cubing-pro/players/players';
import { useParams } from '@@/exports';
import React, { useEffect, useState } from 'react';
import {P404} from "@/components/Status/404";
import PlayerDetail from "@/pages/Player/PlayerComponents/PlayerDetail";
import {IfLoading} from "@/components/Wait/wait";
import UpdateTitle from "@/components/Title/Title";
import PlayerResults from "@/pages/Player/PlayerComponents/PlayerResults";
import {PlayersAPI} from "@/services/cubing-pro/players/typings";

const Player: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [player, setPlayer] = useState<PlayersAPI.Player>();

  const fetchPlayer = () => {
    if (id === undefined) {
      return;
    }
    apiPlayer(id)
      .then((value) => {
        setPlayer(value.data);
        setLoading(false)
      })
      .catch(() => {
        setIs404(true);
        setLoading(true)
      });
  };

  // 动态加载数据
  useEffect(() => {
    fetchPlayer();
  }, [id]);

  const tabs = (
    <>
      <div>
        {IfLoading(loading, <UpdateTitle title={player?.Name}/>)}
        {IfLoading(loading, <PlayerDetail player={player} key={'player_detail'} />)}
        {IfLoading(loading, <PlayerResults player={player} />  )}
      </div>
    </>
  );

  return (
    <>
      {is404 && P404('玩家不存在')}
      {!is404 && tabs}
    </>
  );
};

export default Player;
