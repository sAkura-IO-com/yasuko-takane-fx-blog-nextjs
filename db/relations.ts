import { defineRelations } from "drizzle-orm";

import { account, passkey, session, user, verification } from "./auth-schema";
import { comment, contentType, post, postTag, tag } from "./schema";

export const relations = defineRelations(
  {
    user,
    session,
    account,
    verification,
    passkey,
    contentType,
    post,
    tag,
    postTag,
    comment,
  },
  (r) => ({
    user: {
      sessions: r.many.session({
        from: r.user.id,
        to: r.session.userId,
      }),
      accounts: r.many.account({
        from: r.user.id,
        to: r.account.userId,
      }),
      passkeys: r.many.passkey({
        from: r.user.id,
        to: r.passkey.userId,
      }),
      posts: r.many.post({
        from: r.user.id,
        to: r.post.authorId,
      }),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
    passkey: {
      user: r.one.user({
        from: r.passkey.userId,
        to: r.user.id,
      }),
    },
    contentType: {
      posts: r.many.post({
        from: r.contentType.id,
        to: r.post.typeId,
      }),
    },
    post: {
      contentType: r.one.contentType({
        from: r.post.typeId,
        to: r.contentType.id,
      }),
      author: r.one.user({
        from: r.post.authorId,
        to: r.user.id,
      }),
      postTags: r.many.postTag({
        from: r.post.id,
        to: r.postTag.postId,
      }),
      comments: r.many.comment({
        from: r.post.id,
        to: r.comment.postId,
      }),
    },
    tag: {
      postTags: r.many.postTag({
        from: r.tag.id,
        to: r.postTag.tagId,
      }),
    },
    postTag: {
      post: r.one.post({
        from: r.postTag.postId,
        to: r.post.id,
      }),
      tag: r.one.tag({
        from: r.postTag.tagId,
        to: r.tag.id,
      }),
    },
    // comment 的 parent/root 自引用在 rc 版 defineRelations 里会触发循环推断，
    // 评论查询一律手写 join，这里只登记跨表关系。
    comment: {
      post: r.one.post({
        from: r.comment.postId,
        to: r.post.id,
      }),
    },
  }),
);
