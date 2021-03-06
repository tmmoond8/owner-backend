import express from 'express';
import BookmarkRepository from '../../../repository/BookmarkRepository';
import { createBookmark } from '../../../entity/Bookmark';

class BookmarkController {
  public list = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      body: { user }
    } = req;
    try {
      const bookmarks = await BookmarkRepository().list(user.profile.id);
      return res.json({ ok: true, message: 'list', bookmarks: bookmarks.map(bookmark => bookmark.articleId) });
    } catch (error) {
      next(error);
    }
    return res.status(500);
  };
  public add = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      params: { articleId },
      body: { user }
    } = req;
    try {
      const existed = await BookmarkRepository().get(user.profile.id, articleId)
      if (existed) {
        res.json({ ok: true, message: 'already existed' });
      } else {
        const bookmark = createBookmark({ articleId: parseInt(articleId), userId: user.profile.id })
        await BookmarkRepository().add(bookmark)
        return res.json({ ok: true, message: 'add', bookmark });
      }
    } catch (error) {
      next(error);
    }
    return res.status(500);
  };

  public remove = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      params: { articleId },
      body: { user }
    } = req;
    try {
      await BookmarkRepository().remove(parseInt(articleId), user.profile.id);
      return res.json({ ok: true, message: 'removed' });
    } catch (error) {
      next(error);
    }
    return res.status(500);
  };
}

export default new BookmarkController();
