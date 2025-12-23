"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Search, ChevronLeft, Clock, Calendar, 
  ShoppingBag, ArrowUpDown, Loader2,
  Timer, ChevronRight, Target, Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import logo from "@/lib/images/image copy.png"

interface Product {
  productId: string;
  advisorId: string;
  productName: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
  dayOfWeek: string;
  startTime: number;
  endTime: number;
  reserved?: boolean;
}

const formatTime = (time: number) => {
  const timeStr = time.toString().padStart(4, '0');
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
};

export default function ProductsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [myReservations, setMyReservations] = useState<any[]>([]) 
  const [allReservations, setAllReservations] = useState<any[]>([]) // 전체 예약 상태 추가
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")

  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    const userId = localStorage.getItem("userId")
    try {
      // 대시보드와 동일하게 전체 예약 현황(allReservations)까지 함께 호출하여 정합성을 맞춥니다.
      const [prodRes, resvRes, allResvRes] = await Promise.all([
        fetch("http://34.50.7.8:30000/v1/products", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`http://34.50.7.8:30000/v1/reservations/users/${userId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`http://34.50.7.8:30000/v1/reservations/`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ])

      if (prodRes.ok) {
        const data = await prodRes.json()
        setProducts(data.result || data)
      }
      if (resvRes.ok) {
        const data = await resvRes.json()
        setMyReservations(Array.isArray(data) ? data : (data.result || []))
      }
      if (allResvRes.ok) {
        const data = await allResvRes.json()
        setAllReservations(data.isSuccess ? data.result : data)
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handlePayment = async (product: Product) => {
    const TOSS_CLIENT_KEY = "test_ck_Gv6LjeKD8azXjngMeXkN3wYxAdXy";
    
    const loadToss = () => {
      return new Promise((resolve) => {
        if ((window as any).TossPayments) {
          resolve((window as any).TossPayments);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://js.tosspayments.com/v1/payment";
        script.onload = () => resolve((window as any).TossPayments);
        document.head.appendChild(script);
      });
    };

    const token = localStorage.getItem("accessToken")
    const userId = localStorage.getItem("userId")

    try {
      const response = await fetch("http://34.50.7.8:30000/v1/payments/init", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': "Bearer " + token
        },
        body: JSON.stringify({
          userId: userId,
          productName: product.productName,
          amount: product.price
        })
      });

      if (!response.ok) throw new Error("결제 초기화 실패");
      const initData = await response.json();
      const p = initData.result || initData;

      const TossPayments = await loadToss() as any;
      const tossPayments = TossPayments(TOSS_CLIENT_KEY);

      tossPayments.requestPayment("카드", { 
          amount: p.amount,
          orderId: p.orderId,
          orderName: product.productName, 
          successUrl: `${window.location.origin}/dashboard/payment/success`,
          failUrl: `${window.location.origin}/dashboard/payment/fail`,
          metadata: {
              productId: product.productId,
              advisorId: product.advisorId,
              date: '2025-12-18',
              time: formatTime(product.startTime),
              endTime: formatTime(product.endTime)
          }
      })
      .catch((error: any) => {
          if (error.code === "USER_CANCEL") return;
          console.error("❌ 결제 요청 실패:", error);
      });

    } catch (error) {
      console.error('❌ 결제 에러:', error);
      alert("결제 준비 중 오류가 발생했습니다.");
    }
  };

  const dynamicCategories = ["전체", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "전체" || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  })

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-xs font-bold text-muted-foreground">전문가 상품을 불러오고 있습니다...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-secondary/20">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center">
              <Image src={logo} alt="Next Me" width={110} height={30} className="h-8 w-auto" priority />
            </Link>
          </div>
          <Badge variant="outline" className="border-primary text-primary font-bold hidden xs:inline-flex">MARKETPLACE</Badge>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">전문가 서비스 탐색</h2>
              <p className="text-sm text-muted-foreground">당신의 재무 목표를 함께 달성할 전문가를 찾아보세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="상품명 또는 상담 내용으로 검색..." 
                  className="pl-10 h-11 bg-card border-border rounded-xl focus-visible:ring-primary font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible pb-1 scrollbar-hide">
                 <Button variant="outline" size="sm" className="h-11 px-4 font-bold border-border bg-card gap-2 whitespace-nowrap">
                    <ArrowUpDown className="h-4 w-4 text-primary" /> 추천순
                 </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dynamicCategories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-4 font-black text-[11px] uppercase tracking-wider h-8 ${
                    selectedCategory === cat 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-secondary/20 text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-2">
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <Globe className="h-3 w-3" /> Search Results ({filteredProducts.length})
               </span>
            </div>

            {filteredProducts.length > 0 ? filteredProducts.map((prod) => {
              const currentUserId = localStorage.getItem("userId");
              
              // 1. 내가 예약했는지 여부
              const isReservedByMe = myReservations.some(res => res.productId === prod.productId);
              
              // 2. 다른 사람이 예약했는지 여부 (대시보드와 동일하게 allReservations로 판별)
              const isReservedByOthers = Array.isArray(allReservations) && allReservations.some(res => res.productId === prod.productId && res.userId !== currentUserId);
              
              // 3. 최종 품절 상태 (API reserved 필드 혹은 타인 예약 여부)
              const isSoldOut = prod.reserved || isReservedByOthers;

              return (
                <div 
                  key={prod.productId} 
                  className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border bg-card transition-all relative overflow-hidden ${
                    isSoldOut && !isReservedByMe 
                    ? 'border-border bg-secondary/5 opacity-80' 
                    : 'border-border/60 hover:border-primary/40 hover:shadow-lg shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                      isSoldOut && !isReservedByMe ? 'bg-secondary/20 border-border' : 'bg-primary/5 border-primary/10 group-hover:bg-primary/10'
                    }`}>
                      <Target className={`h-6 w-6 ${isSoldOut && !isReservedByMe ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-[16px] text-foreground truncate">{prod.productName}</h3>
                        <Badge variant="outline" className="text-[9px] font-black h-4 px-1.5 border-primary/30 text-primary uppercase">
                          {prod.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">{prod.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-primary/60" /> {prod.durationMin}분
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-primary/60" /> {prod.dayOfWeek}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Timer className="h-3.5 w-3.5 text-primary/60" /> {formatTime(prod.startTime)} ~ {formatTime(prod.endTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Price</p>
                      <p className="text-lg font-black text-foreground tabular-nums">₩{prod.price.toLocaleString()}</p>
                    </div>
                    <Button 
                      disabled={isSoldOut || isReservedByMe}
                      onClick={() => handlePayment(prod)}
                      className={`h-11 px-6 rounded-xl font-black text-xs gap-2 transition-all ${
                        isReservedByMe 
                          ? 'bg-green-600 hover:bg-green-600 text-white cursor-default' 
                          : isSoldOut 
                            ? 'bg-secondary text-muted-foreground' 
                            : 'bg-primary text-primary-foreground hover:shadow-md hover:shadow-primary/20'
                      }`}
                    >
                      {isReservedByMe ? "예약 완료" : isSoldOut ? "예약 마감" : "신청하기"}
                      {!isReservedByMe && !isSoldOut && <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>

                  {(isSoldOut && !isReservedByMe) && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-destructive/10 text-destructive border-none text-[9px] font-black">SOLD OUT</Badge>
                    </div>
                  )}
                  {isReservedByMe && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-100 text-green-700 border-none text-[9px] font-black uppercase">Reserved by Me</Badge>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border-2 border-dashed border-border/50">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-bold text-muted-foreground">검색 조건에 맞는 전문가 상품이 없습니다.</p>
                <Button 
                  variant="link" 
                  onClick={() => {setSearchTerm(""); setSelectedCategory("전체")}} 
                  className="mt-2 text-primary font-black text-xs"
                >
                  필터 초기화 및 전체보기
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}