<?php

/** @var \App\Model\Post $post */
/** @var \App\Model\Comment[] $comments */
/** @var \App\Service\Router $router */

$title = "{$post->getSubject()} ({$post->getId()})";
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= $post->getSubject() ?></h1>
    <article>
        <?= $post->getContent();?>
    </article>

    <ul class="action-list">
        <li> <a href="<?= $router->generatePath('post-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('post-edit', ['id'=> $post->getId()]) ?>">Edit</a></li>
    </ul>

    <section class="comments">
        <h2>Comments (<?= count($comments) ?>)</h2>

        <?php if (! $comments): ?>
            <p>No comments yet.</p>
        <?php endif; ?>

        <?php foreach ($comments as $comment): ?>
            <div class="comment">
                <h3><?= htmlspecialchars($comment->getAuthor() ?? '') ?></h3>
                <p><?= nl2br(htmlspecialchars($comment->getContent() ?? '')) ?></p>
                <ul class="action-list">
                    <li><a href="<?= $router->generatePath('comment-show', ['id' => $comment->getId()]) ?>">Details</a></li>
                    <li><a href="<?= $router->generatePath('comment-edit', ['id' => $comment->getId()]) ?>">Edit</a></li>
                </ul>
            </div>
        <?php endforeach; ?>

        <a href="<?= $router->generatePath('comment-create', ['post_id' => $post->getId()]) ?>">Add comment</a>
    </section>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
