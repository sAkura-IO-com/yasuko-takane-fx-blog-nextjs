import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { comment, post } from "@/db/schema";
import { cacheTags } from "@/lib/blog/cache-tags";
import { countWords } from "@/lib/blog/slug";
import { refreshCacheTag } from "@/lib/cache/refresh-tag";

/** init 迁移里写入的系统「文章」分类 ID。 */
const ARTICLE_TYPE_ID = "11111111-1111-4111-8111-111111111111";

const DEMO_POST_SLUG = "aud-jpy-loss";
const DEMO_POST_TITLE = "大損 ～豪ドル編～";
const DEMO_POST_EXCERPT =
  "豪ドル円のナンピンを繰り返し、大底で損切り。さらに全力ドテンショートしてしまった記録です。";
const DEMO_POST_PUBLISHED_AT = new Date("2026-11-24T20:00:00+08:00");

const DEMO_POST_CONTENT = `みんな…更新遅くなってごめん…。<br/>
もしかしたらお察しかもだけど…<br/>

# 豪ドル円で死にました…。

本当はこんなこと書きたくなかったけど<br/>
FX堕天使あふぃちゃんとして<br/>
ちゃんと現実と向き合わなきゃやって思ったので<br/>
震える手で更新してます…。<br/>

本当につらい…。<br/>
だってこんな何にもない相場で<br/>
死んだのは<br/>
きっとあたしだけだから…。<br/>

「いつか豪ドル円は上がる」<br/>
そう信じて<br/>
ズルズルとポジションを持ち続けて<br/>
ナンピンを繰り返して<br/>

気がつけば<br/>
ポジションはパンパン<br/>
結局耐えきれなくなって<br/>
損切りしました…。<br/>
しかも大底です…。<br/>

でも一番最悪だったのは…<br/>
その大底で全力ドテンショート<br/>
してしまったことです…。<br/>
ショートした瞬間は未来が見えてました。<br/>
豪ドル円は80円台に突入するって。<br/>
そんなわけないじゃないですか…。<br/>`;

const DEMO_COMMENT_AUTHOR = "ともこ";
const DEMO_COMMENT_BODY = `はじめまして！
お気持ちわかります…！
私も昨日豪円で大損しちゃいました(泣)
でもこんなところで負けて
終われないですよね(;≧△≦)
お金持ち目指して一緒に頑張りましょう！！

応援してます！(｀・ω・´)`;
const DEMO_COMMENT_CREATED_AT = new Date("2026-11-25T10:00:00+08:00");

/**
 * 首次初始化完成后写入示例文章与评论。
 * 作者直接使用刚创建的管理员，不额外创建用户；按 slug 判断，重复执行时跳过。
 */
export async function seedDemoContent(authorId: string): Promise<void> {
  const [existing] = await db
    .select({ id: post.id })
    .from(post)
    .where(eq(post.slug, DEMO_POST_SLUG))
    .limit(1);
  if (existing) return;

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(post)
      .values({
        authorId,
        slug: DEMO_POST_SLUG,
        title: DEMO_POST_TITLE,
        excerpt: DEMO_POST_EXCERPT,
        content: DEMO_POST_CONTENT,
        typeId: ARTICLE_TYPE_ID,
        kind: "article",
        status: "published",
        publishedAt: DEMO_POST_PUBLISHED_AT,
        wordCount: countWords(DEMO_POST_CONTENT),
        createdAt: DEMO_POST_PUBLISHED_AT,
        updatedAt: DEMO_POST_PUBLISHED_AT,
      })
      .returning({ id: post.id });

    if (!created) throw new Error("示例文章写入失败");

    await tx.insert(comment).values({
      postId: created.id,
      authorName: DEMO_COMMENT_AUTHOR,
      isAdmin: false,
      body: DEMO_COMMENT_BODY,
      status: "approved",
      reviewedAt: DEMO_COMMENT_CREATED_AT,
      createdAt: DEMO_COMMENT_CREATED_AT,
      updatedAt: DEMO_COMMENT_CREATED_AT,
    });
  });

  refreshCacheTag(cacheTags.posts, "action");
  refreshCacheTag(cacheTags.contentTypes, "action");
  refreshCacheTag(cacheTags.metrics, "action");
  refreshCacheTag(cacheTags.post(DEMO_POST_SLUG), "action");
}
