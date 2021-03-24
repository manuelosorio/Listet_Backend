// eslint-disable camelcase
export interface List {
  slug: string;
  name: string;
  description: string;
  creation_date: Date;
  deadline: Date;
  isPrivate: number;
  allowComments: number;
  author_id: number;
}
