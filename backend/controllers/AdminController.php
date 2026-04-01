<?php

require_once __DIR__ . '/../config/database.php';

/**
 * AdminController — CRUD operations for the admin panel.
 *
 * Manages hangman words, word search words, and the typegame leaderboard.
 * All methods use the admin database instance except leaderboard methods,
 * which use the typegame instance.
 * All routes that call these methods require prior authentication via requireAdminAuth().
 */
class AdminController {

    // ── Hangman ──────────────────────────────────────────────────────────────

    /**
     * Returns all hangman words ordered by ID.
     *
     * @return array Success envelope with data array of { id, word, hint, difficulty, active }
     */
    public function listHangmanWords(): array {
        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->query(
            "SELECT id, word, hint, difficulty, active
               FROM hangman_words
              ORDER BY id"
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Creates a single hangman word. Word is stored uppercase; hint is trimmed.
     * Requires: word, hint, difficulty in request body.
     *
     * @return array Success envelope with the created row, or 400 on validation failure
     */
    public function createHangmanWord(): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['word']) || empty($body['hint']) || empty($body['difficulty'])) {
            http_response_code(400);
            return ['success' => false, 'error' => 'word, hint, and difficulty are required'];
        }

        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare(
            "INSERT INTO hangman_words (word, hint, difficulty, active)
             VALUES (:word, :hint, :difficulty, :active)
             RETURNING id, word, hint, difficulty, active"
        );
        $stmt->execute([
            ':word'       => strtoupper(trim($body['word'])),
            ':hint'       => trim($body['hint']),
            ':difficulty' => $body['difficulty'],
            ':active'     => isset($body['active']) ? (bool)$body['active'] : true,
        ]);
        return ['success' => true, 'data' => $stmt->fetch()];
    }

    /**
     * Partially updates a hangman word. Only fields present in the request body are changed.
     *
     * @param int $id Word ID
     * @return array Success envelope with the updated row, or 404 if not found
     */
    public function updateHangmanWord(int $id): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo    = Database::getAdminInstance();
        $fields = [];
        $params = [':id' => $id];

        if (isset($body['word'])) {
            $fields[] = 'word = :word';
            $params[':word'] = strtoupper(trim($body['word']));
        }
        if (isset($body['hint'])) {
            $fields[] = 'hint = :hint';
            $params[':hint'] = trim($body['hint']);
        }
        if (isset($body['difficulty'])) {
            $fields[] = 'difficulty = :difficulty';
            $params[':difficulty'] = $body['difficulty'];
        }
        if (isset($body['active'])) {
            $fields[] = 'active = :active';
            $params[':active'] = (bool)$body['active'];
        }

        if (empty($fields)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'No fields to update'];
        }

        $sql  = 'UPDATE hangman_words SET ' . implode(', ', $fields)
              . ' WHERE id = :id RETURNING id, word, hint, difficulty, active';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $row  = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            return ['success' => false, 'error' => 'Word not found'];
        }
        return ['success' => true, 'data' => $row];
    }

    /**
     * Deletes a hangman word by ID.
     *
     * @param int $id Word ID
     * @return array Success envelope, or 404 if not found
     */
    public function deleteHangmanWord(int $id): array {
        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare('DELETE FROM hangman_words WHERE id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            return ['success' => false, 'error' => 'Word not found'];
        }
        return ['success' => true, 'data' => null];
    }

    // ── Word Search ───────────────────────────────────────────────────────────

    /**
     * Returns all word search words ordered by ID.
     *
     * @return array Success envelope with data array of { id, word, category, active }
     */
    public function listWordsearchWords(): array {
        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->query(
            "SELECT id, word, category, active
               FROM word_search_words
              ORDER BY id"
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Creates a single word search word. Word is stored uppercase; category is trimmed.
     * Requires: word, category in request body.
     *
     * @return array Success envelope with the created row, or 400 on validation failure
     */
    public function createWordsearchWord(): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['word']) || empty($body['category'])) {
            http_response_code(400);
            return ['success' => false, 'error' => 'word and category are required'];
        }

        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare(
            "INSERT INTO word_search_words (word, category, active)
             VALUES (:word, :category, :active)
             RETURNING id, word, category, active"
        );
        $stmt->execute([
            ':word'     => strtoupper(trim($body['word'])),
            ':category' => trim($body['category']),
            ':active'   => isset($body['active']) ? (bool)$body['active'] : true,
        ]);
        return ['success' => true, 'data' => $stmt->fetch()];
    }

    /**
     * Partially updates a word search word. Only fields present in the request body are changed.
     *
     * @param int $id Word ID
     * @return array Success envelope with the updated row, or 404 if not found
     */
    public function updateWordsearchWord(int $id): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo    = Database::getAdminInstance();
        $fields = [];
        $params = [':id' => $id];

        if (isset($body['word'])) {
            $fields[] = 'word = :word';
            $params[':word'] = strtoupper(trim($body['word']));
        }
        if (isset($body['category'])) {
            $fields[] = 'category = :category';
            $params[':category'] = trim($body['category']);
        }
        if (isset($body['active'])) {
            $fields[] = 'active = :active';
            $params[':active'] = (bool)$body['active'];
        }

        if (empty($fields)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'No fields to update'];
        }

        $sql  = 'UPDATE word_search_words SET ' . implode(', ', $fields)
              . ' WHERE id = :id RETURNING id, word, category, active';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $row  = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            return ['success' => false, 'error' => 'Word not found'];
        }
        return ['success' => true, 'data' => $row];
    }

    /**
     * Deletes a word search word by ID.
     *
     * @param int $id Word ID
     * @return array Success envelope, or 404 if not found
     */
    public function deleteWordsearchWord(int $id): array {
        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare('DELETE FROM word_search_words WHERE id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            return ['success' => false, 'error' => 'Word not found'];
        }
        return ['success' => true, 'data' => null];
    }

    // ── Bulk operations ───────────────────────────────────────────────────────

    /**
     * Creates multiple hangman words in one request.
     * Input: { words: [{ word, hint, difficulty? }, ...] }
     * Invalid or incomplete entries are silently skipped.
     *
     * @return array Success envelope with array of created rows
     */
    public function bulkCreateHangmanWords(): array {
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $words = $body['words'] ?? [];

        if (empty($words) || !is_array($words)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'words array is required'];
        }

        $pdo     = Database::getAdminInstance();
        $created = [];

        foreach ($words as $item) {
            $word       = strtoupper(trim($item['word'] ?? ''));
            $hint       = trim($item['hint'] ?? '');
            $difficulty = in_array($item['difficulty'] ?? '', ['easy', 'medium', 'hard'])
                          ? $item['difficulty'] : 'medium';

            if ($word === '' || $hint === '') continue;

            $stmt = $pdo->prepare(
                "INSERT INTO hangman_words (word, hint, difficulty, active)
                 VALUES (:word, :hint, :difficulty, :active)
                 RETURNING id, word, hint, difficulty, active"
            );
            $stmt->execute([
                ':word'       => $word,
                ':hint'       => $hint,
                ':difficulty' => $difficulty,
                ':active'     => true,
            ]);
            $created[] = $stmt->fetch();
        }

        return ['success' => true, 'data' => $created];
    }

    /**
     * Deletes multiple hangman words by ID array.
     * Input: { ids: [1, 2, 3] }
     *
     * @return array Success envelope with { deleted: <count> }
     */
    public function bulkDeleteHangmanWords(): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $ids  = array_map('intval', array_filter($body['ids'] ?? [], fn($v) => ctype_digit((string)$v)));

        if (empty($ids)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'ids array is required'];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare("DELETE FROM hangman_words WHERE id IN ($placeholders)");
        $stmt->execute($ids);

        return ['success' => true, 'data' => ['deleted' => $stmt->rowCount()]];
    }

    /**
     * Creates multiple word search words in one request.
     * Input: { words: [{ word, category? }, ...] }
     * Category defaults to 'general' if omitted.
     *
     * @return array Success envelope with array of created rows
     */
    public function bulkCreateWordsearchWords(): array {
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $words = $body['words'] ?? [];

        if (empty($words) || !is_array($words)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'words array is required'];
        }

        $pdo     = Database::getAdminInstance();
        $created = [];

        foreach ($words as $item) {
            $word     = strtoupper(trim($item['word'] ?? ''));
            $category = trim($item['category'] ?? '') ?: 'general';

            if ($word === '') continue;

            $stmt = $pdo->prepare(
                "INSERT INTO word_search_words (word, category, active)
                 VALUES (:word, :category, :active)
                 RETURNING id, word, category, active"
            );
            $stmt->execute([
                ':word'     => $word,
                ':category' => $category,
                ':active'   => true,
            ]);
            $created[] = $stmt->fetch();
        }

        return ['success' => true, 'data' => $created];
    }

    /**
     * Deletes multiple word search words by ID array.
     * Input: { ids: [1, 2, 3] }
     *
     * @return array Success envelope with { deleted: <count> }
     */
    public function bulkDeleteWordsearchWords(): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $ids  = array_map('intval', array_filter($body['ids'] ?? [], fn($v) => ctype_digit((string)$v)));

        if (empty($ids)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'ids array is required'];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $pdo  = Database::getAdminInstance();
        $stmt = $pdo->prepare("DELETE FROM word_search_words WHERE id IN ($placeholders)");
        $stmt->execute($ids);

        return ['success' => true, 'data' => ['deleted' => $stmt->rowCount()]];
    }

    // ── Leaderboard ───────────────────────────────────────────────────────────

    /**
     * Returns all typegame scores ordered by score descending.
     *
     * @return array Success envelope with data array of { id, name, score, difficulty, created_at }
     */
    public function listLeaderboard(): array {
        $pdo  = Database::getTypegameInstance();
        $stmt = $pdo->query(
            "SELECT id, name, score, difficulty, created_at
               FROM scores
              ORDER BY score DESC"
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Deletes a single leaderboard score by ID.
     *
     * @param int $id Score ID
     * @return array Success envelope, or 404 if not found
     */
    public function deleteScore(int $id): array {
        $pdo  = Database::getTypegameInstance();
        $stmt = $pdo->prepare('DELETE FROM scores WHERE id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            return ['success' => false, 'error' => 'Score not found'];
        }
        return ['success' => true, 'data' => null];
    }

    /**
     * Deletes multiple leaderboard scores by ID array.
     * Input: { ids: [1, 2, 3] }
     *
     * @return array Success envelope with { deleted: <count> }
     */
    public function bulkDeleteScores(): array {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $ids  = array_map('intval', array_filter($body['ids'] ?? [], fn($v) => ctype_digit((string)$v)));

        if (empty($ids)) {
            http_response_code(400);
            return ['success' => false, 'error' => 'ids array is required'];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $pdo  = Database::getTypegameInstance();
        $stmt = $pdo->prepare("DELETE FROM scores WHERE id IN ($placeholders)");
        $stmt->execute($ids);

        return ['success' => true, 'data' => ['deleted' => $stmt->rowCount()]];
    }
}
