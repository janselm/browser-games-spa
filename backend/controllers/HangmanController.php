<?php

require_once __DIR__ . '/../config/database.php';

/**
 * HangmanController — serves words for the hangman game using a session-based
 * rotation system.
 *
 * Each player gets a browser cookie containing a UUID that maps to a
 * hangman_sessions row. The session stores a Fisher-Yates-shuffled array of
 * all active word IDs and a position pointer. Words are served in order;
 * when the list is exhausted a fresh session is created. Sessions expire
 * after one hour of inactivity.
 */
class HangmanController {

    private const COOKIE_NAME = 'hangman_session';

    public function getWord(): array {
        $pdo = Database::getInstance();

        // Occasional expired-session cleanup (~1 % of requests)
        if (random_int(1, 100) === 1) {
            $pdo->exec("DELETE FROM hangman_sessions WHERE expires_at < NOW()");
        }

        $session = $this->loadSession($pdo);
        if (!$session) {
            $session = $this->createSession($pdo);
            if (!$session) {
                http_response_code(404);
                return ['success' => false, 'error' => 'No words available'];
            }
            $this->setCookie($session['session_id']);
        }

        $wordOrder = $this->parseIntArray($session['word_order']);
        $position  = (int) $session['position'];

        // Exhausted the list — create a fresh shuffled session
        if ($position >= count($wordOrder)) {
            $pdo->prepare("DELETE FROM hangman_sessions WHERE session_id = CAST(:sid AS UUID)")
                ->execute([':sid' => $session['session_id']]);
            $session = $this->createSession($pdo);
            if (!$session) {
                http_response_code(404);
                return ['success' => false, 'error' => 'No words available'];
            }
            $this->setCookie($session['session_id']);
            $wordOrder = $this->parseIntArray($session['word_order']);
            $position  = 0;
        }

        $wordId = $wordOrder[$position];

        $stmt = $pdo->prepare(
            "SELECT id, word, hint, difficulty
               FROM hangman_words
              WHERE id = :id AND active = TRUE"
        );
        $stmt->execute([':id' => $wordId]);
        $word = $stmt->fetch();

        // Always advance the position (skip deactivated words gracefully)
        $pdo->prepare(
            "UPDATE hangman_sessions SET position = position + 1
              WHERE session_id = CAST(:sid AS UUID)"
        )->execute([':sid' => $session['session_id']]);

        if (!$word) {
            // Word deactivated since session was built; client retries
            http_response_code(404);
            return ['success' => false, 'error' => 'Word unavailable'];
        }

        return ['success' => true, 'data' => $word];
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Loads an existing session from the database using the hangman_session cookie.
     * Returns null if no cookie is present, the UUID is invalid, or the session
     * has expired.
     */
    private function loadSession(\PDO $pdo): ?array {
        $id = $_COOKIE[self::COOKIE_NAME] ?? null;
        if (!$id || !$this->isValidUuid($id)) return null;

        $stmt = $pdo->prepare(
            "SELECT session_id, word_order, position
               FROM hangman_sessions
              WHERE session_id = CAST(:sid AS UUID)
                AND expires_at > NOW()"
        );
        $stmt->execute([':sid' => $id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Creates a new session with a Fisher-Yates-shuffled list of all active word IDs.
     * Stores the order as a PostgreSQL integer array and sets a 1-hour expiry.
     * Returns null if there are no active words to serve.
     */
    private function createSession(\PDO $pdo): ?array {
        $stmt = $pdo->query("SELECT id FROM hangman_words WHERE active = TRUE");
        $ids  = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (empty($ids)) return null;

        // Fisher-Yates shuffle
        for ($i = count($ids) - 1; $i > 0; $i--) {
            $j       = random_int(0, $i);
            [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
        }

        $sessionId = $this->generateUuid();
        $pgArray   = '{' . implode(',', $ids) . '}';

        $stmt = $pdo->prepare(
            "INSERT INTO hangman_sessions (session_id, word_order, expires_at)
             VALUES (CAST(:sid AS UUID), :order, NOW() + INTERVAL '1 hour')
             RETURNING session_id, word_order, position"
        );
        $stmt->execute([':sid' => $sessionId, ':order' => $pgArray]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Parses a PostgreSQL integer array literal (e.g. "{1,2,3}") into a PHP array.
     */
    private function parseIntArray(string $pgArray): array {
        $inner = trim($pgArray, '{}');
        if ($inner === '') return [];
        return array_map('intval', explode(',', $inner));
    }

    /** RFC-4122 v4 UUID */
    private function generateUuid(): string {
        $data    = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Validates that a string matches the RFC-4122 v4 UUID format.
     * Used to sanitise the session cookie value before using it in a query.
     */
    private function isValidUuid(string $value): bool {
        return (bool) preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $value
        );
    }

    /**
     * Sets the hangman session cookie. httponly prevents JS access;
     * SameSite=Lax protects against CSRF while allowing normal navigation.
     */
    private function setCookie(string $sessionId): void {
        setcookie(self::COOKIE_NAME, $sessionId, [
            'expires'  => time() + 3600,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}
