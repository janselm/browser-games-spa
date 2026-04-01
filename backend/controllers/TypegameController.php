<?php

/**
 * TypegameController — manages leaderboard scores for the typegame.
 *
 * Scores are stored in a separate PostgreSQL database (typegame) from the
 * main games database, accessed via Database::getTypegameInstance().
 */
class TypegameController
{
    private PDO $pdo;

    /**
     * Connects to the typegame database via the dedicated PDO singleton.
     * Using a separate instance isolates typegame credentials from the main DB.
     */
    public function __construct()
    {
        $this->pdo = Database::getTypegameInstance();
    }

    /**
     * GET /api/leaderboard.php?difficulty=1&limit=50
     * Returns a raw JSON array (not envelope) — LeaderboardService.js does .forEach() on the result.
     */
    public function getLeaderboard(int $difficulty, int $limit): array
    {
        if ($difficulty > 0) {
            $stmt = $this->pdo->prepare(
                'SELECT name, score, difficulty FROM scores
                  WHERE difficulty = :diff
                  ORDER BY score DESC
                  LIMIT :lim'
            );
            $stmt->bindValue(':diff', $difficulty, PDO::PARAM_INT);
        } else {
            $stmt = $this->pdo->prepare(
                'SELECT name, score, difficulty FROM scores
                  ORDER BY score DESC
                  LIMIT :lim'
            );
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * POST /api/leaderboard.php
     * Body: { name, score, difficulty }
     */
    public function saveScore(array $body): array
    {
        $name       = substr(trim($body['name']       ?? 'Anonymous'), 0, 20);
        $score      = (int)($body['score']            ?? 0);
        $difficulty = (int)($body['difficulty']       ?? 1);

        if ($name === '') $name = 'Anonymous';
        if (!in_array($difficulty, [1, 2, 3], true)) $difficulty = 1;

        $stmt = $this->pdo->prepare(
            'INSERT INTO scores (name, score, difficulty) VALUES (:name, :score, :diff)'
        );
        $stmt->execute([
            ':name'  => $name,
            ':score' => $score,
            ':diff'  => $difficulty,
        ]);

        return ['success' => true];
    }
}
