import { AlertTriangle, Calendar, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Subscription, Client } from "@/types";

interface ActiveSubscriptionAlertProps {
    subscription: Subscription;
    client?: Client;
    className?: string;
}

/**
 * Componente para exibir alerta sobre matrícula ativa existente
 */
export function ActiveSubscriptionAlert({
    subscription,
    client,
    className
}: ActiveSubscriptionAlertProps) {
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <Alert className={className} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                        {client?.name || "Cliente"} já possui matrícula ativa
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Vencimento: {formatDate(endDate)}</span>
                    <Badge variant="outline" className="ml-auto">
                        {daysRemaining > 0
                            ? `${daysRemaining} dias restantes`
                            : "Vencida"
                        }
                    </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                    <p>Plano: <strong>{subscription.plan || "Plano não definido"}</strong></p>
                    <p className="mt-1">
                        Para criar uma nova matrícula, aguarde o vencimento da atual ou
                        desative a matrícula existente.
                    </p>
                </div>
            </AlertDescription>
        </Alert>
    );
}

/**
 * Hook para verificar se um cliente possui matrícula ativa
 */
export function useActiveSubscriptionCheck(subscriptions: Subscription[]) {
    const getActiveSubscription = (clientId: string): Subscription | null => {
        const now = new Date();
        return subscriptions.find(sub =>
            sub.clientId === clientId &&
            sub.active &&
            new Date(sub.endDate) > now
        ) || null;
    };

    const hasActiveSubscription = (clientId: string): boolean => {
        return getActiveSubscription(clientId) !== null;
    };

    return {
        getActiveSubscription,
        hasActiveSubscription
    };
}
