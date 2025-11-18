package com.example.teh

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.example.teh.BuildConfig // <-- Import BuildConfig Anda
import com.example.teh.onchain.BlockchainService // <-- 1. Import Service Anda
import com.example.teh.ui.theme.TehTheme

class MainActivity : ComponentActivity() {

    // 2. Buat satu instance Service untuk Activity ini
    private val blockchainService = BlockchainService()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 3. Inisialisasi service dengan RPC URL Anda (dari BuildConfig)
        blockchainService.initialize(BuildConfig.RPC_URL)
        Log.d("MainActivity", "BlockchainService di-inisialisasi dengan URL: ${BuildConfig.RPC_URL}")

        enableEdgeToEdge()
        setContent {
            TehTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->

                    // 4. Kita panggil Composable baru kita
                    BlockchainStatusScreen(
                        service = blockchainService,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

/**
 * Composable baru yang akan menampilkan status koneksi
 */
@Composable
fun BlockchainStatusScreen(service: BlockchainService, modifier: Modifier = Modifier) {

    // 5. 'remember' untuk menyimpan state (hasil) nomor blok
    var blockNumber by remember { mutableStateOf("Mencoba terhubung ke Sepolia...") }

    // 6. 'LaunchedEffect' adalah cara standar di Compose
    //    untuk memanggil 'suspend function' (getLatestBlockNumber)
    //    Ini akan berjalan 1x saat composable ini muncul di layar
    LaunchedEffect(key1 = true) {
        Log.d("Compose", "LaunchedEffect berjalan, memanggil getLatestBlockNumber...")
        blockNumber = service.getLatestBlockNumber() // <-- Panggil fungsi suspend
        Log.d("Compose", "Hasil nomor blok: $blockNumber")
    }

    // 7. Tampilkan hasilnya di tengah layar
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "Block Number Sepolia: $blockNumber"
        )
    }
}


@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    TehTheme {
        // Preview tidak bisa menjalankan service, jadi kita beri teks statis
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Block Number Sepolia: 123456")
        }
    }
}