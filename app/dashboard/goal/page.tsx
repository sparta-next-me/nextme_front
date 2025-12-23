"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import logo from "@/lib/images/image copy.png"
import { 
  ChevronLeft, Loader2, Sparkles, Trash2, 
  Edit3, History, X, Settings, LogOut, MessageSquare, 
  ChevronRight, ShieldCheck, TrendingUp, Zap
} from "lucide-react"

function UserGoalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exists, setExists] = useState(false)
  const [userName, setUserName] = useState("")
  
  const [step, setStep] = useState<'view' | 'form' | 'deep_analysis' | 'history'>('view')
  const [aiResult, setAiResult] = useState<string | null>(null)

  const [originData, setOriginData] = useState({
    age: "", job: "", capital: "", monthlyIncome: "", fixedExpenses: ""
  })
  
  const [formData, setFormData] = useState({
    age: "", job: "", capital: "", monthlyIncome: "", fixedExpenses: ""
  })

  const [deepAnalysisData, setDeepAnalysisData] = useState({
    goalTitle: "",
    monthlySaving: "",
    investmentStyle: "공격형", 
    customMessage: ""
  })

  const [reports, setReports] = useState<any[]>([])

  // 🚀 URL의 ?mode=history를 감지하여 즉시 탭 전환 로직 유지
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'history') {
      setStep('history')
    }
  }, [searchParams])

  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    try {
      const reportRes = await fetch("http://34.50.7.8:30000/v1/usergoal/report/all", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      })
      const reportData = await reportRes.json()
      if (reportRes.ok && reportData.isSuccess) {
        setReports(reportData.result || [])
      }
    } catch (e) { console.error("History fetch error", e) }
  }, [])

  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    if (!token) return router.push("/login")

    try {
      const storedName = localStorage.getItem("name")
      if (storedName) setUserName(storedName)

      const goalRes = await fetch("http://34.50.7.8:30000/v1/usergoal", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const goalData = await goalRes.json()

      if (goalRes.ok && goalData.isSuccess && goalData.result) {
        const fetched = {
          age: String(goalData.result.age || ""),
          job: goalData.result.job || "",
          capital: String(goalData.result.capital || ""),
          monthlyIncome: String(goalData.result.monthlyIncome || ""),
          fixedExpenses: String(goalData.result.fixedExpenses || "")
        }
        setFormData(fetched)
        setOriginData(fetched)
        setExists(true)
        
        const mode = searchParams.get('mode')
        if (mode !== 'history') setStep('view')
      } else {
        setExists(false)
        setStep('form')
      }
      await fetchReports()
    } catch (error) { 
      setStep('form')
    } finally { 
      setIsLoading(false) 
    }
  }, [router, fetchReports, searchParams])

  useEffect(() => { fetchInitialData() }, [fetchInitialData])

  const handleDeleteGoal = async () => {
    if (!confirm("정보를 삭제하면 기존의 모든 AI 분석 리포트가 함께 사라집니다. 정말 삭제하시겠습니까?")) return
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch("http://34.50.7.8:30000/v1/usergoal", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        alert("모든 정보가 삭제되었습니다.")
        setExists(false)
        setFormData({ age: "", job: "", capital: "", monthlyIncome: "", fixedExpenses: "" })
        setReports([])
        setStep('form')
      }
    } catch (e) { alert("삭제 실패") }
  }

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if(!confirm("해당 분석 기록을 삭제하시겠습니까?")) return
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch(`http://34.50.7.8:30000/v1/usergoal/report?reportId=${reportId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if(res.ok) fetchReports()
    } catch (e) { alert("삭제 실패") }
  }

  const handleSaveInfo = async () => {
    const isUnchanged = JSON.stringify(originData) === JSON.stringify(formData)
    if (exists && isUnchanged) { setStep('view'); return; }
    const token = localStorage.getItem("accessToken")
    if (!token) return
    setIsSubmitting(true)
    try {
      const response = await fetch("http://34.50.7.8:30000/v1/usergoal", {
        method: exists ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          age: Number(formData.age), job: formData.job,
          capital: Number(formData.capital), monthlyIncome: Number(formData.monthlyIncome),
          fixedExpenses: Number(formData.fixedExpenses)
        })
      })
      if (response.ok) { alert("정보가 저장되었습니다."); fetchInitialData(); }
    } catch (e) { alert("저장 실패") } finally { setIsSubmitting(false) }
  }

  const handleCreateReport = async () => {
    const token = localStorage.getItem("accessToken")
    if (!token) return
    setIsSubmitting(true)
    try {
      const response = await fetch("http://34.50.7.8:30000/v1/usergoal/report/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          question: `목표: ${deepAnalysisData.goalTitle}. 투자 성향: ${deepAnalysisData.investmentStyle}. 추가 저축: ${deepAnalysisData.monthlySaving}. 요청: ${deepAnalysisData.customMessage}`
        })
      })
      const data = await response.json()
      if (response.ok && data.isSuccess) {
        setAiResult(data.result.resultReport)
        setDeepAnalysisData({ goalTitle: "", monthlySaving: "", investmentStyle: "공격형", customMessage: "" })
        fetchReports() 
      }
    } catch (e) { alert("분석 중 오류") } finally { setIsSubmitting(false) }
  }

  const handleViewReportDetail = async (reportId: string) => {
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch("http://34.50.7.8:30000/v1/usergoal/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ reportId })
      })
      const data = await res.json()
      if (res.ok && data.isSuccess) setAiResult(data.result.resultReport)
    } catch (e) { alert("조회 실패") }
  }

  const handleLogout = () => { localStorage.clear(); router.push("/") }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => step === 'view' ? router.push("/dashboard") : setStep('view')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <Image src={logo} alt="Next Me" width={110} height={30} className="h-10 w-auto" priority />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/ai-chat"><Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5" /></Button></Link>
            <Link href="/dashboard/settings"><Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button></Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5 text-muted-foreground" /></Button>
            <Avatar className="h-8 w-8 border"><AvatarFallback className="bg-primary/5 text-xs font-bold">{userName?.charAt(0)}</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight">재무 목표 설정</h1>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Goal & Analysis</p>
          </div>
          {exists && step === 'view' && (
            <Button variant="outline" size="sm" onClick={() => setStep('history')} className="font-bold border-primary/20 bg-card shadow-sm">
              <History className="h-4 w-4 mr-2" /> 히스토리 보기
            </Button>
          )}
        </div>

        {/* AI 분석 결과 상세 모달 (기존의 화이트 디자인으로 복구) */}
        {aiResult && (
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border-primary/10">
              <div className="p-6 border-b flex justify-between items-center bg-card">
                <div className="flex items-center gap-2 text-primary font-bold"><Sparkles className="h-5 w-5" /> AI 재무 분석 상세 리포트</div>
                <Button variant="ghost" size="icon" onClick={() => setAiResult(null)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-8 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-medium bg-background">{aiResult}</div>
              <div className="p-6 border-t bg-card flex justify-end">
                <Button className="font-bold px-8" onClick={() => setAiResult(null)}>닫기</Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP: VIEW */}
        {step === 'view' && exists && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <Card className="md:col-span-1 p-6 flex flex-col items-center text-center shadow-sm">
              <Avatar className="h-20 w-20 mb-4 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/5 text-xl font-black text-primary">{userName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-black mb-1">{userName}님</h2>
              <p className="text-sm text-muted-foreground font-bold mb-6">{formData.job} | {formData.age}세</p>
              <div className="w-full space-y-2">
                <Button variant="outline" className="w-full font-bold h-11" onClick={() => setStep('form')}><Edit3 className="mr-2 h-4 w-4" /> 정보 수정</Button>
                <Button variant="ghost" className="w-full font-bold h-11 text-destructive hover:text-destructive hover:bg-destructive/5" onClick={handleDeleteGoal}><Trash2 className="mr-2 h-4 w-4" /> 정보 삭제</Button>
              </div>
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Card className="relative overflow-hidden border-primary/10 shadow-md">
                <div className="p-6">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Sparkles className="h-5 w-5 text-primary" /> 정밀 재무 분석</h2>
                  <div className="p-5 rounded-xl bg-secondary/30 border border-border/50 mb-6">
                    <p className="text-sm text-foreground/80 font-medium leading-relaxed">"미래 자산 가치와 최적의 투자 시뮬레이션을 AI와 확인해보세요."</p>
                  </div>
                  <Button className="w-full h-14 font-black text-lg group shadow-lg" onClick={() => setStep('deep_analysis')}>
                    AI 분석 시작하기 <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-primary shadow-sm">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">총 자산</p>
                  <p className="text-lg font-black truncate">₩{Number(formData.capital).toLocaleString()}</p>
                </Card>
                <Card className="p-5 border-l-4 border-l-green-500 shadow-sm">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">월 수입</p>
                  <p className="text-lg font-black truncate">₩{Number(formData.monthlyIncome).toLocaleString()}</p>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-400 shadow-sm">
                  <p className="text-[11px] font-black text-red-500/70 uppercase tracking-widest mb-1">월 고정 지출</p>
                  <p className="text-lg font-black truncate">₩{Number(formData.fixedExpenses).toLocaleString()}</p>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* STEP: FORM */}
        {(step === 'form' || (!exists && step === 'view')) && (
          <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-6">
            <h2 className="text-2xl font-black mb-2 tracking-tight text-center">기본 정보 설정</h2>
            <Card className="p-8 space-y-6 shadow-xl border-primary/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase ml-1">나이</label>
                  <Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="h-12 font-bold bg-secondary/20 border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase ml-1">직업</label>
                  <Input value={formData.job} onChange={e => setFormData({...formData, job: e.target.value})} className="h-12 font-bold bg-secondary/20 border-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase ml-1">현재 총 자산 (원)</label>
                <Input type="number" value={formData.capital} onChange={e => setFormData({...formData, capital: e.target.value})} className="h-12 font-bold bg-secondary/20 border-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase ml-1">월 수입</label>
                  <Input type="number" value={formData.monthlyIncome} onChange={e => setFormData({...formData, monthlyIncome: e.target.value})} className="h-12 font-bold bg-secondary/20 border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-red-500/70 uppercase ml-1">월 고정 지출</label>
                  <Input type="number" value={formData.fixedExpenses} onChange={e => setFormData({...formData, fixedExpenses: e.target.value})} className="h-12 font-bold bg-secondary/20 border-none" />
                </div>
              </div>
              <Button className="w-full h-14 text-lg font-black mt-4 uppercase tracking-widest" onClick={handleSaveInfo} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "저장하기"}
              </Button>
            </Card>
          </div>
        )}

        {/* STEP: DEEP ANALYSIS */}
        {step === 'deep_analysis' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-8">
            <h2 className="text-2xl font-black flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> 분석 목표 설정</h2>
            <Card className="p-8 space-y-6 shadow-xl border-primary/10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary uppercase ml-1 tracking-widest">나의 재무 목표</label>
                  <Input value={deepAnalysisData.goalTitle} onChange={e => setDeepAnalysisData({...deepAnalysisData, goalTitle: e.target.value})} className="h-14 font-black bg-primary/5 border-primary/20 text-lg" placeholder="예: 3년 내 내 집 마련 자금" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase ml-1">투자 성향</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['안정형', '중립형', '공격형'].map((style) => (
                      <Button key={style} type="button" variant={deepAnalysisData.investmentStyle === style ? "default" : "outline"} className="font-bold h-11" onClick={() => setDeepAnalysisData({...deepAnalysisData, investmentStyle: style})}>
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase ml-1">월 저축 가능 금액</label>
                  <Input type="number" value={deepAnalysisData.monthlySaving} onChange={e => setDeepAnalysisData({...deepAnalysisData, monthlySaving: e.target.value})} className="h-12 bg-secondary/20 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase ml-1">상세 요청사항</label>
                  <Textarea className="min-h-[150px] bg-secondary/20 border-none font-medium text-sm" value={deepAnalysisData.customMessage} onChange={e => setDeepAnalysisData({...deepAnalysisData, customMessage: e.target.value})} placeholder="AI가 분석 시 고려해야 할 상황을 적어주세요." />
                </div>
              </div>
              <Button className="w-full h-14 text-lg font-black mt-4 uppercase tracking-widest" onClick={handleCreateReport} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "분석 리포트 받기"}
              </Button>
            </Card>
          </div>
        )}

        {/* STEP: HISTORY (기존의 화이트 디자인으로 복구) */}
        {step === 'history' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 pb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black flex items-center gap-2"><History className="h-6 w-6 text-primary" /> 분석 히스토리</h2>
              <Button variant="ghost" size="sm" onClick={() => setStep('view')} className="font-bold">목표 보기로 이동</Button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {reports.length > 0 ? reports.map((report) => (
                <Card 
                  key={report.reportId} 
                  className="p-5 bg-card border shadow-sm hover:border-primary/30 transition-all group cursor-pointer relative"
                  onClick={() => handleViewReportDetail(report.reportId)}
                >
                  <div className="flex-1 pr-10">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">
                      {report.question?.split('.')[0] || "Financial Analysis Report"}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" size="icon" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => handleDeleteReport(report.reportId, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              )) : (
                <Card className="p-20 text-center border-dashed border-2">
                  <p className="text-muted-foreground font-bold opacity-40 uppercase tracking-widest">기록이 없습니다</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function UserGoalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <UserGoalContent />
    </Suspense>
  )
}