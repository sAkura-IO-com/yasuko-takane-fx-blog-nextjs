export type CommentStatus = "pending" | "approved" | "rejected" | "spam";

export type PublicComment = {
  id: string;
  parentId: string | null;
  rootId: string | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  createdAt: Date;
};

export type CommentPage = {
  roots: PublicComment[];
  replies: PublicComment[];
  nextCursor: string | null;
  total: number;
};

export type CreatedCommentView = {
  id: string;
  parentId: string | null;
  rootId: string | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
  status: CommentStatus;
};
