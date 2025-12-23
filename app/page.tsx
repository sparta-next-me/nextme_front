"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  MessageSquare, 
  Calendar, 
  Shield, 
  LogOut, 
  LayoutDashboard 
} from "lucide-react"
import Image from "next/image"
import logo from "@/lib/images/image copy.png"

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 페이지 로드 시 로그인 상태 확인
    const token = localStorage.getItem("accessToken")
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("name")
      setIsLoggedIn(false)
      router.refresh() // 현재 페이지 상태 갱신
    }
  }

 

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          {/* 1. 로고 영역 (왼쪽 고정) */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Image src={logo} alt="Next Me" width={120} height={32} className="h-13 w-auto" />
            </Link>
          </div>

          {/* 2. 내비게이션 (중앙 배치) */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              기능
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              사용방법
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              가격
            </Link>
          </nav>

          {/* 3. 버튼 영역 (오른쪽 고정) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    대시보드
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="bg-transparent">
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">AI 기반 재무 설계</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
              미래의 나를 위한
              <br />
              <span className="text-primary">똑똑한 재무 계획</span>
            </h1>
            <p className="text-lg md:xl text-muted-foreground text-balance max-w-2xl mx-auto">
              AI가 당신의 소비·저축 데이터를 분석하여 미래의 재무 상태를 예측하고, 현실적인 플랜을 제안합니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    <LayoutDashboard className="h-5 w-5 mr-2" />
                    대시보드 바로가기
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    무료로 시작하기
                  </Button>
                </Link>
              )}
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  자세히 알아보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">주요 기능</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Next Me가 제공하는 강력한 AI 재무 설계 도구들
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI 재무 분석</h3>
              <p className="text-muted-foreground">과거 소비 패턴을 분석하여 미래 재무 상태를 정확하게 예측합니다</p>
            </Card>

            <Card className="p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">목표 설정</h3>
              <p className="text-muted-foreground">
                주택 구매, 은퇴 준비 등 인생 목표를 설정하고 달성 계획을 수립합니다
              </p>
            </Card>

            <Card className="p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI 챗봇 상담</h3>
              <p className="text-muted-foreground">24/7 AI 챗봇이 재무 관련 궁금증을 즉시 해결해드립니다</p>
            </Card>

            {/* 수정된 전문가 상담 예약 카드 */}
            <Card className="p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                
              </div>
              <h3 className="text-xl font-semibold">전문가 상담 예약</h3>
              <p className="text-muted-foreground">필요시 실제 재무 전문가와 1:1 상담을 예약할 수 있습니다</p>
            </Card>

            <Card className="p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">안전한 데이터 관리</h3>
              <p className="text-muted-foreground">금융 데이터는 암호화되어 안전하게 보관됩니다</p>
            </Card>

            <Card className="p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">맞춤형 플랜</h3>
              <p className="text-muted-foreground">당신의 상황에 꼭 맞는 현실적인 재무 계획을 제시합니다</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">어떻게 사용하나요?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">간단한 3단계로 시작하세요</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">데이터 연동</h3>
              <p className="text-muted-foreground">
                카드사 및 은행 계좌를 안전하게 연동하여 소비·저축 데이터를 불러옵니다
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">AI 분석</h3>
              <p className="text-muted-foreground">AI가 당신의 재무 패턴을 분석하고 미래 상태를 예측합니다</p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">플랜 실행</h3>
              <p className="text-muted-foreground">맞춤형 재무 계획을 받고 목표를 향해 나아가세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">지금 바로 시작하세요</h2>
            <p className="text-lg text-muted-foreground text-balance">
              미래를 위한 첫 걸음을 Next Me와 함께 시작하세요
            </p>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  대시보드에서 분석 시작하기
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  무료로 시작하기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Next Me" width={100} height={27} className="h-7 w-auto" />
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                이용약관
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                개인정보처리방침
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                고객센터
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Next Me. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}