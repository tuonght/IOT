import { useState, useMemo } from "react";
import { mockHistory } from "../mockData";
import "./History.css";

export default function History() {
  const [pageSize, setPageSize] = useState(10);
  // Giá trị hiện tại người dùng chọn hoặc gõ trong các ô lọc.
  const [deviceFilter, setDeviceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [timeInput, setTimeInput] = useState("");

  
  const [activeFilters, setActiveFilters] = useState({
    device: "",
    action: "",
    status: "",
    time: "",
  });
  
  const [currentPage, setCurrentPage] = useState(1);

  
  function handleSearch() {
    setActiveFilters({
      device: deviceFilter,
      action: actionFilter,
      status: statusFilter,
      time: timeInput.trim().toLowerCase(),
    });
    setCurrentPage(1);
  }

  // Xóa toàn bộ lựa chọn/từ khóa và bỏ lọc.
  function handleReset() {
    setDeviceFilter("");
    setActionFilter("");
    setStatusFilter("");
    setTimeInput("");
    setActiveFilters({
      device: "",
      action: "",
      status: "",
      time: "",
    });
    setCurrentPage(1);
  }

  
  const filteredHistory = useMemo(() => {
    return mockHistory.filter((row) => {
      const matchDevice = activeFilters.device
        ? row.device.toLowerCase() === activeFilters.device.toLowerCase()
        : true;

      const matchAction = activeFilters.action
        ? row.action.toLowerCase() === activeFilters.action.toLowerCase()
        : true;

      const matchStatus = activeFilters.status
        ? row.status.toLowerCase() === activeFilters.status.toLowerCase()
        : true;

      
      const matchTime = activeFilters.time
        ? row.time.toLowerCase().includes(activeFilters.time)
        : true;

      return matchDevice && matchAction && matchStatus && matchTime;
    });
  }, [activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const pageNumbers =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : currentPage <= 3
        ? [1, 2, 3, 4, "...", totalPages]
        : currentPage >= totalPages - 2
          ? [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
          : [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  const visibleHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="history-page">
      {/* Form lọc  */}
      <div className="page-title">History</div>
      <div className="filters">
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
        >
          <option value="">Thiết Bị</option>
          <option value="Điều hòa">Điều hòa</option>
          <option value="Đèn">Đèn</option>
          <option value="Quạt">Quạt</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">Hành Động</option>
          <option value="ON">ON</option>
          <option value="OFF">OFF</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Loading">Loading</option>
        </select>

        <input
          type="text"
          placeholder="2026-08-19 10:30:00"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <button className="btn-sm" onClick={handleSearch}>
          Tìm Kiếm
        </button>
        <button className="btn-sm btn-ghost" onClick={handleReset}>
          Bỏ Tìm Kiếm
        </button>
      </div>

      
      <div className="panel history-table-panel">
        <div className="history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Thiết Bị</th>
                <th>Người Thực Hiện</th>
                <th>Hành Động</th>
                <th>Status</th>
                <th>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {/* kết quả thì */}
              {visibleHistory.length > 0 ? (
                visibleHistory.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.device}</td>
                    <td>{row.performedBy}</td>
                    <td>
                      <span className={"badge " + row.action.toLowerCase()}>
                        {row.action}
                      </span>
                    </td>
                    <td>
                      <span className={"badge " + row.status.toLowerCase()}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="history-empty" colSpan={6}>
                    Không tìm thấy kết quả nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bộ đếm kết quả và các nút phân trang. */}
      <div className="pagination">
        <div className="history-pagination-info">
          Hiển thị {filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -{Math.min(currentPage * pageSize, filteredHistory.length)} trong tổng {filteredHistory.length} kết quả
        </div>
        <div className="pg-btns">
          <label className="history-page-size">
            Dòng/trang
            <select
              aria-label="Số dòng mỗi trang"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 20, 30, 40, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="pg-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <span className="history-page-ellipsis" key={`ellipsis-${index}`}>
                …
              </span>
            ) : (
              <button
                type="button"
                className={`pg-btn ${currentPage === page ? "active" : ""}`}
                key={page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}
          <button
            type="button"
            className="pg-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}