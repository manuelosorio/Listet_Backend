export interface ListItem {
  id?: number,
  item: string,
  deadline?: Date | null,
  completed: number,
  list_id: number,
}
export interface ListItemModel {
  id?: number
  item: string;
  deadline?: Date | null;
  completed: number;
  list_id?: number;
  username?: string;
  slug?: string;
  listInfo?: string;
}
