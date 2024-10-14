import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getManagementTeamByPhoneNo = async (phoneNumber) => {
  const managementTeam =
    await sql`SELECT * FROM Management_Team WHERE phone_number = ${phoneNumber};`;
  return managementTeam;
};

const getManagementTeamById = async (managementTeamId) => {
  const managementTeam =
    await sql`SELECT * FROM Management_Team WHERE id = ${managementTeamId};`;
  return managementTeam;
};

const getManagementTeamByEmail = async (email) => {
  const managementTeam =
    await sql`SELECT * FROM Management_Team WHERE email_address = ${email};`;
  return managementTeam;
};

const getNonSensitiveManagementTeamInfoById = async (managementTeamId) => {
  const managementTeam = await sql`
      SELECT id, name, email_address, phone_number
      FROM Management_Team 
      WHERE id = ${managementTeamId};
    `;
  return managementTeam;
};

const setRefreshToken = async (refreshToken, managementTeamId) => {
  const managementTeam = await sql`
    UPDATE Management_Team
    SET refresh_token = ${refreshToken}
    WHERE id = ${managementTeamId}
    RETURNING id, name, phone_number, email_address;
  `;
  return managementTeam;
};

const createManagementTeam = async (name, phoneNumber, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const managementTeam = await sql`
      INSERT INTO Management_Team (name, phone_number, email_address, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${hashedPassword})
      RETURNING id, name, phone_number, email_address;
    `;
    return managementTeam[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteManagementTeam = async (managementTeamId) => {
  try {
    const managementTeam =
      await sql`DELETE FROM Management_Team WHERE id=${managementTeamId} RETURNING id, name, phone_number, email_address`;
    return managementTeam;
  } catch (error) {
    throw new Error(error);
  }
};

const updateManagementTeamNamePhoneNo = async (
  managementTeamId,
  { name, phoneNumber }
) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
  UPDATE Management_Team SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${managementTeamId} RETURNING id, name, phone_number, email_address;
  `;

  try {
    const managementTeam = await query;
    return managementTeam;
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getManagementTeamByPhoneNo,
  getManagementTeamById,
  getManagementTeamByEmail,
  getNonSensitiveManagementTeamInfoById,
  setRefreshToken,
  createManagementTeam,
  deleteManagementTeam,
  updateManagementTeamNamePhoneNo,
};
