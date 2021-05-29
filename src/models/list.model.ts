export interface ListModel {
  id?: number;
  slug?: string;
  prevSlug?: string;
  name: string;
  description: string;
  creation_date?: Date;
  deadline: Date;
  is_private: number;
  allow_comments: number;
  author_id?: number;
  author_username?: string;
}

export interface ListOwnerModel {
  slug: string;
  name: string;
  description: string;
  creation_date: Date;
  deadline: Date;
  is_private: number;
  allow_comments: number;
  owner_id: number;
  owner_username?: string;
  is_owner: boolean;
}

export interface ListQueryModel {
  slug?: string;
  author_username?: string;
}
