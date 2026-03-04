import React from 'react';
import styles from './toTop.less';
import { BsCaretUp } from "react-icons/bs";

const ScrollToTopButton: React.FC = () => {
  const backToTopHandle = () => {
    document.documentElement.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    document.body.scrollTo?.({ left: 0, top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.backToTop} onClick={backToTopHandle}>
      <BsCaretUp />
    </div>
  );
};

export default ScrollToTopButton;
