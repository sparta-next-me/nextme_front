"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Camera, Bell, LogOut, Loader2 } from "lucide-react"
import Image from "next/image"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: ""
  })

  // 1. 정보 가져오기 및 권한 체크
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("role")

    // 토큰이 없으면 로그인 페이지로
    if (!token) {
      router.replace("/login")
      return
    }

    try {
      // API 주소를 기존 연동 코드들과 동일하게 30000 포트로 수정
      const response = await fetch("http://34.50.7.8:30000/v1/user/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isSuccess && data.result) {
          // 서버에서 받은 데이터를 상태에 정확히 반영 (이름 불러오기 해결)
          setUserData({
            name: data.result.name || "",
            email: data.result.email || "",
            phone: data.result.phone || ""
          })
          // 대시보드 등에서 사용할 수 있도록 로컬스토리지 동기화
          localStorage.setItem("name", data.result.name)
        }
      } else if (response.status === 401 || response.status === 403) {
          router.replace("/login")
      }
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // 2. 프로필 수정 (PATCH /v1/user/me)
  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("accessToken")
    if (!userData.name.trim()) {
      alert("이름을 입력해주세요.")
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch("http://34.50.7.8:30000/v1/user/me", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone 
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isSuccess) {
          alert("프로필이 성공적으로 수정되었습니다.")
          localStorage.setItem("name", userData.name) // 로컬 이름 업데이트
          fetchUserData() // 최신 정보 다시 불러오기
        }
      } else {
        alert("수정에 실패했습니다.")
      }
    } catch (error) {
      console.error("프로필 수정 에러:", error)
      alert("통신 중 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  // 3. 로그아웃 (POST /auth/logout)
  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return

    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")

    try {
      await fetch("http://34.50.7.8:30000/v1/user/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Refresh-Token": refreshToken || ""
        }
      })
      
      localStorage.clear()
      router.push("/")
      alert("로그아웃 되었습니다.")
    } catch (error) {
      console.error("로그아웃 요청 에러:", error)
      localStorage.clear()
      router.push("/")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-bold">권한 확인 및 설정을 불러오고 있습니다...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">설정</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">프로필</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary uppercase font-bold">
                {userData.name ? userData.name.charAt(0) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-xl">{userData.name || "사용자"}</p>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold">이름</Label>
              <Input 
                id="name" 
                value={userData.name} 
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                placeholder="수정할 이름을 입력하세요"
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full sm:w-auto font-bold transition-all active:scale-95">
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              수정 내용 저장
            </Button>
          </div>
        </Card>

        {/* 알림 설정 */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">알림 설정</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">푸시 알림</p>
                <p className="text-sm text-muted-foreground">자산 분석 및 목표 달성 알림</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
        
        {/* 계정 관리 */}
        <Card className="p-6 border-destructive/20 bg-destructive/5">
          <h2 className="text-lg font-semibold mb-4 text-destructive">계정 관리</h2>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent font-bold"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </Card>
      </div>
    </div>
  )
}