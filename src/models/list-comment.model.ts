export interface ListCommentModel {
  author_id: number;
  comment_message: string;
  creation_date: Date;
  parent_id: number;
}
export interface ListCommentEmitter {
  comment: string;
  creation_date: Date | string;
  firstName: string;
  lastName: string;
  username: string;
  listInfo?: string;
}