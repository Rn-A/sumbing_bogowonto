import mysql from 'mysql2/promise';

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2KbACdoGinhE3wN.root',
      password: 'SHVh56rmn2hCf5OG',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    });
    console.log('Successfully connected to TiDB Cloud!');
    await connection.query('CREATE DATABASE IF NOT EXISTS basecamp_sumbing;');
    console.log('Database basecamp_sumbing created successfully or already exists!');
    const [rows] = await connection.query('SHOW DATABASES;');
    console.log('Databases:', rows);
    await connection.end();
  } catch (err) {
    console.error('Failed to connect or create DB:', err);
  }
}

test();
