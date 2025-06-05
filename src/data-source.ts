import { DataSource } from "typeorm";
import { Chat } from "./entity/Chat";
import { ChatRoom } from "./entity/ChatRoom";
import { ChatRoomUser } from "./entity/ChatRoomUser";
import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Chat, ChatRoom, ChatRoomUser],
  synchronize: true,
  logging: true,
  timezone: "+09:00",
});
