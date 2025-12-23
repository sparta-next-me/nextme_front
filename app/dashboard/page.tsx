"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState, useCallback } from "react"
import {
  TrendingUp, Target, Calendar, MessageSquare,
  Settings, Wallet, CreditCard, LogOut, Lock,
  Plus, Sparkles, Loader2, ShieldCheck,
  UserCheck, ChevronRight, History, Gift, Trophy, ShoppingBag,
  ChevronLeft, Clock, Timer, ExternalLink, Award, Trash2
} from "lucide-react"
import Image from "next/image"

// 이미지 임포트
import shinLogo from "@/lib/images/shin.png"
import kiLogo from "@/lib/images/ki.png"
import kukLogo from "@/lib/images/kuk.png"
import logo from "@/lib/images/image copy.png"

const BANK_LOGOS: Record<string, any> = {
  "신한은행": shinLogo,
  "기업은행": kiLogo,
  "국민은행": kukLogo,
  "우리은행": "/lib/images/woori.png", 
};

interface LinkedAccount {
  bankAccount: string;
  bankName: string;
  connectedId: string;
  accountId: string;
}

interface Transaction {
  resAccountOut: number; 
  resAfterTranBalance: number; 
  resAccountTrDate: string;
  resAccountTrTime: string;
  bankAccount: string; 
}

interface Promotion {
  id: string;
  name: string;
  pointAmount: number;
  status: string;
}

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

declare global {
  interface Window {
    TossPayments: any;
  }
}

const formatTime = (time: number) => {
  const timeStr = time.toString().padStart(4, '0');
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
};

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [isLinked, setIsLinked] = useState(false)
  const [isSynced, setIsSynced] = useState(false) 
  const [totalAsset, setTotalAsset] = useState(0)
  const [monthlyExpense, setMonthlyExpense] = useState(0)
  const [userGoal, setUserGoal] = useState<any>(null)
  const [latestReport, setLatestReport] = useState<any>(null)
  const [activePromos, setActivePromos] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [myReservations, setMyReservations] = useState<any[]>([])
  const [allReservations, setAllReservations] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 3

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    const userId = localStorage.getItem("userId")
    const userRole = localStorage.getItem("role") || "";
    
    if (!token) { router.push("/login"); return; }
    if (userRole.includes("ADVISOR")) { router.replace("/advisor"); return; }
    if (userRole.includes("MANAGER") || userRole.includes("MASTER")) { router.replace("/admin"); return; }

    try {
      const storedName = localStorage.getItem("name")
      if (storedName) setUserName(storedName)

      const [accRes, tranRes, goalRes, reportRes, promoRes, prodRes, resvRes, allResvRes] = await Promise.all([
        fetch("http://34.50.7.8:30000/v1/account/user-account", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}) 
        }),
        fetch("http://34.50.7.8:30000/v1/account/tran/all", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        }),
        fetch("http://34.50.7.8:30000/v1/usergoal", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://34.50.7.8:30000/v1/usergoal/report/all", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://34.50.7.8:30000/v1/promotions?status=ACTIVE&page=0&size=2", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://34.50.7.8:30000/v1/products", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`http://34.50.7.8:30000/v1/reservations/users/${userId}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`http://34.50.7.8:30000/v1/reservations/`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (accRes.ok) {
        const data = await accRes.json()
        if (data.isSuccess && Array.isArray(data.result)) {
          setLinkedAccounts(data.result); setIsLinked(data.result.length > 0);
        }
      }

      if (tranRes.ok) {
        const tranData = await tranRes.json()
        if (tranData.isSuccess && Array.isArray(tranData.result) && tranData.result.length > 0) {
          setIsSynced(true);
          const trans: any[] = tranData.result;
          const sortedTrans = [...trans].sort((a, b) => {
            const dateTimeA = (a.resAccountTrDate || "") + (a.resAccountTrTime || "");
            const dateTimeB = (b.resAccountTrDate || "") + (b.resAccountTrTime || "");
            return dateTimeB.localeCompare(dateTimeA);
          });
          const latestBalances: Record<string, number> = {};
          sortedTrans.forEach(t => { 
            const accKey = t.bankAccount || t.resAccount || "default_account";
            if (latestBalances[accKey] === undefined) {
              latestBalances[accKey] = Number(t.resAfterTranBalance) || 0; 
            }
          });
          const total = Object.values(latestBalances).reduce((a, b) => a + b, 0);
          setTotalAsset(total);
          const currentMonth = new Date().toISOString().slice(0, 7).replace("-", ""); 
          const monthlySum = trans
            .filter((t: any) => t.resAccountTrDate?.startsWith(currentMonth))
            .reduce((sum: number, t: any) => sum + (Number(t.resAccountOut) || 0), 0);
          setMonthlyExpense(monthlySum);
        }
      }

      if (goalRes.ok) {
        const data = await goalRes.json(); if (data.isSuccess) setUserGoal(data.result);
      }
      if (reportRes.ok) {
        const data = await reportRes.json(); if (data.isSuccess && data.result?.length > 0) setLatestReport(data.result[0]);
      }
      if (promoRes.ok) {
        const data = await promoRes.json(); if (data.isSuccess) setActivePromos(data.result.content || []);
      }
      
      let fetchedProducts: Product[] = [];
      if (prodRes?.ok) {
        const data = await prodRes.json(); 
        fetchedProducts = data.result || data;
        if (Array.isArray(fetchedProducts)) setProducts(fetchedProducts);
      }

      if (resvRes?.ok) {
        const resList = await resvRes.json();
        if (Array.isArray(resList)) {
          const formatted = resList.map((r: any) => ({
            ...r,
            productName: r.productName || fetchedProducts.find(p => p.productId === r.productId)?.productName || "금융 상담 서비스"
          })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMyReservations(formatted);
        }
      }

      if (allResvRes?.ok) {
        const data = await allResvRes.json();
        const allList = data.isSuccess ? data.result : data;
        if (Array.isArray(allList)) {
          setAllReservations(allList.filter((r: any) => r.status !== "CANCELLED"));
        }
      }

    } catch (error) { console.error("🚨 Error:", error) } finally { setIsLoading(false) }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDisconnect = async (acc: LinkedAccount) => {
    if (!confirm(`${acc.bankName} 계좌 연동을 해제하시겠습니까?`)) return;
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch("http://34.50.7.8:30000/v1/account", {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          connectedId: acc.connectedId,
          userId: userId,
          accountId: acc.accountId
        })
      });
      if (res.ok) { 
        alert("연동이 해제되었습니다."); 
        fetchData(); 
      } else { 
        alert("해제에 실패했습니다."); 
      }
    } catch (e) { console.error(e); }
  }

  const handlePayment = async (product: Product) => {
    const TOSS_CLIENT_KEY = "test_ck_Gv6LjeKD8azXjngMeXkN3wYxAdXy";
    const loadToss = () => {
      return new Promise((resolve) => {
        if (window.TossPayments) { resolve(window.TossPayments); return; }
        const script = document.createElement("script");
        script.src = "https://js.tosspayments.com/v1/payment";
        script.onload = () => resolve(window.TossPayments);
        document.head.appendChild(script);
      });
    };
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch('http://34.50.7.8:30000/v1/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + token },
        body: JSON.stringify({ userId: userId, productName: product.productName, amount: product.price })
      });
      if (!response.ok) throw new Error("결제 초기화 실패");
      const initData = await response.json();
      const p = initData.result || initData;
      const TossPayments = await loadToss() as any;
      const tossPayments = TossPayments(TOSS_CLIENT_KEY);
      tossPayments.requestPayment("카드", { 
        amount: p.amount, orderId: p.orderId, orderName: product.productName, 
        successUrl: `${window.location.origin}/dashboard/payment/success`,
        failUrl: `${window.location.origin}/dashboard/payment/fail`,
        metadata: { productId: product.productId, advisorId: product.advisorId, date: new Date().toISOString().split('T')[0], time: formatTime(product.startTime), endTime: formatTime(product.endTime) }
      });
    } catch (error) { alert("결제 통신 중 오류가 발생했습니다."); }
  };

  const handleApplyAdvisor = async () => {
    if (!confirm("전문가 승인 요청을 보내시겠습니까?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch("http://34.50.7.8:30000/v1/user/me/advisor/apply", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const result = await response.json();
      if (response.ok) alert(result.message || "요청이 접수되었습니다.");
      else alert(result.message || "오류가 발생했습니다.");
    } catch (error) { alert("네트워크 오류가 발생했습니다."); }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/"); }
  const totalPages = Math.ceil(products.length / productsPerPage)
  const currentProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)

  const CardBlurOverlay = ({ message, linkHref }: any) => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[3px] p-4 text-center">
      <div className="bg-card p-4 rounded-xl shadow-xl border border-border/50 max-w-[220px]">
        <Lock className="h-5 w-5 text-primary mx-auto mb-2" />
        <p className="text-[11px] font-bold mb-3 leading-tight">{message}</p>
        <Link href={linkHref}><Button size="sm" className="h-7 text-[11px] font-bold px-3">연동하기</Button></Link>
      </div>
    </div>
  )

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="Next Me" width={110} height={30} className="h-15 w-auto" priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/chat"><Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5" /></Button></Link>
            <Link href="/dashboard/settings"><Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button></Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5 text-muted-foreground" /></Button>
            <Avatar className="h-8 w-8 border"><AvatarFallback className="bg-primary/5 text-xs font-bold">{userName?.charAt(0)}</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">안녕하세요, {userName}님</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-5 flex flex-col h-[180px] border-t-4 border-t-slate-500 shadow-sm bg-card/50">
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-border/50">
              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> My Accounts
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => router.push("/dashboard/link")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide text-xs font-bold">
              {isLinked ? linkedAccounts.map((acc, i) => (
                <div key={i} className="flex justify-between items-center p-1 hover:bg-secondary/20 rounded-md transition-colors group">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 relative overflow-hidden rounded-full border bg-white flex-shrink-0">
                      {BANK_LOGOS[acc.bankName] ? (
                        <Image src={BANK_LOGOS[acc.bankName]} alt={acc.bankName} fill className="object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-[8px]">{acc.bankName.charAt(0)}</div>
                      )}
                    </div>
                    <span className="truncate max-w-[80px] font-bold">{acc.bankName}</span>
                    <span className="font-mono text-muted-foreground text-[10px]">{acc.bankAccount}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDisconnect(acc)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              )) : <div className="text-muted-foreground opacity-50 py-4 italic text-center">연동된 계좌 없음</div>}
            </div>
          </Card>
          <Card className="p-6 h-[180px] relative overflow-hidden border-t-4 border-t-primary shadow-sm">
            {!isSynced && <CardBlurOverlay message="계좌 거래 연동 필요" linkHref="/dashboard/link" />}
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Wallet className="h-5 w-5 text-primary" /></div>
            <p className="text-xs text-muted-foreground mb-1 font-bold">총 자산액</p>
            <p className="text-2xl font-black">₩{isSynced ? totalAsset.toLocaleString() : "0"}</p>
          </Card>
          <Card className="p-6 h-[180px] relative overflow-hidden border-t-4 border-t-red-500 shadow-sm">
            {!isSynced && <CardBlurOverlay message="계좌 거래 연동 필요" linkHref="/dashboard/link" />}
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4"><CreditCard className="h-5 w-5 text-red-600" /></div>
            <p className="text-xs text-muted-foreground mb-1 font-bold">이번 달 지출</p>
            <p className="text-2xl font-black tracking-tight">₩{isSynced ? monthlyExpense.toLocaleString() : "0"}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="relative overflow-hidden border-primary/10 shadow-lg bg-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary animate-pulse" /> AI 분석 리포트</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> 나의 재무 목표</h3>
                    <Link href="/dashboard/goal"><Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-primary">수정하기 <ChevronRight className="h-3 w-3 ml-0.5" /></Button></Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">직업 · 나이</p>
                      <p className="text-sm font-bold">{userGoal?.job || "-"} · {userGoal?.age || "0"}세</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                      <p className="text-[10px] font-black text-green-600 uppercase mb-1">월 수입</p>
                      <p className="text-sm font-bold">₩{Number(userGoal?.monthlyIncome || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                      <p className="text-[10px] font-black text-red-600 uppercase mb-1">월 고정 지출</p>
                      <p className="text-sm font-bold">₩{Number(userGoal?.fixedExpenses || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                   <h3 className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4 text-primary" /> 최근 분석 결과 요약</h3>
                   {latestReport ? (
                     <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
                        <p className="text-sm font-medium leading-relaxed line-clamp-3 text-slate-700">{latestReport.resultReport || "상세 분석 내용이 없습니다."}</p>
                        <Button variant="outline" className="w-full text-xs font-bold h-10" onClick={() => router.push("/dashboard/goal")}>전체 리포트 확인하기</Button>
                     </div>
                   ) : (
                     <div className="p-8 text-center border border-dashed rounded-xl">
                        <p className="text-xs font-bold text-muted-foreground mb-3 tracking-widest">진행된 AI 분석이 없습니다.</p>
                        <Button size="sm" className="font-bold" onClick={() => router.push("/dashboard/goal")}>지금 분석 시작하기</Button>
                     </div>
                   )}
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="h-6 w-6 text-primary" /> 전문가 서비스</h2>
                <Link href="/dashboard/products">
                  <Button variant="ghost" size="sm" className="text-[11px] font-black text-primary gap-1">
                    전체보기 <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {currentProducts.map((prod) => {
                  const currentUserId = localStorage.getItem("userId");
                  const isReservedByMe = myReservations.some(res => res.productId === prod.productId && res.status !== "CANCELLED");
                  const isReservedByOthers = allReservations.some(res => res.productId === prod.productId && res.userId !== currentUserId);
                  const isSoldOut = prod.reserved || isReservedByOthers;

                  return (
                    <div key={prod.productId} className={`bg-card p-5 rounded-2xl border border-border/60 hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase tracking-tighter border border-primary/10">{prod.category}</span>
                        <p className="text-lg font-black text-foreground">₩{Number(prod.price).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h4 className="text-md font-bold text-foreground">{prod.productName}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{prod.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] font-bold text-slate-600">
                            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {prod.durationMin}분</div>
                            <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {prod.dayOfWeek}</div>
                            <div className="flex items-center gap-1"><Timer className="h-3.5 w-3.5 text-slate-400" /> {formatTime(prod.startTime)} ~ {formatTime(prod.endTime)}</div>
                          </div>
                        </div>
                        <Button 
                          size="lg" 
                          onClick={() => handlePayment(prod)}
                          className={`h-12 px-8 text-sm font-black rounded-xl transition-colors ${
                            isReservedByMe 
                              ? 'bg-green-600 hover:bg-green-600 text-white cursor-default' 
                              : isSoldOut 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200' 
                                : 'bg-primary text-white shadow-lg shadow-primary/20'
                          }`} 
                          disabled={isSoldOut || isReservedByMe}
                        >
                          {isReservedByMe ? "예약 완료" : isSoldOut ? "예약 마감" : "상담 신청하기"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {products.length > productsPerPage && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[11px] font-black text-muted-foreground">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card/50 shadow-sm border-border/40">
              <h2 className="text-[10px] font-black mb-4 text-muted-foreground uppercase tracking-widest">Quick Menu</h2>
              <div className="space-y-2">
                <Link href="/dashboard/goal" className="block"><Button variant="outline" className="w-full justify-start py-6 font-bold" size="lg"><Target className="h-5 w-5 mr-3 text-primary" />재무 목표 설정</Button></Link>
                <Link href="/dashboard/ai-chat" className="block"><Button variant="outline" className="w-full justify-start py-6 font-bold" size="lg"><MessageSquare className="h-5 w-5 mr-3 text-primary" />AI 챗봇 상담</Button></Link>
                <Link href="/dashboard/chat" className="block"><Button variant="outline" className="w-full justify-start py-6 font-bold" size="lg"><UserCheck className="h-5 w-5 mr-3 text-primary" />전문가 1:1 예약</Button></Link>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start py-6 font-bold border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-all" 
                  size="lg"
                  onClick={handleApplyAdvisor}
                >
                  <Award className="h-5 w-5 mr-3 text-amber-500" />
                  전문가 승인 요청
                </Button>
              </div>
            </Card>

            <Card className="p-6 border-primary/20 bg-card/50 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-5 relative z-10">
                <h2 className="text-sm font-black flex items-center gap-2 tracking-tight"><Trophy className="h-4 w-4 text-amber-500" /> 진행 중인 이벤트</h2>
                <Link href="/dashboard/promotion" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">전체보기</Link>
              </div>
              <div className="space-y-3 relative z-10">
                {activePromos.map((promo) => (
                  <div className="p-4 bg-background/60 hover:bg-primary/[0.03] rounded-xl border border-border/50 group-hover:border-primary/30 transition-all duration-200 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[140px]">{promo.name}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded">REWARD</div>
                        <span className="text-foreground font-black text-[11px]">{promo.pointAmount.toLocaleString()}P</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card/50 shadow-sm border-border/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> 예약 현황</h2>
                <Link href="/dashboard/reservations" className="text-[10px] font-bold text-primary hover:underline">더보기</Link>
              </div>
              <div className="space-y-3">
                {myReservations.filter(r => r.status !== "CANCELLED").length > 0 ? 
                  myReservations.filter(r => r.status !== "CANCELLED").slice(0, 3).map((res: any, idx) => (
                     <div key={idx} className="bg-background/40 p-4 rounded-xl border border-border/50 flex justify-between items-center shadow-sm hover:border-primary/20 transition-colors">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black truncate text-foreground">{res.productName}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold mt-1">
                            <span>{res.reservationDate || new Date().toISOString().split('T')[0]}</span>
                            <span className="w-1 h-1 rounded-full bg-border"></span>
                            <span>{res.startTime?.slice(0, 5)}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black px-2 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded uppercase shrink-0">확정</span>
                     </div>
                  )) : <div className="text-center py-8 text-[11px] text-muted-foreground italic font-bold">진행 중인 예약이 없습니다.</div>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}



