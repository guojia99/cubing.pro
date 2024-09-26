import { Link } from '@@/exports';
import React from "react";

export const PlayerLink = (userId: any, name: string, color: string) => {
  let cor = '#000';
  if (color !== '') {
    cor = color;
  }

  return (
    <td>
      <strong>
        <Link to={'/player/' + userId} style={{ color: cor }}>
          {name}
        </Link>
      </strong>
    </td>
  );
};

export const CompetitionLink = (compsId: any, name: string) => {
  return (
    <td>
      <strong>
        <Link to={'/competition/' + compsId}>{name}</Link>
      </strong>
    </td>
  );
};


export const WCALink = (wcaId: any) => {
  if (wcaId === null || wcaId ===undefined){
    return <>-</>
  }


  let val = wcaId.toUpperCase();
  if (val !== undefined && val !== '' && val !== "-") {
    return (
      <strong>
        <a
          href={'https://www.worldcubeassociation.org/persons/' + val}
          target="_blank"
          rel="noopener noreferrer"
        >
          {val}
        </a>
      </strong>
    );
  }
  return <>-</>;
}