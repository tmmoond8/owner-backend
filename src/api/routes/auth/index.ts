import { Router } from 'express';
import articleContoller from './auth.ctrl';
import { testMiddleware } from '../../middlewares';

const route = Router();

export default (app: Router) => {
  app.use('/auth', route);

  route.get('/getUser', testMiddleware, articleContoller.getUser);
  route.get('/check', articleContoller.check);
  route.post('/login/kakao', articleContoller.kakaoLogin);
};
