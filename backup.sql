-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: organizacao_facil_dev
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('2f1ae2fd-1420-4fa1-9c43-c1aabe7dda13','1dd9af7f384dc39d7c431f7e7bd128ae70eac2454e619d017f9dc6da3f7701fc','2026-04-07 03:57:50.056','20260406034643_teste1',NULL,NULL,'2026-04-07 03:57:49.065',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` enum('TASK','FINANCE','GENERAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categories_userId_idx` (`userId`),
  KEY `categories_userId_scope_idx` (`userId`,`scope`),
  CONSTRAINT `categories_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('cmno39nx00001iovd0vgy68h4','Pessoal','TASK','#DBEAFE','cmno39nwj0000iovdp54gm3kr','2026-04-07 03:58:01.812','2026-04-07 03:58:01.812'),('cmno39nx10002iovdujxpg1zx','Trabalho','TASK','#FEF3C7','cmno39nwj0000iovdp54gm3kr','2026-04-07 03:58:01.813','2026-04-07 03:58:01.813'),('cmno39nx10003iovdxvwda5rr','Saúde','TASK','#D1FAE5','cmno39nwj0000iovdp54gm3kr','2026-04-07 03:58:01.813','2026-04-07 03:58:01.813'),('cmno39nx10004iovdnpc8p78h','Renda','FINANCE','#D1FAE5','cmno39nwj0000iovdp54gm3kr','2026-04-07 03:58:01.813','2026-04-07 03:58:01.813'),('cmno39nx10005iovddlsuq452','Alimentação','FINANCE','#FED7AA','cmno39nwj0000iovdp54gm3kr','2026-04-07 03:58:01.813','2026-04-07 03:58:01.813'),('cmno39nx10006iovdc0vpjpej','Moradia','FINANCE','#FEE2E2','cmno39nwj0000iovdp54gm3kr','2026-04-07 03:58:01.813','2026-04-07 03:58:01.813'),('cmnqykhry0002psvd82vmozp9','Venda VS Experience','FINANCE','#EF4444','cmno39nwj0000iovdp54gm3kr','2026-04-09 04:09:47.518','2026-04-09 04:09:47.518'),('cmogexkg1000c84vdpzeqppep','Casamento','FINANCE','#8B5CF6','cmno39nwj0000iovdp54gm3kr','2026-04-26 23:42:05.761','2026-04-26 23:42:05.761'),('cmogf6h44000g84vdawwcc4n8','Cartões','FINANCE','#10B981','cmno39nwj0000iovdp54gm3kr','2026-04-26 23:49:01.349','2026-04-26 23:49:01.349');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finance_entries`
--

DROP TABLE IF EXISTS `finance_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finance_entries` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('INCOME','EXPENSE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(12,2) NOT NULL,
  `occurredAt` datetime(3) NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `recurrence` enum('NONE','WEEKLY','MONTHLY','ANNUAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `status` enum('CONFIRMED','PREDICTED','OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONFIRMED',
  PRIMARY KEY (`id`),
  KEY `finance_entries_userId_idx` (`userId`),
  KEY `finance_entries_userId_type_idx` (`userId`,`type`),
  KEY `finance_entries_userId_occurredAt_idx` (`userId`,`occurredAt`),
  KEY `finance_entries_categoryId_fkey` (`categoryId`),
  KEY `finance_entries_userId_status_idx` (`userId`,`status`),
  CONSTRAINT `finance_entries_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `finance_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finance_entries`
--

LOCK TABLES `finance_entries` WRITE;
/*!40000 ALTER TABLE `finance_entries` DISABLE KEYS */;
INSERT INTO `finance_entries` VALUES ('cmogerlvu000084vdsceug0h2','INCOME','PIX RECEBIDO DE FALCOTEC SERVICOS DE TECNOLOGIA LTDA | Banco 461 | CNPJ 50.782.463/0001-20  |  Mensagem - DEV',NULL,3750.00,'2026-04-25 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.690','2026-04-26 23:37:27.690','NONE','CONFIRMED'),('cmogerlwx000184vd4bybihr7','INCOME','PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 336 | CPF ***.795.568-**',NULL,300.00,'2026-04-22 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.729','2026-04-26 23:37:27.729','NONE','CONFIRMED'),('cmogerlyd000284vdb3wiyu9z','INCOME','PIX RECEBIDO DE VINICIUS TRAFEGO | Banco 077 | CNPJ 22.699.082/0001-47',NULL,800.00,'2026-04-17 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.781','2026-04-26 23:37:27.781','NONE','CONFIRMED'),('cmogerlzg000384vd7p4pyyib','INCOME','PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 237 | CPF ***.795.568-**',NULL,500.00,'2026-04-10 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.820','2026-04-26 23:37:27.820','NONE','CONFIRMED'),('cmogerm0q000484vdf8u0a23b','INCOME','PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 237 | CPF ***.795.568-**',NULL,550.00,'2026-04-08 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.866','2026-04-26 23:37:27.866','NONE','CONFIRMED'),('cmogerm1p000584vd1ukv548s','INCOME','PIX RECEBIDO DE CLARIS REABILITACAO ORAL LTDA | CNPJ 10.922.978/0001-64  |  Mensagem - Site',NULL,745.00,'2026-04-07 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.901','2026-04-26 23:37:27.901','NONE','CONFIRMED'),('cmogerm2q000684vdsznjcr8f','INCOME','PIX RECEBIDO DE LUCAS GONCALVES BRANCATTI | Banco 104 | CPF ***.690.468-**',NULL,400.00,'2026-04-06 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:37:27.938','2026-04-26 23:37:27.938','NONE','CONFIRMED'),('cmogetgk6000784vdq7ay1wxt','INCOME','PIX RECEBIDO DE AMPARU ASSESSORIA E ISENCOES PARA PCD LTDA | Banco 260 | CNPJ 65.176.144/0001-49',NULL,550.00,'2026-03-31 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:38:54.102','2026-04-26 23:38:54.102','NONE','CONFIRMED'),('cmogetglm000884vdcdpmmixt','INCOME','PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 237 | CPF ***.795.568-**',NULL,600.00,'2026-03-30 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:38:54.154','2026-04-26 23:38:54.154','NONE','CONFIRMED'),('cmogetgni000984vdmz6ncg60','INCOME','PIX RECEBIDO DE VINICIUS CONDINO RECHDAN GESTOR DE TRAFEGO | Banco 336 | CNPJ 22.699.082/0001-47',NULL,80.00,'2026-03-30 12:00:00.000','cmno39nwj0000iovdp54gm3kr',NULL,'2026-04-26 23:38:54.222','2026-04-26 23:38:54.222','NONE','CONFIRMED'),('cmogevbnx000a84vdb1tj263o','INCOME','Multivegetal',NULL,680.00,'2026-04-27 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-04-26 23:40:21.069','2026-04-26 23:40:21.069','MONTHLY','CONFIRMED'),('cmogexagc000b84vdt87cbf83','EXPENSE','BUFFET CASAMENTO',NULL,311.11,'2026-04-26 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmogexkg1000c84vdpzeqppep','2026-04-26 23:41:52.812','2026-04-26 23:42:11.611','NONE','CONFIRMED'),('cmogeymtr000d84vd7gjbal7i','EXPENSE','ASSESSORIA CASAMENTO',NULL,179.00,'2026-04-26 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmogexkg1000c84vdpzeqppep','2026-04-26 23:42:55.503','2026-04-26 23:42:55.503','NONE','CONFIRMED'),('cmogf0ryn000e84vdr962e19r','EXPENSE','SALAO CASAMENTO',NULL,938.86,'2026-04-26 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmogexkg1000c84vdpzeqppep','2026-04-26 23:44:35.471','2026-04-26 23:44:35.471','NONE','CONFIRMED'),('cmogf6bbr000f84vdvk8258qf','EXPENSE','NUBANK CRÉDITO',NULL,590.63,'2026-04-27 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmogf6h44000g84vdawwcc4n8','2026-04-26 23:48:53.847','2026-04-26 23:49:11.916','NONE','CONFIRMED'),('cmogf7qug000h84vdnjm92yuu','EXPENSE','BTG CARTÃO',NULL,924.99,'2026-04-27 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmogf6h44000g84vdawwcc4n8','2026-04-26 23:50:00.616','2026-04-26 23:50:00.616','NONE','CONFIRMED'),('cmogf8nna000i84vd7uuixrod','EXPENSE','PICPAY CRÉDITO',NULL,366.58,'2026-04-26 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmogf6h44000g84vdawwcc4n8','2026-04-26 23:50:43.127','2026-04-26 23:50:43.127','NONE','CONFIRMED'),('cmoqfznjd0000govdqegh4sdu','INCOME','Sb Marketing Ultimo',NULL,400.00,'2026-05-04 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:09:24.458','2026-05-04 00:09:24.458','NONE','PREDICTED'),('cmoqg0mz40001govdb7ll289n','INCOME','Octaverta',NULL,1090.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:10:10.385','2026-05-04 00:10:15.397','NONE','PREDICTED'),('cmoqg1bsr0002govdy2ddwkl9','INCOME','Diabetes eu cuido',NULL,500.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:10:42.555','2026-05-04 00:10:42.555','NONE','PREDICTED'),('cmoqg1p2c0003govd8ryqtvny','INCOME','Claris',NULL,300.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:10:59.748','2026-05-04 00:11:02.870','NONE','PREDICTED'),('cmoqg3k6e0004govd24tpdfnq','INCOME','Miguel Lavanderia',NULL,700.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:12:26.726','2026-05-04 00:12:36.124','NONE','PREDICTED'),('cmoqg4yas0005govdgfm9tg6x','INCOME','Multi Vegetal',NULL,680.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:13:31.684','2026-05-04 00:13:31.684','NONE','PREDICTED'),('cmoqg5cx10006govdzx3pjdk0','INCOME','Eleva Isenções',NULL,550.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:13:50.629','2026-05-04 00:13:50.629','NONE','PREDICTED'),('cmoqg5r950007govdrhd9pdnp','INCOME','Landing Page Restaurante','3x',334.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:14:09.209','2026-05-05 15:25:25.537','MONTHLY','PREDICTED'),('cmoqg6c3l0008govdviencpig','INCOME','Falcotec',NULL,3250.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:14:36.225','2026-05-04 00:14:36.225','NONE','PREDICTED'),('cmoqgeml80009govd9u3fz5ld','INCOME','Rigal Finalização',NULL,400.00,'2026-05-25 15:00:00.000','cmno39nwj0000iovdp54gm3kr','cmnqykhry0002psvd82vmozp9','2026-05-04 00:21:03.068','2026-05-04 00:21:07.731','NONE','PREDICTED');
/*!40000 ALTER TABLE `finance_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `archivedAt` datetime(3) DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT '0',
  `isPinned` tinyint(1) NOT NULL DEFAULT '0',
  `pinnedAt` datetime(3) DEFAULT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `notes_userId_idx` (`userId`),
  KEY `notes_userId_isPinned_idx` (`userId`,`isPinned`),
  KEY `notes_userId_isArchived_idx` (`userId`,`isArchived`),
  KEY `notes_projectId_idx` (`projectId`),
  CONSTRAINT `notes_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
INSERT INTO `notes` VALUES ('cmoqnqinz0000d8vd3e9gwxeo','Casa Floresta','Minha mãe se confundiu com o que o parque oferece pelos anúncios\n','#FEF3C7','cmno39nwj0000iovdp54gm3kr','2026-05-04 03:46:15.168','2026-05-04 03:46:15.168',NULL,0,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PLANNING','IN_PROGRESS','COMPLETED','ON_HOLD','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PLANNING',
  `progress` int NOT NULL DEFAULT '0',
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_userId_idx` (`userId`),
  KEY `projects_userId_status_idx` (`userId`,`status`),
  CONSTRAINT `projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES ('cmp4ym6er00006svd79rnoxin','Vale Azul - Lava Roupa','Landing Page','IN_PROGRESS',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 03:59:34.900','2026-05-14 03:59:34.900','2026-05-17 15:00:00.000','2026-05-12 15:00:00.000'),('cmp4ympi700016svd9mzt75g7','Fernanda Quieroga','Landing Page - Vinicius','IN_PROGRESS',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 03:59:59.647','2026-05-14 03:59:59.647','2026-05-15 15:00:00.000','2026-05-12 15:00:00.000'),('cmp4yn6o500026svd78lb2c9x','Alterações Claris Clinica','Alterações no Drive','IN_PROGRESS',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:00:21.893','2026-05-14 04:00:21.893','2026-05-15 15:00:00.000',NULL),('cmp4yo3qs00036svda37mwrv1','Blog da SB','Estrutura do Blog para SB','IN_PROGRESS',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:01:04.756','2026-05-14 04:01:04.756','2026-05-18 15:00:00.000',NULL),('cmp4yolgr00046svdm4m6yamv','Restaurante Premium - Campos do Jordão','Restaurante Premium - Campos do Jordão','PLANNING',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:01:27.723','2026-05-14 04:01:27.723','2026-05-22 15:00:00.000',NULL),('cmp4yp8k300056svdpxwl109a','iGod','Aplicativo Web nas Sextas feiras','PLANNING',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:01:57.651','2026-05-14 04:01:57.651','2026-05-29 15:00:00.000','2026-05-13 15:00:00.000'),('cmp4yqpc800066svd9o96m0o0','Diabetes no Alvo - Curso','Landing Page para Profissionais','ON_HOLD',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:03:06.056','2026-05-14 04:03:06.056','2026-05-14 15:00:00.000',NULL),('cmp4yrgjm00076svdj0rbnlef','Moriah - Clínica Estética','Landing Page com Blog','PLANNING',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:03:41.314','2026-05-14 04:03:41.314','2026-05-29 15:00:00.000',NULL),('cmp4ys0lx00086svdovv5gjdy','Finalização Octaverta','Finalização Octaverta','IN_PROGRESS',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:04:07.317','2026-05-14 04:04:07.317','2026-05-18 15:00:00.000',NULL),('cmp4yu61a00096svd3igdnlpx','Finalização de Rigal Engenharia','Landing Page','ON_HOLD',0,'cmno39nwj0000iovdp54gm3kr','2026-05-14 04:05:47.662','2026-05-14 04:05:47.662','2026-05-16 15:00:00.000',NULL);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `dueDate` datetime(3) DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_userId_idx` (`userId`),
  KEY `tasks_userId_status_idx` (`userId`,`status`),
  KEY `tasks_userId_dueDate_idx` (`userId`,`dueDate`),
  KEY `tasks_projectId_idx` (`projectId`),
  KEY `tasks_categoryId_fkey` (`categoryId`),
  CONSTRAINT `tasks_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES ('cmnqz9ek5000f8svduuozu51a','Finalizar Octaverta',NULL,'COMPLETED','HIGH','2026-04-12 00:00:00.000','2026-04-10 02:55:58.990','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-09 04:29:09.749','2026-04-10 02:55:58.994'),('cmnqz9zts000g8svd6pjnmj8z','Fazer Integração da Multivegetal',NULL,'COMPLETED','HIGH','2026-04-11 00:00:00.000','2026-04-10 02:55:58.319','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-09 04:29:37.312','2026-04-10 02:55:58.344'),('cmnrjwuhs0000dcvdzx0rk1xk','Comprar ração',NULL,'COMPLETED','MEDIUM','2026-04-11 00:00:00.000','2026-04-09 14:07:40.052','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-09 14:07:15.808','2026-04-09 14:07:40.066'),('cmnsbr6ta0001u4vd2v9480ob','Design Thinking','Design Thinking - Validar','COMPLETED','HIGH','2026-04-11 15:00:00.000','2026-04-11 18:14:29.388','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-10 03:06:41.086','2026-04-11 18:14:29.402'),('cmnsuzxp000003kvd8hmk2y7q','Call com o heitor',NULL,'COMPLETED','URGENT','2026-04-10 00:00:00.000','2026-04-11 13:57:38.098','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-10 12:05:21.876','2026-04-11 13:57:38.141'),('cmnuniupe00003cvddrsoh4k9','Juntar informações para Multi Vegetal',NULL,'COMPLETED','MEDIUM','2026-04-12 00:00:00.000','2026-04-13 12:29:08.215','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-11 18:11:39.891','2026-04-13 12:29:08.237'),('cmnunmdk100013cvdjje2r97g','Terminar Site do Fator Verde',NULL,'COMPLETED','HIGH','2026-04-12 00:00:00.000','2026-04-12 20:12:50.944','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-11 18:14:24.289','2026-04-12 20:12:50.952'),('cmnunmw6r00023cvd3r0mqhd3','Continuar Site Octaverta',NULL,'COMPLETED','HIGH','2026-04-12 00:00:00.000','2026-04-13 12:29:09.051','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-11 18:14:48.435','2026-04-13 12:29:09.056'),('cmnunpfs400033cvd4rws6zpr','Ajudar na Claris',NULL,'COMPLETED','MEDIUM','2026-04-12 00:00:00.000','2026-04-12 00:39:11.436','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-11 18:16:47.140','2026-04-12 00:39:11.465'),('cmnunq5et00043cvd6ypdzvhk','Continuar Estudo de Prompts para AIs',NULL,'COMPLETED','HIGH','2026-04-12 00:00:00.000','2026-04-12 20:12:48.363','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-11 18:17:20.357','2026-04-12 20:12:48.404'),('cmnv1gczh0001nkvdzm5ns0ni','Teste',NULL,'COMPLETED','LOW',NULL,'2026-04-12 00:42:29.385','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-12 00:41:38.237','2026-04-12 00:42:29.391'),('cmnx66hea0000g8vduhsgwiii','Fazer Reunião 13h30 Multivegetal',NULL,'COMPLETED','HIGH','2026-04-13 00:00:00.000','2026-04-14 01:27:03.363','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-13 12:29:27.827','2026-04-14 01:27:03.395'),('cmnx66rs30001g8vd7gpxv7cj','Reunião 18h com a Kelly',NULL,'COMPLETED','MEDIUM','2026-04-13 00:00:00.000','2026-04-14 01:27:04.092','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-13 12:29:41.283','2026-04-14 01:27:04.099'),('cmnx6720b0002g8vd51x5lwka','Alterações Octaverta',NULL,'COMPLETED','HIGH','2026-04-14 00:00:00.000','2026-04-14 02:52:44.912','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-13 12:29:54.539','2026-04-14 02:52:44.950'),('cmnx6fz9w0003g8vd3cif8k36','Reunião Diabetes 18h',NULL,'COMPLETED','HIGH','2026-04-14 00:00:00.000','2026-04-15 04:18:25.908','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-13 12:36:50.900','2026-04-15 04:18:25.911'),('cmnx6ulya0004g8vd44aciief','Mandar msg para Claris',NULL,'COMPLETED','HIGH','2026-04-13 00:00:00.000','2026-04-13 12:59:19.887','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-13 12:48:13.474','2026-04-13 12:59:19.894'),('cmnx7jo0x0005g8vdcpjoflzp','Revisar Estado Costa Flores',NULL,'COMPLETED','HIGH','2026-04-14 00:00:00.000','2026-04-14 02:58:18.288','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-13 13:07:42.561','2026-04-14 02:58:18.296'),('cmnxxzwmq0000twvdcn9svd27','Refazer Copy da Eleva',NULL,'COMPLETED','HIGH','2026-04-14 00:00:00.000','2026-04-16 03:22:00.893','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-14 01:28:10.227','2026-04-16 03:22:00.906'),('cmnxyegr80001twvd2usccmel','Ajustes no Fator Verde',NULL,'COMPLETED','HIGH','2026-04-14 00:00:00.000','2026-04-15 04:18:25.135','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-14 01:39:29.492','2026-04-15 04:18:25.153'),('cmo0x1ipd000114vd9ityanbi','Copywriting',NULL,'COMPLETED','HIGH',NULL,'2026-04-16 03:25:42.044','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:24:44.401','2026-04-16 03:25:42.049'),('cmo0x1p33000214vd17huhoyq','Design Wireframe',NULL,'COMPLETED','HIGH',NULL,'2026-04-16 03:25:40.438','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:24:52.671','2026-04-16 03:25:40.445'),('cmo0x1yqs000314vd1uh3wbwl','Desenvolvimento de Páginas','Páginas Institucionais Internas','COMPLETED','HIGH','2026-04-17 15:00:00.000','2026-04-16 03:25:43.460','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:25:05.188','2026-04-16 03:25:43.466'),('cmo0x2k1h000414vdsp4eauyn','Desenvolvimento de Vitrine',NULL,'COMPLETED','HIGH',NULL,'2026-05-04 00:16:29.353','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:25:32.789','2026-05-04 00:16:29.370'),('cmo0x2o8u000514vdqz5ri0jj','Finalização',NULL,'COMPLETED','HIGH',NULL,'2026-04-21 12:31:27.992','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:25:38.238','2026-04-21 12:31:27.996'),('cmo0x9vyq000614vdsfy2ayau','Desenvolvimento',NULL,'COMPLETED','HIGH',NULL,'2026-04-21 12:27:21.890','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:31:14.834','2026-04-21 12:27:21.915'),('cmo0xanfr000814vd50qpyq7d','Reunião de alinhamento',NULL,'COMPLETED','HIGH',NULL,'2026-04-16 03:32:08.469','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:31:50.439','2026-04-16 03:32:08.474'),('cmo0xaryn000914vduo9txsjk','Analise de Design',NULL,'COMPLETED','HIGH',NULL,'2026-04-16 03:32:07.665','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:31:56.303','2026-04-16 03:32:07.670'),('cmo0xavow000a14vd2bo9d12k','Desenvolvimento',NULL,'COMPLETED','HIGH',NULL,'2026-04-21 12:31:27.180','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:32:01.136','2026-04-21 12:31:27.184'),('cmo0xazev000b14vdtl73sf7t','Entrega',NULL,'COMPLETED','HIGH',NULL,'2026-04-21 12:31:26.391','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-16 03:32:05.959','2026-04-21 12:31:26.394'),('cmo2u3fow00006wvdjsc11i2j','Teste','Teste','COMPLETED','HIGH','2026-04-18 15:00:00.000','2026-05-04 00:16:43.688','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-17 11:37:47.312','2026-05-04 00:16:43.692'),('cmo2ubps700036wvd4hom4r90','UX Research',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-04 00:16:44.065','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-17 11:44:13.639','2026-05-04 00:16:44.071'),('cmo2ubyjb00046wvdub7b112x','Desenvolvimento',NULL,'COMPLETED','MEDIUM',NULL,'2026-04-17 11:44:38.072','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-17 11:44:24.984','2026-04-17 11:44:38.088'),('cmo8lnebd00007ovd1rprmlyk','Finalizar a Octaverta','Finalizar a Octaverta','COMPLETED','URGENT','2026-04-21 15:00:00.000','2026-05-04 00:16:28.555','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-21 12:27:59.161','2026-05-04 00:16:28.562'),('cmo8lo1vl00017ovd84loqxu3','Finalizar Claris (máximo possível para enviar)','Finalizar Claris (máximo possível para enviar)','COMPLETED','URGENT','2026-04-21 15:00:00.000','2026-05-04 00:16:41.774','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-21 12:28:29.697','2026-05-04 00:16:41.780'),('cmo8lou7700027ovd99hbj4hf','Subir site no domínio da Eleva','Subir site no domínio da Eleva','COMPLETED','HIGH','2026-04-21 15:00:00.000','2026-05-04 00:16:43.237','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-21 12:29:06.403','2026-05-04 00:16:43.244'),('cmoak6klw0000m4vd0e6knmvo','Reunião com a Kelly',NULL,'COMPLETED','URGENT','2026-04-22 00:00:00.000','2026-05-04 00:16:42.703','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-04-22 21:22:26.900','2026-05-04 00:16:42.711'),('cmoqgt1jo000agovdj6f8y40s','Reunião com Kelly 14h',NULL,'COMPLETED','MEDIUM','2026-05-04 00:00:00.000','2026-05-05 00:24:05.060','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-04 00:32:15.637','2026-05-05 00:24:05.069'),('cmoqgzeha000bgovd1hh04iet','Enviar e Revisar Proposta Personalis',NULL,'COMPLETED','HIGH','2026-05-04 00:00:00.000','2026-05-05 00:24:03.384','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-04 00:37:12.334','2026-05-05 00:24:03.394'),('cmoqgzocp000cgovddsccc6zt','Validar The One Office',NULL,'COMPLETED','MEDIUM','2026-05-04 00:00:00.000','2026-05-05 00:24:04.242','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-04 00:37:25.129','2026-05-05 00:24:04.249'),('cmoqh4tki000dgovdldiv10k2','Mandar outra Mensagem para Mayara',NULL,'COMPLETED','URGENT','2026-05-04 00:00:00.000','2026-05-05 00:24:02.153','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-04 00:41:25.170','2026-05-05 00:24:02.193'),('cmorvyomr000020vdzip5scyr','Finalizar Alterações Kelly',NULL,'COMPLETED','URGENT','2026-05-04 00:00:00.000','2026-05-13 01:28:09.404','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-05 00:24:19.251','2026-05-13 01:28:09.408'),('cmorvz03v000120vd6rgtdm9d','Fazer alterações restantes da Octaverta',NULL,'COMPLETED','HIGH',NULL,'2026-05-13 01:28:08.856','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-05 00:24:34.123','2026-05-13 01:28:08.881'),('cmp3dtbeq00009cvd95ua17i4','Subir Produtos da Octaverta','Subir Produtos da Octaverta - Falar sobre os 480 sem imagens que subiram','COMPLETED','URGENT','2026-05-13 15:00:00.000','2026-05-13 03:10:42.853','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-13 01:29:29.858','2026-05-13 03:10:42.867'),('cmp3dtkjw00019cvd15fopbo9','Entrar no Mercado Livre da Multivegetal','Entrar no Mercado Livre da Multivegetal','COMPLETED','HIGH',NULL,'2026-05-13 01:59:39.126','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-13 01:29:41.708','2026-05-13 01:59:39.143'),('cmp3dxt9w00029cvd70do34sa','Finalizar Site da Lava Roupa','Finalizar Site da Lava Roupa','COMPLETED','HIGH','2026-05-14 15:00:00.000','2026-05-14 03:59:09.129','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-13 01:32:59.636','2026-05-14 03:59:09.144'),('cmp3dy6fa00039cvd14kkyknk','Finalizar Site da Professora de Inglês','Finalizar Site da Professora de Inglês','COMPLETED','HIGH','2026-05-15 15:00:00.000','2026-05-14 03:59:09.052','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-13 01:33:16.678','2026-05-14 03:59:09.065'),('cmp3e2oma00049cvd34bvbde1','Resolver Etiquetas da Lauvic','Resolver Etiquetas da Lauvic','COMPLETED','HIGH','2026-05-13 15:00:00.000','2026-05-13 01:59:42.820','cmno39nwj0000iovdp54gm3kr',NULL,NULL,'2026-05-13 01:36:46.882','2026-05-13 01:59:42.834'),('cmp4yxa8c000a6svdgqdhbeth','Copy',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:08:30.965','cmno39nwj0000iovdp54gm3kr','cmp4ympi700016svd9mzt75g7',NULL,'2026-05-14 04:08:13.069','2026-05-14 04:08:30.969'),('cmp4yxdw3000b6svd74mhi8a1','Design',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:08:30.332','cmno39nwj0000iovdp54gm3kr','cmp4ympi700016svd9mzt75g7',NULL,'2026-05-14 04:08:17.811','2026-05-14 04:08:30.337'),('cmp4yxgpj000c6svdy28y1kqa','Desenvolvimento',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:08:29.450','cmno39nwj0000iovdp54gm3kr','cmp4ympi700016svd9mzt75g7',NULL,'2026-05-14 04:08:21.463','2026-05-14 04:08:29.458'),('cmp4yxloi000d6svdu1z7oxvi','1° Revisao',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4ympi700016svd9mzt75g7',NULL,'2026-05-14 04:08:27.906','2026-05-14 04:08:27.906'),('cmp4yy0j1000e6svd13mxh6w4','Copy',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:03.547','cmno39nwj0000iovdp54gm3kr','cmp4ym6er00006svd79rnoxin',NULL,'2026-05-14 04:08:47.149','2026-05-14 04:09:03.553'),('cmp4yy4ga000f6svd31axm0br','Design',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:02.400','cmno39nwj0000iovdp54gm3kr','cmp4ym6er00006svd79rnoxin',NULL,'2026-05-14 04:08:52.234','2026-05-14 04:09:02.408'),('cmp4yy7ex000g6svdu9kp5yvp','Desenvolvimento',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:03.045','cmno39nwj0000iovdp54gm3kr','cmp4ym6er00006svd79rnoxin',NULL,'2026-05-14 04:08:56.073','2026-05-14 04:09:03.050'),('cmp4yyagd000h6svd9uhw6j1o','1 revisão',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4ym6er00006svd79rnoxin',NULL,'2026-05-14 04:09:00.013','2026-05-14 04:09:00.013'),('cmp4yyp29000i6svd9d2zczpf','Desenvolvimento',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:25.203','cmno39nwj0000iovdp54gm3kr','cmp4yn6o500026svd78lb2c9x',NULL,'2026-05-14 04:09:18.945','2026-05-14 04:09:25.213'),('cmp4yyt7o000j6svdzelo8y09','Ultima revisão',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yn6o500026svd78lb2c9x',NULL,'2026-05-14 04:09:24.324','2026-05-14 04:09:27.856'),('cmp4yz26t000k6svdqny3q4jq','1 revisão',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:37.418','cmno39nwj0000iovdp54gm3kr','cmp4yn6o500026svd78lb2c9x',NULL,'2026-05-14 04:09:35.957','2026-05-14 04:09:37.422'),('cmp4yz973000l6svdruee0h2o','Design',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:46.361','cmno39nwj0000iovdp54gm3kr','cmp4yn6o500026svd78lb2c9x',NULL,'2026-05-14 04:09:45.039','2026-05-14 04:09:46.368'),('cmp4yzd2v000m6svd04voz59w','Reunião',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:09:51.011','cmno39nwj0000iovdp54gm3kr','cmp4yn6o500026svd78lb2c9x',NULL,'2026-05-14 04:09:50.072','2026-05-14 04:09:51.019'),('cmp4yzmu0000n6svd4btm206z','Estrutura',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:10:06.697','cmno39nwj0000iovdp54gm3kr','cmp4yo3qs00036svda37mwrv1',NULL,'2026-05-14 04:10:02.712','2026-05-14 04:10:06.702'),('cmp4yzoug000o6svd6xc9rxt8','Posts',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yo3qs00036svda37mwrv1',NULL,'2026-05-14 04:10:05.320','2026-05-14 04:10:05.320'),('cmp4yzuy6000p6svd7iuebupe','Planejamento',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:10:31.965','cmno39nwj0000iovdp54gm3kr','cmp4yolgr00046svdm4m6yamv',NULL,'2026-05-14 04:10:13.230','2026-05-14 04:10:31.971'),('cmp4yzwxz000q6svd3oxr4f6f','Copy',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:10:31.166','cmno39nwj0000iovdp54gm3kr','cmp4yolgr00046svdm4m6yamv',NULL,'2026-05-14 04:10:15.815','2026-05-14 04:10:31.173'),('cmp4yzzzt000r6svdye5rz4od','Design',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yolgr00046svdm4m6yamv',NULL,'2026-05-14 04:10:19.769','2026-05-14 04:10:19.769'),('cmp4z02pg000s6svd89cmtx2c','Desenvolvimento',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yolgr00046svdm4m6yamv',NULL,'2026-05-14 04:10:23.284','2026-05-14 04:10:23.284'),('cmp4z07bd000t6svdmrref3ai','1° Revisão',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yolgr00046svdm4m6yamv',NULL,'2026-05-14 04:10:29.257','2026-05-14 04:10:29.257'),('cmp4z0fzm000u6svd9t1n2yu5','Criação de contrato',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yp8k300056svdpxwl109a',NULL,'2026-05-14 04:10:40.498','2026-05-14 04:10:51.471'),('cmp4z0lvh000v6svdv917ci4t','Desenvolvimento 1° Sexta',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yp8k300056svdpxwl109a',NULL,'2026-05-14 04:10:48.125','2026-05-14 04:10:48.125'),('cmp4z0wwt000w6svd15nih6kp','Copy e Estrutura',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:11:08.416','cmno39nwj0000iovdp54gm3kr','cmp4yqpc800066svd9o96m0o0',NULL,'2026-05-14 04:11:02.430','2026-05-14 04:11:08.419'),('cmp4z10t7000x6svdw3z7ktb9','1° Revisão',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yqpc800066svd9o96m0o0',NULL,'2026-05-14 04:11:07.483','2026-05-14 04:11:07.483'),('cmp4z16hb000y6svdof4ht4d9','Planejamento',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yrgjm00076svdj0rbnlef',NULL,'2026-05-14 04:11:14.831','2026-05-14 04:11:14.831'),('cmp4z18id000z6svdbf28r5mr','Contrato',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:11:23.876','cmno39nwj0000iovdp54gm3kr','cmp4yrgjm00076svdj0rbnlef',NULL,'2026-05-14 04:11:17.461','2026-05-14 04:11:23.883'),('cmp4z1cik00106svdvwes5j0s','Desenvolvimento',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yrgjm00076svdj0rbnlef',NULL,'2026-05-14 04:11:22.652','2026-05-14 04:11:22.652'),('cmp4z1li300116svd9tal9k18','Subir ultimos Produtos',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4ys0lx00086svdovv5gjdy',NULL,'2026-05-14 04:11:34.299','2026-05-14 04:11:34.299'),('cmp4z1pku00126svdfome85ie','Subir no domínio principal',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4ys0lx00086svdovv5gjdy',NULL,'2026-05-14 04:11:39.582','2026-05-14 04:11:39.582'),('cmp4z1v5l00136svdnz8dk3qh','Subir Headman',NULL,'COMPLETED','MEDIUM',NULL,'2026-05-14 04:11:50.375','cmno39nwj0000iovdp54gm3kr','cmp4ys0lx00086svdovv5gjdy',NULL,'2026-05-14 04:11:46.809','2026-05-14 04:11:50.381'),('cmp4z280m00146svd0ywarsm1','Aguardando aprovação',NULL,'PENDING','MEDIUM',NULL,NULL,'cmno39nwj0000iovdp54gm3kr','cmp4yu61a00096svd3igdnlpx',NULL,'2026-05-14 04:12:03.478','2026-05-14 04:12:03.478');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan` enum('FREE','PRO','BUSINESS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FREE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmno39nwj0000iovdp54gm3kr','Victor','dev@organizacaofacil.com.br','$2b$12$HJXQCW5g8CdeENHEfOfsK.ChbFCKvPcICu9sYa6A1GQbFSlP.y5/i','PRO','2026-04-07 03:58:01.796','2026-04-07 04:28:54.610');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-14 20:40:51
