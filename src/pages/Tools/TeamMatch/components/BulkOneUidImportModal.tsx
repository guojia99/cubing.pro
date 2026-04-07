import { parseBulkOneUidText, syncOneIdFromPaste } from '@/pages/Tools/TeamMatch/bulkOneUidImport';
import type { TeamMatchStoreAction } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { Button, Input, Modal, Space, Typography, message } from 'antd';
import React, { useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
  disabled?: boolean;
};

const EXAMPLE = `1\t薛泽韩\t2546
2\t陈诚骏\t7735
3\t蔡镇宇\t10954`;

const BulkOneUidImportModal: React.FC<Props> = ({ session, dispatch, disabled }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const apply = () => {
    const parsed = parseBulkOneUidText(text);
    if (parsed.length === 0) {
      message.warning('未解析到有效行。每行：序号 Tab 姓名 Tab One 数字 uid，或 姓名 Tab uid');
      return;
    }
    if (session.players.length === 0) {
      message.warning('请先在上方添加选手，仅能为已有选手同步 One ID');
      return;
    }

    const outcome = syncOneIdFromPaste(parsed, session.players);
    if (!outcome.ok) {
      Modal.error({
        title: 'One ID 冲突',
        content: (
          <Typography.Paragraph>
            按文档更新后，以下 One ID 会重复出现在多名选手上，已取消整批写入，请核对文档或手动编辑。
            <br />
            重复 uid：{outcome.duplicateOneIds.join('、')}
          </Typography.Paragraph>
        ),
      });
      return;
    }

    const r = outcome.data;
    const { applied, unmatched, batchDuplicateNameSkipped, unchanged } = r;

    const doCommit = () => {
      if (applied.length === 0) {
        message.info('没有需要更新的 One ID（姓名未匹配或已与文档一致）');
        setText('');
        setOpen(false);
        return;
      }
      dispatch({ type: 'UPSERT_PLAYERS', players: r.nextPlayers });
      const parts: string[] = [`已更新 ${applied.length} 人的 One ID`];
      if (unmatched.length > 0) parts.push(`文档中 ${unmatched.length} 行姓名不在当前名单，已忽略`);
      if (batchDuplicateNameSkipped.length > 0) {
        parts.push(`粘贴内重名 ${batchDuplicateNameSkipped.length} 行仅取首次`);
      }
      if (unchanged.length > 0) parts.push(`${unchanged.length} 人无需变更`);
      message.success(parts.join('；'));
      setText('');
      setOpen(false);
    };

    const needConfirm = unmatched.length > 0 || batchDuplicateNameSkipped.length > 0;
    if (needConfirm && applied.length > 0) {
      Modal.confirm({
        title: '确认同步 One ID',
        width: 640,
        content: (
          <div>
            <Typography.Paragraph>
              将为 <strong>{applied.length}</strong> 名已有选手写入文档中的 One ID。
            </Typography.Paragraph>
            {unmatched.length > 0 && (
              <>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  以下姓名在文档中但<strong>不在当前选手名单</strong>，不会新增选手，已忽略：
                </Typography.Paragraph>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {unmatched.map((x) => x.name).join('、')}
                </Typography.Text>
              </>
            )}
            {batchDuplicateNameSkipped.length > 0 && (
              <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                粘贴中重复姓名 {batchDuplicateNameSkipped.length} 行，已按首次出现处理。
              </Typography.Paragraph>
            )}
          </div>
        ),
        okText: '确认写入',
        onOk: doCommit,
      });
      return;
    }

    doCommit();
  };

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        同步 One ID
      </Button>
      <Modal
        title="同步 One ID"
        open={open}
        onCancel={() => setOpen(false)}
        width={720}
        footer={null}
        destroyOnClose
        styles={{ body: { paddingTop: 12 } }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          从 Excel 粘贴<strong>序号 Tab 姓名 Tab uid</strong>或<strong>姓名 Tab uid</strong>。仅按<strong>姓名</strong>与
          <strong>当前已有选手</strong>匹配并更新其 One 数字 ID；文档里多出的姓名不会新增选手。若与某选手已有 One ID 相同则跳过该行。
        </Typography.Paragraph>
        <Input.TextArea
          rows={18}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space style={{ marginTop: 16 }} wrap>
          <Button type="primary" onClick={apply}>
            解析并同步
          </Button>
          <Button onClick={() => setText(EXAMPLE)}>填入示例</Button>
          <Button type="link" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default BulkOneUidImportModal;
