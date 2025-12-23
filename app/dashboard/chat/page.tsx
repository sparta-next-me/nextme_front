"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs" 
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label" 
import { 
  Send, User, MessageSquare, Loader2, Hash, 
  ArrowLeft, LogOut, UserPlus, Settings, Plus, Search,
  Users 
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function RealTimeChatPage() {
  const router = useRouter()
  
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("GROUP") 
  const [rooms, setRooms] = useState<any[]>([])
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null)
  const [oldestCreatedAt, setOldestCreatedAt] = useState<string | null>(null)

  const [allUsers, setAllUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false) 
  
  const [isCreating, setIsCreating] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState("") 
  
  const stompClient = useRef<Client | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  const API_BASE = 'http://sparta-nextme.xyz:30000'
  const USER_API_BASE = '/user-api' 

  const getMessageDateId = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      let date: Date;
      if (Array.isArray(createdAt)) {
        date = new Date(createdAt[0], createdAt[1] - 1, createdAt[2]);
      } else if (typeof createdAt === 'string' && createdAt.includes(',')) {
        const p = createdAt.split(',');
        date = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
      } else if (typeof createdAt === 'string' && createdAt.length >= 8 && /^\d+$/.test(createdAt)) {
        date = new Date(
          parseInt(createdAt.substring(0, 4)),
          parseInt(createdAt.substring(4, 6)) - 1,
          parseInt(createdAt.substring(6, 8))
        );
      } else {
        date = new Date(createdAt);
      }
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    } catch (e) { return ""; }
  };

  const renderTime = (rawData: any) => {
    if (!rawData) return "";
    let hour = "", min = "";
    if (Array.isArray(rawData)) {
      hour = String(rawData[3] || "0").padStart(2, '0');
      min = String(rawData[4] || "0").padStart(2, '0');
    } else if (typeof rawData === 'string' && rawData.includes(',')) {
      const parts = rawData.split(',');
      hour = (parts[3] || "0").padStart(2, '0');
      min = (parts[4] || "0").padStart(2, '0');
    } else {
      const timeStr = String(rawData);
      if (timeStr.length >= 12) {
        hour = timeStr.substring(8, 10).padStart(2, '0');
        min = timeStr.substring(10, 12).padStart(2, '0');
      } else return timeStr;
    }
    return `${hour}:${min}`;
  };

  const saveLastMsgToLocal = (roomId: string, content: string) => {
    if (!content || content === "방에 입장했습니다") return;
    const saved = localStorage.getItem("chat_last_messages");
    const dict = saved ? JSON.parse(saved) : {};
    dict[roomId] = content;
    localStorage.setItem("chat_last_messages", JSON.stringify(dict));
  }

  const getLastMsgFromLocal = (roomId: string) => {
    const saved = localStorage.getItem("chat_last_messages");
    if (!saved) return "";
    const dict = JSON.parse(saved);
    return dict[roomId] || "";
  }

  const loadRooms = useCallback(async (type: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) return []
    try {
      const res = await fetch(`${API_BASE}/v1/chats/room?roomType=${type}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      const roomList = data.rooms || data.result || (Array.isArray(data) ? data : [])
      
      const mappedRooms = roomList.map((room: any) => {
        const rId = String(room.chatRoomId || room.id);
        const serverLastMsg = room.lastMessage || room.lastChatMessage?.content;
        let finalMsg = serverLastMsg || getLastMsgFromLocal(rId) || "대화 내용이 없습니다.";
        if (serverLastMsg) saveLastMsgToLocal(rId, serverLastMsg);
        return { ...room, lastMessage: finalMsg };
      })

      const uniqueRooms = mappedRooms.filter((room: any, idx: number, self: any[]) => 
        idx === self.findIndex((r) => (r.chatRoomId || r.id) === (room.chatRoomId || room.id))
      );

      setRooms(uniqueRooms)
      return uniqueRooms;
    } catch (e) { 
      setRooms([]); 
      return [];
    }
  }, [])

  const selectRoom = async (room: any) => {
    const roomId = room.chatRoomId || room.id
    if (!roomId) return;
    const token = localStorage.getItem("accessToken")

    try {
      const joinRes = await fetch(`${API_BASE}/v1/chats/room/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      })
      
      if (joinRes.ok) {
        if (subscriptionRef.current) subscriptionRef.current.unsubscribe()
        setCurrentRoom(room)
        
        const enterMessage = {
          type: "ENTER",
          content: "방에 입장했습니다",
          createdAt: new Date().toISOString(),
          senderName: userName,
          senderId: userId,
          chatMessageId: `enter-${roomId}-${Date.now()}`
        };

        setOldestMessageId(null);
        setOldestCreatedAt(null);
        
        await loadChatHistory(roomId, false, enterMessage);
        
        if (stompClient.current?.connected) {
          subscriptionRef.current = stompClient.current.subscribe(`/topic/chat.room.${roomId}`, (msg) => {
            const received = JSON.parse(msg.body)
            setMessages((prev) => {
              const recId = received.chatMessageId || received.messageId?.chatMessageId;
              if (prev.some(m => (m.chatMessageId || m.messageId?.chatMessageId) === recId)) return prev;
              return [...prev, received];
            })
            updateRoomLastMessage(String(roomId), received.content);
            scrollToBottom()
          })
        }
      }
    } catch (e) { console.error(e) }
  }

  const updateRoomLastMessage = (roomId: string, content: string) => {
    if (!content) return;
    saveLastMsgToLocal(roomId, content);
    setRooms(prevRooms => prevRooms.map(r => {
      const targetId = String(r.chatRoomId || r.id);
      if (targetId === roomId) {
        return { ...r, lastMessage: content };
      }
      return r;
    }));
  }

  const loadChatHistory = async (roomId: string, isMore = false, initialEnterMsg?: any) => {
    if (isLoadingHistory) return [];
    const token = localStorage.getItem("accessToken");
    let url = `${API_BASE}/v1/chats/message/${roomId}?size=20`;
    
    if (isMore && oldestMessageId && oldestCreatedAt) {
      url += `&beforeMessageId=${oldestMessageId}&beforeCreatedAt=${encodeURIComponent(oldestCreatedAt)}`;
    }
    
    setIsLoadingHistory(true);
    try {
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      const newMessages = Array.isArray(data) ? data : (data.messages || data.result || []);
      
      let returnHistory: any[] = [];
      if (newMessages.length > 0 || initialEnterMsg) {
        if (newMessages.length > 0) {
          const oldestMsg = newMessages[newMessages.length - 1];
          setOldestMessageId(oldestMsg.messageId?.chatMessageId || oldestMsg.chatMessageId);
          setOldestCreatedAt(oldestMsg.createdAt);
        }
        
        const history = [...newMessages].reverse();
        returnHistory = initialEnterMsg ? [...history, initialEnterMsg] : history;

        setMessages(prev => {
          const combined = isMore ? [...history, ...prev] : returnHistory;
          return combined.filter((msg, idx, self) => 
            idx === self.findIndex((m) => (
              (m.chatMessageId || m.messageId?.chatMessageId) === (msg.chatMessageId || msg.messageId?.chatMessageId)
            ))
          );
        });
        if (!isMore) scrollToBottom();
      }
      setHasMoreMessages(newMessages.length === 20);
      return returnHistory; 
    } catch (e) { 
      console.error(e); 
      return [];
    } finally { 
      setIsLoadingHistory(false); 
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim() || !stompClient.current?.connected || !currentRoom) return
    const roomId = currentRoom.chatRoomId || currentRoom.id
    stompClient.current.publish({
      destination: `/app/chat.send/${roomId}`,
      body: JSON.stringify({ 
        content: inputValue, 
        roomType: currentRoom.roomType || currentRoom.type || activeTab 
      }),
    })
    setInputValue("")
  }

  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollTop < 50 && hasMoreMessages && !isLoadingHistory) {
      const roomId = currentRoom?.chatRoomId || currentRoom?.id;
      if (roomId) loadChatHistory(roomId, true);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) return router.push("/login")
    setUserId(localStorage.getItem("userId") || "")
    setUserName(localStorage.getItem("name") || "사용자")
    setUserRole(localStorage.getItem("role")) 
    const client = new Client({
      brokerURL: `ws://sparta-nextme.xyz:30000/ws/chat`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      webSocketFactory: () => new SockJS(`${API_BASE}/ws/chat`),
      reconnectDelay: 5000,
      onConnect: () => { setIsConnected(true); loadRooms(activeTab); },
      onDisconnect: () => setIsConnected(false)
    })
    client.activate()
    stompClient.current = client
    return () => { if (stompClient.current) stompClient.current.deactivate() }
  }, [activeTab, loadRooms, router])

  const scrollToBottom = () => {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, 100)
  }

  const handleLeaveRoom = async () => {
    const roomId = currentRoom?.chatRoomId || currentRoom?.id
    if (!roomId || !confirm("방을 나가시겠습니까?")) return
    const token = localStorage.getItem("accessToken")
    try {
      await fetch(`${API_BASE}/v1/chats/room/${roomId}/leave`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })
      const saved = localStorage.getItem("chat_last_messages");
      if (saved) {
        const dict = JSON.parse(saved);
        delete dict[String(roomId)];
        localStorage.setItem("chat_last_messages", JSON.stringify(dict));
      }
      setCurrentRoom(null);
      loadRooms(activeTab);
    } catch (e) { console.error(e) }
  }

  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    const token = localStorage.getItem("accessToken");
    const currentMyId = localStorage.getItem("userId");
    try {
      const res = await fetch(`${USER_API_BASE}/v1/user/admin/users/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.isSuccess && data.result?.content) {
        const filtered = data.result.content.filter((u: any) => 
          (u.role === "USER" || u.role === "ADVISOR") && String(u.userId) !== String(currentMyId)
        );
        setAllUsers(filtered);
      }
    } catch (e) {
      console.error("유저 목록 조회 중 에러 발생:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    return allUsers.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const startDirectChat = async (targetUser: any) => {
    if (isCreating) return;
    const targetId = targetUser.userId;
    const alreadyExist = rooms.find(room => 
      (room.roomType === "DIRECT" || room.type === "DIRECT") && 
      (room.invitedUserId === targetId || room.opponentId === targetId)
    );
    if (alreadyExist) {
      setIsUserModalOpen(false);
      setActiveTab("DIRECT");
      selectRoom(alreadyExist);
      return;
    }
    setIsCreating(true);
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch(`${API_BASE}/v1/chats/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomType: "DIRECT", inviteUserId: targetId, invitedUserName: targetUser.name })
      });
      const data = await res.json();
      if (res.ok) {
        setIsUserModalOpen(false);
        setActiveTab("DIRECT");
        await loadRooms("DIRECT");
        selectRoom(data.result || data);
      }
    } catch (e) { console.error(e); } finally { setIsCreating(false); }
  }

  const createGroupChat = async () => {
    if (!newGroupTitle.trim() || isCreating) return;
    setIsCreating(true);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE}/v1/chats/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomType: "GROUP", title: newGroupTitle })
      });
      if (res.ok) {
        setNewGroupTitle("");
        setIsUserModalOpen(false);
        setActiveTab("GROUP");
        await loadRooms("GROUP");
      }
    } catch (e) { console.error(e); } finally { setIsCreating(false); }
  }

  // 로직은 그대로 유지: 메시지에서 참여자 정보(ID, Name) 수집
  const currentRoomParticipants = useMemo(() => {
    if (!currentRoom) return [];
    const participantMap = new Map();
    participantMap.set(String(userId), { userId, name: userName });
    messages.forEach(msg => {
      const sId = String(msg.senderId || msg.userId);
      const sName = msg.senderName;
      if (sId && sId !== "undefined" && sName) {
        participantMap.set(sId, { userId: sId, name: sName });
      }
    });
    return Array.from(participantMap.values());
  }, [messages, currentRoom, userId, userName]);

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans">
      <aside className="w-80 md:w-96 flex flex-col bg-card border-r border-border shadow-2xl z-20">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="icon" onClick={() => router.push("/dashboard")} className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-all shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-black tracking-tight">메시지</h1>
            </div>
            <Dialog open={isUserModalOpen} onOpenChange={(open) => { setIsUserModalOpen(open); if(!open) setSearchTerm(""); if(open) loadAllUsers(); }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary transition-colors"><UserPlus className="h-5 w-5" /></Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border sm:max-w-[400px]">
                <DialogHeader><DialogTitle className="text-xl font-black">새 대화 시작</DialogTitle></DialogHeader>
                <Tabs defaultValue="direct" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2 bg-secondary/50 h-10">
                    <TabsTrigger value="direct" className="text-xs font-bold">1:1 메시지</TabsTrigger>
                    <TabsTrigger value="group" className="text-xs font-bold">그룹 채널</TabsTrigger>
                  </TabsList>
                  <TabsContent value="direct" className="py-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="이름으로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10 bg-secondary/30 border-none rounded-xl text-sm" />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                      {isLoadingUsers ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="text-xs text-muted-foreground font-bold">유저 목록 불러오는 중...</p></div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <button key={`user-${user.userId}`} disabled={isCreating} onClick={() => startDirectChat(user)} className={`w-full p-3 flex items-center gap-3 rounded-xl hover:bg-secondary/50 text-left transition-all ${isCreating ? 'opacity-50' : ''}`}>
                            <Avatar className="h-10 w-10 ring-2 ring-primary/5"><AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex flex-1 justify-between items-center">
                              <div><p className="font-bold text-sm">{user.name}</p><p className="text-[10px] text-muted-foreground uppercase font-black">{user.role}</p></div>
                              <div className="h-2 w-2 rounded-full bg-green-500/50" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-10"><p className="text-sm text-muted-foreground font-bold italic text-zinc-400">{searchTerm ? "검색 결과가 없습니다." : "조회된 유저가 없습니다."}</p></div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="group" className="py-6 space-y-4">
                    <div className="space-y-2"><Label htmlFor="groupTitle" className="text-xs font-bold text-muted-foreground ml-1">채널 이름</Label><Input id="groupTitle" placeholder="채널 이름을 입력하세요" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="bg-secondary/30 border-none h-11 rounded-xl" /></div>
                    <Button className="w-full h-11 rounded-xl font-bold" onClick={createGroupChat} disabled={isCreating || !newGroupTitle.trim()}>{isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} 새 그룹 채널 생성</Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentRoom(null); loadRooms(v); }}>
            <TabsList className="grid grid-cols-2 w-full bg-secondary/50 h-11 rounded-xl">
              <TabsTrigger value="GROUP" className="rounded-lg font-bold text-xs">그룹 채널</TabsTrigger>
              <TabsTrigger value="DIRECT" className="rounded-lg font-bold text-xs">1:1 메시지</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
          {rooms.map((room: any) => {
            const rId = room.chatRoomId || room.id;
            const isSelected = (currentRoom?.chatRoomId || currentRoom?.id) === rId;
            return (
              <button key={`room-list-${activeTab}-${rId}`} onClick={() => selectRoom(room)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-secondary/30'}`}>
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{activeTab === "GROUP" ? <Hash className="h-5 w-5" /> : <User className="h-5 w-5" />}</div>
                <div className="text-left overflow-hidden flex-1">
                  <p className={`font-bold truncate text-[14px] ${isSelected ? 'text-primary' : ''}`}>{room.title || room.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">{room.lastMessage}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="p-4 bg-secondary/20 border-t border-border">
           <div className="flex items-center gap-3 p-2 bg-card rounded-2xl border border-border/50 shadow-sm">
              <Avatar className="h-10 w-10 ring-2 ring-secondary"><AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">{userName?.charAt(0)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-bold truncate">{userName}님</p><div className="flex items-center gap-1.5"><div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} /><span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">{isConnected ? 'Online' : 'Offline'}</span></div></div>
              {userRole === "USER" && <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/settings")} className="h-8 w-8 text-muted-foreground hover:text-primary"><Settings className="h-4 w-4" /></Button>}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-background relative">
        {currentRoom ? (
          <>
            <header className="h-[76px] px-8 border-b border-border flex items-center justify-between bg-card/30 backdrop-blur-xl z-10">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary border border-primary/10">{activeTab === "GROUP" ? <Hash className="h-5 w-5" /> : <User className="h-5 w-5" />}</div>
                <div className="flex flex-col">
                  <h2 className="font-black text-base tracking-tight">{currentRoom.title || currentRoom.name}</h2>
                  {activeTab === "GROUP" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 w-fit">
                          <Users className="h-3 w-3" /> 참여자 목록 ({currentRoomParticipants.length})
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 bg-card border-border shadow-xl rounded-xl">
                        <p className="text-[11px] font-black text-muted-foreground px-2 py-1 mb-1 border-b border-border/50">현재 대화중인 유저</p>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {currentRoomParticipants.map((u) => (
                            <div key={`part-${u.userId}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50">
                              <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px] bg-primary/10 text-primary">{u.name?.charAt(0)}</AvatarFallback></Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{u.name} {String(u.userId) === String(userId) && "(나)"}</span>
                                {/* ID 표시 부분 삭제됨 */}
                              </div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 h-9 rounded-xl transition-colors"><LogOut className="h-4 w-4 mr-2" /> 나가기</Button>
            </header>
            
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-8 py-8 space-y-1 custom-scrollbar bg-gradient-to-b from-background to-secondary/10 flex flex-col">
              {isLoadingHistory && <div className="text-center py-2"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>}
              {messages.map((msg, idx) => {
                const msgKey = msg.chatMessageId || msg.messageId?.chatMessageId || `msg-${idx}-${msg.createdAt}`;
                const msgDateId = getMessageDateId(msg.createdAt || msg.messageId?.createdAt);
                const prevMsgDateId = idx > 0 ? getMessageDateId(messages[idx-1].createdAt || messages[idx-1].messageId?.createdAt) : null;
                const isNewDay = msgDateId && msgDateId !== prevMsgDateId;
                return (
                  <div key={msgKey} className="flex flex-col w-full">
                    {isNewDay && (
                      <div className="flex justify-center my-8 relative w-full">
                        <div className="bg-zinc-200/70 dark:bg-zinc-800/70 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 px-5 py-1.5 rounded-full z-10 backdrop-blur-sm border border-white/10">{msgDateId}</div>
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border/20 -z-0"></div>
                      </div>
                    )}
                    <div className="py-1">
                      {(msg.type === "ENTER" || msg.messageType === "ENTER") ? (
                        <div className="flex justify-center my-2 animate-in fade-in zoom-in-95 duration-500"><span className="bg-secondary/80 text-muted-foreground text-[11px] font-bold px-5 py-2 rounded-full border border-border shadow-sm backdrop-blur-sm">📢 {msg.senderName || userName}님이 {msg.content}</span></div>
                      ) : (
                        <div className={`flex ${String(msg.senderId || msg.userId) === String(userId) ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`flex flex-col max-w-[70%] ${String(msg.senderId || msg.userId) === String(userId) ? "items-end" : "items-start"}`}>
                            {String(msg.senderId || msg.userId) !== String(userId) && (
                              <div className="flex items-center gap-1 mb-1 ml-1">
                                <span className="text-[11px] font-bold text-muted-foreground">{msg.senderName}</span>
                                {/* ID 표시 태그 삭제됨 */}
                              </div>
                            )}
                            <div className="flex items-end gap-2">
                              {String(msg.senderId || msg.userId) === String(userId) && <span className="text-[10px] text-zinc-500 font-bold pb-1">{renderTime(msg.createdAt)}</span>}
                              <Card className={`p-3 text-[14px] font-medium leading-snug border-none shadow-md ${String(msg.senderId || msg.userId) === String(userId) ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none" : "bg-card text-foreground rounded-2xl rounded-tl-none ring-1 ring-border"}`}>{msg.content}</Card>
                              {String(msg.senderId || msg.userId) !== String(userId) && <span className="text-[10px] text-zinc-500 font-bold pb-1">{renderTime(msg.createdAt)}</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <footer className="p-6 bg-card border-t border-border">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3"><Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 h-12 bg-secondary/40 border-none rounded-xl px-4 font-medium" /><Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-primary shadow-lg hover:scale-105 active:scale-95 transition-all" disabled={!inputValue.trim()}><Send className="h-5 w-5 text-primary-foreground" /></Button></form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background"><div className="w-20 h-20 rounded-3xl bg-secondary/30 flex items-center justify-center mb-6"><MessageSquare className="h-8 w-8 text-muted-foreground/20" /></div><h3 className="text-lg font-bold">채팅방을 선택해주세요</h3></div>
        )}
      </main>
      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }`}</style>
    </div>
  )
}