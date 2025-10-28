import { Link } from '@@/exports';
import React from 'react';

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


export const WCALink = (wcaId: any, name: string | null = null) => {
  if (wcaId === null || wcaId ===undefined){
    return <>-</>
  }

  let wca = wcaId.toUpperCase();
  let dataName = wca
  if (name !== null){
    dataName = name
  }

  if (wca !== undefined && wca !== '' && wca !== "-") {
    return (
      <strong>
        <a
          href={'https://www.worldcubeassociation.org/persons/' + wca}
          target="_blank"
          rel="noopener noreferrer"
        >
          {dataName}
        </a>
      </strong>
    );
  }
  return <>-</>;
}


/**
 * 判断字符串是否包含中文，并提取所有中文字符
 * @param text 输入字符串
 * @returns { hasChinese: boolean; chinese: string } 包含中文标志和提取出的中文字符串
 */
function extractChinese(text: string): string {
  // 匹配所有中文字符的正则（基本汉字区间）
  const regex = /[\u4e00-\u9fff]/g;
  const matches = text.match(regex);

  if (matches) {
    return matches.join('');
  }

  return text
}

export const WCALinkWithCnName= (wcaId: any, name: string | null = null) => {
  if (name === null || name === '') {
    return WCALink(wcaId, name);
  }
  return WCALink(wcaId, extractChinese(name))
}
