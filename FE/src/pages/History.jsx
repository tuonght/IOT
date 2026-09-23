import { useState, useMemo } from "react";
import { mockHistory } from "../mockData";

export default function History() {
  const pageSize = 10;
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

      // Tìm kiếm theo chuỗi thời gian (string includes)
      const matchTime = activeFilters.time
        ? row.time.toLowerCase().includes(activeFilters.time)
        : true;

      return matchDevice && matchAction && matchStatus && matchTime;
    });
  }, [activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const visibleHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
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

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
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
                <td colSpan={6} style={{ textAlign: "center", padding: "16px" }}>
                  Không tìm thấy kết quả nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div>
          Hiển thị {filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -{Math.min(currentPage * pageSize, filteredHistory.length)} trong tổng {filteredHistory.length} kết quả
        </div>
        <div className="pg-btns">
          <button
            type="button"
            className="pg-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              type="button"
              className={`pg-btn ${currentPage === page ? "active" : ""}`}
              key={page}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
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