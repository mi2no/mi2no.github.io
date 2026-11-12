<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\Comment;
use App\Model\Post;
use App\Service\Router;
use App\Service\Templating;

class CommentController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $comments = Comment::findAll();
        $html = $templating->render('comment/index.html.php', [
            'comments' => $comments,
            'router' => $router,
        ]);
        return $html;
    }

    public function createAction(?array $requestComment, Templating $templating, Router $router): ?string
    {
        if ($requestComment) {
            $comment = Comment::fromArray($requestComment);
            // @todo missing validation
            $comment->save();

            $path = $router->generatePath('comment-index');
            $router->redirect($path);
            return null;
        } else {
            $comment = new Comment();
        }

        $html = $templating->render('comment/create.html.php', [
            'comment' => $comment,
            'posts' => Post::findAll(),
            'router' => $router,
        ]);
        return $html;
    }

    public function editAction(int $commentId, ?array $requestComment, Templating $templating, Router $router): ?string
    {
        $comment = Comment::find($commentId);
        if (! $comment) {
            throw new NotFoundException("Missing comment with id $commentId");
        }

        if ($requestComment) {
            $comment->fill($requestComment);
            // @todo missing validation
            $comment->save();

            $path = $router->generatePath('comment-index');
            $router->redirect($path);
            return null;
        }

        $html = $templating->render('comment/edit.html.php', [
            'comment' => $comment,
            'posts' => Post::findAll(),
            'router' => $router,
        ]);
        return $html;
    }

    public function showAction(int $commentId, Templating $templating, Router $router): ?string
    {
        $comment = Comment::find($commentId);
        if (! $comment) {
            throw new NotFoundException("Missing comment with id $commentId");
        }

        $html = $templating->render('comment/show.html.php', [
            'comment' => $comment,
            'post' => $comment->getPost(),
            'router' => $router,
        ]);
        return $html;
    }

    public function deleteAction(int $commentId, Router $router): ?string
    {
        $comment = Comment::find($commentId);
        if (! $comment) {
            throw new NotFoundException("Missing comment with id $commentId");
        }

        $comment->delete();
        $path = $router->generatePath('comment-index');
        $router->redirect($path);
        return null;
    }
}
