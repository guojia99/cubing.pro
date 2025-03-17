declare module "./bld_helper" {
  const AnalyseAlg: (
    alg: string,
    cornerBuffer: string,
    cornerOrder: string,
    edgeBuffer: string,
    edgeOrder: string
  ) => any;
  export default AnalyseAlg;
}
