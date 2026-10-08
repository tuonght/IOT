import { useMemo, useState } from "react";
import { mockSensorData } from "../mockData";
import "./DataSensor.css";

const SENSOR_TYPES = ["Nhiệt độ", "Độ ẩm", "Ánh sáng"];

export default function DataSensor() {
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

 
  const filteredData = useMemo(() => {
    // ban sao
    let result = [...mockSensorData];

    
    if (activeFilters.type !== "all" && activeFilters.type !== "time") {
      result = result.filter((item) => item.type === activeFilters.type);
    }

    // lọc theo từ khóa
    if (activeFilters.query) {
      result = result.filter((item) => {
        if (activeFilters.type === "time") {
          return item.time.toLowerCase().includes(activeFilters.query);
        }

        if (activeFilters.type === "all") {
          return [item.type, item.value, item.time].some((field) =>
            field.toLowerCase().includes(activeFilters.query)
          );
        }

        return item.value.toLowerCase().includes(activeFilters.query);
      });
    }

    
    if (activeFilters.order === "asc") {
      result.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
    } else if (activeFilters.order === "desc") {
      result.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    }

    return result;
  }, [activeFilters]);

  // Tính tổng số trang rồi cắt đúng đoạn bản ghi cần render.
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageNumbers =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : currentPage <= 3
        ? [1, 2, 3, 4, "...", totalPages]
        : currentPage >= totalPages - 2
          ? [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
          : [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  const visibleData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="data-sensor-page">
     
      <div className="sensor-page-title">Data Sensor</div>
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

      {/* dùng visibleData  */}
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
            {filteredData.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
            -{Math.min(currentPage * pageSize, filteredData.length)} trong tổng{" "}
            {filteredData.length} kết quả
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
