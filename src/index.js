const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const db = new Pool({
  user: "postgres",
  password: "postgres",
  host: "localhost",
  port: 5432,
  database: "siswa",
});

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Endpoint untuk mendapatkan data berdasarkan ID (Read)
app.get("/barang", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM Barang;
  `);

    res.status(200).send(result.rows);
  } catch (error) {
    console.error(error);
  }
});

// Endpoint untuk membuat data baru (Create)
app.post("/tambah-barang", async (req, res) => {
  const { Nama_Barang, Jenis_Barang_ID, Stok } = req.body;

  try {
    const result = await db.query(`
      INSERT INTO Barang (Nama_Barang, Jenis_Barang_ID, Stok)
      VALUES ('${Nama_Barang}', ${Jenis_Barang_ID}, ${Stok})
      RETURNING *;
  `);

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

// Endpoint untuk mengupdate data berdasarkan ID (Update)
app.put("/ubah-barang/:id", async (req, res) => {
  const { id } = req.params;
  const { Nama_Barang, Jenis_Barang_ID, Stok } = req.body;

  try {
    const result = await db.query(
      `
      UPDATE Barang
      SET Nama_Barang = $1, Jenis_Barang_ID = $2, Stok = $3
      WHERE id = $4
      RETURNING *;
  `,
      [Nama_Barang, Jenis_Barang_ID, Stok, id]
    );

    if (result.rowCount > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "data tidak ditemukan" });
    }
  } catch (error) {
    console.log(error);
  }
});

// Endpoint untuk menghapus data berdasarkan ID (Delete)
app.delete("/hapus-barang/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      DELETE FROM Barang WHERE ID = ${id} RETURNING *;
  `);

    if (result.rowCount > 0) {
      res.json({ message: "data berhasil ditambahkan" });
    } else {
      res.status(404).json({ message: "data tidak ditemukan" });
    }
  } catch (error) {
    console.error(error);
  }
});

// Endpoint untuk searching dan sorting berdasarkan nama barang dan tanggal transaksi
app.get("/barang/search", async (req, res) => {
  const { barang } = req.query;

  try {
    const query = `
    SELECT b.nama_barang, t.tanggal_transaksi
    FROM barang b
    INNER JOIN transaksi t ON b.id = t.barang_id
    WHERE b.id = $1;

    `;

    const result = await db.query(query, [barang]);
    res.status(200).send(result.rows);
  } catch (error) {
    console.log("gagal pencarian...", error);
  }
});

// Endpoint untuk membandingkan jenis barang
app.get("/barang/compare/:perbandingan", async (req, res) => {
  const { perbandingan } = req.params;

  try {
    let query = `
      SELECT Jenis_Barang.Nama_Jenis, SUM(Transaksi.Jumlah_Terjual) AS TotalTerjual
      FROM Jenis_Barang
      INNER JOIN Barang ON Jenis_Barang.ID = Barang.Jenis_Barang_ID
      INNER JOIN Transaksi ON Barang.ID = Transaksi.Barang_ID
      GROUP BY Jenis_Barang.Nama_Jenis
  `;

    if (perbandingan === "terbanyak") {
      query += " ORDER BY TotalTerjual DESC LIMIT 1";
    } else if (perbandingan === "terendah") {
      query += " ORDER BY TotalTerjual ASC LIMIT 1";
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
});

// Endpoint untuk filter rentang waktu
app.get("/api/barang/filter", async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT *
      FROM Transaksi
      WHERE Tanggal_Transaksi >= '${startDate}' AND Tanggal_Transaksi <= '${endDate}'
  `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
});

app.listen(80, () => {
  console.log("server ready!");
});
