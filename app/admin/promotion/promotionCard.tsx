"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Square, Trophy, BarChart3 } from "lucide-react"

interface Promotion {
  id: string;
  name: string;
  pointAmount: number;
  totalStock: number;
  status: "SCHEDULED" | "ACTIVE" | "ENDED";
}

interface PromotionCardProps {
  promotion: Promotion;
  onStatusClick: (id: string, name: string) => void;
  onWinnersClick: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export function PromotionCard({ promotion, onStatusClick, onWinnersClick, onToggleStatus }: PromotionCardProps) {
  return (
    <div className="group p-5 rounded-[1.8rem] bg-secondary/10 border border-transparent hover:border-primary/20 hover:bg-secondary/20 transition-all flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-black text-lg tracking-tight uppercase italic">{promotion.name}</p>
          <Badge 
            variant={promotion.status === "ACTIVE" ? "default" : "secondary"} 
            className="text-[9px] font-black uppercase rounded-md px-2"
          >
            {promotion.status}
          </Badge>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {promotion.pointAmount.toLocaleString()} PTS · {promotion.totalStock} LIMIT
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-10 w-10 text-blue-500 rounded-xl hover:bg-blue-50" 
          onClick={() => onStatusClick(promotion.id, promotion.name)}
        >
          <BarChart3 className="h-5 w-5" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-10 w-10 text-yellow-500 rounded-xl hover:bg-yellow-50" 
          onClick={() => onWinnersClick(promotion.id, promotion.name)}
        >
          <Trophy className="h-5 w-5" />
        </Button>
        
        {promotion.status === "SCHEDULED" && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-10 w-10 text-green-500 rounded-xl hover:bg-green-50" 
            onClick={() => onToggleStatus(promotion.id, "SCHEDULED")}
          >
            <Play className="h-5 w-5 fill-current" />
          </Button>
        )}
        {promotion.status === "ACTIVE" && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-10 w-10 text-destructive rounded-xl hover:bg-destructive/10" 
            onClick={() => onToggleStatus(promotion.id, "ACTIVE")}
          >
            <Square className="h-5 w-5 fill-current" />
          </Button>
        )}
      </div>
    </div>
  )
}