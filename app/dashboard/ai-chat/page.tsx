"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send, Sparkles, Loader2, LogOut, Hash } from "lucide-react"

// WebSocket 라이브러리
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"

export default function AIChatPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  
  const stompClient = useRef<Client | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const API_BASE = "http://sparta-nextme.xyz:30000"

  // ✅ 날짜 문자열 변환용 헬퍼
  const formatDateString = (rawData: any) => {
    if (!rawData) return "";
    try {
      let date: Date;
      if (Array.isArray(rawData)) {
        date = new Date(rawData[0], rawData[1] - 1, rawData[2]);
      } else {
        date = new Date(rawData);
      }
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch (e) { return ""; }
  };

  // ✅ 시간 표시용 헬퍼 함수
  const renderTime = (rawData: any) => {
    if (!rawData) return "";
    let hour = "", min = "";
    try {
      if (Array.isArray(rawData)) {
        hour = String(rawData[3] || "0").padStart(2, '0');
        min = String(rawData[4] || "0").padStart(2, '0');
      } else if (typeof rawData === 'string' && rawData.includes(',')) {
        const parts = rawData.split(',');
        hour = (parts[3] || "0").padStart(2, '0');
        min = (parts[4] || "0").padStart(2, '0');
      } else {
        const date = new Date(rawData);
        if (isNaN(date.getTime())) {
          const timeStr = String(rawData);
          if (timeStr.length >= 12) {
            hour = timeStr.substring(8, 10).padStart(2, '0');
            min = timeStr.substring(10, 12).padStart(2, '0');
          } else return "";
        } else {
          hour = String(date.getHours()).padStart(2, '0');
          min = String(date.getMinutes()).padStart(2, '0');
        }
      }
      return `${hour}:${min}`;
    } catch (e) { return ""; }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const userId = localStorage.getItem("userId")
    const name = localStorage.getItem("name") || "사용자"
    
    setCurrentUserId(userId)
    setUserName(name)

    if (!token) {
      router.push("/login")
      return
    }

    const client = new Client({
      brokerURL: `ws://sparta-nextme.xyz:30000/ws/chat`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS(`${API_BASE}/ws/chat`),
    })

    client.onConnect = () => {
      setIsConnected(true)
      stompClient.current = client
      initChatRoom(token, userId!)
    }

    client.onStompError = () => setIsConnected(false)
    client.activate()
    stompClient.current = client

    return () => {
      if (stompClient.current) stompClient.current.deactivate()
    }
  }, [router])

  const initChatRoom = async (token: string, userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/chats/room?roomType=AI`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      const aiRooms = data.rooms || data.result || (Array.isArray(data) ? data : [])
      let roomId = aiRooms?.[0]?.chatRoomId || aiRooms?.[0]?.id

      if (!roomId) {
        const createRes = await fetch(`${API_BASE}/v1/chats/room`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ roomType: "AI", inviteUserId: userId }) 
        })
        const newData = await createRes.json()
        roomId = newData.chatRoomId || newData.result?.chatRoomId || newData.id
      }

      if (roomId) {
        setCurrentRoomId(roomId)
        const msgRes = await fetch(`${API_BASE}/v1/chats/message/${roomId}?size=20`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const msgData = await msgRes.json()
        const fetchedMsgs = Array.isArray(msgData) ? msgData : (msgData.messages || msgData.result || [])
        
        if (fetchedMsgs.length === 0) {
          setMessages([{
            senderId: "AI",
            content: "안녕하세요! Next Me AI 어시스턴트입니다. 재무 지식에 대해 궁금한 점을 물어보세요.",
            createdAt: new Date().toISOString()
          }])
        } else {
          setMessages(fetchedMsgs.reverse())
        }
        
        subscribeToRoom(roomId)
        scrollToBottom()
      }
    } catch (e) {
      console.error("채팅방 로드 실패:", e)
    }
  }

  const subscribeToRoom = (roomId: string) => {
    if (stompClient.current?.connected) {
      stompClient.current.subscribe(`/topic/chat.room.${roomId}`, (message) => {
        const newMessage = JSON.parse(message.body)
        setMessages((prev) => [...prev, newMessage])
        setIsTyping(false) // ✅ 답변이 오면 로딩 숨김
        scrollToBottom()
      })
    }
  }

  const handleSend = (manualText?: string) => {
    const textToSend = manualText || inputValue
    if (!textToSend.trim() || !stompClient.current?.connected || !currentRoomId) return

    stompClient.current.publish({
      destination: `/app/chat.send/${currentRoomId}`,
      body: JSON.stringify({ content: textToSend, roomType: "AI" }),
    })

    setInputValue("")
    setIsTyping(true) // ✅ 보내자마자 로딩 표시 시작
    scrollToBottom() // ✅ 로딩이 보이도록 아래로 강제 스크롤
  }

  const handleLeaveRoom = async () => {
    if (!currentRoomId) return
    if (confirm("대화를 종료하시겠습니까? 종료 시 대화 내역이 삭제됩니다.")) {
      const token = localStorage.getItem("accessToken")
      const userId = localStorage.getItem("userId")
      try {
        await fetch(`${API_BASE}/v1/chats/room/${currentRoomId}/leave`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId })
        })
      } catch (e) { console.error(e) } 
      finally {
        if (stompClient.current) stompClient.current.deactivate()
        router.push("/dashboard")
      }
    }
  }

  const scrollToBottom = () => {
    // 타임아웃을 주어 렌더링이 완료된 후 스크롤이 발생하도록 함
    setTimeout(() => { 
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } 
    }, 100)
  }

  // ✅ isTyping이 변경될 때마다 스크롤을 한 번 더 실행하여 시각적 확인 보장
  useEffect(() => {
    if (isTyping) scrollToBottom();
  }, [isTyping]);

  return (
    <div className="min-h-screen flex flex-col bg-background h-screen overflow-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI 어시스턴트</p>
                <p className={`text-[10px] ${isConnected ? 'text-green-500 font-bold' : 'text-muted-foreground'}`}>
                  {isConnected ? '● ONLINE' : '○ CONNECTING...'}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4 mr-1.5" /> 나가기
          </Button>
        </div>
      </header>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-secondary/5 custom-scrollbar pb-4">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {messages.map((msg, idx) => {
              const isMine = String(msg.senderId) === String(currentUserId)
              const currentDate = formatDateString(msg.createdAt);
              const prevDate = idx > 0 ? formatDateString(messages[idx - 1].createdAt) : null;
              const showDateDivider = currentDate !== prevDate;

              return (
                <div key={idx} className="space-y-6">
                  {showDateDivider && (
                    <div className="flex justify-center my-8">
                      <div className="bg-muted/50 text-muted-foreground text-[10px] font-bold px-4 py-1 rounded-full border border-border/50 uppercase tracking-tighter">
                        {currentDate}
                      </div>
                    </div>
                  )}

                  <div className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}>
                    {!isMine && (
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                      <Card className={`p-4 shadow-sm text-sm leading-relaxed ${
                        isMine ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none border-none" 
                               : "bg-card rounded-2xl rounded-tl-none border-border/50"
                      }`}>
                        {msg.content}
                      </Card>
                      <span className="text-[10px] text-muted-foreground/50 font-medium pb-1 whitespace-nowrap">
                        {renderTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* ✅ [수정] 렌더링 위치를 명확히 하고 가시성을 높임 */}
            {isTyping && (
               <div className="flex gap-3 justify-start pt-4 animate-in slide-in-from-bottom-2 duration-300">
                 <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                 </div>
                 <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm flex flex-col gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[11px] text-primary/70 font-bold animate-pulse">
                      AI가 답변을 작성하고 있습니다...
                    </span>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 영역 */}
      <div className="border-t border-border bg-card/80 backdrop-blur-md shrink-0 p-4 pb-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              "효과적인 지출 관리 비법",
              "주택 청약 저축 가이드",
              "사회초년생 자산 관리 팁",
              "안전한 예적금 고르는 법",
              "종잣돈 1억 모으기 전략",
              "인플레이션 대비 투자법"
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={isTyping} // ✅ 전송 중 버튼 비활성화
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all text-[11px] font-bold text-muted-foreground hover:text-primary group whitespace-nowrap disabled:opacity-50"
              >
                <Hash className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/50" />
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isTyping ? "AI가 답변을 생각하는 중입니다..." : (isConnected ? "AI에게 궁금한 점을 물어보세요..." : "연결 대기 중...")}
              className="flex-1 bg-background h-12 rounded-xl border-border/50 focus:ring-primary"
              disabled={!isConnected || isTyping} 
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg" disabled={!isConnected || !inputValue.trim() || isTyping}>
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}