import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Pagination.css";

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    const { t } = useTranslation();
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const [jumpToPageInput, setJumpToPageInput] = useState("");

    if (totalPages <= 1) {
        return null;
    }

    const handlePageClick = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const handleJumpToPage = () => {
        const page = parseInt(jumpToPageInput, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
            setJumpToPageInput("");
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            handleJumpToPage();
        }
    };

    const pageNumbers = [];
    const pageRange = 2;

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - pageRange && i <= currentPage + pageRange)
        ) {
            pageNumbers.push(i);
        } else if (
            i === currentPage - pageRange - 1 ||
            i === currentPage + pageRange + 1
        ) {
            pageNumbers.push("...");
        }
    }

    return (
        <div className="pagination-container">
            <button
                className="pagination-button"
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
                title={t("common.prev")}
            >
                &laquo;
            </button>

            {pageNumbers.map((num, index) =>
                num === "..." ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="pagination-ellipsis"
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={num}
                        className={`pagination-button ${
                            currentPage === num ? "active" : ""
                        }`}
                        onClick={() => handlePageClick(num)}
                    >
                        {num}
                    </button>
                )
            )}

            <button
                className="pagination-button"
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
                title={t("common.next")}
            >
                &raquo;
            </button>

            {totalPages > pageRange * 2 + 2 && (
                <div className="pagination-jump-container">
                    <input
                        type="number"
                        className="pagination-jump-input"
                        value={jumpToPageInput}
                        onChange={(e) => setJumpToPageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        min="1"
                        max={totalPages}
                        placeholder={t("common.page")}
                    />
                    <button
                        className="pagination-jump-button"
                        onClick={handleJumpToPage}
                    >
                        {t("common.go")}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pagination;
