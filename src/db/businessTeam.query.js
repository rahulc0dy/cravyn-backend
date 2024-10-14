import { sql } from "./database.js";

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

const deleteBusinessTeam = async (businessTeamId) => {
  try {
    const businessTeam =
      await sql`DELETE FROM Business_Team WHERE id=${businessTeamId} RETURNING id, name, phone_number, email_address`;
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
  deleteBusinessTeam,
};
