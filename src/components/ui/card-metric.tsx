
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardMetricProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
  };
  className?: string;
}

export function CardMetric({ title, value, icon, trend, className }: CardMetricProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {trend && (
              <p className={cn("text-xs mt-1 flex items-center", 
                trend.positive ? "text-gym-accent" : "text-red-500"
              )}>
                {trend.positive ? "↑" : "↓"} {trend.value}
                <span className="text-muted-foreground ml-1">vs last month</span>
              </p>
            )}
          </div>
          {icon && (
            <div className="bg-gym-light p-3 rounded-lg">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
