"use client"

import { useState, useEffect, useCallback, useMemo } from "react" // 1. useMemo 추가
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductFormModal from "@/app/advisor/modal/productFromModal"
import logo from "@/lib/images/image copy.png"
import {
  Calendar, Plus, MessageSquare, Settings, LogOut,
  Sparkles, Trash2, Loader2, ShieldCheck, Video, X,
  TrendingUp, Wallet, Target, Lock, ChevronRight, History,
  ChevronLeft, ChevronRight as ChevronRightIcon, Clock, Globe, User
} from "lucide-react"

// --- 인터페이스 정의 ---
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
  createdAt?: string; 
}

interface Reservation {
  reservationId: string;
  userId: string;
  advisorId: string;
  productId: string;
  productName: string | null;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string | null;
  cancelled: boolean;
  createdAt: string;
  userName?: string; 
}

interface LinkedAccount {
  bankAccount: string;
  bankName: string;
  accountId: string;
  connectedId: string;
  isTransactionSync?: boolean;
}

const formatTime = (time: number) => {
  const timeStr = time.toString().padStart(4, '0');
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
};

export default function AdvisorDashboardPage() {
  const router = useRouter()
  
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [userGoal, setUserGoal] = useState<any>(null)
  const [latestReport, setLatestReport] = useState<any>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [isSynced, setIsSynced] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [reservationPage, setReservationPage] = useState(1)
  const [allProductPage, setAllProductPage] = useState(1)
  const [myProductPage, setMyProductPage] = useState(1)
  const ITEMS_PER_PAGE = 3 

  const myProducts = products.filter(p => p.advisorId === userId)
  
  const totalResPages = Math.ceil(reservations.length / ITEMS_PER_PAGE)
  const totalAllProdPages = Math.ceil(products.length / ITEMS_PER_PAGE)
  const totalMyProdPages = Math.ceil(myProducts.length / ITEMS_PER_PAGE)
  
  const currentReservations = reservations.slice(
    (reservationPage - 1) * ITEMS_PER_PAGE,
    reservationPage * ITEMS_PER_PAGE
  )
  const currentAllProducts = products.slice(
    (allProductPage - 1) * ITEMS_PER_PAGE,
    allProductPage * ITEMS_PER_PAGE
  )
  const currentMyProducts = myProducts.slice(
    (myProductPage - 1) * ITEMS_PER_PAGE,
    myProductPage * ITEMS_PER_PAGE
  )

  // --- [로직 추가] 예약 내역 기반 정산 예정액 계산 ---
  const estimatedSettlement = useMemo(() => {
    return reservations.reduce((acc, res) => {
      const product = products.find(p => p.productId === res.productId);
      return acc + (product?.price || 0);
    }, 0);
  }, [reservations, products]);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken")
    const storedId = localStorage.getItem("userId")
    const storedName = localStorage.getItem("name")
    const role = localStorage.getItem("role")

    if (!storedToken || !storedId) {
      router.push("/login")
      return
    }
    if (role === "USER") {
      router.push("/dashboard")
      return
    }
    if (role === "ADVISOR") {
      setToken(storedToken)
      setUserId(storedId)
      setUserName(storedName || "전문가")
      setIsReady(true)
    } else {
      router.push("/login")
    }
  }, [router])

  const fetchAllData = useCallback(async () => {
    if (!token || !userId) return
    try {
      const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      
      const [accRes, prodRes, goalRes, reportRes, resvRes] = await Promise.all([
        fetch("http://34.50.7.8:30000/v1/account/user-account", {
          method: "POST", headers, body: JSON.stringify({ userId })
        }),
        fetch("http://34.50.7.8:30000/v1/products", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://34.50.7.8:30000/v1/usergoal", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://34.50.7.8:30000/v1/usergoal/report/all", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`http://34.50.7.8:30000/v1/reservations/advisors/${userId}`, { headers: { "Authorization": `Bearer ${token}` } })
      ])

      let fetchedProducts: Product[] = [];
      if (prodRes.ok) {
        const data = await prodRes.json()
        fetchedProducts = Array.isArray(data) ? (data as Product[]) : (data.result || [])
        setProducts(fetchedProducts)
      }

      if (accRes.ok) {
        const data = await accRes.json()
        if (data.isSuccess && data.result) {
          setLinkedAccounts(data.result)
          setIsLinked(data.result.length > 0)
          const synced = data.result.some((acc: any) => acc.isTransactionSync === true)
          setIsSynced(synced)
        }
      }
      if (goalRes.ok) {
        const data = await goalRes.json()
        if (data.isSuccess) setUserGoal(data.result)
      }
      if (reportRes.ok) {
        const data = await reportRes.json()
        if (data.isSuccess && data.result) {
          if (data.result.length > 0) setLatestReport(data.result[0])
        }
      }
      if (resvRes.ok) {
        const data = await resvRes.json()
        const resvList: Reservation[] = Array.isArray(data) ? data : (data.result || [])
        
        const mappedResv = resvList.map(res => {
            const productInfo = fetchedProducts.find(p => p.productId === res.productId);
            return {
                ...res,
                productName: res.productName || productInfo?.productName || "금융 상담 서비스"
            };
        });

        const sortedResv = mappedResv
          .filter((r: Reservation) => !r.cancelled)
          .sort((a: Reservation, b: Reservation) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime());
        setReservations(sortedResv)
      }
    } catch (e) { console.error("데이터 로드 실패:", e) } finally { setIsLoading(false) }
  }, [token, userId])

  useEffect(() => { if (isReady) fetchAllData() }, [isReady, fetchAllData])

  const handleLogout = () => { if (confirm("로그아웃 하시겠습니까?")) { localStorage.clear(); router.push("/"); } }

  const handleDeleteAccount = async (connectedId: string, accountId: string) => {
    if (!confirm("이 계좌를 연동 해제하시겠습니까?")) return
    try {
      const res = await fetch("http://34.50.7.8:30000/v1/account", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ connectedId, accountId })
      })
      if (res.ok) fetchAllData()
    } catch (e) { console.error(e) }
  }

  // --- [수정] 상품 삭제 시 상태 즉시 반영 로직 ---
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return
    try {
      const res = await fetch(`http://34.50.7.8:30000/v1/products/${productId}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (res.ok) {
        // 클라이언트 상태에서 즉시 제거 (새로고침 없이 반영)
        setProducts(prev => prev.filter(p => p.productId !== productId))
        // 서버와 최종 데이터 싱크
        fetchAllData()
      } else {
        alert("상품 삭제에 실패했습니다.")
      }
    } catch (e) {
      console.error("삭제 중 오류 발생:", e)
    }
  }

  if (!isReady || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-sm font-bold text-muted-foreground">데이터를 불러오고 있습니다...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="Next Me" width={110} height={30} className="h-8 sm:h-10 w-auto" priority />
            <Badge variant="outline" className="hidden xs:inline-flex border-primary text-primary font-bold">ADVISOR</Badge>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard/chat"><Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5" /></Button></Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5 text-muted-foreground" /></Button>
            <Avatar className="h-8 w-8 border"><AvatarFallback className="bg-primary/5 text-xs font-bold">{userName.charAt(0)}</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">안녕하세요, {userName} 전문가님</h1>
            <p className="text-sm text-muted-foreground">자산 현황과 운영 상품을 통합 관리합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="p-5 flex flex-col h-[180px] border-t-4 border-t-slate-500 bg-card/50 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-border/50">
              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> 개인 계좌 현황
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => router.push("/dashboard/link")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-bold">
              {isLinked ? linkedAccounts.map((acc, i) => (
                <div key={i} className="flex justify-between items-center p-1 rounded-md hover:bg-secondary/10 transition-colors">
                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-[150px]">{acc.bankName}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">***{acc.bankAccount?.slice(-4)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDeleteAccount(acc.connectedId, acc.accountId)}><X className="h-4 w-4" /></Button>
                </div>
              )) : <div className="text-muted-foreground opacity-50 py-4 italic text-center">연동된 계좌가 없습니다.</div>}
            </div>
          </Card>

          <Card className="p-6 h-[180px] relative overflow-hidden border-t-4 border-t-primary shadow-sm">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Wallet className="h-5 w-5 text-primary" /></div>
            <p className="text-xs text-muted-foreground mb-1 font-bold">총 관리 자산</p>
            {isSynced ? (
              <p className="text-2xl font-black">₩{Number(userGoal?.capital || 0).toLocaleString()}</p>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1 font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all text-xs"
                onClick={() => router.push("/dashboard/link")}
              >
                <Lock className="h-3.5 w-3.5 mr-2" /> 거래 내역 연동하기
              </Button>
            )}
          </Card>

          <Card className="p-6 h-[180px] border-t-4 border-t-blue-500 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <p className="text-xs text-muted-foreground mb-1 font-bold">이번 달 정산 예정액</p>
            <p className="text-2xl font-black">₩{estimatedSettlement.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 tracking-tight">확정 예약 {reservations.length}건 합산</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border shadow-md overflow-hidden bg-card">
              <Tabs defaultValue="reservations" className="w-full">
                <div className="px-4 sm:px-6 py-4 border-b bg-secondary/5">
                  <TabsList className="bg-secondary/20 p-1 rounded-lg h-10 w-full sm:w-fit grid grid-cols-2">
                    <TabsTrigger value="reservations" className="font-bold gap-2 px-2 sm:px-6 data-[state=active]:bg-background rounded-md text-xs sm:text-sm">
                      <Calendar className="h-4 w-4 text-primary" /> 상담 예약
                    </TabsTrigger>
                    <TabsTrigger value="products" className="font-bold gap-2 px-2 sm:px-6 data-[state=active]:bg-background rounded-md text-xs sm:text-sm">
                      <Plus className="h-4 w-4 text-primary" /> 상품 관리
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="reservations" className="p-4 sm:p-6 m-0 animate-in fade-in-50">
                  <div className="min-h-[320px] space-y-3">
                    {currentReservations.length > 0 ? currentReservations.map((res, index) => (
                      <div key={res.reservationId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-sm gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-11 h-11 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary text-sm shadow-inner shrink-0">
                            {res.userName ? res.userName.charAt(0) : <User className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[15px] truncate">
                              {res.productName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">{res.reservationDate}</Badge>
                              <span className="text-xs text-primary font-bold">{res.startTime.slice(0, 5)} ~ {res.endTime.slice(0, 5)}</span>
                              {res.createdAt && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {res.createdAt.split(' ')[0]}</span>}
                            </div>
                          </div>
                        </div>
                        <Link href="/dashboard/chat" className="w-full sm:w-auto">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto font-bold gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">
                             채팅방 입장
                          </Button>
                        </Link>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/60 italic">
                        <Calendar className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">현재 확정된 상담 예약이 없습니다.</p>
                      </div>
                    )}
                  </div>
                  {totalResPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-6 border-t mt-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReservationPage(p => Math.max(1, p - 1))} disabled={reservationPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="text-xs font-black text-muted-foreground">{reservationPage} / {totalResPages}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReservationPage(p => Math.min(totalResPages, p + 1))} disabled={reservationPage === totalResPages}><ChevronRightIcon className="h-4 w-4" /></Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products" className="p-0 m-0 animate-in fade-in-50">
                  <Tabs defaultValue="my-products" className="w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-secondary/5 gap-3">
                      <TabsList className="bg-secondary/10 p-1 rounded-lg h-9">
                        <TabsTrigger value="my-products" className="text-[11px] font-bold gap-1.5 px-3 data-[state=active]:bg-background">
                          <User className="h-3 w-3" /> 내 상품 ({myProducts.length})
                        </TabsTrigger>
                        <TabsTrigger value="all-products" className="text-[11px] font-bold gap-1.5 px-3 data-[state=active]:bg-background">
                          <Globe className="h-3 w-3" /> 전체 상품 ({products.length})
                        </TabsTrigger>
                      </TabsList>
                      <Button size="sm" onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }} className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-8 px-3 text-[11px] w-full sm:w-auto">
                        <Plus className="h-3.5 w-3.5 mr-1" /> 상품 등록
                      </Button>
                    </div>

                    <TabsContent value="my-products" className="p-4 sm:p-6 m-0">
                      <div className="min-h-[268px] space-y-3">
                        {currentMyProducts.length > 0 ? currentMyProducts.map((product) => (
                           <div key={product.productId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-sm gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                              <div className="w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner shrink-0">
                                <Target className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="font-bold text-[15px] truncate max-w-[150px]">{product.productName}</p>
                                  <Badge variant="outline" className="text-[10px] font-black h-4 px-1 border-primary/30 text-primary">{product.durationMin}분</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-1">
                                  <Clock className="h-3 w-3 text-primary/60" />
                                  <span>{formatTime(product.startTime)} ~ {formatTime(product.endTime)}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>{product.dayOfWeek}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-0 sm:pl-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                              <p className="font-black text-primary text-[15px] tabular-nums">₩{product.price.toLocaleString()}</p>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }} className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 transition-colors"><Settings className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.productId)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-secondary/20 rounded-2xl bg-secondary/5 text-muted-foreground/60">
                            <User className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">내가 등록한 상품이 없습니다.</p>
                          </div>
                        )}
                      </div>
                      {totalMyProdPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-6 border-t mt-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMyProductPage(p => Math.max(1, p - 1))} disabled={myProductPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          <span className="text-xs font-black text-muted-foreground">{myProductPage} / {totalMyProdPages}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMyProductPage(p => Math.min(totalMyProdPages, p + 1))} disabled={myProductPage === totalMyProdPages}><ChevronRightIcon className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="all-products" className="p-4 sm:p-6 m-0">
                      <div className="min-h-[268px] space-y-3">
                        {currentAllProducts.length > 0 ? currentAllProducts.map((product) => (
                           <div key={product.productId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-sm gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                              <div className="w-11 h-11 rounded-xl bg-secondary/5 flex items-center justify-center border border-border shrink-0">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="font-bold text-[15px] truncate max-w-[150px]">{product.productName}</p>
                                  {product.advisorId === userId && <Badge className="text-[9px] h-3.5 bg-primary/10 text-primary border-none">MY</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground mt-1">
                                  <Badge variant="secondary" className="text-[9px] px-1 h-4 font-bold">{product.durationMin}분</Badge>
                                  <Clock className="h-3 w-3 ml-1" />
                                  <span>{formatTime(product.startTime)} ~ {formatTime(product.endTime)}</span>
                                  <span className="opacity-40">|</span>
                                  <span className="uppercase text-[9px] font-black">{product.dayOfWeek}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-4 w-full sm:w-auto">
                              <p className="font-black text-foreground text-[14px]">₩{product.price.toLocaleString()}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-secondary/20 rounded-2xl bg-secondary/5 text-muted-foreground/60">
                            <Globe className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">등록된 상품이 존재하지 않습니다.</p>
                          </div>
                        )}
                      </div>
                      {totalAllProdPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-6 border-t mt-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAllProductPage(p => Math.max(1, p - 1))} disabled={allProductPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          <span className="text-xs font-black text-muted-foreground">{allProductPage} / {totalAllProdPages}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAllProductPage(p => Math.min(totalAllProdPages, p + 1))} disabled={allProductPage === totalAllProdPages}><ChevronRightIcon className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-primary/20 shadow-lg relative overflow-hidden bg-gradient-to-br from-card to-secondary/10">
              <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles className="h-10 w-10 text-primary" /></div>
              <div className="mb-2">
                <h2 className="text-[10px] font-black mb-3 text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Target className="h-3 w-3" /> Quick Menu</h2>
                <Link href="/dashboard/goal" className="block">
                  <Button variant="outline" className="w-full justify-start py-6 font-bold bg-background/50 border-primary/10 hover:border-primary/30 group transition-all" size="lg">
                    <Target className="h-5 w-5 mr-3 text-primary" />
                    <span className="text-sm">재무 목표 설정</span>
                    <ChevronRight className="ml-auto h-4 w-4 opacity-30 group-hover:opacity-100 transition-all" />
                  </Button>
                </Link>
                <Link href="/dashboard/ai-chat" className="block mt-2">
                  <Button variant="outline" className="w-full justify-start py-6 font-bold text-sm" size="lg"><MessageSquare className="h-5 w-5 mr-3 text-primary" />AI 챗봇 상담</Button>
                </Link>
              </div>

              <div className="pt-5 border-t border-dashed border-primary/20">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><Sparkles className="h-5 w-5 text-primary animate-pulse" /> 최신 AI 분석 리포트</h2>
                {latestReport ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-slate-900 border-l-4 border-l-primary shadow-xl">
                      <p className="text-[14px] font-bold text-white leading-relaxed line-clamp-6">{latestReport.resultReport}</p>
                    </div>
                    <Button variant="outline" className="w-full text-xs font-black border-primary/20 hover:bg-primary/5 transition-colors h-11" onClick={() => router.push("/dashboard/goal?mode=history")}><History className="h-4 w-4 mr-2" /> 전체 리포트 히스토리 보기</Button>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-primary/20 rounded-xl bg-background/50 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground">생성된 리포트가 없습니다.</p>
                    <Button size="sm" className="w-full font-bold" onClick={() => router.push("/dashboard/goal")}>AI 분석 시작하기</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedProduct}
        onSuccess={fetchAllData}
      />
    </div>
  )
}