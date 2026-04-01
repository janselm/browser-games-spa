<?php

require_once __DIR__ . '/../config/database.php';

/**
 * WordSearchController — serves word data for the word search puzzle.
 */
class WordSearchController {

    /**
     * Returns 10 randomly selected active words from the word_search_words table.
     * The frontend builds the puzzle grid from this list.
     *
     * @return array Success envelope containing an array of { id, word, category }
     */
    public function getWords(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query(
            "SELECT id, word, category
               FROM word_search_words
              WHERE active = TRUE
              ORDER BY RANDOM()
              LIMIT 10"
        );
        $words = $stmt->fetchAll();
        return ['success' => true, 'data' => $words];
    }
}
