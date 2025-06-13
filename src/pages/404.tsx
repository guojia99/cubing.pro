import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';
import { FormattedMessage } from '@@/exports';

const NoFoundPage: React.FC = () => (
  <Result
    status="404"
    title="404"
    subTitle={<FormattedMessage id="home.status.404" />}
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        <FormattedMessage id="home.status.back_home" />
      </Button>
    }
  />
);

export default NoFoundPage;

/*

RA: R D' R':[U',R' D R]   // R D' R' U' R' D R U R' D' R2 D R'
RD: R D' R':[U2,R' D R]   // R D' R' U2 R' D R U2 R' D' R2 D R'
A:
B:
C:       J  M  KP  RS  X
D:
E:          M   P
F:     G     N KPQ RST  Y
G:       F
H:         W   KPQ RST XYZ
J:   C     W N K Q RST
W:     D    HJ
M:   C  E   HJ
N:      EF  HJ
K:   C   F G J
P:  BC  EF  HJ
Q: ABC DEF GHJ
R: ABC DEF GHJ
S: ABC DEF GHJ
T: ABC DEF GHJ
X: ABC DEF GHJ
Y: ABC DEF GHJ
Z: ABC DEF GHJ








CE	R' F R:[S',R U' R']
CF	U:[S',R U' R']
CG	R2 U R U R' ....
CH	[S,R' F R]
DE	U' M U:[M',U2]
DF	U': [S,R' F R]
DG	[r U' r',S']
DH	M U:[M',U2]
EG	R2 U':[S,R2]
EH	U M U:[M',U2]
FG	R':[U' R U,M]
FH	R:[M',U R' U']



* */
