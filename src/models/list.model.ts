export interface ListModel {
  id?: number;
  slug?: string;
  prevSlug?: string;
  name: string;
  description: string;
  creation_date?: Date;
  deadline: Date;
  isPrivate: number;
  allowComments: number;
  author_id?: number;
  author_username?: string;
}

export interface ListOwnerModel {
  slug: string;
  name: string;
  description: string;
  creation_date: Date;
  deadline: Date;
  isPrivate: number;
  allowComments: number;
  owner_id: number;
  owner_username?: string;
  isOwner: boolean;
}

export interface ListQueryModel {
  slug?: string;
  author_username?: string;
}
