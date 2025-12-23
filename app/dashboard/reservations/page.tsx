"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Calendar, Timer, Search, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import logo from "@/lib/images/image copy.png"

export default function ReservationsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [reservations, setReservations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const fetchMyReservations = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    const userId = localStorage.getItem("userId")
    
    if (!token || !userId) {
      router.push("/login");
      return;
    }
    
    try {
      // 1. 예약 내역 가져오기
      const res = await fetch(`http://34.50.7.8:30000/v1/reservations/users/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      // 2. 상품 정보도 함께 가져와서 이름 매칭 (대시보드와 동일한 로직)
      const prodRes = await fetch("http://34.50.7.8:30000/v1/products", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        let prodData: any[] = []
        if (prodRes.ok) {
          const pJson = await prodRes.json()
          prodData = pJson.result || pJson
        }

        let list = Array.isArray(data) ? data : (data.result || [])
        
        // 데이터 포맷팅 및 본인 확인 강화
        const formatted = list
          .filter((r: any) => String(r.userId) === String(userId)) // 확실하게 본인 ID로 필터링
          .map((r: any) => ({
            ...r,
            productName: r.productName || prodData.find((p: any) => p.productId === r.productId)?.productName || "금융 상담 서비스"
          }))
          .sort((a: any, b: any) => 
            new Date(b.createdAt || b.reservationDate).getTime() - new Date(a.createdAt || a.reservationDate).getTime()
          );
        
        setReservations(formatted)
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    // 💡 다른 사용자의 정보가 섞일 수 있는 sessionStorage 대신 항상 새로 서버에서 불러오도록 수정
    fetchMyReservations();
  }, [fetchMyReservations]);

  const handleCancelReservation = async (resItem: any) => {
    const targetOrderId = resItem.paymentId || resItem.orderId;
    
    if (!targetOrderId) {
      alert("결제 식별 정보를 찾을 수 없습니다.");
      return;
    }

    if (!confirm("예약을 취소하시겠습니까?")) return;

    const token = localStorage.getItem("accessToken");
    
    try {
      const response = await fetch("http://34.50.7.8:30000/v1/payments/cancel", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: targetOrderId,
          reason: "사용자 요청에 의한 예약 취소",
          cancelAmount: resItem.amount || resItem.price || 0
        })
      });

      if (response.ok) {
        alert("예약이 성공적으로 취소되었습니다.");
        fetchMyReservations(); // 취소 후 목록 새로고침
      } else {
        const result = await response.json();
        alert(`취소 실패: ${result.message || "서버 오류"}`);
      }
    } catch (error) {
      alert("네트워크 오류로 취소에 실패했습니다.");
    }
  };

  const filteredReservations = reservations.filter(res => 
    (res.productName || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-black">나의 예약 내역</h1>
          </div>
          <Image src={logo} alt="Logo" width={80} height={20} className="opacity-50" />
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="상담 명칭으로 검색..." 
            className="pl-10 h-12 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {filteredReservations.length > 0 ? filteredReservations.map((res, idx) => (
            <div key={res.reservationId || idx} className={`bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all ${res.status === 'CANCELLED' ? 'opacity-60 bg-slate-50' : 'hover:shadow-md hover:border-primary/20'}`}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${res.status === 'CANCELLED' ? 'bg-slate-400' : 'bg-green-500'}`}></span>
                  <h3 className="text-lg font-bold">{res.productName}</h3>
                  {res.status === 'CANCELLED' && <Badge variant="outline" className="text-slate-500 border-slate-200">취소됨</Badge>}
                </div>
            
                <div className="flex flex-wrap gap-3 text-[12px] font-bold">
                  <div className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-lg text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {res.reservationDate}
                  </div>
                  <div className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-lg text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {res.startTime?.slice(0,5)} - {res.endTime?.slice(0,5)}
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col justify-between items-end shrink-0 border-t md:border-t-0 pt-4 md:pt-0 gap-3">
                <div className="text-right">
                   <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">상태</p>
                   <Badge className={`${res.status === 'CANCELLED' ? 'bg-slate-300' : 'bg-primary'} text-white border-none font-bold`}>
                    {res.status === 'CANCELLED' ? '취소 완료' : '예약 확정'}
                  </Badge>
                </div>
                
                {res.status !== 'CANCELLED' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancelReservation(res)}
                    className="text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 font-bold text-xs rounded-lg transition-colors"
                  >
                    예약 취소
                  </Button>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-24 border-2 border-dashed rounded-3xl text-muted-foreground font-bold bg-slate-50/50">
              조회된 예약 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}