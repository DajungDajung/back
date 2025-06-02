export interface User {
  id: number;
  img_id: number;
  password: string;
  email: string;
  nickname: string;
  info: string;
  created_at: string;
  salt: string;
}
