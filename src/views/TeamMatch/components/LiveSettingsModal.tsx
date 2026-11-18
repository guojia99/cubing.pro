import {
  getDefaultBracketPageSettings,
  getDefaultLiveUISettings,
  type BracketPageSettings,
  type LiveUISettings,
} from '@/views/TeamMatch/liveUiSettings';
import { getDefaultPkArenaSettings, type PkArenaSettings } from '@/views/TeamMatch/pkArenaSettings';
import { TEAM_MATCH_MODAL_Z_INDEX } from '@/views/TeamMatch/uiZIndex';
import { Button, ColorPicker, Form, Input, InputNumber, Modal, Slider, Space, Switch, Tabs, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useTeamMatchI18n } from '../i18n';

function colorFieldToString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'toRgbString' in v && typeof (v as { toRgbString: () => string }).toRgbString === 'function') {
    return (v as { toRgbString: () => string }).toRgbString();
  }
  return String(v ?? '');
}

const ARENA_COLOR_KEYS: (keyof PkArenaSettings)[] = [
  'backgroundColor',
  'backgroundColorEnd',
  'glowLeft',
  'glowRight',
  'stripLeft',
  'stripRight',
  'teamNameColor',
  'playerNameColor',
  'pkTitleColor',
  'barBg',
];

const BRACKET_COLOR_KEYS: (keyof BracketPageSettings)[] = [
  'pageBg',
  'hintColor',
  'wingTitleColor',
  'blockTitleColor',
  'teamLineColor',
  'vsColor',
  'matchIdColor',
  'cardBg',
  'cardBorderColor',
  'clickableBorderColor',
  'leftWingBorder',
  'rightWingBorder',
  'centerColumnBg',
  'centerColumnBorder',
  'bronzeHintColor',
];

function normalizeLiveForm(raw: {
  bracket?: Partial<BracketPageSettings>;
  arena?: Partial<PkArenaSettings>;
}): LiveUISettings {
  const arena = { ...getDefaultPkArenaSettings() };
  const bracket = { ...getDefaultBracketPageSettings() };
  if (raw.arena) {
    (Object.keys(arena) as (keyof PkArenaSettings)[]).forEach((k) => {
      const v = raw.arena![k];
      if (v === undefined) return;
      if (ARENA_COLOR_KEYS.includes(k)) (arena as Record<string, unknown>)[k] = colorFieldToString(v);
      else (arena as Record<string, unknown>)[k] = v;
    });
  }
  if (raw.bracket) {
    (Object.keys(bracket) as (keyof BracketPageSettings)[]).forEach((k) => {
      const v = raw.bracket![k];
      if (v === undefined) return;
      if (BRACKET_COLOR_KEYS.includes(k)) (bracket as Record<string, unknown>)[k] = colorFieldToString(v);
      else (bracket as Record<string, unknown>)[k] = v;
    });
  }
  return { arena, bracket };
}

type Props = {
  open: boolean;
  onClose: () => void;
  value: LiveUISettings;
  onApply: (next: LiveUISettings) => void;
};

const LiveSettingsModal: React.FC<Props> = ({ open, onClose, value, onApply }) => {
  const { t } = useTeamMatchI18n();
  const [form] = Form.useForm<LiveUISettings>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(value);
    }
  }, [open, value, form]);

  return (
    <Modal
      className="tm-workbench-modal"
      title={t('teamMatch.settings')}
      open={open}
      onCancel={onClose}
      width={600}
      footer={null}
      destroyOnHidden
      zIndex={TEAM_MATCH_MODAL_Z_INDEX}
      styles={{
        body: {
          maxHeight: 'min(72vh, 560px)',
          overflowY: 'auto',
          paddingTop: 8,
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        size="small"
        initialValues={value}
        onFinish={(vals) => {
          onApply(normalizeLiveForm(vals as { bracket?: Partial<BracketPageSettings>; arena?: Partial<PkArenaSettings> }));
        }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          {t('teamMatch.settingsSaved')}
        </Typography.Paragraph>
        <Tabs
          items={[
            {
              key: 'bracket',
              label: t('teamMatch.bracket'),
              children: (
                <>
                  <Form.Item label={t('teamMatch.pageBg')} name={['bracket', 'pageBg']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.bracketScale')} name={['bracket', 'scale']}>
                    <Slider min={0.75} max={1.25} step={0.05} marks={{ 1: '1×' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.hintFont')} name={['bracket', 'hintFontPx']}>
                    <InputNumber min={10} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.hintColor')} name={['bracket', 'hintColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.wingFont')} name={['bracket', 'wingTitleFontPx']}>
                    <InputNumber min={9} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.wingColor')} name={['bracket', 'wingTitleColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.blockFont')} name={['bracket', 'blockTitleFontPx']}>
                    <InputNumber min={10} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.blockColor')} name={['bracket', 'blockTitleColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.teamFont')} name={['bracket', 'teamLineFontPx']}>
                    <InputNumber min={11} max={28} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.teamColor')} name={['bracket', 'teamLineColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.vsFont')} name={['bracket', 'vsFontPx']}>
                    <InputNumber min={10} max={22} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.vsColor')} name={['bracket', 'vsColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.matchFont')} name={['bracket', 'matchIdFontPx']}>
                    <InputNumber min={10} max={22} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.matchColor')} name={['bracket', 'matchIdColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.cardBg')} name={['bracket', 'cardBg']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.cardBorder')} name={['bracket', 'cardBorderColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.clickableBorder')} name={['bracket', 'clickableBorderColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.leftBorder')} name={['bracket', 'leftWingBorder']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.rightBorder')} name={['bracket', 'rightWingBorder']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.leftFill')} name={['bracket', 'leftWingFill']} tooltip={t('teamMatch.gradientHint')}>
                    <Input.TextArea rows={2} placeholder="linear-gradient(...)" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.rightFill')} name={['bracket', 'rightWingFill']}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.centerBg')} name={['bracket', 'centerColumnBg']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.centerBorder')} name={['bracket', 'centerColumnBorder']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.bronzeFont')} name={['bracket', 'bronzeHintFontPx']}>
                    <InputNumber min={9} max={18} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.bronzeColor')} name={['bracket', 'bronzeHintColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'arena',
              label: t('teamMatch.fullscreenBattle'),
              children: (
                <>
                  <Form.Item label={t('teamMatch.waves')} name={['arena', 'flagBackgroundEnabled']} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Typography.Paragraph type="secondary" style={{ marginTop: -4, marginBottom: 8 }}>
                    {t('teamMatch.wavesHint')}
                  </Typography.Paragraph>
                  <Form.Item label={t('teamMatch.scale')} name={['arena', 'scale']}>
                    <Slider min={0.5} max={1.6} step={0.05} marks={{ 1: '1×' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.backgroundTop')} name={['arena', 'backgroundColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.backgroundBottom')} name={['arena', 'backgroundColorEnd']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.glowLeft')} name={['arena', 'glowLeft']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.glowRight')} name={['arena', 'glowRight']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.stripLeft')} name={['arena', 'stripLeft']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.stripRight')} name={['arena', 'stripRight']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.teamColor')} name={['arena', 'teamNameColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.teamFont')} name={['arena', 'teamNameFontPx']}>
                    <InputNumber min={14} max={64} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.playerColor')} name={['arena', 'playerNameColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.playerFont')} name={['arena', 'playerNameFontPx']}>
                    <InputNumber min={12} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.pkColor')} name={['arena', 'pkTitleColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.pkFont')} name={['arena', 'pkTitleFontPx']}>
                    <InputNumber min={28} max={120} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.avatarSize')} name={['arena', 'avatarSizePx']}>
                    <InputNumber min={40} max={160} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.diagonalStep')} name={['arena', 'diagonalStepPx']} tooltip={t('teamMatch.diagonalHint')}>
                    <InputNumber min={8} max={80} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.buttonFont')} name={['arena', 'buttonFontPx']}>
                    <InputNumber min={12} max={28} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.barBg')} name={['arena', 'barBg']}>
                    <ColorPicker showText />
                  </Form.Item>

                  <Typography.Paragraph strong style={{ marginBottom: 4, marginTop: 8 }}>
                    {t('teamMatch.heroSettings')}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 8 }}>
                    {t('teamMatch.heroHint')}
                  </Typography.Paragraph>
                  <Form.Item label={t('teamMatch.heroAvatar')} name={['arena', 'heroDetailAvatarPx']}>
                    <InputNumber min={120} max={480} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.heroName')} name={['arena', 'heroDetailNameFontPx']}>
                    <InputNumber min={24} max={96} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.heroPk')} name={['arena', 'heroDetailPkScoreFontPx']}>
                    <InputNumber min={20} max={88} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.heroSeed')} name={['arena', 'heroDetailSeedFontPx']}>
                    <InputNumber min={14} max={56} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.heroTeam')} name={['arena', 'heroDetailTeamFontPx']}>
                    <InputNumber min={14} max={48} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.heroSchool')} name={['arena', 'heroDetailSchoolFontPx']}>
                    <InputNumber min={12} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={t('teamMatch.heroCry')} name={['arena', 'heroDetailCryFontPx']}>
                    <InputNumber min={12} max={44} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    label={t('teamMatch.carouselInterval')}
                    name={['arena', 'heroCarouselIntervalMs']}
                    tooltip={t('teamMatch.carouselHint')}
                    getValueProps={(ms) => {
                      const d = getDefaultPkArenaSettings().heroCarouselIntervalMs;
                      const raw = typeof ms === 'number' && Number.isFinite(ms) ? ms : d;
                      return { value: raw / 1000 };
                    }}
                    normalize={(sec) => {
                      const d = getDefaultPkArenaSettings().heroCarouselIntervalMs;
                      if (sec === null || sec === undefined || Number.isNaN(Number(sec))) return d;
                      return Math.max(500, Math.round(Number(sec) * 1000));
                    }}
                  >
                    <InputNumber min={0.5} max={60} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit">
            {t('teamMatch.apply')}
          </Button>
          <Button
            onClick={() => {
              const d = getDefaultLiveUISettings();
              form.setFieldsValue(d);
              onApply(d);
            }}
          >
            {t('teamMatch.reset')}
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default LiveSettingsModal;
