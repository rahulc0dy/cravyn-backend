import { sql } from "./database.js";

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

const deleteManagementTeam = async (managementTeamId) => {
  try {
    const managementTeam =
      await sql`DELETE FROM Management_Team WHERE id=${managementTeamId} RETURNING id, name, phone_number, email_address`;
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
  deleteManagementTeam,
};
