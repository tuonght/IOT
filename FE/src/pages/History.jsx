import { useState, useEffect } from "react";
import { api } from "../api";
import CopyableTime from "../components/CopyableTime";
import { getPageNumbers } from "../utils/pagination";
import "./History.css";

export default function History() {
  const [historyRows, setHistoryRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [error, setError] = useState("");
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

  useEffect(() => {
    let mounted = true;

    async function refreshHistory() {
      try {
        const result = await api.history({
          device: activeFilters.device,
          action: activeFilters.action,
          status: activeFilters.status,
          time: activeFilters.time,
          page: currentPage - 1,
          size: pageSize,
        });
        if (mounted) {
          setHistoryRows(result.content || []);
          setTotalElements(result.totalElements || 0);
          setError("");
        }
      } catch (requestError) {
        if (mounted) setError(requestError.message);
      }
    }

    refreshHistory();
    const intervalId = window.setInterval(refreshHistory, 5000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [activeFilters, currentPage, pageSize]);

  useEffect(() => {
    let mounted = true;
    api.historyDevices()
      .then((devices) => {
        if (mounted) setAvailableDevices(devices || []);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message);
      });
    return () => { mounted = false; };
  }, []);

  function handleSearch() {
    setActiveFilters({
      device: deviceFilter,
      action: actionFilter,
      status: statusFilter,
      time: timeInput.replace(/\s+/g, " ").trim().toLowerCase(),
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

  
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const pageNumbers = getPageNumbers(totalPages, currentPage);

  return (
    <div className="history-page">
      {/* Form lọc  */}
      <div className="page-title">History</div>
      {error && <div className="error-text">{error}</div>}
      <div className="filters">
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
        >
          <option value="">Thiết Bị</option>
          {availableDevices.map((device) => (
            <option key={device} value={device}>{device}</option>
          ))}
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
          placeholder="Tìm kiếm theo thời gian VD: 2026-05-10 19:55:32"
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
              {historyRows.length > 0 ? (
                historyRows.map((row) => (
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
                    <td><CopyableTime value={row.time} /></td>
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
          Hiển thị {totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -{Math.min(currentPage * pageSize, totalElements)} trong tổng {totalElements} kết quả
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