<?php

// Load .env file into the environment (no Composer required)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line[0] === '#' || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value));
    }
}

session_start();

// CORS headers — always set
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/controllers/HangmanController.php';
require_once __DIR__ . '/controllers/TypegameController.php';
require_once __DIR__ . '/controllers/WordSearchController.php';
require_once __DIR__ . '/controllers/AdminController.php';

/**
 * Halts the request with 401 if the current session is not authenticated.
 * Called before every admin route handler.
 */
function requireAdminAuth(): void {
    if (empty($_SESSION['admin'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }
}

/**
 * Halts the request with 429 if the given IP has exceeded 5 failed login
 * attempts within the last 15 minutes. Attempt counts are stored as JSON
 * files in the system temp directory.
 */
function checkLoginRateLimit(string $ip): void {
    $file     = sys_get_temp_dir() . '/login_' . md5($ip) . '.json';
    $now      = time();
    $attempts = file_exists($file)
        ? (json_decode(file_get_contents($file), true) ?? [])
        : [];

    $attempts = array_values(array_filter($attempts, fn($t) => $now - $t < 15 * 60));

    if (count($attempts) >= 5) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many login attempts. Try again in 15 minutes.']);
        exit;
    }
}

/**
 * Records a failed login attempt for the given IP.
 * Timestamps older than 15 minutes are pruned before writing.
 * Uses LOCK_EX for atomic file writes under concurrent requests.
 */
function recordLoginAttempt(string $ip): void {
    $file     = sys_get_temp_dir() . '/login_' . md5($ip) . '.json';
    $now      = time();
    $attempts = file_exists($file)
        ? (json_decode(file_get_contents($file), true) ?? [])
        : [];

    $attempts   = array_values(array_filter($attempts, fn($t) => $now - $t < 15 * 60));
    $attempts[] = $now;
    file_put_contents($file, json_encode($attempts), LOCK_EX);
}

/**
 * Clears the failed-attempt record for the given IP after a successful login.
 */
function clearLoginAttempts(string $ip): void {
    $file = sys_get_temp_dir() . '/login_' . md5($ip) . '.json';
    if (file_exists($file)) unlink($file);
}

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    // ── Auth routes ───────────────────────────────────────────────────────────
    if ($method === 'POST' && $path === '/api/admin/login') {
        $ip = $_SERVER['REMOTE_ADDR'];
        checkLoginRateLimit($ip);

        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';

        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare('SELECT password FROM users WHERE username = :username');
        $stmt->execute([':username' => $username]);
        $row  = $stmt->fetch();

        if ($row && password_verify($password, $row['password'])) {
            clearLoginAttempts($ip);
            $_SESSION['admin'] = true;
            echo json_encode(['success' => true, 'data' => null]);
        } else {
            recordLoginAttempt($ip);
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        }

    } elseif ($method === 'POST' && $path === '/api/admin/logout') {
        session_destroy();
        echo json_encode(['success' => true, 'data' => null]);

    } elseif ($method === 'GET' && $path === '/api/admin/check') {
        requireAdminAuth();
        echo json_encode(['success' => true, 'data' => null]);

    // ── Game routes ───────────────────────────────────────────────────────────
    } elseif ($method === 'GET' && $path === '/api/hangman/word') {
        $controller = new HangmanController();
        echo json_encode($controller->getWord());

    } elseif ($method === 'GET' && $path === '/api/wordsearch/words') {
        $controller = new WordSearchController();
        echo json_encode($controller->getWords());

    // ── Admin — Hangman ───────────────────────────────────────────────────────
    } elseif ($method === 'GET' && $path === '/api/admin/hangman/words') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->listHangmanWords());

    } elseif ($method === 'POST' && $path === '/api/admin/hangman/words') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->createHangmanWord());

    } elseif ($method === 'POST' && $path === '/api/admin/hangman/words/bulk') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->bulkCreateHangmanWords());

    } elseif ($method === 'DELETE' && $path === '/api/admin/hangman/words/bulk') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->bulkDeleteHangmanWords());

    } elseif (preg_match('#^/api/admin/hangman/words/(\d+)$#', $path, $m)) {
        requireAdminAuth();
        $controller = new AdminController();
        if ($method === 'PUT') {
            echo json_encode($controller->updateHangmanWord((int)$m[1]));
        } elseif ($method === 'DELETE') {
            echo json_encode($controller->deleteHangmanWord((int)$m[1]));
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        }

    // ── Admin — Word Search ───────────────────────────────────────────────────
    } elseif ($method === 'GET' && $path === '/api/admin/wordsearch/words') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->listWordsearchWords());

    } elseif ($method === 'POST' && $path === '/api/admin/wordsearch/words') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->createWordsearchWord());

    } elseif ($method === 'POST' && $path === '/api/admin/wordsearch/words/bulk') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->bulkCreateWordsearchWords());

    } elseif ($method === 'DELETE' && $path === '/api/admin/wordsearch/words/bulk') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->bulkDeleteWordsearchWords());

    } elseif (preg_match('#^/api/admin/wordsearch/words/(\d+)$#', $path, $m)) {
        requireAdminAuth();
        $controller = new AdminController();
        if ($method === 'PUT') {
            echo json_encode($controller->updateWordsearchWord((int)$m[1]));
        } elseif ($method === 'DELETE') {
            echo json_encode($controller->deleteWordsearchWord((int)$m[1]));
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        }

    // ── Admin — Leaderboard ───────────────────────────────────────────────────
    } elseif ($method === 'GET' && $path === '/api/admin/leaderboard') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->listLeaderboard());

    } elseif ($method === 'DELETE' && $path === '/api/admin/leaderboard/bulk') {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->bulkDeleteScores());

    } elseif ($method === 'DELETE' && preg_match('#^/api/admin/leaderboard/(\d+)$#', $path, $m)) {
        requireAdminAuth();
        $controller = new AdminController();
        echo json_encode($controller->deleteScore((int)$m[1]));

    } elseif ($method === 'GET' && $path === '/api/leaderboard.php') {
        $difficulty = (int)($_GET['difficulty'] ?? 0);
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $controller = new TypegameController();
        echo json_encode($controller->getLeaderboard($difficulty, $limit));

    } elseif ($method === 'POST' && $path === '/api/leaderboard.php') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $controller = new TypegameController();
        echo json_encode($controller->saveScore($body));

    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Not found']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
