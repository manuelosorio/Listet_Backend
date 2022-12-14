export interface ListCommentModel {
  id?: number;
  author_id: number;
  comment: string;
  creation_date: Date | string;
  date_updated?: Date;
  parent_id?: number;
  is_owner?: boolean;
}

export interface ListCommentQueryModel {
  list_owner_username?: string;
  slug: string;
}

export interface ListCommentEmitter extends Partial<ListCommentModel>{
  id?: number;
  comment: string;
  creation_date: Date | string;
  firstName: string;
  lastName: string;
  username: string;
  listInfo?: string;
}
