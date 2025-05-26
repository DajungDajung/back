export interface ChatRoom {
  id: number;
  user1_id: number;
  user2_id: number;
  item_id: number;
  last_message: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  receiver_id: number;
  contents: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatUserInfo {
  id: number;
  nickname: string;
  img_id: string | null;
}

export interface ChatItemInfo {
  id: number;
  title: string;
  img_id: string | null;
  price: number;
}

export interface ChatRoomList extends ChatRoom {
  userInfo: ChatUserInfo;
}

export interface ChatMessageList extends ChatMessage {
  userInfo: ChatUserInfo;
  itemInfo: ChatItemInfo;
}
