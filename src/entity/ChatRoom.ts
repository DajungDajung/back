import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Chat } from "./Chat";
import { ChatRoomUser } from "./ChatRoomUser";

@Entity("chat_rooms")
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  item_id!: number;

  @Column({ type: "text", default: "" })
  last_message!: string;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;

  @OneToMany(() => Chat, (chat) => chat.chatRoom)
  chats!: Chat[];

  @OneToMany(() => ChatRoomUser, (chatRoomUser) => chatRoomUser.chatRoom)
  participants!: ChatRoomUser[];
}
