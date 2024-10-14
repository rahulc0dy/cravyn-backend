import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getBusinessTeamByPhoneNo = async (phoneNumber) => {
  const businessTeam =
    await sql`SELECT * FROM Business_Team WHERE phone_number = ${phoneNumber};`;
  return businessTeam;
};

const getBusinessTeamById = async (businessTeamId) => {
  const businessTeam =
    await sql`SELECT * FROM Business_Team WHERE id = ${businessTeamId};`;
  return businessTeam;
};

const getBusinessTeamByEmail = async (email) => {
  const businessTeam =
    await sql`SELECT * FROM Business_Team WHERE email_address = ${email};`;
  return businessTeam;
};

const getNonSensitiveBusinessTeamInfoById = async (businessTeamId) => {
  const businessTeam = await sql`
      SELECT id, name, email_address, phone_number
      FROM Business_Team 
      WHERE id = ${businessTeamId};
    `;
  return businessTeam;
};

const setRefreshToken = async (refreshToken, businessTeamId) => {
  const businessTeam = await sql`
    UPDATE Business_Team
    SET refresh_token = ${refreshToken}
    WHERE id = ${businessTeamId}
    RETURNING id, name, phone_number, email_address;
  `;
  return businessTeam;
};

const createBusinessTeam = async (name, phoneNumber, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const businessTeam = await sql`
      INSERT INTO Business_Team (name, phone_number, email_address, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${hashedPassword})
      RETURNING id, name, phone_number, email_address;
    `;
    return businessTeam[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteBusinessTeam = async (businessTeamId) => {
  try {
    const businessTeam =
      await sql`DELETE FROM Business_Team WHERE id=${businessTeamId} RETURNING id, name, phone_number, email_address`;
    return businessTeam;
  } catch (error) {
    throw new Error(error);
  }
};

const updateBusinessTeamNamePhoneNo = async (
  businessTeamId,
  { name, phoneNumber }
) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
  UPDATE Business_Team SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${businessTeamId} RETURNING id, name, phone_number, email_address;
  `;

  try {
    const businessTeam = await query;
    return businessTeam;
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getBusinessTeamByPhoneNo,
  getBusinessTeamById,
  getBusinessTeamByEmail,
  getNonSensitiveBusinessTeamInfoById,
  setRefreshToken,
  createBusinessTeam,
  deleteBusinessTeam,
  updateBusinessTeamNamePhoneNo,
};
