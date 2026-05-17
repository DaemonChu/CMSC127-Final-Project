/* 
============================================================
NOTE: placeholder UI for testing only, remove whenever
============================================================
*/

import { useEffect, useState } from "react";

export default function DriverList() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/drivers")
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Drivers</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>License Number</th>
            <th style={thStyle}>License Type</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.license_number}>
              <td style={tdStyle}>{driver.full_name}</td>
              <td style={tdStyle}>{driver.license_number}</td>
              <td style={tdStyle}>{driver.license_type}</td>
              <td style={tdStyle}>{driver.license_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// reusable styles
const thStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  backgroundColor: "#f5f5f5",
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "10px",
};
