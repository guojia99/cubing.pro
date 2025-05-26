import {getIntl} from "@@/exports";



export function ExtAppList() {
  const intl = getIntl();
  return [
    {
      title: intl.formatMessage({ id: 'layout.cstimerTitle' }),
      desc: intl.formatMessage({ id: 'layout.cstimerDesc' }),
      url: "https://cstimer.net/",
      icon: "https://cstimer.net/favicon.ico",
    },
    {
      title: intl.formatMessage({ id: 'layout.blddbTitle' }),
      desc: intl.formatMessage({ id: 'layout.blddbDesc' }),
      url: "https://v2.blddb.net/",
      icon: "https://v2.blddb.net/images/logo/logo-2.svg",
    },
    {
      title: intl.formatMessage({ id: 'layout.speedcubedbTitle' }),
      desc: intl.formatMessage({ id: 'layout.speedcubedbDesc' }),
      url: "https://speedcubedb.com/",
      icon: "https://speedcubedb.com/favicon.png",
    },
    {
      title: intl.formatMessage({ id: 'layout.bldtrainerTitle' }),
      desc: intl.formatMessage({ id: 'layout.bldtrainerDesc' }),
      url: "https://bld.cuber.pro/",
      icon: "https://bld.cuber.pro/images/logo.svg",
    },
    {
      title: intl.formatMessage({ id: 'layout.333fmTitle' }),
      desc: intl.formatMessage({ id: 'layout.333fmDesc' }),
      url: "https://333.fm/",
      icon: "https://333.fm/logo.svg",
    },
    {
      title: intl.formatMessage({ id: 'layout.reconzTitle' }),
      desc: intl.formatMessage({ id: 'layout.reconzDesc' }),
      url: "https://reco.nz/",
      icon: "https://reco.nz/favicon.ico",
    },
    {
      title: intl.formatMessage({ id: 'layout.algCubingTitle' }),
      desc: intl.formatMessage({ id: 'layout.algCubingDesc' }),
      url: "https://alg.cubing.net/",
      icon: "https://alg.cubing.net/favicon.ico",
    },
    {
      title: intl.formatMessage({ id: 'layout.twizzleTitle' }),
      desc: intl.formatMessage({ id: 'layout.twizzleDesc' }),
      url: "https://alpha.twizzle.net/explore/",
      icon: "https://alpha.twizzle.net/explore/favicon.ico",
    },
    {
      title: intl.formatMessage({ id: 'layout.visualcubeTitle' }),
      desc: intl.formatMessage({ id: 'layout.visualcubeDesc' }),
      url: "https://visualcubeplus.com/#",
      icon: "https://visualcubeplus.com/img/logo.png",
    }
  ];
}
