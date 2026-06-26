import { Record } from '@/components/Data/types/record';
import { Tag } from 'antd';

/** Ant Design Tag 预设色：浅色/深色主题下可读性优于自填 hex */
const tagPreset: { [key: string]: string } = {
  PB: 'success',
  NR: 'warning',
  GR: 'gold',
  CR: 'volcano',
};

export const RecordTagWithResult = (
  resultVal: string,
  resultId: string,
  isBest: boolean,
  isPB: boolean,
  recordMap: Map<string, Record>,
) => {
  let tag = '';
  if (isPB) {
    tag = 'PB';
  }

  const r_keys: string[] = ['NR', 'GR', 'CR'];
  for (let i = 0; i < r_keys.length; i++) {
    const cr_key = resultId + '_' + r_keys[i];
    const record = recordMap.get(cr_key);
    if (
      !(
        record === null ||
        record === undefined ||
        !((isBest && (record.Best || record.Repeatedly)) || (!isBest && record.Average))
      )
    ) {
      if (record.Type === r_keys[i]) {
        tag = r_keys[i];
      }
    }
  }

  if (tag === '') {
    return <>{resultVal}</>;
  }

  const preset = tagPreset[tag] ?? 'default';

  return (
    <>
      <strong>{resultVal}</strong>{' '}
      <Tag color={preset} style={{ marginLeft: 3 }}>
        {tag}
      </Tag>
    </>
  );
};

export const RecordTag = (record: Record, values: string) => {
  const preset = tagPreset[record.Type] ?? 'default';

  return (
    <>
      <Tag color={preset} style={{ marginLeft: '3px', maxWidth: '30px' }}>
        {record.Type}
      </Tag>
      <strong>{values}</strong>
    </>
  );
};
