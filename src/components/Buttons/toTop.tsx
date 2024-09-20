import React, { useEffect, useState } from 'react';
import styles from './toTop.less';
import { BsCaretUp } from "react-icons/bs";

export const throttle = (fn: any, time: number): ((...args: any) => void) => {
  let timer: NodeJS.Timeout | null = null;
  return (...args) => {
    if (!timer) {
      fn.apply(this, args);
      timer = setTimeout(() => {
        timer = null;
      }, time);
    }
  };
};

function getScrollTop() {
  let scrollTop = 0,
    bodyScrollTop = 0,
    documentScrollTop = 0;
  if (document.body) bodyScrollTop = document.body.scrollTop;
  if (document.documentElement) documentScrollTop = document.documentElement.scrollTop;
  scrollTop = bodyScrollTop - documentScrollTop > 0 ? bodyScrollTop : documentScrollTop;
  return scrollTop;
}

function getWindowHeight() {
  let windowHeight = 0;
  if (document.compatMode === 'CSS1Compat') windowHeight = document.documentElement.clientHeight;
  else windowHeight = document.body.clientHeight;
  return windowHeight;
}

function getScrollHeight() {
  return document.documentElement.scrollHeight;
}

function getScrollProgress() {
  const scrollTop = getScrollTop();
  const scrollHeight = getScrollHeight();
  const windowHeight = getWindowHeight();
  const progress = (scrollTop / (scrollHeight - windowHeight)) * 100;
  return Math.min(100, Math.max(0, progress)); // 确保值在 0 到 100 之间
}

const ScrollToTopButton: React.FC = () => {
  const [visibleBackTopBtn, setVisibleBackTopBtn] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 保存滚动进度

  const handleScroll = throttle(() => {
    setVisibleBackTopBtn(getScrollTop() > getWindowHeight());
    setScrollProgress(getScrollProgress()); // 更新滚动进度
  }, 200);

  useEffect(() => {
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll);
  }, []);

  const backToTopHandle = () => {
    document.documentElement.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {visibleBackTopBtn && (
        <div id={styles.backToTop} onClick={backToTopHandle}>
          <BsCaretUp />
          <span>{scrollProgress.toFixed(0)}%</span>
        </div>
      )}
    </>
  );
};

export default ScrollToTopButton;
