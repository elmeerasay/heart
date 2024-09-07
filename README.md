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

Save lalu jalankan node, pilih salah satu dibawah ini

```bash
node art.js
```
Slippage sesuai Estimasi yang didapatkan { Biasanya swap sering gagal karena market realtime akan berubah dengan cepat, tapi akan mendapatkan harga yang tidak terlalu jauh dengan est yang diharapkan sehingga tidak banyak kebuang fee nya } 
contoh :
![image](https://github.com/user-attachments/assets/68d3dd9f-18b4-47e3-8d33-c90bef70be20)


```bash
node nosp.js
```
Slippage otomatis, jumlah yang diharapkan diterima adalah 0 { realtime } , transaksi banyak sukses. jika gagal biasanya token kosong, fee abis / nonce duplikat { wallet digunakan juga untuk bulksender } tetapi kebuang fee agak lumayan banyak karena pair belum stabil
contoh :
![image](https://github.com/user-attachments/assets/5e43ee7f-1e98-404f-8232-3b49f762fc8d)


note : perbedaan harga market bisa berubah 0.0000000000000000001 detik



