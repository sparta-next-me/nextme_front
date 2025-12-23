"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { 
  Plus, Play, Square, Slack, LogOut, Activity, 
  Sparkles, UserCheck, Eye, ShieldCheck, Zap, Info, Send, ChevronLeft, ChevronRight, Loader2,
  Trophy, CheckCircle2, Timer, Calendar
} from "lucide-react"
import logo from "@/lib/images/image copy.png"

// --- 인터페이스 정의 ---
interface Promotion {
  id: string; 
  name: string;         
  pointAmount: number; 
  totalStock: number;  
  startTime: string;   
  endTime: string;     
  status: "SCHEDULED" | "ACTIVE" | "ENDED";
  etc: string | null;
  createdAt: string; 
}

interface PromotionStatus {
  queueSize: number;
  participantCount: number;
  winnerCount: number;
  totalStock: number;
  remainingStock: number;
}

interface WinnerListResponse {
  userId: string;
  queuePosition: number;
  participatedAt: string;
}

interface AdvisorRequest {
  userId: string;
  userName: string;
  name: string;
  email: string;
  appliedAt: string;
  reason: string;
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState("")

  const BASE_URL = "http://34.50.7.8:30000"
  const PROMO_API = `${BASE_URL}/v1/promotions`
  const ADMIN_USER_API = `${BASE_URL}/v1/user` 

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [activePromoCount, setActivePromoCount] = useState(0) 
  const [advisorRequests, setAdvisorRequests] = useState<AdvisorRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<AdvisorRequest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPromoCreateOpen, setIsPromoCreateOpen] = useState(false)

  const [winners, setWinners] = useState<WinnerListResponse[]>([])
  const [isWinnersOpen, setIsWinnersOpen] = useState(false)
  const [statusData, setPromotionStatusData] = useState<PromotionStatus | null>(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [targetPromoId, setTargetPromoId] = useState<string | null>(null) 
  const [targetPromoName, setTargetPromoName] = useState("")

  const [promoPage, setPromoPage] = useState(0)
  const [totalPromoPages, setTotalPromoPages] = useState(1)
  const itemsPerPage = 5 

  // --- 수정된 로직: 리스트 순서(index)에 따라 "신짱구, 신짱아..." 순차적으로 할당 ---
  const getCharacterName = (index: number) => {
    const surnames = ["신", "김", "이", "박", "최", "정", "강", "조", "윤", "장"];
    const characters = [
      "짱구", "짱아", "미선", "형만", "흰둥이", "철수", "훈이", "유리", "맹구", "성아",
      "미리", "나미", "수지", "치타", "광자", "이슬", "로베르토", "지혜", "뭉치", "코난"
    ];

    // index 기반으로 순차 매칭 (이름 20개가 돌 때마다 성씨가 바뀜)
    const surIdx = Math.floor(index / characters.length) % surnames.length;
    const charIdx = index % characters.length;

    return `${surnames[surIdx]}${characters[charIdx]}`;
  };

  const refreshStatus = useCallback(async (id: string) => {
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch(`${PROMO_API}/${id}/status`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.isSuccess) setPromotionStatusData(data.result)
    } catch (e) { console.error("현황 갱신 오류") }
  }, [PROMO_API])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isStatusOpen && targetPromoId) {
      timer = setInterval(() => refreshStatus(targetPromoId), 3000)
    }
    return () => clearInterval(timer)
  }, [isStatusOpen, targetPromoId, refreshStatus])

  const fetchWinners = async (id: string, name: string) => {
    const token = localStorage.getItem("accessToken")
    try {
      setTargetPromoName(name)
      const res = await fetch(`${PROMO_API}/${id}/winners`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.isSuccess) {
        setWinners(data.result)
        setIsWinnersOpen(true)
      }
    } catch (error) { alert("당첨자 목록 로드 실패"); }
  }

  const openStatusMonitor = (id: string, name: string) => {
    setTargetPromoId(id)
    setTargetPromoName(name)
    refreshStatus(id) 
    setIsStatusOpen(true)
  }

  const fetchPromotions = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    try {
      setIsLoading(true)
      const res = await fetch(`${PROMO_API}?page=${promoPage}&size=${itemsPerPage}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      const countRes = await fetch(`${PROMO_API}?page=0&size=100`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const countData = await countRes.json()

      if (data.isSuccess) {
        setPromotions(data.result.content); 
        setTotalPromoPages(data.result.totalPages);
      }
      if (countData.isSuccess) {
        const totalActive = countData.result.content.filter((p: Promotion) => p.status === "ACTIVE").length
        setActivePromoCount(totalActive)
      }
    } catch (error) { console.error("로드 실패", error); } finally { setIsLoading(false); }
  }, [promoPage, PROMO_API])

  const fetchPendingAdvisors = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch(`${ADMIN_USER_API}/advisor/pending`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.isSuccess) { setAdvisorRequests(data.result); }
    } catch (error) { console.error("심사 로드 실패", error); }
  }, [ADMIN_USER_API])

  useEffect(() => {
    const role = localStorage.getItem("role")
    const name = localStorage.getItem("name") || "관리자"
    if (role !== "MANAGER" && role !== "MASTER") { router.push("/login"); return; }
    setUserRole(role); setUserName(name); setIsMounted(true);
    fetchPromotions(); fetchPendingAdvisors();
  }, [router, fetchPromotions, fetchPendingAdvisors])

  const [newPromo, setNewPromo] = useState({ 
    name: "", pointAmount: "", totalStock: "", 
    startTime: "", endTime: "" 
  })

  const handleCreatePromotion = async () => {
    const token = localStorage.getItem("accessToken")
    if (!newPromo.name || !newPromo.pointAmount || !newPromo.totalStock) return alert("필수 정보를 입력하세요.")
    try {
      const res = await fetch(PROMO_API, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...newPromo, 
          totalStock: Number(newPromo.totalStock), 
          pointAmount: Number(newPromo.pointAmount),
          createdAt: new Date().toISOString()
        })
      })
      const data = await res.json()
      if (data.isSuccess) { alert("프로모션이 생성되었습니다."); setIsPromoCreateOpen(false); fetchPromotions(); }
    } catch (error) { alert("생성 중 오류 발생"); }
  }

  const handleTogglePromotion = async (id: string, currentStatus: string) => {
    const token = localStorage.getItem("accessToken")
    const action = currentStatus === "SCHEDULED" ? "start" : "end"
    if (!confirm(`프로모션을 ${action === "start" ? "시작" : "종료"}하시겠습니까?`)) return
    try {
      const res = await fetch(`${PROMO_API}/${id}/${action}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.isSuccess) fetchPromotions()
    } catch (error) { alert("상태 변경 실패"); }
  }

  const handleProcessAdvisor = async (userId: string, isApprove: boolean) => {
    const token = localStorage.getItem("accessToken")
    const actionText = isApprove ? "승인" : "거절"
    if (!isApprove && !confirm("해당 신청을 거절하시겠습니까?")) return
    try {
      const res = await fetch(`${ADMIN_USER_API}/advisor/${userId}/approve`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.isSuccess) { alert(data.message || `${actionText} 처리되었습니다.`); setIsDetailOpen(false); fetchPendingAdvisors(); }
    } catch (error) { alert("서버 통신 오류"); }
  }

  const handleSlackTest = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${PROMO_API}/test/monitoring/test-slack-only`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.isSuccess) alert("슬랙 테스트 메시지 전송 성공");
    } catch (e) { alert("슬랙 API 통신 오류"); }
  };

  const handleSendSlackReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!confirm("현황 보고서를 슬랙으로 전송하시겠습니까?")) return;
    try {
      const res = await fetch(`${PROMO_API}/monitoring/report/manual`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.isSuccess) alert("슬랙 보고서가 전송되었습니다.");
    } catch (e) { console.log("보고서 API 통신 오류"); }
  };

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src={logo} alt="Next Me" width={100} height={28} className="h-7 w-auto" priority />
            <Badge variant="outline" className="ml-2 border-primary text-primary font-bold uppercase text-[10px]">{userRole} ADMIN</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-black uppercase">{userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={() => {localStorage.clear(); router.push("/login");}} className="rounded-xl"><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">환영합니다, {userName} 관리자님.</h1>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl h-10" onClick={handleSlackTest}><Slack className="h-4 w-4 mr-2" /> Slack 테스트</Button>
            <Button size="sm" className="flex-1 md:flex-none bg-primary rounded-xl h-10" onClick={handleSendSlackReport}><Send className="h-4 w-4 mr-2" /> 슬랙 보고 전송</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Card className="p-6 h-[140px] sm:h-[160px] relative overflow-hidden border-t-4 border-t-slate-500 bg-card shadow-sm flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2"><Activity className="h-5 w-5 text-slate-600" /></div>
                <div><p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">시스템 상태</p><p className="text-2xl font-black italic tracking-tighter">OPERATIONAL</p></div>
                <div className="absolute top-4 right-4 opacity-5 italic font-black text-4xl select-none">SYS</div>
            </Card>
            <Card className="p-6 h-[140px] sm:h-[160px] relative overflow-hidden border-t-4 border-t-primary bg-card shadow-sm flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2"><Zap className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">활성화된 프로모션</p>
                  <p className="text-3xl font-black italic tracking-tighter text-primary">{activePromoCount} <span className="text-sm font-bold ml-1">Live</span></p>
                </div>
                <div className="absolute top-4 right-4 opacity-5 italic font-black text-4xl select-none">PROMO</div>
            </Card>
            <Card className="p-6 h-[140px] sm:h-[160px] relative overflow-hidden border-t-4 border-t-orange-500 bg-card shadow-sm flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center mb-2"><UserCheck className="h-5 w-5 text-orange-500" /></div>
                <div><p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">전문가 승인 대기</p><p className="text-3xl font-black italic tracking-tighter text-orange-500">{advisorRequests.length} <span className="text-sm font-bold ml-1">Reqs</span></p></div>
                <div className="absolute top-4 right-4 opacity-5 italic font-black text-4xl select-none">APPROVE</div>
            </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="promotions" className="w-full">
              <TabsList className="bg-secondary/30 mb-6 p-1 rounded-xl w-fit">
                <TabsTrigger value="promotions" className="font-bold rounded-lg px-4 sm:px-6 uppercase italic text-xs sm:text-sm">Promotions</TabsTrigger>
                <TabsTrigger value="advisors" className="font-bold rounded-lg px-4 sm:px-6 uppercase italic text-xs sm:text-sm">Advisors</TabsTrigger>
              </TabsList>

              <TabsContent value="promotions" className="mt-0">
                <Card className="p-4 sm:p-6 border-border shadow-none flex flex-col min-h-[500px] rounded-2xl bg-card/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-black italic uppercase flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> 프로모션 현황</h2>
                    <Button size="sm" onClick={() => setIsPromoCreateOpen(true)} className="rounded-xl font-bold h-9 text-xs"><Plus className="h-4 w-4 mr-1" /> 신규</Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left font-sans table-fixed min-w-[650px]">
                        <thead className="text-muted-foreground text-[10px] font-black uppercase border-b border-border/50">
                          <tr>
                            <th className="px-2 py-3 w-[25%]">Campaign</th>
                            <th className="px-2 py-3 w-[30%]">Schedule</th>
                            <th className="px-2 py-3 text-center w-[15%]">Status</th>
                            <th className="px-2 py-3 text-right w-[30%]">Control</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-sm font-medium">
                          {promotions.map((p) => (
                            <tr key={p.id} className="group hover:bg-secondary/10 transition-all">
                              <td className="px-2 py-5 overflow-hidden">
                                <p className="font-bold text-foreground italic uppercase truncate">{p.name}</p>
                                <p className="text-[10px] text-primary font-mono font-bold mt-1 tracking-tighter">{p.pointAmount.toLocaleString()}P · {p.totalStock}명</p>
                                <p className="text-[9px] text-muted-foreground font-mono mt-1 italic tracking-tight">생성일: {p.createdAt.split('T')[0]}</p>
                              </td>
                              <td className="px-2 py-5 font-mono text-[10px] space-y-1">
                                <div className="flex items-center gap-1"><Badge variant="outline" className="h-3.5 px-1 text-[7px] border-green-500/50 text-green-600">S</Badge> {p.startTime.slice(5, 16).replace('T', ' ')}</div>
                                <div className="flex items-center gap-1"><Badge variant="outline" className="h-3.5 px-1 text-[7px] border-destructive/50 text-destructive">E</Badge> {p.endTime.slice(5, 16).replace('T', ' ')}</div>
                              </td>
                              <td className="px-1 py-5 text-center">
                                <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"} className="rounded-md font-black uppercase text-[8px] h-5 justify-center px-1.5">{p.status}</Badge>
                              </td>
                              <td className="px-2 py-5">
                                <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                  {p.status === "SCHEDULED" && <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleTogglePromotion(p.id, "SCHEDULED")}><Play className="h-3.5 w-3.5 fill-current" /></Button>}
                                  {p.status === "ACTIVE" && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleTogglePromotion(p.id, "ACTIVE")}><Square className="h-3.5 w-3.5 fill-current" /></Button>}
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-500 hover:bg-orange-50" onClick={() => fetchWinners(p.id, p.name)}><Trophy className="h-3.5 w-3.5" /></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => openStatusMonitor(p.id, p.name)}><Info className="h-3.5 w-3.5" /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="sm:hidden space-y-3">
                      {promotions.map((p) => (
                        <div key={p.id} className="p-4 rounded-2xl bg-secondary/10 border border-border/40 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-black italic uppercase text-sm tracking-tight">{p.name}</p>
                                <Badge variant="secondary" className="text-[7px] h-3.5 px-1 opacity-70 font-mono">CREATED {p.createdAt.split('T')[0]}</Badge>
                              </div>
                              <p className="text-[10px] text-primary font-bold mt-0.5">{p.pointAmount.toLocaleString()}P · {p.totalStock}명</p>
                            </div>
                            <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"} className="text-[8px] px-1.5 font-black uppercase">{p.status}</Badge>
                          </div>
                          <div className="flex flex-col gap-1 py-2 border-y border-border/30">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> 시작</span>
                              <span className="font-bold">{p.startTime.slice(5, 16).replace('T', ' ')}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> 종료</span>
                              <span className="font-bold">{p.endTime.slice(5, 16).replace('T', ' ')}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex gap-2">
                                <Button variant="secondary" className="h-9 px-3 text-[10px] font-bold rounded-lg" onClick={() => openStatusMonitor(p.id, p.name)}><Activity className="h-3 w-3 mr-1.5" /> 현황</Button>
                                <Button variant="secondary" className="h-9 px-3 text-[10px] font-bold rounded-lg" onClick={() => fetchWinners(p.id, p.name)}><Trophy className="h-3 w-3 mr-1.5" /> 당첨</Button>
                            </div>
                            <div className="flex gap-1">
                                {p.status === "SCHEDULED" && <Button className="h-9 w-9 bg-green-500 hover:bg-green-600" size="icon" onClick={() => handleTogglePromotion(p.id, "SCHEDULED")}><Play className="h-4 w-4 fill-current" /></Button>}
                                {p.status === "ACTIVE" && <Button className="h-9 w-9 bg-destructive hover:bg-destructive/90" size="icon" onClick={() => handleTogglePromotion(p.id, "ACTIVE")}><Square className="h-4 w-4 fill-current" /></Button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-auto pt-6 border-t border-border/50">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPromoPage(p => Math.max(0, p-1))} disabled={promoPage === 0}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-[10px] font-black px-4 italic">{promoPage + 1} / {totalPromoPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPromoPage(p => Math.min(totalPromoPages - 1, p+1))} disabled={promoPage >= totalPromoPages - 1}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="advisors" className="mt-0">
                <Card className="p-4 sm:p-6 border-border shadow-none flex flex-col min-h-[500px] rounded-2xl bg-card/50">
                  <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2 font-black italic uppercase"><UserCheck className="h-5 w-5 text-primary" /> 신청 심사</h2>
                  <div className="flex-1 space-y-3">
                    {advisorRequests.length > 0 ? advisorRequests.map((req) => (
                      <div key={req.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-transparent hover:border-primary/20 hover:bg-white transition-all gap-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border-2 border-background"><AvatarFallback className="font-bold bg-secondary">{req.name?.[0]}</AvatarFallback></Avatar>
                          <div className="text-left"><p className="font-bold text-sm tracking-tight">{req.name}</p><p className="text-[10px] text-muted-foreground font-mono uppercase">{req.appliedAt?.split('T')[0]}</p></div>
                        </div>
                        <Button variant="outline" size="sm" className="h-9 sm:h-8 font-bold rounded-xl px-4 border-primary/20 text-xs sm:text-[11px]" onClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }}><Eye className="h-3.5 w-3.5 mr-2" /> 상세보기 및 심사</Button>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30 font-black italic uppercase text-xs tracking-widest">No pending requests</div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:block"> 
            <Card className="p-6 border-border shadow-none bg-secondary/5 rounded-2xl border-dashed">
              <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> 가이드</h2>
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-xl border border-border/50">
                  <p className="font-bold text-orange-500 text-[10px] uppercase mb-1 flex items-center gap-1"><Trophy className="h-3 w-3" /> Winner List</p>
                  <p className="text-[11px] font-bold italic leading-relaxed text-muted-foreground">트로피 아이콘을 클릭하여 실시간 당첨자 목록과 참여 순번을 확인하세요.</p>
                </div>
                <div className="p-4 bg-background rounded-xl border border-border/50">
                  <p className="font-bold text-primary text-[10px] uppercase mb-1 flex items-center gap-1"><Activity className="h-3 w-3" /> Live Monitor</p>
                  <p className="text-[11px] font-bold italic leading-relaxed text-muted-foreground">Info 아이콘을 통해 현재 대기열 크기와 잔여 수량을 실시간으로 모니터링할 수 있습니다.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* --- 모달들 --- */}
      <Dialog open={isWinnersOpen} onOpenChange={setIsWinnersOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[420px] rounded-[1.5rem] p-6 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="font-black italic uppercase text-lg flex items-center gap-2 text-orange-500"><Trophy className="h-5 w-5" /> Winners List</DialogTitle></DialogHeader>
          <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 space-y-2 my-4">
            {winners.length > 0 ? winners.map((w, index) => (
              <div key={w.userId + index} className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-border/50">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black italic text-orange-600 w-5">#{index + 1}</span>
                    <div className="overflow-hidden">
                        {/* 짱구 캐릭터 이름이 순서대로(index) 나오도록 수정 */}
                        <p className="text-[13px] font-black text-foreground italic uppercase tracking-tight">{getCharacterName(index)}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">{w.participatedAt.replace('T', ' ').slice(5, 19)}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-[8px] font-black border-orange-500/20 text-orange-600 bg-orange-50 uppercase px-1.5 h-5">Win</Badge>
              </div>
            )) : <div className="py-14 text-center text-[10px] font-black uppercase opacity-40 italic tracking-widest">당첨자 데이터가 없습니다.</div>}
          </div>
          <Button onClick={() => setIsWinnersOpen(false)} className="w-full h-12 rounded-xl font-black uppercase italic tracking-widest text-xs">Close List</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[450px] rounded-[1.5rem] p-6 sm:p-8 border-none">
          <DialogHeader>
            <DialogTitle className="font-black italic text-lg uppercase flex items-center justify-between">
              <span className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary animate-pulse" /> Live Monitor</span>
              <Badge variant="outline" className="text-[9px] border-primary text-primary animate-pulse">실시간 갱신</Badge>
            </DialogTitle>
          </DialogHeader>
          {statusData ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 py-4">
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50"><p className="text-[8px] font-black uppercase text-muted-foreground">Queue Size</p><p className="text-lg font-black">{statusData.queueSize.toLocaleString()}</p></div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50"><p className="text-[8px] font-black uppercase text-muted-foreground">Participant</p><p className="text-lg font-black">{statusData.participantCount.toLocaleString()}</p></div>
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary"><p className="text-[8px] font-black uppercase">Winners</p><p className="text-lg font-black">{statusData.winnerCount.toLocaleString()}</p></div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50"><p className="text-[8px] font-black uppercase text-muted-foreground">Total Stock</p><p className="text-lg font-black">{statusData.totalStock.toLocaleString()}</p></div>
              <div className="col-span-2 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 text-center">
                <p className="text-[9px] font-black uppercase text-orange-600">Remaining Stock</p>
                <p className="text-3xl sm:text-4xl font-black text-orange-600 tracking-tighter">{statusData.remainingStock.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          )}
          <Button className="w-full h-12 font-black rounded-xl uppercase italic tracking-widest text-xs shadow-lg shadow-primary/20" onClick={() => setIsStatusOpen(false)}>Close Monitor</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[380px] rounded-[1.5rem] p-6 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="font-black italic uppercase text-lg flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> 심사</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50">
                <Avatar className="h-10 w-10"><AvatarFallback className="font-black bg-primary text-white">{selectedRequest.name?.[0]}</AvatarFallback></Avatar>
                <div className="overflow-hidden">
                  <p className="font-black text-sm uppercase truncate">{selectedRequest.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{selectedRequest.email}</p>
                </div>
              </div>
              <div className="p-4 bg-secondary/5 border border-border/40 rounded-xl text-[10px] sm:text-[11px] font-bold italic leading-relaxed text-muted-foreground">"{selectedRequest.reason}"</div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="font-black uppercase italic text-[10px] h-11 rounded-xl" onClick={() => handleProcessAdvisor(selectedRequest.userId, false)}>Reject</Button>
                <Button className="font-black uppercase italic text-[10px] h-11 rounded-xl" onClick={() => handleProcessAdvisor(selectedRequest.userId, true)}>Approve</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoCreateOpen} onOpenChange={setIsPromoCreateOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[420px] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="font-black italic uppercase text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> 신규 프로모션 생성</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase italic ml-1">캠페인 명</Label>
              <Input placeholder="CAMPAIGN NAME" className="h-11 rounded-xl bg-secondary/20 border-none font-bold italic" value={newPromo.name} onChange={(e)=>setNewPromo({...newPromo, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase italic ml-1">포인트</Label>
                <Input type="number" placeholder="POINT" className="h-11 rounded-xl bg-secondary/20 border-none font-bold" value={newPromo.pointAmount} onChange={(e)=>setNewPromo({...newPromo, pointAmount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase italic ml-1">재고 수량</Label>
                <Input type="number" placeholder="STOCK" className="h-11 rounded-xl bg-secondary/20 border-none font-bold" value={newPromo.totalStock} onChange={(e)=>setNewPromo({...newPromo, totalStock: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase italic ml-1">시작 일시</Label>
              <Input type="datetime-local" className="h-11 rounded-xl bg-secondary/20 border-none font-bold" value={newPromo.startTime} onChange={(e)=>setNewPromo({...newPromo, startTime: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase italic ml-1">종료 일시</Label>
              <Input type="datetime-local" className="h-11 rounded-xl bg-secondary/20 border-none font-bold" value={newPromo.endTime} onChange={(e)=>setNewPromo({...newPromo, endTime: e.target.value})} />
            </div>
            <Button className="w-full h-12 rounded-xl mt-4 font-black uppercase italic tracking-widest shadow-lg shadow-primary/20" onClick={handleCreatePromotion}>Create Campaign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}