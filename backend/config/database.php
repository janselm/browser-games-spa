<?php

/**
 * Database — PDO singleton factory.
 *
 * The application uses three separate PostgreSQL connections:
 *   - getInstance()       game user  (games DB)   — used by game controllers for reads
 *   - getAdminInstance()  admin user (games DB)   — used by AdminController for word CRUD
 *   - getTypegameInstance() typegame user (typegame DB) — used for leaderboard scores
 *
 * All credentials are read from environment variables (set via .env).
 */
class Database {
    private static ?PDO $instance         = null;
    private static ?PDO $adminInstance    = null;
    private static ?PDO $typegameInstance = null;

    /**
     * Returns a PDO connection for the game user.
     * This account has limited permissions — suitable for game-play reads.
     */
    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dsn = "pgsql:host=" . getenv('DB_HOST') . ";port=" . getenv('DB_PORT') . ";dbname=" . getenv('DB_NAME');
            self::$instance = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        }
        return self::$instance;
    }

    /**
     * Returns a PDO connection for the admin user.
     * This account has full CRUD access to the word tables and user table.
     */
    public static function getAdminInstance(): PDO {
        if (self::$adminInstance === null) {
            $dsn = "pgsql:host=" . getenv('DB_HOST') . ";port=" . getenv('DB_PORT') . ";dbname=" . getenv('DB_NAME');
            self::$adminInstance = new PDO($dsn, getenv('DB_ADMIN_USER'), getenv('DB_ADMIN_PASS'), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        }
        return self::$adminInstance;
    }

    /**
     * Returns a PDO connection for the typegame leaderboard database.
     * This is a separate PostgreSQL database (typegame) from the main games database.
     */
    public static function getTypegameInstance(): PDO {
        if (self::$typegameInstance === null) {
            $dsn = "pgsql:host=" . getenv('TYPEGAME_HOST') . ";port=" . getenv('TYPEGAME_PORT') . ";dbname=" . getenv('TYPEGAME_DB');
            self::$typegameInstance = new PDO($dsn, getenv('TYPEGAME_USER'), getenv('TYPEGAME_PASS'), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        }
        return self::$typegameInstance;
    }
}
