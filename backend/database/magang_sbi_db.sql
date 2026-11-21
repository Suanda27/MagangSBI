-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 11, 2026 at 09:35 AM
-- Server version: 10.11.15-MariaDB
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `magang_sbi_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bagians`
--

CREATE TABLE `bagians` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_bagian` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lampirans`
--

CREATE TABLE `lampirans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_permintaan` bigint(20) UNSIGNED NOT NULL,
  `nama_file` varchar(255) NOT NULL,
  `path_file` varchar(255) NOT NULL,
  `tipe_file` varchar(255) NOT NULL,
  `ukuran_file` varchar(255) NOT NULL,
  `jenis_lampiran` varchar(255) NOT NULL DEFAULT 'Bukti Pengajuan',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lantais`
--

CREATE TABLE `lantais` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_lantai` varchar(255) NOT NULL,
  `id_plant` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `layanans`
--

CREATE TABLE `layanans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_layanan` varchar(255) NOT NULL,
  `kategori` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `id_bagian` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_09_27_074813_create_bagians_table', 1),
(5, '2026_09_27_074814_create_layanans_table', 1),
(6, '2026_09_27_074815_create_plants_table', 1),
(7, '2026_09_27_074816_create_lantais_table', 1),
(8, '2026_09_27_074817_create_permintaans_table', 1),
(9, '2026_09_27_074818_create_riwayat_permintaans_table', 1),
(10, '2026_09_27_074819_create_lampirans_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permintaans`
--

CREATE TABLE `permintaans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kode_tiket` varchar(255) NOT NULL,
  `id_karyawan` bigint(20) UNSIGNED NOT NULL,
  `id_layanan` bigint(20) UNSIGNED NOT NULL,
  `id_pic` bigint(20) UNSIGNED DEFAULT NULL,
  `lokasi` varchar(255) DEFAULT NULL,
  `deskripsi` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Submitted',
  `tanggal_selesai` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plants`
--

CREATE TABLE `plants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_plant` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_permintaans`
--

CREATE TABLE `riwayat_permintaans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_permintaan` bigint(20) UNSIGNED NOT NULL,
  `id_karyawan` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nik` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'employee',
  `id_bagian` bigint(20) UNSIGNED DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bagians`
--
ALTER TABLE `bagians`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  ADD KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lampirans`
--
ALTER TABLE `lampirans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lampirans_id_permintaan_foreign` (`id_permintaan`);

--
-- Indexes for table `lantais`
--
ALTER TABLE `lantais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lantais_id_plant_foreign` (`id_plant`);

--
-- Indexes for table `layanans`
--
ALTER TABLE `layanans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `layanans_id_bagian_foreign` (`id_bagian`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `permintaans`
--
ALTER TABLE `permintaans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permintaans_kode_tiket_unique` (`kode_tiket`),
  ADD KEY `permintaans_id_karyawan_foreign` (`id_karyawan`),
  ADD KEY `permintaans_id_layanan_foreign` (`id_layanan`),
  ADD KEY `permintaans_id_pic_foreign` (`id_pic`);

--
-- Indexes for table `plants`
--
ALTER TABLE `plants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `riwayat_permintaans`
--
ALTER TABLE `riwayat_permintaans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `riwayat_permintaans_id_permintaan_foreign` (`id_permintaan`),
  ADD KEY `riwayat_permintaans_id_karyawan_foreign` (`id_karyawan`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_nik_unique` (`nik`),
  ADD KEY `users_id_bagian_foreign` (`id_bagian`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bagians`
--
ALTER TABLE `bagians`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lampirans`
--
ALTER TABLE `lampirans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lantais`
--
ALTER TABLE `lantais`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `layanans`
--
ALTER TABLE `layanans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `permintaans`
--
ALTER TABLE `permintaans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `plants`
--
ALTER TABLE `plants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_permintaans`
--
ALTER TABLE `riwayat_permintaans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `lampirans`
--
ALTER TABLE `lampirans`
  ADD CONSTRAINT `lampirans_id_permintaan_foreign` FOREIGN KEY (`id_permintaan`) REFERENCES `permintaans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lantais`
--
ALTER TABLE `lantais`
  ADD CONSTRAINT `lantais_id_plant_foreign` FOREIGN KEY (`id_plant`) REFERENCES `plants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `layanans`
--
ALTER TABLE `layanans`
  ADD CONSTRAINT `layanans_id_bagian_foreign` FOREIGN KEY (`id_bagian`) REFERENCES `bagians` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permintaans`
--
ALTER TABLE `permintaans`
  ADD CONSTRAINT `permintaans_id_karyawan_foreign` FOREIGN KEY (`id_karyawan`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permintaans_id_layanan_foreign` FOREIGN KEY (`id_layanan`) REFERENCES `layanans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permintaans_id_pic_foreign` FOREIGN KEY (`id_pic`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `riwayat_permintaans`
--
ALTER TABLE `riwayat_permintaans`
  ADD CONSTRAINT `riwayat_permintaans_id_karyawan_foreign` FOREIGN KEY (`id_karyawan`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `riwayat_permintaans_id_permintaan_foreign` FOREIGN KEY (`id_permintaan`) REFERENCES `permintaans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_id_bagian_foreign` FOREIGN KEY (`id_bagian`) REFERENCES `bagians` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
