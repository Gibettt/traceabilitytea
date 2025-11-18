import java.util.Properties


plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}


val localProperties = Properties() // <-- Lebih bersih karena sudah di-import
val localPropertiesFile = rootProject.file("local.properties")

// 2. Load filenya
if (localPropertiesFile.exists()) {
    localProperties.load(localPropertiesFile.inputStream())
}

android {
    namespace = "com.example.teh"
    compileSdk {
        version = release(35)
    }

    defaultConfig {
        applicationId = "com.example.teh"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // 3. Ambil nilai & jadikan BuildConfig
        // Ini akan membuat variabelnya tersedia di kode Kotlin
        buildConfigField(
            "String", // Tipe data
            "RPC_URL",  // Nama variabel di Kotlin
            "\"${localProperties.getProperty("RPC_URL", "URL_DEFAULT_JIKA_TIDAK_ADA")}\"" // Ambil nilainya
        )
        buildConfigField(
            "String",
            "CHAIN_ID",
            "\"${localProperties.getProperty("CHAIN_ID", "1")}\"" // Ambil nilainya
        )
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    implementation(project(":onchain"))

    constraints {
        // "libs.versions.kotlin.get()" mengambil nilai "2.0.21" dari file toml And
        implementation("org.jetbrains.kotlin:kotlin-stdlib") {
            version {
                strictly(libs.versions.kotlin.get())
            }
        }
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8") {
            version {
                strictly(libs.versions.kotlin.get())
            }
        }
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7") {
            version {
                strictly(libs.versions.kotlin.get())
            }
        }
    }
}