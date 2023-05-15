import { messageToJson } from '../worker';
import { PostMention, User } from '../../entity';
import {
  NotificationDoneByContext,
  NotificationPostContext,
} from '../../notifications';
import { NotificationWorker } from './worker';
import { ChangeObject } from '../../types';
import { buildPostContext } from './utils';

interface Data {
  postMention: ChangeObject<PostMention>;
}

const worker: NotificationWorker = {
  subscription: 'api.post-mention-notification',
  handler: async (message, con) => {
    const { postMention }: Data = messageToJson(message);
    const { postId, mentionedByUserId, mentionedUserId } = postMention;
    const postCtx = await buildPostContext(con, postId);

    if (!postCtx) {
      return;
    }

    const doneBy = await con
      .getRepository(User)
      .findOneBy({ id: mentionedByUserId });

    if (!doneBy) {
      return;
    }

    const ctx: NotificationPostContext & NotificationDoneByContext = {
      ...postCtx,
      userId: mentionedUserId,
      doneBy,
    };
    return [{ type: 'post_mention', ctx }];
  },
};

export default worker;
