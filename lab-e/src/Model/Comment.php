<?php
namespace App\Model;

use App\Service\Config;

class Comment
{
    private ?int $id = null;
    private ?int $postId = null;
    private ?string $author = null;
    private ?string $content = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): Comment
    {
        $this->id = $id;

        return $this;
    }

    public function getPostId(): ?int
    {
        return $this->postId;
    }

    public function setPostId(?int $postId): Comment
    {
        $this->postId = $postId;

        return $this;
    }

    public function getAuthor(): ?string
    {
        return $this->author;
    }

    public function setAuthor(?string $author): Comment
    {
        $this->author = $author;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): Comment
    {
        $this->content = $content;

        return $this;
    }

    /**
     * Post, do którego należy komentarz (null, jeśli post nie istnieje).
     */
    public function getPost(): ?Post
    {
        return $this->postId ? Post::find($this->postId) : null;
    }

    public static function fromArray($array): Comment
    {
        $comment = new self();
        $comment->fill($array);

        return $comment;
    }

    public function fill($array): Comment
    {
        if (isset($array['id']) && ! $this->getId()) {
            $this->setId($array['id']);
        }
        if (isset($array['post_id'])) {
            $this->setPostId((int) $array['post_id']);
        }
        if (isset($array['author'])) {
            $this->setAuthor($array['author']);
        }
        if (isset($array['content'])) {
            $this->setContent($array['content']);
        }

        return $this;
    }

    private static function getPdo(): \PDO
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        return $pdo;
    }

    /**
     * @return Comment[]
     */
    public static function findAll(): array
    {
        $pdo = self::getPdo();
        $sql = 'SELECT * FROM comment ORDER BY id DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute();

        $comments = [];
        $commentsArray = $statement->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($commentsArray as $commentArray) {
            $comments[] = self::fromArray($commentArray);
        }

        return $comments;
    }

    /**
     * @return Comment[]
     */
    public static function findByPostId(int $postId): array
    {
        $pdo = self::getPdo();
        $sql = 'SELECT * FROM comment WHERE post_id = :post_id ORDER BY id ASC';
        $statement = $pdo->prepare($sql);
        $statement->execute(['post_id' => $postId]);

        $comments = [];
        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $commentArray) {
            $comments[] = self::fromArray($commentArray);
        }

        return $comments;
    }

    public static function find($id): ?Comment
    {
        $pdo = self::getPdo();
        $sql = 'SELECT * FROM comment WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute(['id' => $id]);

        $commentArray = $statement->fetch(\PDO::FETCH_ASSOC);
        if (! $commentArray) {
            return null;
        }

        return self::fromArray($commentArray);
    }

    public function save(): void
    {
        $pdo = self::getPdo();
        if (! $this->getId()) {
            $sql = "INSERT INTO comment (post_id, author, content) VALUES (:post_id, :author, :content)";
            $statement = $pdo->prepare($sql);
            $statement->execute([
                'post_id' => $this->getPostId(),
                'author' => $this->getAuthor(),
                'content' => $this->getContent(),
            ]);

            $this->setId($pdo->lastInsertId());
        } else {
            $sql = "UPDATE comment SET post_id = :post_id, author = :author, content = :content WHERE id = :id";
            $statement = $pdo->prepare($sql);
            $statement->execute([
                ':post_id' => $this->getPostId(),
                ':author' => $this->getAuthor(),
                ':content' => $this->getContent(),
                ':id' => $this->getId(),
            ]);
        }
    }

    public function delete(): void
    {
        $pdo = self::getPdo();
        $sql = "DELETE FROM comment WHERE id = :id";
        $statement = $pdo->prepare($sql);
        $statement->execute([
            ':id' => $this->getId(),
        ]);

        $this->setId(null);
        $this->setPostId(null);
        $this->setAuthor(null);
        $this->setContent(null);
    }
}
