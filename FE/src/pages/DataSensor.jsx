import { useState, useMemo } from "react";
import { mockSensorData } from "../mockData";

export default function DataSensor() {
  const pageSize = 10;
  const [sortType, setSortType] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [timeInput, setTimeInput] = useState("");

  // Lưu điều kiện khi bấm nút "Tìm Kiếm"
  const [activeFilters, setActiveFilters] = useState({
    type: "",
    order: "",
    time: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  function handleSearch() {
    setActiveFilters({
      type: sortType,
      order: sortOrder,
      time: timeInput.trim().toLowerCase(),
    });
    setCurrentPage(1);
  }

  function handleReset() {
    setSortType("");
    setSortOrder("");
    setTimeInput("");
    setActiveFilters({
      type: "",
      order: "",
      time: "",
    });
    setCurrentPage(1);
  }

  const filteredData = useMemo(() => {
    let result = [...mockSensorData];

    // 1. Lọc theo Loại Cảm Biến (khớp chính xác với mockData tiếng Việt)
    if (activeFilters.type) {
      result = result.filter(
        (item) => item.type.toLowerCase() === activeFilters.type.toLowerCase()
      );
    }

    // 2. Tìm kiếm chuỗi thời gian (gõ 2026, 08-19, hoặc 10:30 đều ra)
    if (activeFilters.time) {
      result = result.filter((item) =>
        item.time.toLowerCase().includes(activeFilters.time)
      );
    }

    // 3. Sắp xếp: dùng parseFloat để loại bỏ đơn vị '°C', '%', 'adc'
    if (activeFilters.order === "asc") {
      result.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
    } else if (activeFilters.order === "desc") {
      result.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    }

    return result;
  }, [activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const visibleData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="page-title">Data Sensor</div>
      <div className="filters">
        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="">Loại CB</option>
          <option value="Nhiệt độ">Nhiệt độ</option>
          <option value="Độ ẩm">Độ ẩm</option>
          <option value="Ánh sáng">Ánh sáng</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="">Sort Type</option>
          <option value="asc">Increase</option>
          <option value="desc">Decrease</option>
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
              <th>Loại Cảm Biến</th>
              <th>Giá Trị</th>
              <th>Thời Gian</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.length > 0 ? (
              visibleData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.type}</td>
                  <td>{row.value}</td>
                  <td>{row.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "16px" }}>
                  Không tìm thấy kết quả nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div>
          Hiển thị {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -{Math.min(currentPage * pageSize, filteredData.length)} trong tổng {filteredData.length} kết quả
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