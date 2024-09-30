import { Record } from '@/components/Data/types/record';
import { Tag } from 'antd';

const CR_color = '#f50';
const GR_color = '#ffd049';
const PB_color = '#87d068';

export const RecordTagWithResult = (
  resultVal: string,
  resultId: string,
  isBest: boolean,
  isPB: boolean,
  recordMap: Map<string, Record>,
) => {
  let color = '';
  let tag = '';
  if (isPB) {
    color = PB_color;
    tag = 'PB';
  }

  const r_keys: string[] = ['GR', 'CR'];
  const r_keys_colors: string[] = [GR_color, CR_color];
  for (let i = 0; i < r_keys.length; i++) {
    let cr_key = resultId + '_' + r_keys[i];
    const record = recordMap.get(cr_key);
    if (
      !(
        record === null ||
        record === undefined ||
        !((isBest && (record.Best || record.Repeatedly)) || (!isBest && record.Average))
      )
    ) {
      if (record.Type === r_keys[i]) {
        color = r_keys_colors[i];
        tag = r_keys[i];
      }
    }
  }

  if (color === '') {
    return <>{resultVal}</>;
  }

  return (
    <>
      <strong style={{ color: color }}>{resultVal}</strong>{' '}
      <Tag color={color} style={{ marginLeft: '3px' }}>
        {tag}
      </Tag>
    </>
  );
};

export const RecordTag = (record: Record, values: string) => {
  let color = '';
  if (record.Type === 'CR') {
    color = CR_color;
  }
  if (record.Type === 'GR') {
    color = GR_color;
  }

  return (
    <>
      <Tag color={color} style={{ marginLeft: '3px' }}>
        {record.Type}
      </Tag>
      {' '}
      <strong style={{ color: color }}>{values}</strong>
    </>
  );
};
