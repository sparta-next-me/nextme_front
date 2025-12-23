"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, Gift, ChevronRight, Loader2, 
  Sparkles, ChevronLeft, AlertCircle, Timer, Trophy, ArrowRight, Wallet
} from "lucide-react"
import Image from "next/image"
import logo from "@/lib/images/image copy.png"

interface Promotion {
  id: string;
  name: string;
  pointAmount: number;
  totalStock: number;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "ACTIVE" | "ENDED";
}

export default function PromotionPage() {
  const router = useRouter()
  
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "ACTIVE">("ACTIVE")
  
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [totalPoints, setTotalPoints] = useState<number>(0)

  const BASE_URL = "http://34.50.7.8:30000/v1/promotions"
  const POINT_URL = "http://34.50.7.8:30000/v1/points"

  // 총 포인트 로드 함수
  const fetchTotalPoints = async () => {
    const token = localStorage.getItem("accessToken")
    const userId = localStorage.getItem("userId")
    if (!userId || !token) return;

    try {
      const res = await fetch(`${POINT_URL}/users/${userId}/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.isSuccess) setTotalPoints(data.result.totalPoints)
    } catch (err) {
      console.error("포인트 로드 실패", err)
    }
  }

  useEffect(() => {
    fetchTotalPoints();
    
    const token = localStorage.getItem("accessToken")
    const statusQuery = filter === "ACTIVE" ? "status=ACTIVE&" : ""
    
    fetch(`${BASE_URL}?${statusQuery}page=0&size=20`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.isSuccess) {
          const now = new Date();
          let fetchedPromos = data.result.content;
          if (filter === "ACTIVE") {
            fetchedPromos = fetchedPromos.filter((p: Promotion) => {
              const start = new Date(p.startTime);
              const end = new Date(p.endTime);
              return p.status === "ACTIVE" && now >= start && now <= end;
            });
          }
          setPromotions(fetchedPromos);
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  const handleJoin = async () => {
    if (!selectedId) return
    const token = localStorage.getItem("accessToken")
    setSubmitting(true)
    
    try {
      const joinRes = await fetch(`${BASE_URL}/${selectedId}/join`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      const joinData = await joinRes.json()
      
      if (joinData.isSuccess) {
        const resultRes = await fetch(`${BASE_URL}/${selectedId}/participations`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const resultData = await resultRes.json()
        
        if (resultData.isSuccess) {
          setResult(resultData.result)
          // 당첨 시 포인트 즉시 갱신
          await fetchTotalPoints();
        }
      } else {
        alert(joinData.message || "참여에 실패했습니다.")
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectPromotion = (id: string) => {
    const promo = promotions.find(p => p.id === id);
    if (!promo || promo.status === "ENDED") return; // 종료된 프로모션은 진입 방지 가능

    setSelectedId(id)
    setResult(null)
    window.scrollTo(0, 0)
    
    const token = localStorage.getItem("accessToken")
    fetch(`${BASE_URL}/${id}/participations`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(res => {
      if(res.status === 200) return res.json()
      return null
    }).then(data => {
      if(data && data.isSuccess) setResult(data.result)
    }).catch(() => {})
  }

  const selectedPromotion = promotions.find(p => p.id === selectedId)

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => selectedId ? setSelectedId(null) : router.back()} className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center">
              <Image src={logo} alt="Next Me" width={110} height={30} className="h-10 auto w-auto" priority />
            </Link>
          </div>
          <Badge variant="outline" className="font-bold border-primary/20 text-primary px-3 py-1 uppercase text-[10px]">
            {selectedId ? "Details" : "Promotions"}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {selectedId && selectedPromotion ? (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-8 border border-border shadow-2xl bg-card relative overflow-hidden rounded-[32px]">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-primary">
                <p className="text-[120px] font-black select-none">EVENT</p>
              </div>
              
              <Badge className={`mb-4 border-none font-bold px-4 py-1.5 rounded-full ${
                selectedPromotion.status === 'ACTIVE' ? 'bg-primary' : 
                selectedPromotion.status === 'SCHEDULED' ? 'bg-amber-500' : 'bg-slate-500'
              }`}>
                {selectedPromotion.status}
              </Badge>
              <h1 className="text-3xl font-black tracking-tight mb-2 leading-tight">{selectedPromotion.name}</h1>
              <p className="text-muted-foreground font-bold mb-8 italic text-sm">기간: {selectedPromotion.startTime.split('T')[0]} ~ {selectedPromotion.endTime.split('T')[0]}</p>

              <div className="bg-secondary/30 rounded-[32px] p-12 text-center mb-8 border border-border/50">
                <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-3">Winning Reward</p>
                <p className="text-6xl font-black text-primary tracking-tighter">{selectedPromotion.pointAmount.toLocaleString()}<span className="text-2xl ml-1">P</span></p>
              </div>

              {result ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className={`rounded-[32px] p-10 border-2 flex flex-col items-center text-center space-y-4 ${
                    result.status === 'WON' ? 'bg-green-500/5 border-green-500/20' : 
                    result.status === 'LOST' ? 'bg-slate-500/5 border-slate-500/20' : 'bg-orange-500/5 border-orange-500/20'
                  }`}>
                    {result.status === 'WON' ? (
                      <>
                        <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                          <Trophy className="h-10 w-10 text-green-500 animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-black text-green-600 uppercase tracking-tight">당첨 성공!</h2>
                        <p className="text-lg font-bold text-foreground leading-relaxed">{result.message}</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-14 w-14 text-slate-400 mb-2" />
                        <h2 className="text-2xl font-black text-slate-600">아쉬운 결과</h2>
                        <p className="text-sm font-bold text-muted-foreground">선착순 인원에 들지 못했습니다.</p>
                      </>
                    )}
                  </div>
                  <Button className="w-full h-16 rounded-2xl font-black text-lg bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all" onClick={() => router.push("/dashboard/points")}>
                    상세 내역 확인하기 <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full h-24 rounded-[32px] font-black text-2xl italic tracking-[0.1em] shadow-2xl transition-all active:scale-95 bg-primary hover:bg-primary/90"
                  disabled={selectedPromotion.status !== "ACTIVE" || submitting}
                  onClick={handleJoin}
                >
                  {submitting ? <Loader2 className="animate-spin h-8 w-8" /> : 
                   selectedPromotion.status === "SCHEDULED" ? "COMING SOON" : 
                   selectedPromotion.status === "ENDED" ? "PROMOTION ENDED" : "JOIN PROMOTION NOW"}
                </Button>
              )}
            </Card>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />프로모션
                </h1>
              </div>

              <Link href="/dashboard/points">
                <div className="flex items-center gap-4 bg-card px-6 py-4 rounded-[24px] shadow-xl shadow-primary/5 hover:scale-105 transition-all active:scale-95 cursor-pointer border-2 border-primary/20 min-w-[220px]">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[11px] font-black text-muted-foreground uppercase mb-1.5 tracking-wider">My Points Balance</span>
                    <span className="text-2xl font-black text-primary tracking-tighter">
                      {totalPoints.toLocaleString()} <span className="text-sm ml-0.5">P</span>
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary/30 ml-auto" />
                </div>
              </Link>
            </div>
            
            <div className="flex gap-3 mb-12 bg-secondary/30 p-2 rounded-2xl w-fit border border-border/50">
              <Button variant={filter === "ACTIVE" ? "default" : "ghost"} size="sm" className="rounded-xl font-black px-10 h-10 transition-all" onClick={() => setFilter("ACTIVE")}>진행 중</Button>
              <Button variant={filter === "ALL" ? "default" : "ghost"} size="sm" className="rounded-xl font-black px-10 h-10 transition-all" onClick={() => setFilter("ALL")}>전체 보기</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map((p) => {
                const isActive = p.status === "ACTIVE";
                const isScheduled = p.status === "SCHEDULED";
                const isEnded = p.status === "ENDED";

                return (
                  <div 
                    key={p.id} 
                    className={`group transition-all ${isEnded ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-2'}`} 
                    onClick={() => handleSelectPromotion(p.id)}
                  >
                    <Card className={`p-8 relative overflow-hidden border border-border shadow-sm transition-all rounded-[24px] bg-card ${
                      !isActive ? 'grayscale opacity-70 bg-secondary/10' : 'hover:shadow-2xl'
                    }`}>
                      <div className="flex justify-between items-start mb-8">
                        <Badge className={`border-none font-black px-3 py-1 rounded-lg text-[10px] uppercase ${
                          isActive ? 'bg-primary/10 text-primary' : 
                          isScheduled ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {p.status}
                        </Badge>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">Reward</p>
                           <p className={`text-3xl font-black tracking-tighter ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                             {p.pointAmount.toLocaleString()}P
                           </p>
                        </div>
                      </div>
                      
                      <h3 className={`text-xl font-black mb-10 line-clamp-2 min-h-[3.5rem] leading-tight transition-colors ${
                        isActive ? 'group-hover:text-primary' : 'text-slate-400'
                      }`}>
                        {p.name}
                      </h3>

                      <div className="pt-6 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs tracking-tighter">
                          <Calendar className="h-4 w-4" />
                          {p.startTime.split('T')[0]} ~ {p.endTime.split('T')[0]}
                        </div>
                        
                        {isActive && (
                          <div className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shadow-lg shadow-primary/30">
                            <ChevronRight className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      
                      {/* 종료 스탬프 표시 (선택 사항) */}
                      {isEnded && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 border-4 border-slate-400 text-slate-400 font-black px-4 py-1 rounded-xl opacity-30 pointer-events-none">
                          FINISHED
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}