
import menu from './en-US/menu';
import draws from "@/locales/en-US/draws";
import home from "@/locales/en-US/home";
import layout from "@/locales/en-US/layout";
import algs from "@/locales/en-US/algs";
import wca from "@/locales/en-US/wca";

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  ...menu,
  ...draws,
  ...home,
  ...layout,
  ...algs,
  ...wca
};
