import express from 'express';
import EmotionRepository from '../../../repository/EmotionRepository';
import Emotion, { createEmotion } from '../../../entity/Emotion';
import ArticleRepository from '../../../repository/ArticleRepository';
import UserRepository from '../../../repository/UserRepository';

const EMOTION_TYPE = {
  LOVE: 'LOVE',
  SAD: 'SAD',
  LAUGHING: 'LAUGHING',
  ANGRY: 'ANGRY'
} as const;

type EmotionKey = keyof typeof EMOTION_TYPE;

class EmotionController {

  public get = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      params: { articleId },
      body: { user },
    } = req;
    try {
      const emotions = await EmotionRepository().get(articleId);
      const { emotionCount, yourEmotion}  = getEmotionCounter(emotions, user?.profile?.id);
      res.json({ ok: true, message: 'list', emotionCount, yourEmotion, });
    } catch (error) {
      next(error);
    }
  };

  public list = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      params: { userCode },
      body: { user },
    } = req;
    try {
      let userId = user?.profile.id;
      if (userCode) {
        const targetUser = await UserRepository().getByCode(userCode);
        userId = targetUser?.id;
      }
      const emotionList = await EmotionRepository().list(userId);
      const emotions = emotionList.reduce((accum, emotion) => {
        (accum as Record<string, string>)[emotion.articleId] = emotion.type;
        return accum;
      }, {})
      res.json({ ok: true, message: 'list', emotions });
    } catch (error) {
      next(error);
    }
  };

  public cud = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const { body: {
      articleId,
      type,
      user
    }} = req;

    try {
      const emotionListPromise = EmotionRepository().list(articleId);
      const existed = await EmotionRepository().cud({
        articleId: articleId,
        authorId: user.profile.id,
      });
      let updateStatus = '';
      const emotions = await emotionListPromise;
      let { emotionCount, yourEmotion}  = getEmotionCounter(emotions, user.profile.id);
      
      if (existed) {
        if (existed.type === type) {
          await EmotionRepository().remove(existed);
          await ArticleRepository().decreaseEmotion(articleId);
          updateStatus = 'removed';
          emotionCount[existed?.type as EmotionKey] = emotionCount[existed?.type as EmotionKey] - 1;
          yourEmotion = null;
        } else {
          await EmotionRepository().save(existed);
          updateStatus = 'updated';
          emotionCount[existed.type as EmotionKey] = emotionCount[existed?.type as EmotionKey] - 1;
          emotionCount[type as EmotionKey] = emotionCount[type as EmotionKey] + 1;
          existed.type = type;
          yourEmotion = type;
        }
      } else {
        const newEmotion = createEmotion({
          articleId,
          type,
          authorId: user.profile.id});
        await EmotionRepository().save(newEmotion);
        await ArticleRepository().increaseEmotion(articleId);
        updateStatus = 'created';
        emotionCount[type as EmotionKey] = emotionCount[type as EmotionKey] + 1;
        yourEmotion = type;
      }

      res.json({ ok: true, message: `emotion ${updateStatus}`, updateStatus, emotionCount, yourEmotion });
    } catch (error) {
      next(error);
    }
  };

}


const getEmotionCounter = (emotions: Emotion[], userId?: string) => {
  const emotionCount = {
    [EMOTION_TYPE.LOVE]: 0,
    [EMOTION_TYPE.SAD]: 0,
    [EMOTION_TYPE.LAUGHING]: 0,
    [EMOTION_TYPE.ANGRY]: 0,
  }
  let yourEmotion = null;
  emotions.reduce((accum, emotion) => {
    if (emotion.type in accum) {
      accum[emotion.type as keyof typeof EMOTION_TYPE] = accum[emotion.type  as keyof typeof EMOTION_TYPE] + 1;
    }
    if (emotion.authorId === userId) {
      yourEmotion = emotion.type;
    }
    return accum;
  }, emotionCount);
  return {
    emotionCount,
    yourEmotion,
  }
}

export default new EmotionController();
