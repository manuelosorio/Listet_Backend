export interface ListCommentModel {
  id?: number;
  author_id: number;
  comment_message: string;
  creation_date: Date;
  date_updated?: Date
  parent_id: number;
}

export interface ListCommentQueryModel {
  list_owner_username?: string;
  slug: string;
}

export interface ListCommentEmitter {
  id?: number;
  comment: string;
  creation_date: Date | string;
  firstName: string;
  lastName: string;
  username: string;
  listInfo?: string;
}
