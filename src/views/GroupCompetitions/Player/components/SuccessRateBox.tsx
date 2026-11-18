import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { useThemeColors } from '@/theme/useThemeColors';
import { useI18n } from '@/contexts/I18nProvider';

const { Text, Title } = Typography;

interface SuccessRateBoxProps {
  data: number[];
}

const calculateRate = (data: number[]) => {
  const total = data.length;
  const success = data.filter(n => n > 0).length;
  return total > 0 ? (success / total) * 100 : 0;
};

const SuccessRateBox: React.FC<SuccessRateBoxProps> = ({ data }) => {
  const { t, tf } = useI18n();
  const theme = useThemeColors();
  const totalCount = data.length;
  const successCount = data.filter(n => n > 0).length;
  const overallRate = calculateRate(data);

  const rate20 = data.length >= 20 ? calculateRate(data.slice(-20)) : null;
  const rate50 = data.length >= 50 ? calculateRate(data.slice(-50)) : null;
  const rate100 = data.length >= 100 ? calculateRate(data.slice(-100)) : null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card
        variant="borderless"
        style={{
          width: 260,
          maxWidth: '100%',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center',
          padding: 8,
        }}
      >
        <Title level={5}>{t('competitionAdmin.successRate')}</Title>
        <Progress
          type="circle"
          percent={parseFloat(overallRate.toFixed(1))}
          strokeColor={theme.signalSuccess}
          size={100}
        />
        <div style={{ marginTop: 16 }}>
          <Text>{successCount} / {totalCount}</Text>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: theme.mutedForeground }}>
          {rate20 !== null && <div>{tf('competitionAdmin.recentAttempts', { count: 20, rate: rate20.toFixed(0) })}</div>}
          {rate50 !== null && <div>{tf('competitionAdmin.recentAttempts', { count: 50, rate: rate50.toFixed(0) })}</div>}
          {rate100 !== null && <div>{tf('competitionAdmin.recentAttempts', { count: 100, rate: rate100.toFixed(0) })}</div>}
        </div>
      </Card>
    </div>
  );
};

export default SuccessRateBox;
