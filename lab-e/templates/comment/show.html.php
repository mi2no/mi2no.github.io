<?php

/** @var \App\Model\Comment $comment */
/** @var ?\App\Model\Post $post */
/** @var \App\Service\Router $router */

$title = "Comment by {$comment->getAuthor()} ({$comment->getId()})";
$bodyClass = 'show';

ob_start(); ?>
    <h1>Comment by <?= htmlspecialchars($comment->getAuthor() ?? '') ?></h1>
    <p>
        On post:
        <?php if ($post): ?>
            <a href="<?= $router->generatePath('post-show', ['id' => $post->getId()]) ?>"><?= htmlspecialchars($post->getSubject() ?? '') ?></a>
        <?php else: ?>
            <em>deleted post</em>
        <?php endif; ?>
    </p>
    <article>
        <?= nl2br(htmlspecialchars($comment->getContent() ?? '')) ?>
    </article>

    <ul class="action-list">
        <li><a href="<?= $router->generatePath('comment-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('comment-edit', ['id' => $comment->getId()]) ?>">Edit</a></li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
