import React from 'react';
import './Pagination.css';

interface PaginationProps {
  Latest: React.ReactNode;
  Earliest: React.ReactNode;
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
