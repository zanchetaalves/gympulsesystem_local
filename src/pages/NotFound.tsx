
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gym-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4">Página não encontrada</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild className="bg-gym-primary hover:bg-gym-secondary">
          <Link to="/">Voltar para o Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
