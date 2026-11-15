import mysql from "mysql2/promise";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { host, port, name, user, password } = body;

    if (!host || !port || !name || !user) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณากรอกข้อมูลการเชื่อมต่อฐานข้อมูลให้ครบถ้วน",
      });
    }

    const connection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      multipleStatements: true,
    });

    await connection.end();

    return { ok: true };
  } catch (error: any) {
    return createError({
      statusCode: 400,
      statusMessage: error.message || "เชื่อมต่อฐานข้อมูลไม่สำเร็จ",
    });
  }
});
