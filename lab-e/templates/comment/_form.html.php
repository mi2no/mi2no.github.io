<?php
    /** @var $comment ?\App\Model\Comment */
    /** @var $posts \App\Model\Post[] */
?>

<div class="form-group">
    <label for="post_id">Post</label>
    <select id="post_id" name="comment[post_id]" required>
        <option value="">-- choose post --</option>
        <?php foreach ($posts as $post): ?>
            <option value="<?= $post->getId() ?>" <?= $comment && $comment->getPostId() === $post->getId() ? 'selected' : '' ?>>
                <?= htmlspecialchars($post->getSubject() ?? '') ?>
            </option>
        <?php endforeach; ?>
    </select>
</div>

<div class="form-group">
    <label for="author">Author</label>
    <input type="text" id="author" name="comment[author]" required value="<?= $comment ? htmlspecialchars($comment->getAuthor() ?? '') : '' ?>">
</div>

<div class="form-group">
    <label for="content">Content</label>
    <textarea id="content" name="comment[content]" required><?= $comment ? htmlspecialchars($comment->getContent() ?? '') : '' ?></textarea>
</div>

<div class="form-group">
    <label></label>
    <input type="submit" value="Submit">
</div>
