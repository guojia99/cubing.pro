import React from 'react';
import { Card, Slider, Switch } from 'antd';
import { useIntl } from '@@/plugin-locale';
import type { FormulaFontFamilyId } from '../utils/formulaFontFamily';
import FormulaFontFamilySettings from './FormulaFontFamilySettings';

export interface AlgsPageSettingsPanelProps {
  formulaFontSize: number;
  onFormulaFontSizeChange: (size: number) => void;
  formulaFontFamily: FormulaFontFamilyId;
  onFormulaFontFamilyChange: (id: FormulaFontFamilyId) => void;
  columnsPerRow: number;
  onColumnsPerRowChange: (columns: number) => void;
  showVisualCubeSwitch: boolean;
  useVisualCube: boolean;
  onUseVisualCubeChange: (enabled: boolean) => void;
  showHideAltFormulas: boolean;
  hideAltFormulas: boolean;
  onHideAltFormulasChange: (hide: boolean) => void;
}

const AlgsPageSettingsPanel: React.FC<AlgsPageSettingsPanelProps> = ({
  formulaFontSize,
  onFormulaFontSizeChange,
  formulaFontFamily,
  onFormulaFontFamilyChange,
  columnsPerRow,
  onColumnsPerRowChange,
  showVisualCubeSwitch,
  useVisualCube,
  onUseVisualCubeChange,
  showHideAltFormulas,
  hideAltFormulas,
  onHideAltFormulasChange,
}) => {
  const intl = useIntl();

  return (
    <Card size="small" title={intl.formatMessage({ id: 'algs.detail.pageSettings' })} bordered={false}>
      <div className="algs-page-settings">
        <FormulaFontFamilySettings
          formulaFontFamily={formulaFontFamily}
          formulaFontSize={formulaFontSize}
          onFormulaFontFamilyChange={onFormulaFontFamilyChange}
        />

        <div className="algs-page-settings-row">
          <span className="algs-page-settings-label">
            {intl.formatMessage({ id: 'algs.detail.formulaFontSize' })}: {formulaFontSize}
          </span>
          <Slider
            min={8}
            max={32}
            value={formulaFontSize}
            onChange={(v) => {
              const n = typeof v === 'number' ? v : v[0];
              onFormulaFontSizeChange(n);
            }}
          />
        </div>

        <div className="algs-page-settings-row">
          <span className="algs-page-settings-label">
            {intl.formatMessage({ id: 'algs.detail.columnsPerRow' })}: {columnsPerRow}
          </span>
          <Slider
            min={1}
            max={8}
            value={columnsPerRow}
            onChange={(v) => {
              const n = typeof v === 'number' ? v : v[0];
              onColumnsPerRowChange(n);
            }}
          />
        </div>

        {showHideAltFormulas && (
          <div className="algs-page-settings-switch">
            <span className="algs-page-settings-label">
              {intl.formatMessage({ id: 'algs.detail.hideAltFormulas' })}
            </span>
            <Switch
              checked={hideAltFormulas}
              onChange={onHideAltFormulasChange}
            />
          </div>
        )}

        {showVisualCubeSwitch && (
          <div className="algs-page-settings-switch">
            <span className="algs-page-settings-label">
              {intl.formatMessage({ id: 'algs.detail.useVisualCube' })}
            </span>
            <Switch checked={useVisualCube} onChange={onUseVisualCubeChange} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default AlgsPageSettingsPanel;
