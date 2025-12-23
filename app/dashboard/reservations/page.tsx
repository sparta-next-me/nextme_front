"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Calendar, Timer, Search, Loader2, AlertCircle } from "lucide-react"
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
      // 1. 본인 예약 목록 조회
      const res = await fetch(`http://34.50.7.8:30000/v1/reservations/users/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      // 2. 상품명 매칭을 위한 전체 상품 정보 조회 (디자인 유지용)
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
        
        // 데이터 정제: 본인 것만 필터링 + 상품명 매칭 + 최신순 정렬
        const formatted = list
          .filter((r: any) => String(r.userId) === String(userId))
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
    // 💡 정보 혼선 방지를 위해 sessionStorage를 거치지 않고 직접 fetch합니다.
    fetchMyReservations();
  }, [fetchMyReservations]);

  const handleCancelReservation = async (resItem: any) => {
    const targetOrderId = resItem.paymentId || resItem.orderId;
    
    if (!targetOrderId) {
      alert("결제 식별자(UUID)를 찾을 수 없습니다. 예약 정보 상세를 확인해주세요.");
      return;
    }

    if (!confirm("예약을 취소하시겠습니까? 취소 시 해당 상담은 다시 예약 가능한 상태로 전환됩니다.")) return;

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

      const result = await response.json();

      if (response.ok && (result.isSuccess !== false)) {
        alert("예약이 성공적으로 취소되었습니다.");
        // 취소 후 리스트 새로고침
        fetchMyReservations();
      } else {
        alert(`취소 실패: ${result.message || "서버에서 거부되었습니다."}`);
      }
    } catch (error) {
      console.error("취소 에러:", error);
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black">전체 예약 내역</h1>
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
            <div key={res.reservationId || idx} className={`bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all ${res.status === 'CANCELLED' ? 'opacity-60' : 'hover:shadow-md'}`}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black">{res.productName}</h3>
                  {res.status === 'CANCELLED' && <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">취소됨</Badge>}
                </div>
            
                <div className="flex flex-wrap gap-4 text-[12px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1.5 rounded-lg">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {res.reservationDate}
                  </div>
                  <div className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1.5 rounded-lg">
                    <Timer className="h-3.5 w-3.5 text-primary" /> {res.startTime?.slice(0,5)} - {res.endTime?.slice(0,5)}
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col justify-between items-end shrink-0 border-t md:border-t-0 pt-4 md:pt-0 gap-3">
                <Badge className={`${res.status === 'CANCELLED' ? 'bg-slate-300' : 'bg-green-500'} text-white border-none font-bold px-3 py-1`}>
                  {res.status === 'CANCELLED' ? '취소 완료' : '예약 확정'}
                </Badge>
                
                {res.status !== 'CANCELLED' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancelReservation(res)}
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold text-xs rounded-lg transition-colors"
                  >
                    예약 취소
                  </Button>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl text-muted-foreground font-bold">
              조회된 예약 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
