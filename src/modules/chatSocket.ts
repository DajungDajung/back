import { Server, Socket } from "socket.io";
import { AppDataSource } from "../data-source";
import { Chat } from "../entity/Chat";
import { ChatRoom } from "../entity/ChatRoom";

interface JoinRoomPayload {
  room_id: number;
}

interface SendMessagePayload {
  room_id: number;
  sender_id: number;
  receiver_id: number;
  contents: string;
}

interface MarkAsReadPayload {
  room_id: number;
  user_id: number;
}

module.exports = (socket: Socket, io: Server) => {
  // 채팅방 입장
  socket.on("joinRoom", (payload: JoinRoomPayload) => {
    const roomKey = `room_${payload.room_id}`;
    socket.join(roomKey);
  });

  // 메시지 전송
  socket.on("sendMessage", async (payload: SendMessagePayload) => {
    const { room_id, sender_id, receiver_id, contents } = payload;

    try {
      const chatRepo = AppDataSource.getRepository(Chat);
      const chatRoomRepo = AppDataSource.getRepository(ChatRoom);

      // DB 저장
      const newMessage = chatRepo.create({
        room_id,
        sender_id,
        receiver_id,
        contents,
        is_read: false,
      });
      await chatRepo.save(newMessage);

      // 채팅방 최근 메시지 갱신
      await chatRoomRepo.update(room_id, {
        last_message: contents,
      });

      // 양쪽 사용자에게 실시간 전송
      const roomKey = `room_${room_id}`;
      io.to(roomKey).emit("newMessage", newMessage);
    } catch (error) {
      console.error("[Socket] 메시지 전송 중 오류:", error);
      socket.emit("error", "메시지 전송 실패");
    }
  });

  // 메시지 읽음 처리
  socket.on("markAsRead", async (payload: MarkAsReadPayload) => {
    const { room_id, user_id } = payload;

    try {
      const chatRepo = AppDataSource.getRepository(Chat);

      await chatRepo
        .createQueryBuilder()
        .update(Chat)
        .set({ is_read: true })
        .where("room_id = :room_id", { room_id })
        .andWhere("receiver_id = :user_id", { user_id })
        .andWhere("is_read = false")
        .execute();
    } catch (error) {
      console.error("[Socket] 읽음 처리 실패:", error);
      socket.emit("error", "읽음 처리 실패");
    }
  });

  // 채팅방 나가기
  socket.on("leaveRoom", (payload: { room_id: number }) => {
    try {
      const roomKey = `room_${payload.room_id}`;

      socket.leave(roomKey);
    } catch (error) {
      console.error("[Socket] 채팅방 나가기 오류:", error);
      socket.emit("error", "채팅방 나가기 실패");
    }
  });
};
