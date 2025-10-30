pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        // (opsional, aman ditambah) untuk plugin yg mungkin ada di jitpack
        maven("https://jitpack.io")
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // WAJIB untuk dependency com.github.* & Scarlet yang kamu butuhkan
        maven("https://jitpack.io")
    }
}

rootProject.name = "teh"
include(":app", ":onchain")
