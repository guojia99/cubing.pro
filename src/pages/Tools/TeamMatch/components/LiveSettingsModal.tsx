import {
  getDefaultBracketPageSettings,
  getDefaultLiveUISettings,
  type BracketPageSettings,
  type LiveUISettings,
} from '@/pages/Tools/TeamMatch/liveUiSettings';
import { getDefaultPkArenaSettings, type PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import { Button, ColorPicker, Form, Input, InputNumber, Modal, Slider, Space, Tabs, Typography } from 'antd';
import React, { useEffect } from 'react';

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
  const [form] = Form.useForm<LiveUISettings>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(value);
    }
  }, [open, value, form]);

  return (
    <Modal
      title="正赛与对战设置"
      open={open}
      onCancel={onClose}
      width={600}
      footer={null}
      destroyOnClose
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
          调整后将自动保存到本机浏览器。
        </Typography.Paragraph>
        <Tabs
          items={[
            {
              key: 'bracket',
              label: '对阵图',
              children: (
                <>
                  <Form.Item label="页面背景" name={['bracket', 'pageBg']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="对阵图缩放" name={['bracket', 'scale']}>
                    <Slider min={0.75} max={1.25} step={0.05} marks={{ 1: '1×' }} />
                  </Form.Item>
                  <Form.Item label="说明文字字号 (px)" name={['bracket', 'hintFontPx']}>
                    <InputNumber min={10} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="说明文字颜色" name={['bracket', 'hintColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="半区标题字号 (px)" name={['bracket', 'wingTitleFontPx']}>
                    <InputNumber min={9} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="半区标题颜色" name={['bracket', 'wingTitleColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="冠军/铜牌标题字号 (px)" name={['bracket', 'blockTitleFontPx']}>
                    <InputNumber min={10} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="冠军/铜牌标题颜色" name={['bracket', 'blockTitleColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="队名字号 (px)" name={['bracket', 'teamLineFontPx']}>
                    <InputNumber min={11} max={28} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="队名颜色" name={['bracket', 'teamLineColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="VS 字号 (px)" name={['bracket', 'vsFontPx']}>
                    <InputNumber min={10} max={22} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="VS 颜色" name={['bracket', 'vsColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="场次号字号 (px)" name={['bracket', 'matchIdFontPx']}>
                    <InputNumber min={10} max={22} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="场次号颜色" name={['bracket', 'matchIdColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="卡片背景" name={['bracket', 'cardBg']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="卡片边框" name={['bracket', 'cardBorderColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="可录入时描边" name={['bracket', 'clickableBorderColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="左半区左边线" name={['bracket', 'leftWingBorder']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="右半区右边线" name={['bracket', 'rightWingBorder']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="左半区背景（CSS）" name={['bracket', 'leftWingFill']} tooltip="支持 linear-gradient 或纯色">
                    <Input.TextArea rows={2} placeholder="linear-gradient(...)" />
                  </Form.Item>
                  <Form.Item label="右半区背景（CSS）" name={['bracket', 'rightWingFill']}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label="中间列背景" name={['bracket', 'centerColumnBg']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="中间列竖线" name={['bracket', 'centerColumnBorder']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="铜牌提示字号 (px)" name={['bracket', 'bronzeHintFontPx']}>
                    <InputNumber min={9} max={18} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="铜牌提示颜色" name={['bracket', 'bronzeHintColor']}>
                    <ColorPicker showText />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'arena',
              label: '对战全屏',
              children: (
                <>
                  <Form.Item label="整体缩放" name={['arena', 'scale']}>
                    <Slider min={0.5} max={1.6} step={0.05} marks={{ 1: '1×' }} />
                  </Form.Item>
                  <Form.Item label="背景色（上）" name={['arena', 'backgroundColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="背景色（下，渐变）" name={['arena', 'backgroundColorEnd']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="左侧光晕" name={['arena', 'glowLeft']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="右侧光晕" name={['arena', 'glowRight']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="左队条带色" name={['arena', 'stripLeft']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="右队条带色" name={['arena', 'stripRight']}>
                    <ColorPicker showText />
                  </Form.Item>
                  <Form.Item label="队名颜色" name={['arena', 'teamNameColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="队名字号 (px)" name={['arena', 'teamNameFontPx']}>
                    <InputNumber min={14} max={64} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="队员名颜色" name={['arena', 'playerNameColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="队员名字号 (px)" name={['arena', 'playerNameFontPx']}>
                    <InputNumber min={12} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="中央 PK 颜色" name={['arena', 'pkTitleColor']}>
                    <ColorPicker showText format="hex" />
                  </Form.Item>
                  <Form.Item label="中央 PK 字号 (px)" name={['arena', 'pkTitleFontPx']}>
                    <InputNumber min={28} max={120} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="头像边长 (px)" name={['arena', 'avatarSizePx']}>
                    <InputNumber min={40} max={160} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="斜线间距 (px)" name={['arena', 'diagonalStepPx']} tooltip="每名队员相对上一名横向偏移">
                    <InputNumber min={8} max={80} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="顶栏按钮字号 (px)" name={['arena', 'buttonFontPx']}>
                    <InputNumber min={12} max={28} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="顶栏背景" name={['arena', 'barBg']}>
                    <ColorPicker showText />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit">
            应用
          </Button>
          <Button
            onClick={() => {
              const d = getDefaultLiveUISettings();
              form.setFieldsValue(d);
              onApply(d);
            }}
          >
            恢复默认
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default LiveSettingsModal;
