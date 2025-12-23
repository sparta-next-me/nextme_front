import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, Clock, Star, Video, MessageSquare } from "lucide-react"
import Image from "next/image"

export default function ConsultationPage() {
  const consultants = [
    {
      name: "박재무",
      title: "재무설계사 · CFP",
      rating: 4.9,
      reviews: 127,
      expertise: ["은퇴 설계", "자산 관리", "세금 절약"],
      available: true,
    },
    {
      name: "이투자",
      title: "투자 전문가 · CFA",
      rating: 4.8,
      reviews: 98,
      expertise: ["주식 투자", "펀드 관리", "포트폴리오"],
      available: true,
    },
    {
      name: "김부동산",
      title: "부동산 컨설턴트",
      rating: 4.7,
      reviews: 84,
      expertise: ["주택 구매", "부동산 투자", "전월세"],
      available: false,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">전문가 상담</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Next Me" width={100} height={27} className="h-7 w-auto" />
            </Link>
            <Avatar>
              <AvatarFallback>김</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Consultation */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">다가오는 상담</p>
              <h2 className="text-2xl font-bold mb-2">박재무 전문가</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>12월 20일 (금)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>오후 2:00</span>
                </div>
              </div>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">박</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1">
              <Video className="h-4 w-4 mr-2" />
              화상 상담 입장
            </Button>
            <Button variant="outline">일정 변경</Button>
          </div>
        </Card>

        {/* Filter Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">전문가 찾기</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant="default" size="sm">
              전체
            </Button>
            <Button variant="outline" size="sm">
              재무 설계
            </Button>
            <Button variant="outline" size="sm">
              투자
            </Button>
            <Button variant="outline" size="sm">
              부동산
            </Button>
            <Button variant="outline" size="sm">
              세금
            </Button>
            <Button variant="outline" size="sm">
              보험
            </Button>
          </div>
        </div>

        {/* Consultants List */}
        <div className="space-y-4">
          {consultants.map((consultant, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarFallback className="text-xl">{consultant.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{consultant.name}</h3>
                      <p className="text-sm text-muted-foreground">{consultant.title}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        consultant.available ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {consultant.available ? "상담 가능" : "예약 마감"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{consultant.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({consultant.reviews}개의 리뷰)</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {consultant.expertise.map((skill, skillIdx) => (
                      <span
                        key={skillIdx}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" disabled={!consultant.available}>
                      <Calendar className="h-4 w-4 mr-2" />
                      상담 예약
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      메시지
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-8">
          <h3 className="font-semibold mb-2">상담 안내</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 상담 시간은 30분 단위로 예약 가능합니다</li>
            <li>• 화상 상담 또는 채팅 상담을 선택할 수 있습니다</li>
            <li>• 상담 24시간 전까지 무료 취소 가능합니다</li>
            <li>• 첫 상담은 무료로 제공됩니다</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
