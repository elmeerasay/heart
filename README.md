```bash
https://github.com/elmeerasay/heart.git
```

```bash
cd heart
```

```bash
npm init -y
```

```bash
npm install dotenv ethers@5
```

```bash
nano .env
```

Masukin Pk kamu

```bash
CTRL + X 
```

Save lalu jalankan node

```bash
node art.js
```
Slippage sesuai Estimasi yang didapatkan { Biasanya swap sering gagal tapi akan mendapatkan harga yang tidak terlalu jauh dengan est }

```bash
node nosp.js
```
Tidak ada slippage, jumlah yang diharapkan diterima adalah 0 { realtime } , transaksi banyak sukses jika gagal biasanya token kosong, fee abis / nonce duplikat { wallet digunakan juga untuk bulksender }

note : perbedaan harga market bisa berubah 0.0000000000000000001 detik



