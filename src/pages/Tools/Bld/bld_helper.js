// "use strict";

const bldhelper = (function() {
  let cornerCh = " JKLGHIABCDEFXYZWMNRSTOPQ",
    edgeCh = " GHABCDEFOPKLQRSTYZIJWXMN";

  const arra = [[0], [0], [0], [0], [0], [0], [0]];
  const arrc = [[0], [0], [0], [0], [0], [0], [0]];
  function transformation1(transa, transb, transc, transd) {
    arrc[transa][transb] = arra[transa][transb];
    arra[transa][transb] = arrc[transc][transd];
  }

  function transformation2(transa, transb, transc, transd) {
    arrc[transa][transb] = arra[transa][transb];
    arra[transa][transb] = arra[transc][transd];
  }

  function movef() {
    for (let i = 1; i <= 9; i++) {
      arrc[5][i] = arra[5][i];
    }
    arra[5][1] = arra[5][7];
    arra[5][7] = arra[5][9];
    arra[5][9] = arra[5][3];
    arra[5][3] = arrc[5][1];
    arra[5][2] = arra[5][4];
    arra[5][4] = arra[5][8];
    arra[5][8] = arra[5][6];
    arra[5][6] = arrc[5][2];
    for (let i = 1; i <= 3; i++) {
      transformation2(3, 3 * i, 2, i);
    }
    for (let i = 1; i <= 3; i++) {
      transformation2(2, i, 4, 10 - 3 * i);
    }
    for (let i = 1; i <= 3; i++) {
      transformation2(4, 3 * i - 2, 1, 6 + i);
    }
    for (let i = 1; i <= 3; i++) {
      transformation1(1, 6 + i, 3, 12 - 3 * i);
    }
  }

  function movex() {
    for (let i = 1; i <= 9; i++) {
      arrc[3][i] = arra[3][i];
      arrc[4][i] = arra[4][i];
    }
    arra[3][1] = arra[3][3];
    arra[3][3] = arra[3][9];
    arra[3][9] = arra[3][7];
    arra[3][7] = arrc[3][1];
    arra[3][2] = arra[3][6];
    arra[3][6] = arra[3][8];
    arra[3][8] = arra[3][4];
    arra[3][4] = arrc[3][2];
    arra[4][1] = arra[4][7];
    arra[4][7] = arra[4][9];
    arra[4][9] = arra[4][3];
    arra[4][3] = arrc[4][1];
    arra[4][2] = arra[4][4];
    arra[4][4] = arra[4][8];
    arra[4][8] = arra[4][6];
    arra[4][6] = arrc[4][2];
    for (let i = 1; i <= 9; i++) {
      transformation2(6, i, 1, 10 - i);
    }
    for (let i = 1; i <= 9; i++) {
      transformation1(2, i, 6, 10 - i);
    }
    for (let i = 1; i <= 9; i++) {
      transformation1(5, i, 2, i);
    }
    for (let i = 1; i <= 9; i++) {
      transformation1(1, i, 5, i);
    }
  }

  function movey() {
    for (let i = 1; i <= 9; i++) {
      arrc[1][i] = arra[1][i];
      arrc[2][i] = arra[2][i];
    }
    arra[2][1] = arra[2][3];
    arra[2][3] = arra[2][9];
    arra[2][9] = arra[2][7];
    arra[2][7] = arrc[2][1];
    arra[2][2] = arra[2][6];
    arra[2][6] = arra[2][8];
    arra[2][8] = arra[2][4];
    arra[2][4] = arrc[2][2];
    arra[1][1] = arra[1][7];
    arra[1][7] = arra[1][9];
    arra[1][9] = arra[1][3];
    arra[1][3] = arrc[1][1];
    arra[1][2] = arra[1][4];
    arra[1][4] = arra[1][8];
    arra[1][8] = arra[1][6];
    arra[1][6] = arrc[1][2];
    for (let i = 1; i <= 9; i++) {
      transformation2(6, i, 3, i);
    }
    for (let i = 1; i <= 9; i++) {
      transformation2(3, i, 5, i);
    }
    for (let i = 1; i <= 9; i++) {
      transformation2(5, i, 4, i);
    }
    for (let i = 1; i <= 9; i++) {
      arra[4][i] = arrc[6][i];
    }
  }

  function initialize() {
    arra[1][1] = "D";
    arra[1][2] = "E";
    arra[1][3] = "G";
    arra[1][4] = "C";
    arra[1][5] = "U";
    arra[1][6] = "G";
    arra[1][7] = "A";
    arra[1][8] = "A";
    arra[1][9] = "J";
    arra[2][1] = "W";
    arra[2][2] = "I";
    arra[2][3] = "X";
    arra[2][4] = "K";
    arra[2][5] = "D";
    arra[2][6] = "O";
    arra[2][7] = "O";
    arra[2][8] = "M";
    arra[2][9] = "R";
    arra[3][1] = "E";
    arra[3][2] = "D";
    arra[3][3] = "C";
    arra[3][4] = "X";
    arra[3][5] = "L";
    arra[3][6] = "T";
    arra[3][7] = "Q";
    arra[3][8] = "L";
    arra[3][9] = "M";
    arra[4][1] = "K";
    arra[4][2] = "H";
    arra[4][3] = "I";
    arra[4][4] = "R";
    arra[4][5] = "R";
    arra[4][6] = "Z";
    arra[4][7] = "Z";
    arra[4][8] = "P";
    arra[4][9] = "S";
    arra[5][1] = "B";
    arra[5][2] = "B";
    arra[5][3] = "L";
    arra[5][4] = "S";
    arra[5][5] = "F";
    arra[5][6] = "Q";
    arra[5][7] = "N";
    arra[5][8] = "J";
    arra[5][9] = "Y";
    arra[6][1] = "H";
    arra[6][2] = "F";
    arra[6][3] = "F";
    arra[6][4] = "Y";
    arra[6][5] = "B";
    arra[6][6] = "W";
    arra[6][7] = "T";
    arra[6][8] = "N";
    arra[6][9] = "P";
  }

  function movez() {
    movex();
    movey();
    movex();
    movex();
    movex();
  }
  function movel() {
    movey();
    movey();
    movey();
    movef();
    movey();
  }
  function moveu() {
    movex();
    movex();
    movex();
    movef();
    movex();
  }
  function moveb() {
    movex();
    movex();
    movef();
    movex();
    movex();
  }
  function mover() {
    movey();
    movef();
    movey();
    movey();
    movey();
  }
  function moved() {
    movex();
    movef();
    movex();
    movex();
    movex();
  }
  function movedi() {
    moved();
    moved();
    moved();
  }
  function moveli() {
    movel();
    movel();
    movel();
  }
  function moveri() {
    mover();
    mover();
    mover();
  }
  function movefi() {
    movef();
    movef();
    movef();
  }
  function moveui() {
    moveu();
    moveu();
    moveu();
  }
  function movebi() {
    moveb();
    moveb();
    moveb();
  }
  function moved2() {
    moved();
    moved();
  }
  function movel2() {
    movel();
    movel();
  }
  function mover2() {
    mover();
    mover();
  }
  function movef2() {
    movef();
    movef();
  }
  function moveu2() {
    moveu();
    moveu();
  }
  function moveb2() {
    moveb();
    moveb();
  }
  function movexr() {
    movel();
    movex();
  }
  function movexf() {
    moveb();
    movez();
  }
  function movexu() {
    moved();
    movey();
  }
  function movexd() {
    moveu();
    movey();
    movey();
    movey();
  }
  function movexl() {
    mover();
    movex();
    movex();
    movex();
  }
  function movexb() {
    movef();
    movez();
    movez();
    movez();
  }
  function movex2() {
    movex();
    movex();
  }
  function movey2() {
    movey();
    movey();
  }
  function movez2() {
    movez();
    movez();
  }
  function movexi() {
    movex();
    movex();
    movex();
  }
  function moveyi() {
    movey();
    movey();
    movey();
  }
  function movezi() {
    movez();
    movez();
    movez();
  }
  function movem() {
    mover();
    moveli();
    movex();
    movex();
    movex();
  }
  function movem2() {
    mover2();
    movel2();
    movex2();
  }
  function movemi() {
    movex();
    movel();
    mover();
    mover();
    mover();
  }
  function moves() {
    movef();
    movef();
    movef();
    moveb();
    movez();
  }
  function moves2() {
    movef2();
    moveb2();
    movez2();
  }
  function movesi() {
    movez();
    movez();
    movez();
    moveb();
    moveb();
    moveb();
    movef();
  }
  function movee() {
    moveu();
    moved();
    moved();
    moved();
    movey();
    movey();
    movey();
  }
  function movee2() {
    moveu2();
    moved2();
    movey2();
  }
  function moveei() {
    movey();
    moved();
    moveu();
    moveu();
    moveu();
  }
  function movexr2() {
    movexr();
    movexr();
  }
  function movexf2() {
    movexf();
    movexf();
  }
  function movexu2() {
    movexu();
    movexu();
  }
  function movexd2() {
    movexd();
    movexd();
  }
  function movexl2() {
    movexl();
    movexl();
  }
  function movexb2() {
    movexb();
    movexb();
  }
  function movexri() {
    movexr();
    movexr();
    movexr();
  }
  function movexfi() {
    movexf();
    movexf();
    movexf();
  }
  function movexui() {
    movexu();
    movexu();
    movexu();
  }
  function movexdi() {
    movexd();
    movexd();
    movexd();
  }
  function movexli() {
    movexl();
    movexl();
    movexl();
  }
  function movexbi() {
    movexb();
    movexb();
    movexb();
  }

  function operate(operateChar) {
    switch (operateChar) {
      case "R":
        mover();
        break;
      case "L":
        movel();
        break;
      case "F":
        movef();
        break;
      case "B":
        moveb();
        break;
      case "U":
        moveu();
        break;
      case "D":
        moved();
        break;
      case "R2":
        mover2();
        break;
      case "L2":
        movel2();
        break;
      case "F2":
        movef2();
        break;
      case "B2":
        moveb2();
        break;
      case "U2":
        moveu2();
        break;
      case "D2":
        moved2();
        break;
      case "R'":
        moveri();
        break;
      case "L'":
        moveli();
        break;
      case "F'":
        movefi();
        break;
      case "B'":
        movebi();
        break;
      case "U'":
        moveui();
        break;
      case "D'":
        movedi();
        break;
      case "x":
        movex();
        break;
      case "x2":
        movex2();
        break;
      case "x'":
        movexi();
        break;
      case "y":
        movey();
        break;
      case "y2":
        movey2();
        break;
      case "y'":
        moveyi();
        break;
      case "z":
        movez();
        break;
      case "z2":
        movez2();
        break;
      case "z'":
        movezi();
        break;
      case "r":
        movexr();
        break;
      case "r2":
        movexr2();
        break;
      case "r'":
        movexri();
        break;
      case "f":
        movexf();
        break;
      case "f2":
        movexf2();
        break;
      case "f'":
        movexfi();
        break;
      case "u":
        movexu();
        break;
      case "u2":
        movexu2();
        break;
      case "u'":
        movexui();
        break;
      case "d":
        movexd();
        break;
      case "d2":
        movexd2();
        break;
      case "d'":
        movexdi();
        break;
      case "l":
        movexl();
        break;
      case "l2":
        movexl2();
        break;
      case "l'":
        movexli();
        break;
      case "b":
        movexb();
        break;
      case "b2":
        movexb2();
        break;
      case "b'":
        movexbi();
        break;
      case "S":
        moves();
        break;
      case "S2":
        moves2();
        break;
      case "S'":
        movesi();
        break;
      case "M":
        movem();
        break;
      case "M2":
        movem2();
        break;
      case "M'":
        movemi();
        break;
      case "E":
        movee();
        break;
      case "E2":
        movee2();
        break;
      case "E'":
        moveei();
        break;
      case "Rw":
        movexr();
        break;
      case "Rw2":
        movexr2();
        break;
      case "Rw'":
        movexri();
        break;
      case "Fw":
        movexf();
        break;
      case "Fw2":
        movexf2();
        break;
      case "Fw'":
        movexfi();
        break;
      case "Uw":
        movexu();
        break;
      case "Uw2":
        movexu2();
        break;
      case "Uw'":
        movexui();
        break;
      case "Dw":
        movexd();
        break;
      case "Dw2":
        movexd2();
        break;
      case "Dw'":
        movexdi();
        break;
      case "Lw":
        movexl();
        break;
      case "Lw2":
        movexl2();
        break;
      case "Lw'":
        movexli();
        break;
      case "Bw":
        movexb();
        break;
      case "Bw2":
        movexb2();
        break;
      case "Bw'":
        movexbi();
        break;
      default:
        break;
    }
  }

  function operatealg(s1) {
    initialize();
    const arr = s1.split(" ");
    for (let i = 0; i < arr.length; i++) {
      operate(arr[i]);
    }
  }

  function trackedge(s2) {
    switch (s2) {
      case "A": return arra[1][8];
      case "B": return arra[5][2];
      case "C": return arra[1][4];
      case "D": return arra[3][2];
      case "E": return arra[1][2];
      case "F": return arra[6][2];
      case "G": return arra[1][6];
      case "H": return arra[4][2];
      case "I": return arra[2][2];
      case "J": return arra[5][8];
      case "K": return arra[2][4];
      case "L": return arra[3][8];
      case "M": return arra[2][8];
      case "N": return arra[6][8];
      case "O": return arra[2][6];
      case "P": return arra[4][8];
      case "Q": return arra[5][6];
      case "R": return arra[4][4];
      case "S": return arra[5][4];
      case "T": return arra[3][6];
      case "W": return arra[6][6];
      case "X": return arra[3][4];
      case "Y": return arra[6][4];
      case "Z": return arra[4][6];
      default: return 0;
    }
  }

  function trackcorner(s1) {
    switch (s1) {
      case "A": return arra[1][7];
      case "B": return arra[5][1];
      case "C": return arra[3][3];
      case "D": return arra[1][1];
      case "E": return arra[3][1];
      case "F": return arra[6][3];
      case "G": return arra[1][3];
      case "H": return arra[6][1];
      case "I": return arra[4][3];
      case "J": return arra[1][9];
      case "K": return arra[4][1];
      case "L": return arra[5][3];
      case "W": return arra[2][1];
      case "M": return arra[3][9];
      case "N": return arra[5][7];
      case "O": return arra[2][7];
      case "P": return arra[6][9];
      case "Q": return arra[3][7];
      case "R": return arra[2][9];
      case "S": return arra[4][9];
      case "T": return arra[6][7];
      case "X": return arra[2][3];
      case "Y": return arra[5][9];
      case "Z": return arra[4][7];
      default: return 0;
    }
  }


  function cornerfull(s1) {
    let cornerfullChar = "";
    operatealg(s1);
    for (let i = 1; i <= 24; i = i + 3) {
      if (cornerfullChar.indexOf(cornerCh[i]) === -1 && cornerfullChar.indexOf(cornerCh[i + 1]) === -1 && cornerfullChar.indexOf(cornerCh[i + 2]) === -1) {
        let cornerpartChar = cornerCh[i];
        while (trackcorner(cornerpartChar[cornerpartChar.length - 1]) !== cornerpartChar[0]) {
          cornerpartChar = cornerpartChar + trackcorner(cornerpartChar[cornerpartChar.length - 1]);
        }
        if (cornerpartChar !== cornerCh[i]) {
          cornerfullChar = cornerfullChar + cornerpartChar + cornerCh[i];
        }
      }
    }
    return cornerfullChar;
  }

  function edgefull(s1) {
    let edgefullChar = "";
    operatealg(s1);
    for (let i = 1; i <= 24; i = i + 2) {
      if (edgefullChar.indexOf(edgeCh[i]) === -1 && edgefullChar.indexOf(edgeCh[i + 1]) === -1) {
        let edgepartChar = edgeCh[i];
        while (trackedge(edgepartChar[edgepartChar.length - 1]) !== edgepartChar[0]) {
          edgepartChar = edgepartChar + trackedge(edgepartChar[edgepartChar.length - 1]);
        }
        if (edgepartChar !== edgeCh[i]) {
          edgefullChar = edgefullChar + edgepartChar + edgeCh[i];
        }
      }
    }
    return edgefullChar;
  }

  function nearedge(s1) {
    const edgeChtemp = " GHABCDEFOPKLQRSTYZIJWXMN";
    if (edgeChtemp.indexOf(s1) % 2 === 1) {
      return edgeChtemp[edgeChtemp.indexOf(s1) + 1];
    }
    return edgeChtemp[edgeChtemp.indexOf(s1) - 1];
  }

  function edgeread(s1) {
    operatealg(s1);
    let cycleedge = 0;
    let edgereadChar = "";
    let edgereadpartChar = "";
    for (let i = 1; i <= 24; i = i + 2) {
      if (edgereadChar.indexOf(edgeCh[i]) === -1 && edgereadChar.indexOf(edgeCh[i + 1]) === -1) {
        edgereadpartChar = edgeCh[i];
        while (trackedge(edgereadpartChar[edgereadpartChar.length - 1]) !== edgereadpartChar[0] && nearedge(trackedge(edgereadpartChar[edgereadpartChar.length - 1])) !== edgereadpartChar[0]) {
          edgereadpartChar = edgereadpartChar + trackedge(edgereadpartChar[edgereadpartChar.length - 1]);
        }
        if (edgereadpartChar !== edgeCh[i]) {
          edgereadpartChar = edgereadpartChar + trackedge(edgereadpartChar[edgereadpartChar.length - 1]);
          edgereadChar = edgereadChar + edgereadpartChar;
          if (edgeCh[i] !== edgeCh[1] && edgeCh[i] !== edgeCh[2]) {
            cycleedge = cycleedge + 1;
          }
        }
      }
    }
    edgereadChar = edgereadChar.replace(new RegExp(edgeCh[1], "gmu"), "");
    edgereadChar = edgereadChar.replace(new RegExp(edgeCh[2], "gmu"), "");
    let edgereadOut = "";
    for (let i = 1; i <= edgereadChar.length; i = i + 2) {
      if (typeof edgereadChar[i] === "undefined") {
        edgereadOut = `${`${edgereadOut + edgereadChar[i - 1]} `} `;
      } else {
        edgereadOut = `${edgereadOut + edgereadChar[i - 1] + edgereadChar[i]} `;
      }
    }
    edgereadOut = edgereadOut.slice(0, edgereadOut.length - 1);
    return edgereadOut;
  }

  function edgeorientation(s1) {
    operatealg(s1);
    let edgeorientationOut = "";
    for (let i = 3; i <= 24; i = i + 2) {
      if (trackedge(edgeCh[i]) === edgeCh[i + 1]) {
        edgeorientationOut = `${edgeorientationOut + edgeCh[i + 1] + edgeCh[i]} `;
      }
    }
    edgeorientationOut = edgeorientationOut.slice(0, edgeorientationOut.length - 1);
    return edgeorientationOut;
  }

  function printout() {
    for (let i = 1; i <= 6; i++) {
      for (let j = 1; j <= 9; j++) {
        console.log(arra[i][j]);
      }
    }
  }

  function nearcorner(s1) {
    const cornerChtemp = " JKLGHIABCDEFXYZWMNRSTOPQ";
    if (cornerChtemp.indexOf(s1) % 3 === 0) {
      return cornerChtemp[cornerChtemp.indexOf(s1) - 2];
    }
    return cornerChtemp[cornerChtemp.indexOf(s1) + 1];
  }

  function cornerread(s1) {
    operatealg(s1);
    let cyclecorner = 0;
    let cornerreadChar = "";
    let cornerreadpartChar = "";
    for (let i = 1; i <= 24; i = i + 3) {
      if (cornerreadChar.indexOf(cornerCh[i]) === -1 && cornerreadChar.indexOf(cornerCh[i + 1]) === -1 && cornerreadChar.indexOf(cornerCh[i + 2]) === -1) {
        cornerreadpartChar = cornerCh[i];
        while (trackcorner(cornerreadpartChar[cornerreadpartChar.length - 1]) !== cornerreadpartChar[0] && nearcorner(trackcorner(cornerreadpartChar[cornerreadpartChar.length - 1])) !== cornerreadpartChar[0] && trackcorner(cornerreadpartChar[cornerreadpartChar.length - 1]) !== nearcorner(cornerreadpartChar[0])) {
          cornerreadpartChar = cornerreadpartChar + trackcorner(cornerreadpartChar[cornerreadpartChar.length - 1]);
        }
        if (cornerreadpartChar !== cornerCh[i]) {
          cornerreadpartChar = cornerreadpartChar + trackcorner(cornerreadpartChar[cornerreadpartChar.length - 1]);
          cornerreadChar = cornerreadChar + cornerreadpartChar;
          if (cornerCh[i] !== cornerCh[1] && cornerCh[i] !== cornerCh[2] && cornerCh[i] !== cornerCh[3]) {
            cyclecorner = cyclecorner + 1;
          }
        }
      }
    }
    cornerreadChar = cornerreadChar.replace(new RegExp(cornerCh[1], "gmu"), "");
    cornerreadChar = cornerreadChar.replace(new RegExp(cornerCh[2], "gmu"), "");
    cornerreadChar = cornerreadChar.replace(new RegExp(cornerCh[3], "gmu"), "");
    let cornerreadOut = "";
    for (let i = 1; i <= cornerreadChar.length; i = i + 2) {
      if (typeof cornerreadChar[i] === "undefined") {
        cornerreadOut = `${`${cornerreadOut + cornerreadChar[i - 1]} `} `;
      } else {
        cornerreadOut = `${cornerreadOut + cornerreadChar[i - 1] + cornerreadChar[i]} `;
      }
    }
    cornerreadOut = cornerreadOut.slice(0, cornerreadOut.length - 1);
    return cornerreadOut;
  }

  function cornerorientation(s1) {
    operatealg(s1);
    let cornerorientationOut = "";
    for (let i = 4; i <= 24; i = i + 3) {
      if (trackcorner(cornerCh[i]) === cornerCh[i + 1]) {
        cornerorientationOut = `${cornerorientationOut + cornerCh[i + 2] + cornerCh[i]} `;
      }
      if (trackcorner(cornerCh[i]) === cornerCh[i + 2]) {
        cornerorientationOut = `${cornerorientationOut + cornerCh[i + 1] + cornerCh[i]} `;
      }
    }
    cornerorientationOut = cornerorientationOut.slice(0, cornerorientationOut.length - 1);
    return cornerorientationOut;
  }

  function centerread(s1) {
    operatealg(s1);
    if (arra[1][5] === "U" && arra[5][5] === "F") {
      return "";
    }
    if (arra[1][5] === "U" && arra[5][5] === "R") {
      return "y'";
    }
    if (arra[1][5] === "U" && arra[5][5] === "B") {
      return "y2";
    }
    if (arra[1][5] === "U" && arra[5][5] === "L") {
      return "y";
    }

    if (arra[1][5] === "D" && arra[5][5] === "B") {
      return "x2";
    }
    if (arra[1][5] === "D" && arra[5][5] === "F") {
      return "z2";
    }
    if (arra[1][5] === "D" && arra[5][5] === "R") {
      return "z2 y'";
    }
    if (arra[1][5] === "D" && arra[5][5] === "L") {
      return "z2 y";
    }

    if (arra[1][5] === "F" && arra[5][5] === "U") {
      return "z2 x";
    }
    if (arra[1][5] === "F" && arra[5][5] === "D") {
      return "x'";
    }
    if (arra[1][5] === "F" && arra[5][5] === "L") {
      return "z y";
    }
    if (arra[1][5] === "F" && arra[5][5] === "R") {
      return "z' y'";
    }

    if (arra[1][5] === "B" && arra[5][5] === "U") {
      return "x";
    }
    if (arra[1][5] === "B" && arra[5][5] === "D") {
      return "z2 x'";
    }
    if (arra[1][5] === "B" && arra[5][5] === "L") {
      return "z' y";
    }
    if (arra[1][5] === "B" && arra[5][5] === "R") {
      return "z y'";
    }

    if (arra[1][5] === "L" && arra[5][5] === "U") {
      return "z' x";
    }
    if (arra[1][5] === "L" && arra[5][5] === "D") {
      return "z' x'";
    }
    if (arra[1][5] === "L" && arra[5][5] === "F") {
      return "z'";
    }
    if (arra[1][5] === "L" && arra[5][5] === "B") {
      return "z y2";
    }

    if (arra[1][5] === "R" && arra[5][5] === "U") {
      return "z x";
    }
    if (arra[1][5] === "R" && arra[5][5] === "D") {
      return "z x'";
    }
    if (arra[1][5] === "R" && arra[5][5] === "F") {
      return "z";
    }
    if (arra[1][5] === "R" && arra[5][5] === "B") {
      return "z' y2";
    }
    return "";
  }

  function analyseWithConfig(
    alg,
    cornerBuffer, // 角块缓冲
    cornerOrder, // 角块读取顺序
    edgeBuffer, // 棱快缓冲
    edgeOrder, // 棱快读取顺序
    // cornerAlgToPos, // 角块映射
    // edgeAlgToPos, // 棱快映射
  ){
    cornerCh = ` ${cornerBuffer}${nearcorner(cornerBuffer)}${nearcorner(nearcorner(cornerBuffer))}`;
    for (let i = 0; i <= cornerOrder.length - 1; i++) {
      cornerCh = cornerCh + cornerOrder[i] + nearcorner(cornerOrder[i]) + nearcorner(nearcorner(cornerOrder[i]));
    }
    edgeCh = ` ${edgeBuffer}${nearedge(edgeBuffer)}`;
    for (let i = 0; i <= edgeOrder.length - 1; i++) {
      edgeCh = edgeCh + edgeOrder[i] + nearedge(edgeOrder[i]);
    }

    const centerreadOut = centerread(alg);
    const algNew = `${alg} ${centerreadOut}`;
    const edgereadOut = edgeread(algNew);
    const edgeorientationOut = edgeorientation(algNew);
    const cornerreadOut = cornerread(algNew);
    const cornerorientationOut = cornerorientation(algNew);
    return {
      edgereadOut: edgereadOut, // 棱块码
      edgeorientationOut: edgeorientationOut, // 棱翻
      cornerreadOut: cornerreadOut, // 角块码
      cornerorientationOut: cornerorientationOut, // 角翻
    }
  }

  return {
    initialize,
    printout,
    operate,
    operatealg,
    cornerfull,
    edgefull,
    edgeread,
    edgeorientation,
    cornerread,
    cornerorientation,

    // 自己改的, 其他都是兴神的代码
    analyseWithConfig,
  };
})();

//
// //
// if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
//   module.exports = bldhelper;
// }
// //
// // document.getElementById("read").addEventListener("click", bldhelper.analyse);
// export default function AnalyseAlg(
//   alg,
//   cornerBuffer, // 角块缓冲
//   cornerOrder, // 角块读取顺序
//   edgeBuffer, // 棱快缓冲
//   edgeOrder, // 棱快读取顺序
// ) {
//   return bldhelper.analyseWithConfig(alg, cornerBuffer, edgeBuffer, edgeOrder, edgeOrder);
// }
