import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ChatRoom } from "./ChatRoom";

@Entity("chats")
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  room_id!: number;

  @Column()
  sender_id!: number;

  @Column()
  receiver_id!: number;

  @Column({ type: "text" })
  contents!: string;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @Column({ type: "boolean", default: false })
  is_read!: boolean;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.chats, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "room_id" })
  chatRoom!: ChatRoom;
}
