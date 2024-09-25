import React from 'react';
import './Pagination.css'; // 引入 less 文件

interface PaginationProps {
  Latest: JSX.Element | null;
  Earliest: JSX.Element | null;
}

const Pagination: React.FC<PaginationProps> = ({ Latest, Earliest }) => {
  return (
    <div className={`pagination-container ${!Earliest || !Latest ? 'single' : ''}`}>
      {Earliest && (
        <div className="pagination-button earliest">
          {Earliest}
        </div>
      )}
      {Latest && (
        <div className="pagination-button latest">
          {Latest}
        </div>
      )}
    </div>
  );
};

export default Pagination;
