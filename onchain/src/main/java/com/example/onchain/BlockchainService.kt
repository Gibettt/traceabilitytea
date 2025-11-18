package com.example.teh.onchain // <-- Sesuaikan package name ini

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.web3j.protocol.Web3j
import org.web3j.protocol.http.HttpService

class BlockchainService {

    // Kita buat 'lateinit' agar jelas bahwa ini harus di-inisialisasi
    private lateinit var web3j: Web3j

    /**
     * Fungsi ini WAJIB dipanggil pertama kali dari MainActivity
     * untuk "menyalakan" koneksi.
     */
    fun initialize(rpcUrl: String) {
        // Cek sederhana agar tidak dibuat ulang jika sudah ada
        if (::web3j.isInitialized) return

        // Membuat koneksi service HTTP menggunakan RPC URL
        val httpService = HttpService(rpcUrl)

        // Membuat instance Web3j
        web3j = Web3j.build(httpService)
    }

    /**
     * Fungsi 'suspend' untuk mengambil nomor blok terbaru.
     * Ini adalah "Hello, World!" versi blockchain.
     * 'suspend' berarti harus dipanggil dari Coroutine (misal: di background thread)
     */
    suspend fun getLatestBlockNumber(): String {
        if (!::web3j.isInitialized) {
            return "Error: Layanan belum di-inisialisasi."
        }

        // Pindahkan panggilan jaringan ke background thread (WAJIB)
        return try {
            val blockNumberResult = withContext(Dispatchers.IO) {
                // Ini adalah panggilan jaringan yang sebenarnya
                web3j.ethBlockNumber().send()
            }

            if (blockNumberResult.hasError()) {
                "Error: ${blockNumberResult.error.message}"
            } else {
                // BERHASIL! Kita kembalikan nomor bloknya
                blockNumberResult.blockNumber.toString()
            }
        } catch (e: Exception) {
            // Tangani error jika koneksi gagal (misal: tidak ada internet)
            "Error: Gagal terhubung - ${e.message}"
        }
    }
}