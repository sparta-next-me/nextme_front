"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Clock, Plus, LayoutGrid } from "lucide-react"

export default function ProductFormModal({ isOpen, onClose, initialData, onSuccess }: any) {
  const [isLoading, setIsLoading] = useState(false)
  
  // 1. 폼 초기 상태 (백엔드 ProductRequest 규격 기반)
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "",
    durationMin: 60,
    restTime: 15,
    workingHours: 3,
    startTime: 1400,
    endTime: 1700,
    price: "" as any,
    dayOfWeek: "MONDAY"
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        productName: "",
        description: "",
        category: "",
        durationMin: 60,
        restTime: 15,
        workingHours: 3,
        startTime: 1400,
        endTime: 1700,
        price: "" as any,
        dayOfWeek: "MONDAY"
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = localStorage.getItem("accessToken")
    const method = initialData ? "PUT" : "POST"
    
    // PathVariable로 사용될 productId
    const url = initialData 
      ? `http://34.50.7.8:30000/v1/products/${initialData.productId}`
      : "http://34.50.7.8:30000/v1/products"

    try {
      /**
       * 2. 전송 데이터 조립 (Request Body)
       * 백엔드 ProductRequest 클래스에 정의된 10개 필드만 정확히 매핑합니다.
       * 이렇게 하면 reserved, advisorId, productId 등이 포함되어 발생하는 에러를 원천 차단합니다.
       */
      const payload = {
        productName: formData.productName,
        description: formData.description,
        category: formData.category,
        durationMin: Number(formData.durationMin),
        restTime: Number(formData.restTime),
        workingHours: Number(formData.workingHours),
        startTime: Number(formData.startTime),
        endTime: Number(formData.endTime),
        price: Number(formData.price),
        dayOfWeek: formData.dayOfWeek
      }

      const res = await fetch(url, {
        method,
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const result = await res.json()
        alert(`실패: ${result.message || "오류가 발생했습니다."}`)
      }
    } catch (error) {
      alert("서버와 통신 중 에러가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-xl border border-border p-0 overflow-hidden bg-background shadow-2xl">
        <DialogHeader className="p-6 bg-card/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {initialData ? "상담 상품 수정" : "새 상품 등록"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">상담 서비스의 상세 규격을 설정합니다.</p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 섹션 1: 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <LayoutGrid className="h-4 w-4 text-primary" /> 기본 정보
            </h3>
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">상담 상품명</Label>
                <Input value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="bg-background border-border" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">카테고리</Label>
                  <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-background border-border" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">상담 가격 (₩)</Label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-background border-border font-bold text-primary" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">상담 설명</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-background border-border min-h-[80px] resize-none" required />
              </div>
            </div>
          </div>

          {/* 섹션 2: 스케줄 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-primary" /> 스케줄 설정
            </h3>
            <div className="bg-secondary/20 border border-border rounded-xl p-5 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">상담 요일</Label>
                <select 
                  value={formData.dayOfWeek} 
                  onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} 
                  className="w-full h-9 rounded-md border border-border bg-background text-xs font-bold px-2 outline-none"
                >
                  {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">상담(분)</Label>
                <Input type="number" value={formData.durationMin} onChange={e => setFormData({...formData, durationMin: Number(e.target.value)})} className="h-9 bg-background border-border text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">휴식(분)</Label>
                <Input type="number" value={formData.restTime} onChange={e => setFormData({...formData, restTime: Number(e.target.value)})} className="h-9 bg-background border-border text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">시작(HHMM)</Label>
                <Input type="number" value={formData.startTime} onChange={e => setFormData({...formData, startTime: Number(e.target.value)})} className="h-9 bg-background border-border text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">종료(HHMM)</Label>
                <Input type="number" value={formData.endTime} onChange={e => setFormData({...formData, endTime: Number(e.target.value)})} className="h-9 bg-background border-border text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">일일건수</Label>
                <Input type="number" value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: Number(e.target.value)})} className="h-9 bg-background border-border text-xs font-bold" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-bold text-muted-foreground">취소</Button>
            <Button type="submit" disabled={isLoading} className="flex-[2] font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "수정 완료" : "상품 등록 완료"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}