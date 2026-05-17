/* 
============================================================
NOTE: placeholder UI for testing only, remove whenever
============================================================
*/

// import { useEffect, useState } from "react";

// export default function VehicleList() {
//   const [vehicles, setVehicles] = useState([]);

//   useEffect(() => {
//     fetch("http://localhost:3000/api/vehicles")
//       .then((res) => res.json())
//       .then((data) => setVehicles(data))
//       .catch((err) => console.log(err));
//   }, []);

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Vehicles</h2>

//       <table
//         style={{
//           width: "100%",
//           borderCollapse: "collapse",
//           marginTop: "10px",
//         }}
//       >
//         <thead>
//           <tr>
//             <th style={thStyle}>Plate Number</th>
//             <th style={thStyle}>Vehicle Type</th>
//             <th style={thStyle}>Make</th>
//             <th style={thStyle}>Model</th>
//             <th style={thStyle}>Year</th>
//             <th style={thStyle}>Color</th>
//             <th style={thStyle}>Owner (License #)</th>
//           </tr>
//         </thead>

//         <tbody>
//           {vehicles.map((vehicle) => (
//             <tr key={vehicle.plate_number}>
//               <td style={tdStyle}>{vehicle.plate_number}</td>
//               <td style={tdStyle}>{vehicle.vehicle_type}</td>
//               <td style={tdStyle}>{vehicle.make}</td>
//               <td style={tdStyle}>{vehicle.model}</td>
//               <td style={tdStyle}>{vehicle.year}</td>
//               <td style={tdStyle}>{vehicle.color}</td>
//               <td style={tdStyle}>{vehicle.license_number}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // reusable styles
// const thStyle = {
//   border: "1px solid #ccc",
//   padding: "10px",
//   backgroundColor: "#f5f5f5",
//   textAlign: "left",
// };

// const tdStyle = {
//   border: "1px solid #ccc",
//   padding: "10px",
// };

import Placeholder from "./Placeholder";
export default function Vehicles() {
  return <Placeholder title="Vehicle Management" icon="🚗" />;
}