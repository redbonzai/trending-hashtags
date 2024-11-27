export interface Hashtag {
  id: string;
  tag: string;
  count: number;
  updatedAt: string; // Use `Date` if you need to manipulate this as an actual date object
}

export interface Tweet {
  id: string;
  content: string;
  createdAt: string; // Use `Date` if you need to manipulate this as an actual date object
  hashtags: Hashtag[];
}
