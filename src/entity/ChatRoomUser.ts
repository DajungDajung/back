import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ChatRoom } from "./ChatRoom";

@Entity("chat_room_users")
export class ChatRoomUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  room_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => ChatRoom, (room) => room.participants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "room_id" })
  chatRoom!: ChatRoom;
}
