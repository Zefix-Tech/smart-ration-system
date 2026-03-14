import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/datatable.css';

const DataTable = ({ columns, data, loading, total, page, pages, onPageChange, onSearch, searchPlaceholder = "Search..." }) => {
    return (
        <div className="datatable-container">
            <div className="datatable-header">
                <div className="datatable-search-wrapper">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                        className="datatable-search-input"
                    />
                </div>
                {total !== undefined && <div className="datatable-summary">Total: <b>{total}</b></div>}
            </div>

            <div className="datatable-wrapper">
                <table className="datatable-table">
                    <thead className="datatable-thead">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="datatable-tbody">
                        {loading ? (
                            <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>Loading...</td></tr>
                        ) : Array.isArray(data) && data.length > 0 ? (
                            data.map((row, i) => (
                                <tr key={i}>
                                    {columns.map((col, j) => (
                                        <td key={j}>{col.render ? col.render(row) : row[col.accessor]}</td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>No data available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="datatable-footer">
                    <div className="pagination-info">
                        Showing page <span>{page}</span> of <span>{pages}</span>
                    </div>
                    <div className="pagination-btns">
                        <button 
                            disabled={page === 1} 
                            onClick={() => onPageChange(page - 1)}
                            className="page-btn"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={page === pages} 
                            onClick={() => onPageChange(page + 1)}
                            className="page-btn"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
