import db from "../config/db.js";

// --- DRIVER EXPIRATION ---
export async function expireDrivers() {
  return db.query(`
    UPDATE driver
    SET license_status = 'expired'
    WHERE license_expiration_date < CURDATE()
      AND license_status = 'valid'
  `);
}

// --- VEHICLE REGISTRATION EXPIRATION ---
export async function expireRegistrations() {
  return db.query(`
    UPDATE vehicleRegistration
    SET registration_status = 'expired'
    WHERE expiration_date < CURDATE()
      AND registration_status = 'active'
  `);
}

// unified job
export async function runMaintenance() {
  const [drivers] = await expireDrivers();
  const [registrations] = await expireRegistrations();

  // update message
  return {
    driversExpired: drivers.affectedRows,
    registrationsExpired: registrations.affectedRows,
  };
}
