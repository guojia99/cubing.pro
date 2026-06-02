import React, { useEffect, useState } from 'react';
import { Alert, Select } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import {
  FORMULA_FONT_FAMILY_IDS,
  getFormulaFontDownloadUrl,
  getFormulaFontFamilyCSSValue,
  getFormulaFontPrimaryCheckName,
  isFormulaFontInstalled,
  type FormulaFontFamilyId,
} from '../utils/formulaFontFamily';

export interface FormulaFontFamilySettingsProps {
  formulaFontFamily: FormulaFontFamilyId;
  formulaFontSize: number;
  onFormulaFontFamilyChange: (id: FormulaFontFamilyId) => void;
}

const FormulaFontFamilySettings: React.FC<FormulaFontFamilySettingsProps> = ({
  formulaFontFamily,
  formulaFontSize,
  onFormulaFontFamilyChange,
}) => {
  const intl = useIntl();
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (!cancelled) {
        setInstalled(isFormulaFontInstalled(formulaFontFamily));
      }
    };
    check();
    void document.fonts?.ready.then(check);
    return () => {
      cancelled = true;
    };
  }, [formulaFontFamily]);

  const primaryName = getFormulaFontPrimaryCheckName(formulaFontFamily);
  const downloadUrl = getFormulaFontDownloadUrl(formulaFontFamily);
  const fontLabel = intl.formatMessage({ id: `algs.detail.formulaFontFamily.${formulaFontFamily}` });

  return (
    <div className="algs-page-settings-row algs-page-settings-font-family">
      <span className="algs-page-settings-label">
        {intl.formatMessage({ id: 'algs.detail.formulaFontFamily' })}
      </span>

      <div className="algs-page-settings-font-preview-wrap">
        <span className="algs-page-settings-font-preview-caption">
          {intl.formatMessage({ id: 'algs.detail.formulaFontFamily.previewLabel' })}
        </span>
        <div
          className="algs-page-settings-font-preview"
          style={{
            fontFamily: getFormulaFontFamilyCSSValue(formulaFontFamily),
            fontSize: formulaFontSize,
          }}
        >
          {intl.formatMessage({ id: 'algs.detail.formulaFontFamily.preview' })}
        </div>
      </div>

      <Select
        value={formulaFontFamily}
        onChange={onFormulaFontFamilyChange}
        listHeight={320}
        options={FORMULA_FONT_FAMILY_IDS.map((id) => ({
          value: id,
          label: (
            <span style={{ fontFamily: getFormulaFontFamilyCSSValue(id) }}>
              {intl.formatMessage({ id: `algs.detail.formulaFontFamily.${id}` })}
            </span>
          ),
        }))}
      />

      {!installed && primaryName && (
        <Alert
          type="warning"
          showIcon
          className="algs-page-settings-font-missing"
          message={intl.formatMessage(
            { id: 'algs.detail.formulaFontFamily.missing' },
            { font: fontLabel },
          )}
          description={
            <div className="algs-page-settings-font-missing-body">
              <p>{intl.formatMessage({ id: 'algs.detail.formulaFontFamily.downloadHint' })}</p>
              {downloadUrl ? (
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <DownloadOutlined />{' '}
                  {intl.formatMessage({ id: 'algs.detail.formulaFontFamily.downloadLink' })}
                </a>
              ) : (
                <p className="algs-page-settings-font-missing-name">
                  {intl.formatMessage(
                    { id: 'algs.detail.formulaFontFamily.installName' },
                    { name: primaryName },
                  )}
                </p>
              )}
            </div>
          }
        />
      )}
    </div>
  );
};

export default FormulaFontFamilySettings;
