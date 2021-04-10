export interface ListModel {
  slug: string;
  name: string;
  description: string;
  creation_date: Date;
  deadline: Date;
  isPrivate: number;
  allowComments: number;
  author_id: number;
  author_username?: string;
}

export interface ListQueryModel {
  slug?: string;
  author_username?: string;
}
