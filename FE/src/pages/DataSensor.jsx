import { useEffect, useState } from "react";
import { api } from "../api";
import { getPageNumbers } from "../utils/pagination";
import "./DataSensor.css";

const SENSOR_TYPES = ["Nhiệt độ", "Độ ẩm", "Ánh sáng"];

export default function DataSensor() {
  const [sensorData, setSensorData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [sensorType, setSensorType] = useState("all");
  const [sortOrder, setSortOrder] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    type: "all",
    order: "",
    query: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function refreshSensorData() {
      try {
        const result = await api.sensorData({
          type: activeFilters.type,
          q: activeFilters.query,
          sort: activeFilters.order,
          page: currentPage - 1,
          size: pageSize,
        });
        if (mounted) {
          setSensorData(result.content || []);
          setTotalElements(result.totalElements || 0);
          setError("");
        }
      } catch (requestError) {
        if (mounted) setError(requestError.message);
      }
    }

    refreshSensorData();
    const intervalId = window.setInterval(refreshSensorData, 3000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [activeFilters, currentPage, pageSize]);

  const searchPlaceholder =
    sensorType === "time"
      ? "Tìm theo thời gian..."
      : sensorType === "all"
        ? "Tìm theo loại, giá trị hoặc thời gian..."
        : `Tìm theo giá trị ${sensorType.toLowerCase()}...`;

  
  function handleSearch() {
    setActiveFilters({
      type: sensorType,
      order: sortOrder,
      query: searchInput.trim().toLowerCase(),
    });
    setCurrentPage(1);
  }

  // Đưa form, bộ lọc đang áp dụng và phân trang về trạng thái ban đầu.
  function handleReset() {
    setSensorType("all");
    setSortOrder("");
    setSearchInput("");
    setActiveFilters({ type: "all", order: "", query: "" });
    setCurrentPage(1);
  }

 
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const pageNumbers = getPageNumbers(totalPages, currentPage);

  return (
    <div className="data-sensor-page">
     
      <div className="sensor-page-title">Data Sensor</div>
      {error && <div className="error-text">{error}</div>}
      <div className="sensor-filters">
        <select
          aria-label="Loại cảm biến"
          value={sensorType}
          onChange={(event) => setSensorType(event.target.value)}
        >
          <option value="all">ALL</option>
          {SENSOR_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
          <option value="time">Thời gian</option>
        </select>

        <select
          aria-label="Thứ tự sắp xếp giá trị"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        >
          <option value="">Sort Type</option>
          <option value="asc">Increase</option>
          <option value="desc">Decrease</option>
        </select>

        <input
          type="text"
          aria-label="Tìm kiếm dữ liệu cảm biến"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSearch()}
        />

        <button className="sensor-button" type="button" onClick={handleSearch}>
          Tìm Kiếm
        </button>
        <button
          className="sensor-button sensor-button-ghost"
          type="button"
          onClick={handleReset}
        >
          Bỏ Tìm Kiếm
        </button>
      </div>

      <div className="sensor-table-panel">
        <div className="sensor-table-wrap">
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
              {/* không có kết quả thì hiển thị một dòng thông báo. */}
              {sensorData.length > 0 ? (
                sensorData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.type}</td>
                    <td>{row.value}</td>
                    <td>{row.time?.replace("T", " ")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="sensor-empty" colSpan={4}>
                    Không tìm thấy kết quả nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bộ đếm và nút điều hướng phân trang. */}
      <div className="sensor-pagination">
        <div className="sensor-pagination-info">
          <span>
            Hiển thị{" "}
            {totalElements === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
            -{Math.min(currentPage * pageSize, totalElements)} trong tổng{" "}
            {totalElements} kết quả
          </span>
        </div>
        <div className="sensor-page-buttons">
          <label className="sensor-page-size">
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
          {/* cập nhật trang dựa trên state trước đó. */}
          <button
            type="button"
            className="sensor-page-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {/* Hiện các trang gần trang hiện tại và luôn giữ nút trang đầu/cuối. */}
          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <span className="sensor-page-ellipsis" key={`ellipsis-${index}`}>
                …
              </span>
            ) : (
              <button
                type="button"
                className={`sensor-page-button ${
                  currentPage === page ? "active" : ""
                }`}
                key={page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}
          {/* Không cho tiến vượt quá trang cuối. */}
          <button
            type="button"
            className="sensor-page-button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
