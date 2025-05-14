import { NavTabs } from '@/components/Tabs/nav_tabs';
import { FormattedMessage } from '@@/exports';

const PyDraw = () => {
  const items = [
    {
      key: 'full_py',
      label: <FormattedMessage id="draws.expanded_view" />,
      children: <FormattedMessage id="development" />,
    },
    {
      key: 'full2_py',
      label: <FormattedMessage id="draws.top_view" />,
      children: <FormattedMessage id="development" />,
    },
    {
      key: 'full3_py',
      label: <FormattedMessage id="draws.front_view" />,
      children: <FormattedMessage id="development" />,
    },
  ];

  return (
    <>
      <NavTabs
        type="line"
        items={items}
        tabsKey="py_draw_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default PyDraw;
