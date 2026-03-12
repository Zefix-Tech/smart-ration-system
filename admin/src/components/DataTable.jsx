import { useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuSearch } from 'react-icons/lu';
import '../styles/datatable.css';

const DataTable = ({ columns, data, loading, total, page, pages, onPageChange, onSearch, searchPlaceholder = "Search..." }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearch) onSearch(searchTerm);
    };

    return (
        <div className="datatable-container">
            {onSearch && (
                <div className="datatable-header">
                    <form onSubmit={handleSearch} className="datatable-search-form">
                        <LuSearch className="datatable-search-icon" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="datatable-search-input"
                        />
                    </form>
                    <div className="datatable-total">Total: {total || 0} records</div>
                </div>
            )}

            <div className="datatable-table-wrapper">
                <table className="datatable-table">
                    <thead className="datatable-thead">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="datatable-th">{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="datatable-tbody">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="datatable-loading-row">
                                    <div className="datatable-spinner"></div>
                                </td>
                            </tr>
                        ) : data && data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="datatable-tr">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="datatable-td">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="datatable-empty-row">
                                    No records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="datatable-footer">
                    <p className="datatable-pagination-info">
                        Showing page <span>{page}</span> of <span>{pages}</span>
                    </p>
                    <div className="datatable-pagination-controls">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="datatable-page-btn"
                        >
                            <LuChevronLeft className="btn-icon-left" /> Prev
                        </button>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === pages}
                            className="datatable-page-btn"
                        >
                            Next <LuChevronRight className="btn-icon-right" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
