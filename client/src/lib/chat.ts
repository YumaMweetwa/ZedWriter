import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { Message, ChatRoom, InsertMessage, InsertChatRoom } from "@shared/schema";

export class ChatService {
  static async createChatRoom(roomData: InsertChatRoom): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "chatRooms"), {
        ...roomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating chat room:", error);
      throw error;
    }
  }

  static async sendMessage(roomId: string, messageData: Omit<InsertMessage, 'roomId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "messages"), {
        ...messageData,
        roomId,
        createdAt: serverTimestamp(),
      });
      
      // Update room's last activity
      await updateDoc(doc(db, "chatRooms", roomId), {
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  static subscribeToMessages(roomId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id } as Message);
      });
      callback(messages);
    });
  }

  static subscribeToChatRooms(userId: string, callback: (rooms: ChatRoom[]) => void) {
    const q = query(
      collection(db, "chatRooms"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const rooms: ChatRoom[] = [];
      snapshot.forEach((doc) => {
        rooms.push({ ...doc.data(), id: doc.id } as ChatRoom);
      });
      callback(rooms);
    });
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        isRead: true,
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }
}
