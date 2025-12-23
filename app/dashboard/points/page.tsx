"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, Wallet, History, TrendingUp, 
  Gift, Loader2, Sparkles
} from "lucide-react"
import logo from "@/lib/images/image copy.png"

// 1. API 응답 구조에 맞춘 인터페이스 수정
interface PointSummary {
  userId: string;
  totalPoints: number;
  earnedCount: number;
}

interface PointHistory {
  pointId: string;
  promotionId: string;
  promotionName: string;
  amount: number;
  queuePosition: number;
  earnedAt: string | number[]; // 서버에서 배열로 올 경우를 대비
}

export default function PointPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<PointSummary | null>(null)
  const [history, setHistory] = useState<PointHistory[]>([])
  const [loading, setLoading] = useState(true)

  // 날짜 변환 헬퍼 함수
  const formatDate = (dateData: any) => {
    if (!dateData) return "";
    if (Array.isArray(dateData)) {
      return `${dateData[0]}-${String(dateData[1]).padStart(2, '0')}-${String(dateData[2]).padStart(2, '0')}`;
    }
    return new Date(dateData).toLocaleDateString();
  }

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

    if (!userId || !token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}` }
        const [sumRes, histRes] = await Promise.all([
          fetch(`http://34.50.7.8:30000/v1/points/users/${userId}/summary`, { headers }),
          fetch(`http://34.50.7.8:30000/v1/points/users/${userId}/history`, { headers })
        ])

        const sumData = await sumRes.json()
        const histData = await histRes.json()

        // 2. data.result가 존재하는지 안전하게 확인
        if (sumData.isSuccess && sumData.result) setSummary(sumData.result)
        if (histData.isSuccess && histData.result) setHistory(histData.result)
      } catch (e) {
        console.error("포인트 데이터 로드 실패", e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-sm font-bold text-muted-foreground">포인트 내역을 불러오고 있습니다...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Image src={logo} alt="Next Me" width={100} height={30} className="h-8 w-auto" priority />
          </div>
          <Badge className="bg-primary/10 text-primary border-none font-bold px-3 py-1">POINT ASSET</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight mb-1">포인트 자산 현황</h1>
          <p className="text-sm text-muted-foreground font-medium">프로모션 참여로 적립된 혜택 자산입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="p-8 border-t-4 border-t-primary bg-gradient-to-br from-card to-secondary/20 shadow-xl overflow-hidden relative border-none">
            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 pointer-events-none">
              <Wallet size={120} />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Wallet className="h-3 w-3 text-primary" /> 보유 포인트
            </p>
            <p className="text-4xl font-black text-primary tracking-tighter">
              {(summary?.totalPoints ?? 0).toLocaleString()} <span className="text-xl ml-1 font-bold">P</span>
            </p>
          </Card>

          <Card className="p-8 border-t-4 border-t-blue-500 bg-card shadow-lg relative border-none">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-blue-500" /> 총 적립 횟수
            </p>
            <p className="text-4xl font-black tracking-tighter">
              {summary?.earnedCount ?? 0} <span className="text-xl ml-1 text-muted-foreground font-bold">회</span>
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> 적립 히스토리
            </h2>
            <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5">{history.length}건의 내역</Badge>
          </div>

          {history.length > 0 ? history.map((item, idx) => (
            // 3. key 값을 id가 없을 경우 대비하여 조합형으로 변경
            <Card key={item.pointId || `point-${idx}`} className="p-5 flex items-center justify-between hover:border-primary/30 transition-all group border-border/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[15px] tracking-tight">{item.promotionName}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-muted-foreground">
                    <span>{formatDate(item.earnedAt)}</span>
                    <span className="opacity-30">|</span>
                    <span className="text-primary/70">{item.queuePosition}번째 선착순 당첨</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-black text-primary">+{(item.amount ?? 0).toLocaleString()} P</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Earned</p>
              </div>
            </Card>
          )) : (
            <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/5">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">적립된 포인트 내역이 없습니다.</p>
              <Link href="/promotions">
                <Button variant="link" className="text-primary font-bold mt-2">이벤트 참여하러 가기</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="py-10 text-center text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
        © NEXT ME POINT ASSET MANAGEMENT SYSTEM
      </footer>
    </div>
  )
}